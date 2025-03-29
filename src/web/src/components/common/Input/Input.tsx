import React, { InputHTMLAttributes, forwardRef } from 'react';
import classNames from 'classnames'; // version ^2.3.1
import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  label?: string;
  errorMessage?: string;
  isValid?: boolean;
  isInvalid?: boolean;
  fullWidth?: boolean;
  className?: string;
}

/**
 * A reusable input component with support for labels, validation states, and error messages.
 * Provides consistent styling and accessibility features across the application.
 */
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const {
    id,
    label,
    errorMessage,
    isValid,
    isInvalid,
    fullWidth = false,
    className,
    ...rest
  } = props;

  // Generate unique ID if not provided for accessibility
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  // Combine CSS classes
  const containerClassName = classNames(styles.container, className);
  const inputClassName = classNames(styles.input, {
    [styles.valid]: isValid,
    [styles.invalid]: isInvalid,
    [styles.fullWidth]: fullWidth,
  });

  return (
    <div className={containerClassName}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={styles.inputWrapper}>
        <input
          id={inputId}
          className={inputClassName}
          ref={ref}
          aria-invalid={isInvalid}
          {...rest}
        />
      </div>
      {isInvalid && errorMessage && (
        <div className={styles.errorMessage} role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
});

// Set display name for debugging
Input.displayName = 'Input';

export default Input;