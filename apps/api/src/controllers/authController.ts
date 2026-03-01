import { RESOLVER } from "awilix";
import type { Context } from "koa";
import type { Container } from "../container";

export interface AuthController {
  login: (ctx: Context) => Promise<Context>;
  signup: (ctx: Context) => Promise<Context>;
  logout: (ctx: Context) => Context;
  me: (ctx: Context) => Context;
}

const sanitizeUser = (user: {
  passwordHash?: string;
  [key: string]: unknown;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...sanitized } = user;
  return sanitized;
};

export const createAuthController = ({
  authService,
  logger,
}: Container): AuthController => ({
  login: async (ctx: Context): Promise<Context> => {
    const { email, password } = ctx.request.body as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      ctx.status = 400;
      ctx.body = { error: "Email and password are required" };
      return ctx;
    }

    const result = await authService.login({ email, password });
    if (!result) {
      logger.warn("Login attempt failed from controller", {
        email,
        ip: ctx.ip,
      });
      ctx.status = 401;
      ctx.body = { error: "Invalid email or password" };
      return ctx;
    }

    logger.info("Login successful from controller", {
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      ip: ctx.ip,
    });

    ctx.status = 200;
    ctx.body = {
      user: result.user,
      token: result.token,
    };
    return ctx;
  },

  signup: async (ctx: Context): Promise<Context> => {
    const { email, password, name, role } = ctx.request.body as {
      email: string;
      password: string;
      name: string;
      role?: "adult" | "kid";
    };

    if (!email || !password || !name) {
      ctx.status = 400;
      ctx.body = { error: "Email, password, and name are required" };
      return ctx;
    }

    // Validate password length
    if (password.length < 8) {
      ctx.status = 400;
      ctx.body = { error: "Password must be at least 8 characters long" };
      return ctx;
    }

    const result = await authService.signup({ email, password, name, role });
    if (!result) {
      logger.warn("Signup attempt failed from controller", {
        email,
        ip: ctx.ip,
      });
      ctx.status = 409;
      ctx.body = { error: "An account with this email already exists" };
      return ctx;
    }

    logger.info("Signup successful from controller", {
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      ip: ctx.ip,
    });

    ctx.status = 201;
    ctx.body = {
      user: result.user,
      token: result.token,
    };
    return ctx;
  },

  logout: (ctx: Context): Context => {
    // Since we're using JWT, logout is handled client-side by removing the token
    ctx.status = 200;
    ctx.body = { message: "Logged out successfully" };
    return ctx;
  },

  me: (ctx: Context): Context => {
    // This endpoint requires authentication middleware
    const user = ctx.user;

    if (!user) {
      ctx.status = 401;
      ctx.body = { error: "Not authenticated" };
      return ctx;
    }

    ctx.status = 200;
    ctx.body = { user: sanitizeUser(user) };
    return ctx;
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(createAuthController as any)[RESOLVER] = {};
