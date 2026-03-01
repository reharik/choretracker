// src/ui/primitives.tsx
import React from "react";
import styled, { css } from "styled-components";

export const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <VStack gap={1}>
    <Label>{label}</Label>
    {children}
  </VStack>
);

// Styled Components
export const Card = styled.div`
  background: ${({ theme }) => theme.colors.panel};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.sm};
  padding: ${({ theme }) => theme.spacing(2)};
`;

const HStackBase = styled.div<{
  $gap?: number;
  $wrap?: boolean;
  $stackOnMobile?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: ${({ $gap = 2, theme }) => theme.spacing($gap)};
  flex-wrap: ${({ $wrap }) => ($wrap ? "wrap" : "nowrap")};

  @media (max-width: 768px) {
    flex-wrap: wrap;
    ${({ $stackOnMobile }) =>
      $stackOnMobile &&
      `
      flex-direction: column;
      align-items: stretch;
    `}
  }
`;

type HStackProps = React.ComponentPropsWithoutRef<"div"> & {
  gap?: number;
  wrap?: boolean;
  stackOnMobile?: boolean;
};
export const HStack = React.forwardRef<HTMLDivElement, HStackProps>(
  ({ gap, wrap, stackOnMobile, ...rest }, ref) => (
    <HStackBase
      ref={ref}
      $gap={gap}
      $wrap={wrap}
      $stackOnMobile={stackOnMobile}
      {...rest}
    />
  ),
);
HStack.displayName = "HStack";

const VStackBase = styled.div<{ $gap?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap = 2, theme }) => theme.spacing($gap)};
`;

type VStackProps = React.ComponentPropsWithoutRef<"div"> & { gap?: number };
export const VStack = React.forwardRef<HTMLDivElement, VStackProps>(
  ({ gap, ...rest }, ref) => <VStackBase ref={ref} $gap={gap} {...rest} />,
);
VStack.displayName = "VStack";

export const Spacer = styled.div`
  flex: 1 1 auto;
`;

export const Label = styled.label`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.subtext};
`;

// moved input primitives to FormInput.tsx (StyledInput/Select/TextArea)

const ButtonBase = styled.button<{
  $variant?: "primary" | "secondary" | "ghost" | "danger";
  $size?: "sm" | "md";
  $fullWidth?: boolean;
}>`
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: ${({ $size = "md" }) => ($size === "sm" ? "8px 10px" : "10px 14px")};
  cursor: pointer;
  font-weight: 600;
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};

  ${({ $variant = "primary", theme }) => {
    switch ($variant) {
      case "secondary":
        return css`
          background: transparent;
          color: ${theme.colors.text};
          border-color: ${theme.colors.border};
          &:hover {
            background: #0c0f15;
          }
        `;
      case "ghost":
        return css`
          background: transparent;
          color: ${theme.colors.subtext};
          &:hover {
            color: ${theme.colors.text};
            background: #0c0f15;
          }
        `;
      case "danger":
        return css`
          background: ${theme.colors.danger};
          color: #0b0b0b;
          &:hover {
            filter: brightness(0.95);
          }
        `;
      default:
        return css`
          background: ${theme.colors.accent};
          color: #0b0b0b;
          &:hover {
            background: ${theme.colors.accentHover};
          }
        `;
    }
  }}
`;

// Wrapper to map public props to transient props
type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  fullWidth?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, fullWidth, ...rest }, ref) => (
    <ButtonBase
      ref={ref}
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      {...rest}
    />
  ),
);
Button.displayName = "Button";

export const Badge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: #0c1220;
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.subtext};
  font-size: 12px;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th,
  td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
  th {
    color: ${({ theme }) => theme.colors.subtext};
    font-weight: 600;
  }
  tr:hover td {
    background: rgba(255, 255, 255, 0.02);
  }
`;
