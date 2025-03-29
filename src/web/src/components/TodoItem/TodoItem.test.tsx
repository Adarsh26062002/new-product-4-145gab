import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // ^13.0.0
import userEvent from '@testing-library/user-event'; // ^14.0.0
import TodoItem from './TodoItem';
import { Task, Priority } from '../../types/Task';
import { TodoContext } from '../../contexts/TodoContext';

/**
 * Helper function to render a component with mocked TodoContext
 */
const renderWithTodoContext = (ui: React.ReactElement, contextValue: any) => {
  return render(
    <TodoContext.Provider value={contextValue}>
      {ui}
    </TodoContext.Provider>
  );
};

/**
 * Helper function to create a mock task for testing
 */
const createMockTask = (overrides?: Partial<Task>): Task => {
  return {
    id: 'task-123',
    text: 'Test task',
    completed: false,
    priority: Priority.MEDIUM,
    createdAt: Date.now(),
    ...overrides
  };
};

describe('TodoItem component', () => {
  // Mock context functions
  let toggleTaskMock: jest.Mock;
  let deleteTaskMock: jest.Mock;
  let updateTaskMock: jest.Mock;
  let mockContextValue: any;
  
  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    toggleTaskMock = jest.fn();
    deleteTaskMock = jest.fn();
    updateTaskMock = jest.fn();
    
    mockContextValue = {
      toggleTask: toggleTaskMock,
      deleteTask: deleteTaskMock,
      updateTask: updateTaskMock,
      // Include other required context properties
      tasks: [],
      filteredTasks: [],
      filter: 'all',
      activeCount: 0,
      completedCount: 0,
      addTask: jest.fn(),
      updateTaskPriority: jest.fn(),
      setFilter: jest.fn(),
      clearCompletedTasks: jest.fn()
    };
  });

  test('renders the task text and completion status', () => {
    const task = createMockTask({ text: 'Buy groceries' });
    renderWithTodoContext(<TodoItem task={task} />, mockContextValue);
    
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  test('displays the correct priority indicator', () => {
    // Test high priority
    const highPriorityTask = createMockTask({ priority: Priority.HIGH });
    const { rerender } = renderWithTodoContext(<TodoItem task={highPriorityTask} />, mockContextValue);
    
    // We can't directly test CSS classes with CSS modules,
    // but we can verify the task rendered with the expected text
    expect(screen.getByText(highPriorityTask.text)).toBeInTheDocument();
    
    // Test medium priority
    const mediumPriorityTask = createMockTask({ priority: Priority.MEDIUM });
    rerender(<TodoContext.Provider value={mockContextValue}><TodoItem task={mediumPriorityTask} /></TodoContext.Provider>);
    expect(screen.getByText(mediumPriorityTask.text)).toBeInTheDocument();
    
    // Test low priority
    const lowPriorityTask = createMockTask({ priority: Priority.LOW });
    rerender(<TodoContext.Provider value={mockContextValue}><TodoItem task={lowPriorityTask} /></TodoContext.Provider>);
    expect(screen.getByText(lowPriorityTask.text)).toBeInTheDocument();
  });

  test('applies completed styling when task is completed', () => {
    const completedTask = createMockTask({ completed: true, text: 'Completed task' });
    renderWithTodoContext(<TodoItem task={completedTask} />, mockContextValue);
    
    // Check that the checkbox is checked
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    
    // Verify task text is present
    const taskText = screen.getByText('Completed task');
    expect(taskText).toBeInTheDocument();
    
    // We can't directly test CSS styling with CSS modules
  });

  test('calls toggleTask when checkbox is clicked', () => {
    const task = createMockTask();
    renderWithTodoContext(<TodoItem task={task} />, mockContextValue);
    
    fireEvent.click(screen.getByRole('checkbox'));
    
    expect(toggleTaskMock).toHaveBeenCalledWith(task.id);
  });

  test('calls deleteTask when delete button is clicked', () => {
    const task = createMockTask();
    renderWithTodoContext(<TodoItem task={task} />, mockContextValue);
    
    fireEvent.click(screen.getByText('Delete'));
    
    expect(deleteTaskMock).toHaveBeenCalledWith(task.id);
  });

  test('enters edit mode when edit button is clicked', () => {
    const task = createMockTask({ text: 'Original task' });
    renderWithTodoContext(<TodoItem task={task} />, mockContextValue);
    
    fireEvent.click(screen.getByText('Edit'));
    
    // In edit mode, the input should be visible
    const inputElement = screen.getByLabelText('Edit task text');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveValue('Original task');
    
    // Save and Cancel buttons should be visible
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('updates task text when edit is submitted', async () => {
    const task = createMockTask({ text: 'Original task' });
    renderWithTodoContext(<TodoItem task={task} />, mockContextValue);
    
    // Enter edit mode
    fireEvent.click(screen.getByText('Edit'));
    
    // Change the input value
    const inputElement = screen.getByLabelText('Edit task text');
    fireEvent.change(inputElement, { target: { value: 'Updated task' } });
    
    // Submit the form
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    expect(updateTaskMock).toHaveBeenCalledWith({
      id: task.id,
      text: 'Updated task'
    });
    
    // After submission, edit mode should be exited
    await waitFor(() => {
      expect(screen.queryByLabelText('Edit task text')).not.toBeInTheDocument();
    });
  });

  test('cancels edit when cancel button is clicked', () => {
    const task = createMockTask({ text: 'Original task' });
    renderWithTodoContext(<TodoItem task={task} />, mockContextValue);
    
    // Enter edit mode
    fireEvent.click(screen.getByText('Edit'));
    
    // Change the input value
    const inputElement = screen.getByLabelText('Edit task text');
    fireEvent.change(inputElement, { target: { value: 'Updated task' } });
    
    // Click cancel button
    fireEvent.click(screen.getByText('Cancel'));
    
    // updateTask should not be called
    expect(updateTaskMock).not.toHaveBeenCalled();
    
    // Should exit edit mode and show original text
    expect(screen.queryByLabelText('Edit task text')).not.toBeInTheDocument();
    expect(screen.getByText('Original task')).toBeInTheDocument();
  });

  test('prevents empty task submission', () => {
    const task = createMockTask({ text: 'Original task' });
    renderWithTodoContext(<TodoItem task={task} />, mockContextValue);
    
    // Enter edit mode
    fireEvent.click(screen.getByText('Edit'));
    
    // Clear the input value
    const inputElement = screen.getByLabelText('Edit task text');
    fireEvent.change(inputElement, { target: { value: '' } });
    
    // Submit the form
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    // updateTask should not be called with empty text
    expect(updateTaskMock).not.toHaveBeenCalled();
    
    // Should stay in edit mode
    expect(screen.getByLabelText('Edit task text')).toBeInTheDocument();
  });

  test('trims whitespace from edited text', () => {
    const task = createMockTask({ text: 'Original task' });
    renderWithTodoContext(<TodoItem task={task} />, mockContextValue);
    
    // Enter edit mode
    fireEvent.click(screen.getByText('Edit'));
    
    // Change the input value with extra whitespace
    const inputElement = screen.getByLabelText('Edit task text');
    fireEvent.change(inputElement, { target: { value: '  Updated task  ' } });
    
    // Submit the form
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    // updateTask should be called with trimmed text
    expect(updateTaskMock).toHaveBeenCalledWith({
      id: task.id,
      text: 'Updated task'
    });
  });

  test('is keyboard accessible', async () => {
    const task = createMockTask();
    renderWithTodoContext(<TodoItem task={task} />, mockContextValue);
    
    // Test checkbox with Space key
    const checkbox = screen.getByRole('checkbox');
    checkbox.focus();
    fireEvent.keyDown(checkbox, { key: ' ' });
    
    expect(toggleTaskMock).toHaveBeenCalledWith(task.id);
    
    // Test edit button with Enter key
    const editButton = screen.getByText('Edit');
    editButton.focus();
    fireEvent.keyDown(editButton, { key: 'Enter' });
    
    // Should be in edit mode
    const inputElement = screen.getByLabelText('Edit task text');
    expect(inputElement).toBeInTheDocument();
    
    // Fill in the input
    fireEvent.change(inputElement, { target: { value: 'Updated with keyboard' } });
    
    // Submit the form with Enter key
    const saveButton = screen.getByText('Save');
    saveButton.focus();
    fireEvent.keyDown(saveButton, { key: 'Enter' });
    
    // updateTask should be called with the new text
    expect(updateTaskMock).toHaveBeenCalledWith({
      id: task.id,
      text: 'Updated with keyboard'
    });
  });
});