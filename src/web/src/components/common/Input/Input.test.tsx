import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react'; // version ^13.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import Input from './Input';

describe('Input component', () => {
  test('renders with default props', () => {
    render(<Input />);
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement.className).toContain('input');
  });

  test('renders with label when provided', () => {
    const labelText = 'Test Label';
    render(<Input label={labelText} />);
    const labelElement = screen.getByText(labelText);
    expect(labelElement).toBeInTheDocument();
    
    const inputElement = screen.getByRole('textbox');
    expect(labelElement).toHaveAttribute('for', inputElement.id);
  });

  test('applies valid state correctly', () => {
    render(<Input isValid={true} />);
    const inputElement = screen.getByRole('textbox');
    expect(inputElement.className).toContain('valid');
  });

  test('applies invalid state correctly', () => {
    render(<Input isInvalid={true} />);
    const inputElement = screen.getByRole('textbox');
    expect(inputElement.className).toContain('invalid');
  });

  test('displays error message when invalid', () => {
    const errorMessage = 'This field is required';
    render(<Input isInvalid={true} errorMessage={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
  });

  test('does not display error message when valid', () => {
    const errorMessage = 'This field is required';
    render(<Input isValid={true} errorMessage={errorMessage} />);
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
  });

  test('applies fullWidth class when specified', () => {
    render(<Input fullWidth={true} />);
    const inputElement = screen.getByRole('textbox');
    expect(inputElement.className).toContain('fullWidth');
  });

  test('handles change events', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    const inputElement = screen.getByRole('textbox');
    
    userEvent.type(inputElement, 'test');
    expect(handleChange).toHaveBeenCalled();
    expect(inputElement).toHaveValue('test');
  });

  test('is disabled when disabled prop is true', () => {
    const handleChange = jest.fn();
    render(<Input disabled={true} onChange={handleChange} />);
    const inputElement = screen.getByRole('textbox');
    
    expect(inputElement).toBeDisabled();
    userEvent.type(inputElement, 'test');
    expect(handleChange).not.toHaveBeenCalled();
    expect(inputElement).not.toHaveValue('test');
  });

  test('passes additional HTML attributes', () => {
    render(<Input placeholder="Enter text here" data-testid="test-input" />);
    const inputElement = screen.getByTestId('test-input');
    
    expect(inputElement).toHaveAttribute('placeholder', 'Enter text here');
    expect(inputElement).toHaveAttribute('data-testid', 'test-input');
  });

  test('has proper accessibility attributes', () => {
    render(
      <Input 
        aria-label="Test input" 
        aria-describedby="description" 
        isInvalid={true}
      />
    );
    const inputElement = screen.getByRole('textbox');
    
    expect(inputElement).toHaveAttribute('aria-label', 'Test input');
    expect(inputElement).toHaveAttribute('aria-describedby', 'description');
    expect(inputElement).toHaveAttribute('aria-invalid', 'true');
  });

  test('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('INPUT');
    
    // Test that we can access methods through the ref
    if (ref.current) {
      ref.current.focus();
      expect(document.activeElement).toBe(ref.current);
    }
  });

  test('applies custom className correctly', () => {
    const customClass = 'custom-class';
    render(<Input className={customClass} />);
    
    // The className is applied to the container div
    const inputElement = screen.getByRole('textbox');
    const containerElement = inputElement.parentElement?.parentElement;
    
    expect(containerElement?.className).toContain(customClass);
  });

  test('is keyboard accessible', () => {
    render(<Input />);
    const inputElement = screen.getByRole('textbox');
    
    // Simulate tabbing to the input
    inputElement.focus();
    expect(document.activeElement).toBe(inputElement);
  });

  test('generates a unique ID when not provided', () => {
    render(<Input label="Test Label" />);
    const inputElement = screen.getByRole('textbox');
    const labelElement = screen.getByText('Test Label');
    
    expect(inputElement).toHaveAttribute('id');
    expect(labelElement).toHaveAttribute('for', inputElement.id);
  });
});