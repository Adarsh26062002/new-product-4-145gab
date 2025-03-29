import React, { Component, ErrorInfo, ReactNode } from 'react'; // ^18.2.0

// Props interface for the ErrorBoundary component
interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackUI?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// State interface for the ErrorBoundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * A class component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /**
   * Initializes the component with default state
   */
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  /**
   * Static lifecycle method called when an error has been thrown by a descendant component.
   * Used to update state to trigger a fallback UI render.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  /**
   * Lifecycle method called after an error has been thrown by a descendant component.
   * Used for side effects like logging errors.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the console with component stack trace
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Renders either the fallback UI when an error occurs or the normal children when no error has occurred
   */
  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI if provided, otherwise render a default error message
      return this.props.fallbackUI || (
        <div className="error-boundary-fallback">
          <h2>Something went wrong.</h2>
          <p>Please try again or contact support if the problem persists.</p>
        </div>
      );
    }
    
    // When there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;