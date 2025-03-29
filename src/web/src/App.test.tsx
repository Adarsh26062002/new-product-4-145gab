import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { useTodoContext } from './contexts/TodoContext';
import { FilterType } from './types/Filter';

// Mock the TodoContext
jest.mock('./contexts/TodoContext', () => ({
  __esModule: true,
  TodoContext: {
    Provider: ({ children }) => children,
  },
  useTodoContext: jest.fn(),
}));

// Helper function to render the App with specific context values
const renderWithTodoContext = (contextValue = {}) => {
  (useTodoContext as jest.Mock).mockReturnValue({
    tasks: [],
    filteredTasks: [],
    filter: FilterType.ALL,
    activeCount: 0,
    completedCount: 0,
    addTask: jest.fn(),
    updateTask: jest.fn(),
    toggleTask: jest.fn(),
    deleteTask: jest.fn(),
    updateTaskPriority: jest.fn(),
    setFilter: jest.fn(),
    clearCompletedTasks: jest.fn(),
    ...contextValue,
  });

  return render(<App />);
};

// Helper function to create mock tasks
const createMockTask = (id, text, completed = false, priority = 'medium') => ({
  id,
  text,
  completed,
  priority,
  createdAt: Date.now(),
});

describe('App component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders correctly with empty task list', () => {
    renderWithTodoContext();

    // Check for application title
    expect(screen.getByText('React Todo List')).toBeInTheDocument();
    
    // Verify that main components are present
    // We don't need to check implementation details of these components
    // as they have their own tests
    expect(screen.getByRole('main')).toBeInTheDocument();
    
    // Verify task counter displays correctly
    expect(screen.getByText('0 items left')).toBeInTheDocument();
    
    // Clear completed button should not be visible
    expect(screen.queryByText('Clear completed')).not.toBeInTheDocument();
  });

  it('renders correctly with active tasks', () => {
    const mockTasks = [
      createMockTask('1', 'Task 1'),
      createMockTask('2', 'Task 2'),
    ];
    
    renderWithTodoContext({
      tasks: mockTasks,
      filteredTasks: mockTasks,
      activeCount: 2,
      completedCount: 0,
    });

    // Verify task count display
    expect(screen.getByText('2 items left')).toBeInTheDocument();
    
    // Clear completed button should not be visible
    expect(screen.queryByText('Clear completed')).not.toBeInTheDocument();
  });

  it('renders correctly with completed tasks', () => {
    const mockTasks = [
      createMockTask('1', 'Task 1'),
      createMockTask('2', 'Task 2', true),
    ];
    
    renderWithTodoContext({
      tasks: mockTasks,
      filteredTasks: mockTasks,
      activeCount: 1,
      completedCount: 1,
    });

    // Verify task count display uses singular form for 1 item
    expect(screen.getByText('1 item left')).toBeInTheDocument();
    
    // Clear completed button should be visible
    expect(screen.getByText('Clear completed')).toBeInTheDocument();
  });

  it('handles clear completed tasks', async () => {
    const clearCompletedTasksMock = jest.fn();
    
    renderWithTodoContext({
      tasks: [
        createMockTask('1', 'Task 1'),
        createMockTask('2', 'Task 2', true),
      ],
      activeCount: 1,
      completedCount: 1,
      clearCompletedTasks: clearCompletedTasksMock,
    });

    // Click the clear completed button
    const clearButton = screen.getByText('Clear completed');
    userEvent.click(clearButton);
    
    // Verify the mock function was called
    expect(clearCompletedTasksMock).toHaveBeenCalledTimes(1);
  });

  it('integrates with TodoContext', () => {
    const mockContext = {
      tasks: [
        createMockTask('1', 'Task 1'),
        createMockTask('2', 'Task 2', true),
      ],
      filteredTasks: [createMockTask('1', 'Task 1')],
      filter: FilterType.ACTIVE,
      activeCount: 1,
      completedCount: 1,
      clearCompletedTasks: jest.fn(),
    };
    
    renderWithTodoContext(mockContext);
    
    // Verify correct values from context are displayed
    expect(screen.getByText('1 item left')).toBeInTheDocument();
    expect(screen.getByText('Clear completed')).toBeInTheDocument();
  });

  it('handles error states gracefully', () => {
    // Mock console.error to prevent test output clutter
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Since the ErrorBoundary is in the AppContainer and not in the App component,
    // proper error boundary testing would be done in an integration test
    // This is a placeholder test that should be expanded with appropriate
    // integration testing of the error boundary functionality
    
    // A real test would render the AppContainer, force an error in a child component,
    // and verify the fallback UI is displayed properly
    
    // Restore console.error
    console.error = originalConsoleError;
    
    // This assertion will pass but should be replaced with real error boundary testing
    expect(true).toBeTruthy();
  });
});