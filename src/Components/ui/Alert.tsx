// src/components/ui/Alert.tsx
import React from 'react';
import './Alert.css';

type AlertVariant = 'info' | 'warning' | 'error' | 'success';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

const variantIconMap: Record<AlertVariant, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
  success: '✅',
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className = '',
  fullWidth = true,
}) => {
  const classes = [
    'alert',
    `alert--${variant}`,
    fullWidth ? 'alert--full-width' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div role="alert" className={classes}>
      <span className="alert__icon" aria-hidden>
        {variantIconMap[variant]}
      </span>
      <div className="alert__content">
        {title && <div className="alert__title">{title}</div>}
        {children && <div className="alert__description">{children}</div>}
      </div>
    </div>
  );
};

export default Alert;