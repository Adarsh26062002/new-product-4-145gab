import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // ^14.4.3
import TodoForm from './TodoForm';
import { TodoContext, useTodoContext } from '../../contexts/TodoContext';
import { Priority } from '../../types/Task';
import TaskUtils from '../../utils/taskUtils';

// Mock the taskUtils module
jest.mock('../../utils/taskUtils', () => ({
  __esModule: true,
  default: {
    validateTaskText: jest.fn(),
    sanitizeTaskText: jest.fn()
  }
}));

// Mock the useTodoContext hook
jest.mock('../../contexts/TodoContext', () => {
  const originalModule = jest.requireActual('../../contexts/TodoContext');
  return {
    ...originalModule,
    useTodoContext: jest.fn()
  };
});

// Helper function to render components with TodoContext
const renderWithTodoContext = (ui: React.ReactNode, contextOverrides = {}) => {
  const defaultContextValue = {
    addTask: jest.fn(),
    tasks: [],
    filteredTasks: [],
    filter: 'all',
    activeCount: 0,
    completedCount: 0,
    toggleTask: jest.fn(),
    deleteTask: jest.fn(),
    updateTask: jest.fn(),
    updateTaskPriority: jest.fn(),
    setFilter: jest.fn(),
    clearCompletedTasks: jest.fn()
  };

  const mockContextValue = { ...defaultContextValue, ...contextOverrides };
  (useTodoContext as jest.Mock).mockReturnValue(mockContextValue);

  return {
    ...render(ui),
    mockContextValue
  };
};

