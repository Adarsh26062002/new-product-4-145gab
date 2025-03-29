import React from 'react';
import { render, screen } from '@testing-library/react'; // ^14.0.0
import { act } from 'react-dom/test-utils'; // ^18.2.0
import ErrorBoundary from './ErrorBoundary';

/**
 * Creates a component that throws an error when rendered
 * @param errorMessage - The error message to throw
 * @returns A functional component that throws an error
 */
const createErrorComponent = (errorMessage: string): React.FC => {
  return () => {
    throw new Error(errorMessage);
    // The line below will never execute but is needed for type correctness
    return <div>This will not render</div>;
  };
};

/**
 * Mocks console.error to prevent test output pollution
 * @returns Function to restore the original console.error
 */
const mockConsoleError = () => {
  const originalConsoleError = console.error;
  console.error = jest.fn();
  return () => {
    console.error = originalConsoleError;
  };
};

describe('ErrorBoundary', () => {
  test('renders children when there is no error', () => {
    const childText = 'Child component content';
    
    render(
      <ErrorBoundary>
        <div data-testid="child">{childText}</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByTestId('child')).toHaveTextContent(childText);
  });
  
  test('renders fallback UI when a child component throws', () => {
    // Create a component that throws
    const ErrorComponent = createErrorComponent('Test error');
    
    // Mock console.error to prevent test output pollution
    const restoreConsoleError = mockConsoleError();
    
    // Use act to ensure all updates have been processed
    act(() => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );
    });
    
    // Check for the default fallback UI
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(
      screen.getByText('Please try again or contact support if the problem persists.')
    ).toBeInTheDocument();
    
    // Restore console.error
    restoreConsoleError();
  });
  
  test('renders custom fallback UI when provided', () => {
    // Create a component that throws
    const ErrorComponent = createErrorComponent('Test error');
    
    // Create custom fallback UI
    const customFallbackText = 'Custom error message';
    const CustomFallback = <div data-testid="custom-fallback">{customFallbackText}</div>;
    
    // Mock console.error to prevent test output pollution
    const restoreConsoleError = mockConsoleError();
    
    // Use act to ensure all updates have been processed
    act(() => {
      render(
        <ErrorBoundary fallbackUI={CustomFallback}>
          <ErrorComponent />
        </ErrorBoundary>
      );
    });
    
    // Check for the custom fallback UI
    expect(screen.getByTestId('custom-fallback')).toHaveTextContent(customFallbackText);
    
    // Restore console.error
    restoreConsoleError();
  });
  
  test('calls onError prop when an error occurs', () => {
    // Create a component that throws
    const errorMessage = 'Test error';
    const ErrorComponent = createErrorComponent(errorMessage);
    
    // Create a mock onError function
    const onError = jest.fn();
    
    // Mock console.error to prevent test output pollution
    const restoreConsoleError = mockConsoleError();
    
    // Use act to ensure all updates have been processed
    act(() => {
      render(
        <ErrorBoundary onError={onError}>
          <ErrorComponent />
        </ErrorBoundary>
      );
    });
    
    // Check if onError was called with the error
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toBe(errorMessage);
    expect(onError.mock.calls[0][1]).toBeDefined(); // ErrorInfo object
    
    // Restore console.error
    restoreConsoleError();
  });
});