import React, { ButtonHTMLAttributes, FC, forwardRef, Ref, ReactNode } from 'react';
import classNames from 'classnames'; // v2.3.1
import styles from './Button.module.css';

// Button variants
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'text';

// Button sizes
type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Props interface for the Button component
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button visual style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Button content */
  children: ReactNode;
  /** Whether the button is in active/selected state (e.g., for filters) */
  isActive?: boolean;
  /** Whether the button should take up full width of its container */
  fullWidth?: boolean;
  /** Additional CSS class names */
  className?: string;
}

/**
 * A reusable button component with various styling options
 * Supports different variants, sizes, and states for consistent UI across the application
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      children,
      isActive = false,
      fullWidth = false,
      className,
      ...rest
    },
    ref
  ) => {
    // Combine CSS classes based on props
    const buttonClasses = classNames(
      styles.button,
      styles[variant],
      styles[size],
      {
        [styles.active]: isActive,
        [styles.fullWidth]: fullWidth,
      },
      className
    );

    return (
      <button 
        className={buttonClasses} 
        ref={ref} 
        {...rest}
      >
        {children}
      </button>
    );
  }
);

// Display name for debugging
Button.displayName = 'Button';

export default Button;