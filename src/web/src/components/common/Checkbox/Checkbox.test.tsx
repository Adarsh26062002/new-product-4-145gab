import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RenderResult } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import Checkbox from './Checkbox';

describe('Checkbox component', () => {
  test('renders with default props', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  test('renders with label', () => {
    const label = 'Test Label';
    render(<Checkbox label={label} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox');
    expect(screen.getByLabelText(label)).toBe(checkbox);
  });

  test('can be checked and unchecked', async () => {
    const handleChange = jest.fn();
    render(<Checkbox onChange={handleChange} />);
    const checkbox = screen.getByRole('checkbox');
    
    const user = userEvent.setup();
    await user.click(checkbox);
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test('renders in checked state when checked prop is true', () => {
    render(<Checkbox checked={true} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    
    // Find the custom checkbox span element
    const customCheckbox = checkbox.nextElementSibling;
    expect(customCheckbox?.className).toContain('checked');
  });

  test('is disabled when disabled prop is true', async () => {
    const handleChange = jest.fn();
    render(<Checkbox disabled={true} onChange={handleChange} />);
    const checkbox = screen.getByRole('checkbox');
    
    expect(checkbox).toBeDisabled();
    expect(checkbox.parentElement).toHaveAttribute('aria-disabled', 'true');
    
    const user = userEvent.setup();
    await user.click(checkbox);
    
    expect(handleChange).not.toHaveBeenCalled();
  });

  test('applies custom className correctly', () => {
    const customClass = 'custom-class';
    render(<Checkbox className={customClass} />);
    
    const container = screen.getByRole('checkbox').parentElement;
    expect(container?.className).toContain(customClass);
  });

  test('passes additional HTML attributes', () => {
    render(<Checkbox data-testid="custom-checkbox" aria-label="custom checkbox" />);
    const checkbox = screen.getByTestId('custom-checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'custom checkbox');
  });

  test('has proper accessibility attributes', () => {
    const id = 'test-checkbox';
    const label = 'Test Checkbox';
    render(<Checkbox id={id} label={label} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('id', id);
    expect(checkbox.parentElement).toHaveAttribute('htmlFor', id);
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  test('is keyboard accessible', async () => {
    const handleChange = jest.fn();
    render(<Checkbox onChange={handleChange} />);
    const checkbox = screen.getByRole('checkbox');
    
    checkbox.focus();
    expect(document.activeElement).toBe(checkbox);
    
    const user = userEvent.setup();
    await user.keyboard(' '); // Space key to toggle checkbox
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Checkbox ref={ref} />);
    
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.type).toBe('checkbox');
  });

  test('displays check icon when checked', () => {
    const { rerender } = render(<Checkbox checked={true} />);
    
    // Find the check icon element
    const checkIcon = document.querySelector('svg');
    expect(checkIcon?.className).toContain('checkedIcon');
    
    rerender(<Checkbox checked={false} />);
    expect(checkIcon?.className).not.toContain('checkedIcon');
  });
});