import React, { useState } from "react";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { config } from "../config";
import { FormInput } from "../ui/FormInput";
import { Button, Card, VStack } from "../ui/Primitives";

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.bg};
  padding: ${({ theme }) => theme.spacing(3)};
`;

const FormContainer = styled.div`
  max-width: 400px;
  width: 100%;
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const ErrorBanner = styled.div`
  padding: 12px 16px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid ${({ theme }) => theme.colors.danger};
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.9rem;
`;

const EnvBanner = styled.div<{ $dev: boolean }>`
  font-size: 0.75rem;
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ $dev }) =>
    $dev ? "rgba(34, 197, 94, 0.12)" : "rgba(249, 115, 22, 0.12)"};
  color: ${({ $dev }) => ($dev ? "#16a34a" : "#ea580c")};
  border: 1px solid
    ${({ $dev }) => ($dev ? "rgba(34, 197, 94, 0.3)" : "rgba(249, 115, 22, 0.3)")};
  word-break: break-all;
`;

const SignupLink = styled.p`
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing(2)};
  color: ${({ theme }) => theme.colors.subtext};

  a {
    color: ${({ theme }) => theme.colors.accent};
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const PasswordInputWrapper = styled.div`
  position: relative;
`;

const PasswordToggleButton = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.subtext};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSignup, setShowSignup] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"adult" | "kid">("kid");
  const [showPassword, setShowPassword] = useState(false);
  const { login, signup } = useAuth();

  const toggleForm = () => {
    setShowSignup(!showSignup);
    setEmail("");
    setPassword("");
    setName("");
    setError("");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const success = await login(email, password);

    if (!success) {
      setError("Invalid email or password");
    }

    setIsLoading(false);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    console.log("Signup form values:", { name, email, password: "***", role });
    const success = await signup(email, password, name, role);

    if (!success) {
      setError("An account with this email already exists");
    }

    setIsLoading(false);
  };

  if (showSignup) {
    return (
      <Container>
        <FormContainer>
          <Card>
            <VStack gap={3}>
              <Title>Create Account</Title>

              <form onSubmit={handleSignupSubmit}>
                <VStack gap={3}>
                  {error && <ErrorBanner>{error}</ErrorBanner>}

                  <FormInput
                    label="Name"
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setName(e.target.value)
                    }
                    placeholder="Enter your name"
                  />

                  <FormInput
                    label="Email address"
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmail(e.target.value)
                    }
                    placeholder="Enter your email"
                  />

                  <FormInput
                    label="Password"
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                  />

                  <div>
                    <label
                      htmlFor="role"
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: 500,
                      }}
                    >
                      Account Type
                    </label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) =>
                        setRole(e.target.value as "adult" | "kid")
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "1rem",
                      }}
                    >
                      <option value="kid">Kid</option>
                      <option value="adult">Adult</option>
                    </select>
                  </div>

                  <Button type="submit" disabled={isLoading} fullWidth>
                    {isLoading ? "Creating account..." : "Sign up"}
                  </Button>
                </VStack>
              </form>

              <SignupLink>
                Already have an account?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleForm();
                  }}
                >
                  Sign in
                </a>
              </SignupLink>
            </VStack>
          </Card>
        </FormContainer>
      </Container>
    );
  }

  return (
    <Container>
      <FormContainer>
        <Card>
          <VStack gap={3}>
            <Title>ChoreTracker Login</Title>
            <EnvBanner $dev={import.meta.env.DEV}>
              {import.meta.env.DEV ? "Development" : "Production"} · API:{" "}
              {config.apiBaseUrl}
            </EnvBanner>
            <form onSubmit={handleLoginSubmit}>
              <VStack gap={3}>
                {error && <ErrorBanner>{error}</ErrorBanner>}

                <FormInput
                  label="Email address"
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email"
                />

                <PasswordInputWrapper>
                  <FormInput
                    label="Password"
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                  />
                  <PasswordToggleButton
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </PasswordToggleButton>
                </PasswordInputWrapper>

                <Button type="submit" disabled={isLoading} fullWidth>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </VStack>
            </form>

            <SignupLink>
              Don't have an account?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggleForm();
                }}
              >
                Sign up
              </a>
            </SignupLink>
          </VStack>
        </Card>
      </FormContainer>
    </Container>
  );
};
