import { ReactNode } from "react";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { Login } from "../pages/Login";

interface ProtectedRouteProps {
  children: ReactNode;
}

const LoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Spinner = styled.div`
  border: 4px solid ${({ theme }) => theme.colors.bg};
  border-top: 4px solid ${({ theme }) => theme.colors.accent};
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <LoadingContainer>
        <Spinner />
      </LoadingContainer>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <>{children}</>;
};
