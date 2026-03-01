import React from "react";
import styled, { css } from "styled-components";

const baseInput = css<{ $hasError: boolean }>`
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  background: #0c0f15;
  border: 1px solid
    ${({ theme, $hasError }) =>
      $hasError ? theme.colors.danger : theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.radius.sm};
  outline: none;
  transition:
    border 120ms ease,
    box-shadow 120ms ease;
  &:focus {
    border-color: ${({ theme, $hasError }) =>
      $hasError ? theme.colors.danger : theme.colors.accent};
    box-shadow: 0 0 0 3px
      ${({ theme, $hasError }) =>
        $hasError ? `rgba(220, 38, 38, 0.15)` : `rgba(124, 156, 255, 0.15)`};
  }
  &::placeholder {
    color: ${({ theme }) => theme.colors.subtext};
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StyledInput = styled.input<{ $hasError: boolean }>`
  ${baseInput}
`;

const StyledSelect = styled.select<{ $hasError: boolean }>`
  ${baseInput}
`;

const StyledTextArea = styled.textarea<{ $hasError: boolean }>`
  ${baseInput};
  resize: vertical;
  min-height: 80px;
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.85rem;
  margin-top: 4px;
`;

const LabelWrapper = styled.label`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.subtext};
  display: block;
  margin-bottom: 6px;
`;

const FieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

type OwnProps = {
  label?: string;
  error?: string;
};

type PropsOf<T extends keyof React.JSX.IntrinsicElements> =
  React.JSX.IntrinsicElements[T];
type AllowedTags = "input" | "select" | "textarea";
export type FormInputProps<T extends AllowedTags = "input"> = OwnProps & {
  as?: T;
} & PropsOf<T>;

/**
 * A reusable form input component that wraps label, input/select/textarea, and error message display
 */
export const FormInput = React.forwardRef(
  <T extends AllowedTags = "input">(
    props: FormInputProps<T>,
    ref: React.ForwardedRef<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { label, error, as, ...rest } = props as FormInputProps<AllowedTags>;
    const tag: AllowedTags = (as ?? "input") as AllowedTags;

    const hasError = !!error;

    let field: React.ReactNode;
    if (tag === "select") {
      const restProps = rest as PropsOf<"select">;
      field = (
        <StyledSelect {...restProps} $hasError={hasError} ref={ref as never} />
      );
    } else if (tag === "textarea") {
      const restProps = rest as PropsOf<"textarea">;
      field = (
        <StyledTextArea
          {...restProps}
          $hasError={hasError}
          ref={ref as never}
        />
      );
    } else {
      const restProps = rest as PropsOf<"input">;
      field = (
        <StyledInput {...restProps} $hasError={hasError} ref={ref as never} />
      );
    }

    return (
      <FieldWrapper>
        {label && (
          <LabelWrapper
            htmlFor={(rest as PropsOf<"input">).id as string | undefined}
          >
            {label}
          </LabelWrapper>
        )}
        {field}
        {hasError && <ErrorMessage>{error}</ErrorMessage>}
      </FieldWrapper>
    );
  },
);

FormInput.displayName = "FormInput";
