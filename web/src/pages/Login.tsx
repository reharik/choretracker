import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { FormInput } from '../ui/FormInput';
import { Button, Card, VStack } from '../ui/Primitives';

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

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'adult' | 'kid'>('kid');
  const { login, signup } = useAuth();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const success = await login(email, password);

    if (!success) {
      setError('Invalid email or password');
    }

    setIsLoading(false);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    const success = await signup(email, password, name, role);

    if (!success) {
      setError('An account with this email already exists');
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />

                  <FormInput
                    label="Password"
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                  />

                  <div>
                    <label htmlFor="role" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                      Account Type
                    </label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'adult' | 'kid')}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem',
                      }}
                    >
                      <option value="kid">Kid</option>
                      <option value="adult">Adult</option>
                    </select>
                  </div>

                  <Button type="submit" disabled={isLoading} fullWidth>
                    {isLoading ? 'Creating account...' : 'Sign up'}
                  </Button>
                </VStack>
              </form>

              <SignupLink>
                Already have an account?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setShowSignup(false); }}>
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />

                <FormInput
                  label="Password"
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                />

                <Button type="submit" disabled={isLoading} fullWidth>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </VStack>
            </form>

            <SignupLink>
              Don't have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setShowSignup(true); }}>
                Sign up
              </a>
            </SignupLink>
          </VStack>
        </Card>
      </FormContainer>
    </Container>
  );
};
