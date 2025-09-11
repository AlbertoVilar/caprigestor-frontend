// src/components/ui/Input.tsx
import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import './Input.css';

type InputVariant = 'default' | 'error' | 'success';
type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: InputVariant;
  size?: InputSize;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'default',
      size = 'md',
      fullWidth = false,
      leftIcon,
      rightIcon,
      onRightIconClick,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    const finalVariant = error ? 'error' : variant;
    
    const containerClasses = [
      'input-container',
      fullWidth ? 'input-container--full-width' : '',
      className
    ].filter(Boolean).join(' ');
    
    const wrapperClasses = [
      'input-wrapper',
      `input-wrapper--${finalVariant}`,
      `input-wrapper--${size}`,
      isFocused ? 'input-wrapper--focused' : '',
      leftIcon ? 'input-wrapper--with-left-icon' : '',
      rightIcon ? 'input-wrapper--with-right-icon' : ''
    ].filter(Boolean).join(' ');
    
    const inputClasses = [
      'input',
      `input--${size}`
    ].filter(Boolean).join(' ');

    return (
      <div className={containerClasses}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        
        <div className={wrapperClasses}>
          {leftIcon && (
            <div className="input-icon input-icon--left">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {rightIcon && (
            <div 
              className={`input-icon input-icon--right ${onRightIconClick ? 'input-icon--clickable' : ''}`}
              onClick={onRightIconClick}
            >
              {rightIcon}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <div className={`input-message ${error ? 'input-message--error' : 'input-message--helper'}`}>
            {error || helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Componente específico para senha
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'rightIcon' | 'onRightIconClick'>>(
  (props, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    
    const togglePassword = () => setShowPassword(!showPassword);
    
    const eyeIcon = (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {showPassword ? (
          <>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </>
        ) : (
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
      </svg>
    );
    
    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={eyeIcon}
        onRightIconClick={togglePassword}
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';