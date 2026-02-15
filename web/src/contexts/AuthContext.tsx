import type { User } from '@chore-tracker/contracts';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useApiFetchBase } from '../hooks/apiFetch/useApiFetch';

interface AuthContextType {
  user: User | undefined;
  token: string | undefined;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (
    email: string,
    password: string,
    name: string,
    role?: 'adult' | 'kid',
  ) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { apiFetch } = useApiFetchBase();

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      verifyToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const result = await apiFetch<{ user: User }>(`/auth/me`, {
        headers: {
          Authorization: `Bearer ${tokenToVerify}`,
        },
      });

      if (result.success) {
        setUser(result.data.user);
        setToken(tokenToVerify);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('authToken');
        setToken(undefined);
        setUser(undefined);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('authToken');
      setToken(undefined);
      setUser(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await apiFetch<{ user: User; token: string }>(`/auth/login`, {
        method: 'POST',
        body: { email, password },
      });

      if (data.success) {
        setUser(data.data.user);
        setToken(data.data.token);
        localStorage.setItem('authToken', data.data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role?: 'adult' | 'kid',
  ): Promise<boolean> => {
    try {
      const data = await apiFetch<{ user: User; token: string }>(`/auth/signup`, {
        method: 'POST',
        body: { email, password, name, role },
      });

      if (data.success) {
        setUser(data.data.user);
        setToken(data.data.token);
        localStorage.setItem('authToken', data.data.token);
        return true;
      } else {
        console.error('Signup failed:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Signup exception:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(undefined);
    setToken(undefined);
    localStorage.removeItem('authToken');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    signup,
    logout,
    isLoading,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
