import React, { useCallback } from 'react'; // ^18.2.0
import styles from './App.module.css';
import { TodoProvider, useTodoContext } from './contexts/TodoContext';
import TodoForm from './components/TodoForm/TodoForm';
import TodoList from './components/TodoList/TodoList';
import FilterControls from './components/FilterControls/FilterControls';
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary';

/**
 * A fallback UI component displayed when an error occurs in the application
 */
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  return (
    <div className={styles.errorContainer}>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button 
        className={styles.clearButton} 
        onClick={resetErrorBoundary}
      >
        Try again
      </button>
    </div>
  );
};

/**
 * The main application component that renders the entire Todo List application
 */
const App: React.FC = () => {
  // Access the todo context to get task counts and clear completed tasks function
  const { activeCount, completedCount, clearCompletedTasks } = useTodoContext();

  // Define a callback function to clear completed tasks
  const handleClearCompleted = useCallback(() => {
    clearCompletedTasks();
  }, [clearCompletedTasks]);

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>React Todo List</h1>
        </header>

        <main className={styles.main}>
          <TodoForm />
          <FilterControls />
          <TodoList />
        </main>

        <footer className={styles.footer}>
          <p className={styles.taskCount}>
            {activeCount} {activeCount === 1 ? 'item' : 'items'} left
          </p>
          {completedCount > 0 && (
            <button
              className={styles.clearButton}
              onClick={handleClearCompleted}
              aria-label="Clear completed tasks"
            >
              Clear completed
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

/**
 * The root component that wraps the entire application with necessary providers
 * This is for internal use, as the App component is what gets exported
 */
const AppContainer: React.FC = () => {
  return (
    <ErrorBoundary
      fallbackUI={<ErrorFallback 
        error={new Error("An unexpected error occurred")} 
        resetErrorBoundary={() => window.location.reload()} 
      />}
    >
      <TodoProvider>
        <App />
      </TodoProvider>
    </ErrorBoundary>
  );
};

export default App;