describe('TodoForm component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set default behavior for validateTaskText
    (TaskUtils.validateTaskText as jest.Mock).mockImplementation(text => text && text.trim().length > 0);
    // Set default behavior for sanitizeTaskText
    (TaskUtils.sanitizeTaskText as jest.Mock).mockImplementation(text => text.trim());
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders correctly', () => {
    renderWithTodoContext(<TodoForm />);
    
    // Check form with its aria-label
    const form = screen.getByRole('form', { name: /add task form/i });
    expect(form).toBeInTheDocument();
    
    // Check input and button
    expect(screen.getByPlaceholderText('Add a new task...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
  });

  it('handles input changes', async () => {
    renderWithTodoContext(<TodoForm />);
    
    const input = screen.getByPlaceholderText('Add a new task...');
    await userEvent.type(input, 'New task');
    
    expect(input).toHaveValue('New task');
  });

  it('validates empty input', async () => {
    const { mockContextValue } = renderWithTodoContext(<TodoForm />);
    
    // Setup validation to fail for empty input
    (TaskUtils.validateTaskText as jest.Mock).mockReturnValue(false);
    
    const submitButton = screen.getByRole('button', { name: /add task/i });
    await userEvent.click(submitButton);
    
    expect(mockContextValue.addTask).not.toHaveBeenCalled();
    expect(screen.getByText('Task cannot be empty')).toBeInTheDocument();
  });

  it('validates whitespace-only input', async () => {
    const { mockContextValue } = renderWithTodoContext(<TodoForm />);
    
    // Type only spaces
    const input = screen.getByPlaceholderText('Add a new task...');
    await userEvent.type(input, '   ');
    
    // Setup validation to fail for whitespace-only input
    (TaskUtils.validateTaskText as jest.Mock).mockReturnValue(false);
    
    const submitButton = screen.getByRole('button', { name: /add task/i });
    await userEvent.click(submitButton);
    
    expect(mockContextValue.addTask).not.toHaveBeenCalled();
    expect(screen.getByText('Task cannot be empty')).toBeInTheDocument();
  });

  it('submits valid input', async () => {
    const { mockContextValue } = renderWithTodoContext(<TodoForm />);
    
    // Type a valid task
    const input = screen.getByPlaceholderText('Add a new task...');
    await userEvent.type(input, 'New task');
    
    // Setup validation to pass
    (TaskUtils.validateTaskText as jest.Mock).mockReturnValue(true);
    (TaskUtils.sanitizeTaskText as jest.Mock).mockReturnValue('New task');
    
    const submitButton = screen.getByRole('button', { name: /add task/i });
    await userEvent.click(submitButton);
    
    expect(mockContextValue.addTask).toHaveBeenCalledWith({
      text: 'New task',
      priority: Priority.MEDIUM
    });
    expect(input).toHaveValue(''); // Input should be cleared
  });

  it('focuses input after submission', async () => {
    const { mockContextValue } = renderWithTodoContext(<TodoForm />);
    
    // Mock focus function
    const focusMock = jest.fn();
    HTMLInputElement.prototype.focus = focusMock;
    
    // Type a valid task
    const input = screen.getByPlaceholderText('Add a new task...');
    await userEvent.type(input, 'New task');
    
    // Setup validation to pass
    (TaskUtils.validateTaskText as jest.Mock).mockReturnValue(true);
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /add task/i });
    await userEvent.click(submitButton);
    
    // Check that focus was called
    expect(focusMock).toHaveBeenCalled();
  });

  it('sanitizes input before submission', async () => {
    const { mockContextValue } = renderWithTodoContext(<TodoForm />);
    
    // Type a task with surrounding whitespace
    const input = screen.getByPlaceholderText('Add a new task...');
    await userEvent.type(input, '  Task with whitespace  ');
    
    // Setup validation to pass
    (TaskUtils.validateTaskText as jest.Mock).mockReturnValue(true);
    // Setup sanitization to trim whitespace
    (TaskUtils.sanitizeTaskText as jest.Mock).mockReturnValue('Task with whitespace');
    
    const submitButton = screen.getByRole('button', { name: /add task/i });
    await userEvent.click(submitButton);
    
    expect(TaskUtils.sanitizeTaskText).toHaveBeenCalledWith('  Task with whitespace  ');
    expect(mockContextValue.addTask).toHaveBeenCalledWith({
      text: 'Task with whitespace',
      priority: Priority.MEDIUM
    });
  });

  it('clears validation error when user starts typing', async () => {
    renderWithTodoContext(<TodoForm />);
    
    // Setup validation to fail initially
    (TaskUtils.validateTaskText as jest.Mock).mockReturnValue(false);
    
    // Submit empty form to trigger error
    const submitButton = screen.getByRole('button', { name: /add task/i });
    await userEvent.click(submitButton);
    
    // Verify error is shown
    expect(screen.getByText('Task cannot be empty')).toBeInTheDocument();
    
    // Start typing to clear the error
    const input = screen.getByPlaceholderText('Add a new task...');
    await userEvent.type(input, 'a');
    
    // Verify error is no longer shown
    expect(screen.queryByText('Task cannot be empty')).not.toBeInTheDocument();
  });

  it('integrates with TodoContext', async () => {
    // Create a real-like context with a mock function
    const addTaskMock = jest.fn();
    
    // Render with a specific mock context
    render(
      <TodoContext.Provider value={{
        addTask: addTaskMock,
        tasks: [],
        filteredTasks: [],
        filter: 'all',
        activeCount: 0,
        completedCount: 0,
        toggleTask: jest.fn(),
        deleteTask: jest.fn(),
        updateTask: jest.fn(),
        updateTaskPriority: jest.fn(),
        setFilter: jest.fn(),
        clearCompletedTasks: jest.fn()
      }}>
        <TodoForm />
      </TodoContext.Provider>
    );
    
    // Setup validation and sanitization
    (TaskUtils.validateTaskText as jest.Mock).mockReturnValue(true);
    (TaskUtils.sanitizeTaskText as jest.Mock).mockReturnValue('Integration test');
    
    // Type and submit a task
    const input = screen.getByPlaceholderText('Add a new task...');
    await userEvent.type(input, 'Integration test');
    
    const submitButton = screen.getByRole('button', { name: /add task/i });
    await userEvent.click(submitButton);
    
    // Verify context function was called
    expect(addTaskMock).toHaveBeenCalledWith({
      text: 'Integration test',
      priority: Priority.MEDIUM
    });
  });
});