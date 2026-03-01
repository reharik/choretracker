import type {
  AuthResponse,
  LoginInput,
  SignupInput,
  User,
} from "@chore-tracker/contracts";
import { RESOLVER } from "awilix";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Container } from "../container";

export type SanitizedUser = Omit<User, "passwordHash">;

export interface AuthService {
  login: (credentials: LoginInput) => Promise<AuthResponse | undefined>;
  signup: (credentials: SignupInput) => Promise<AuthResponse | undefined>;
  verifyToken: (token: string) => Promise<User | undefined>;
  hashPassword: (password: string) => Promise<string>;
  comparePassword: (password: string, hash: string) => Promise<boolean>;
}

const sanitizeUser = (
  user: User & { passwordHash?: string },
): SanitizedUser => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...sanitized } = user;
  return sanitized as SanitizedUser;
};

export const createAuthService = ({
  connection,
  logger,
  config,
}: Container): AuthService => {
  return {
    login: async (credentials: LoginInput) => {
      const { email, password } = credentials;

      // Find user by email
      const user = await connection("users").where({ email }).first();
      if (!user || !user.passwordHash) {
        logger.warn(
          "Login attempt failed: user not found or no password hash",
          {
            email,
            hasUser: !!user,
            hasPasswordHash: !!user?.passwordHash,
          },
        );
        return undefined;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        logger.warn("Login attempt failed: invalid password", {
          email,
          userId: user.id,
        });
        return undefined;
      }

      // Update last login
      await connection("users")
        .where({ id: user.id })
        .update({ lastLoginAt: new Date().toISOString() });

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn } as jwt.SignOptions,
      );

      logger.info("User logged in successfully", {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return { user: sanitizeUser(user), token };
    },

    signup: async (credentials: SignupInput) => {
      const { email, password, name, role = "kid" } = credentials;

      // Check if user already exists
      const existingUser = await connection("users").where({ email }).first();
      if (existingUser) {
        logger.warn("Signup attempt failed: user already exists", { email });
        return undefined;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const [user] = await connection("users")
        .insert({
          id: connection.raw("gen_random_uuid()"),
          email,
          passwordHash,
          name,
          role,
          isActive: true,
        })
        .returning("*");

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn } as jwt.SignOptions,
      );

      logger.info("User signed up successfully", {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return { user: sanitizeUser(user), token };
    },

    verifyToken: async (token: string) => {
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as {
          userId: string;
          email: string;
          role: string;
        };

        const user = await connection("users")
          .where({ id: decoded.userId })
          .first();

        if (!user) {
          logger.warn("Token verification failed: user not found", {
            userId: decoded.userId,
            email: decoded.email,
          });
          return undefined;
        }

        return user;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorType = err instanceof Error ? err.name : "Unknown";
        logger.warn("Token verification failed: invalid or expired token", {
          error: errorMessage,
          errorType,
        });
        return undefined;
      }
    },

    hashPassword: async (password: string) => {
      return bcrypt.hash(password, 12);
    },

    comparePassword: async (password: string, hash: string) => {
      return bcrypt.compare(password, hash);
    },
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(createAuthService as any)[RESOLVER] = {};
