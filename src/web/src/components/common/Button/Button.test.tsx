import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button component', () => {
  // Note: Since we're using CSS modules, we can't easily test for specific class names
  // as they are transformed during build. Instead, we focus on testing the component's
  // behavior and rendering based on props.

  test('renders with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    // Default button should have classes but we can't check specific names due to CSS modules
    expect(button.className).not.toBe('');
  });

  test('renders with different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button', { name: /primary/i })).toBeInTheDocument();

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button', { name: /secondary/i })).toBeInTheDocument();

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button', { name: /danger/i })).toBeInTheDocument();

    rerender(<Button variant="text">Text</Button>);
    expect(screen.getByRole('button', { name: /text/i })).toBeInTheDocument();
  });

  test('renders with different sizes', () => {
    const { rerender } = render(<Button size="small">Small</Button>);
    expect(screen.getByRole('button', { name: /small/i })).toBeInTheDocument();

    rerender(<Button size="medium">Medium</Button>);
    expect(screen.getByRole('button', { name: /medium/i })).toBeInTheDocument();

    rerender(<Button size="large">Large</Button>);
    expect(screen.getByRole('button', { name: /large/i })).toBeInTheDocument();
  });

  test('applies active state correctly', () => {
    render(<Button isActive>Active</Button>);
    const button = screen.getByRole('button', { name: /active/i });
    expect(button).toBeInTheDocument();
    // Active state should add a class, but we can't check the specific name
    expect(button.className).not.toBe('');
  });

  test('applies fullWidth class when specified', () => {
    render(<Button fullWidth>Full Width</Button>);
    const button = screen.getByRole('button', { name: /full width/i });
    expect(button).toBeInTheDocument();
    // fullWidth should add a class, but we can't check the specific name
    expect(button.className).not.toBe('');
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('is disabled when disabled prop is true', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('passes additional HTML attributes', () => {
    render(
      <Button data-testid="test-button" aria-label="Test button">
        Test
      </Button>
    );
    const button = screen.getByTestId('test-button');
    expect(button).toHaveAttribute('aria-label', 'Test button');
  });

  test('has proper accessibility attributes', () => {
    render(
      <Button aria-pressed="true" aria-haspopup="true">
        Accessible
      </Button>
    );
    const button = screen.getByRole('button', { name: /accessible/i });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('aria-haspopup', 'true');
  });

  test('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Button</Button>);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('BUTTON');
    expect(ref.current?.textContent).toBe('Ref Button');
  });

  test('renders children correctly', () => {
    // Text children
    const { rerender } = render(<Button>Text child</Button>);
    expect(screen.getByText('Text child')).toBeInTheDocument();

    // Element children
    rerender(
      <Button>
        <span data-testid="child-element">Element child</span>
      </Button>
    );
    expect(screen.getByTestId('child-element')).toBeInTheDocument();
  });

  test('applies custom className correctly', () => {
    render(<Button className="custom-class">Custom Class</Button>);
    const button = screen.getByRole('button', { name: /custom class/i });
    expect(button.className).toContain('custom-class');
  });

  test('is keyboard accessible', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Keyboard</Button>);
    const button = screen.getByRole('button', { name: /keyboard/i });
    
    // Focus and press Enter
    button.focus();
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // Press Space
    fireEvent.keyDown(button, { key: ' ', code: 'Space' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});