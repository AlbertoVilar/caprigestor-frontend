import React, { ButtonHTMLAttributes, forwardRef } from "react";
import "./Button.css";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "warning"
  | "outline"
  | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      className = "",
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const classes = [
      "gf-button",
      `gf-button--${variant}`,
      `gf-button--${size}`,
      fullWidth ? "gf-button--full-width" : "",
      loading ? "gf-button--loading" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <span className="gf-button__spinner" aria-hidden="true">
            <svg className="gf-button__spinner-icon" viewBox="0 0 24 24">
              <circle
                className="gf-button__spinner-circle"
                cx="12"
                cy="12"
                r="10"
                fill="none"
                strokeWidth="2"
              />
            </svg>
          </span>
        )}
        <span className={loading ? "gf-button__content--loading" : "gf-button__content"}>
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";
