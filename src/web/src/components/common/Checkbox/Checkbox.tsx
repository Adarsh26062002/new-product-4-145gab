import React, { 
  InputHTMLAttributes, 
  FC, 
  forwardRef, 
  Ref 
} from 'react';
import classNames from 'classnames'; // v2.3.1
import styles from './Checkbox.module.css';
import { ReactComponent as CheckIcon } from '../../assets/icons/check.svg';

/**
 * Props interface for the Checkbox component
 */
interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  label?: string;
  checked?: boolean;
  className?: string;
  disabled?: boolean;
}

/**
 * A reusable checkbox component with custom styling and accessibility features
 */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  id,
  label,
  checked = false,
  className,
  disabled = false,
  ...rest
}, ref) => {
  // Generate a unique ID if not provided
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  // Combine CSS classes for the container
  const containerClasses = classNames(
    styles.container,
    { [styles.disabled]: disabled },
    className
  );

  // Combine CSS classes for the checkbox
  const checkboxClasses = classNames(
    styles.checkbox,
    { [styles.checked]: checked }
  );

  // Combine CSS classes for the check icon
  const checkIconClasses = classNames(
    styles.checkIcon,
    { [styles.checkedIcon]: checked }
  );

  return (
    <label 
      htmlFor={checkboxId} 
      className={containerClasses}
      aria-disabled={disabled}
    >
      <input
        id={checkboxId}
        type="checkbox"
        className={styles.input}
        checked={checked}
        disabled={disabled}
        ref={ref}
        aria-checked={checked}
        {...rest}
      />
      <span className={checkboxClasses} aria-hidden="true">
        <CheckIcon className={checkIconClasses} />
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
});

// Set display name for debugging
Checkbox.displayName = 'Checkbox';

export default Checkbox;