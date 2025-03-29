import React from 'react'; // ^18.2.0
import { createRoot } from 'react-dom/client'; // ^18.2.0
import App from './App';
import { TodoProvider } from './contexts/TodoContext';
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary';
import './index.css';

/**
 * Renders the React application into the DOM
 */
const renderApp = (): void => {
  // Get the root element from the DOM
  const rootElement = document.getElementById('root');
  
  // Make sure the root element exists
  if (!rootElement) {
    console.error('Root element not found. Application cannot be mounted.');
    return;
  }

  // Create a React 18 root using createRoot
  const root = createRoot(rootElement);
  
  // Render the application with ErrorBoundary and TodoProvider
  root.render(
    // In development mode, wrap with StrictMode for additional checks
    process.env.NODE_ENV === 'development' ? (
      <React.StrictMode>
        <ErrorBoundary>
          <TodoProvider>
            <App />
          </TodoProvider>
        </ErrorBoundary>
      </React.StrictMode>
    ) : (
      <ErrorBoundary>
        <TodoProvider>
          <App />
        </TodoProvider>
      </ErrorBoundary>
    )
  );
};

// Initialize the application
renderApp();