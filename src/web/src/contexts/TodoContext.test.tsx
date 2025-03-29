import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'; // ^13.4.0
import { TodoContext, TodoProvider, useTodoContext } from './TodoContext';
import { Task } from '../types/Task';
import { FilterType } from '../types/Filter';

// Mock the useTodoList hook
jest.mock('../hooks/useTodoList', () => jest.fn());

// Import the mocked hook
import useTodoList from '../hooks/useTodoList';

// Test fixtures
const mockTasks: Task[] = [
  { id: 'task-1', text: 'Test Task 1', completed: false, priority: 'medium', createdAt: 1234567890 },
  { id: 'task-2', text: 'Test Task 2', completed: true, priority: 'high', createdAt: 1234567891 }
];

const mockFilteredTasks: Task[] = [
  { id: 'task-1', text: 'Test Task 1', completed: false, priority: 'medium', createdAt: 1234567890 }
];

// Setup function to configure the mock implementation
const setup = (mockTodoListHook: any) => {
  // Configure the mock implementation
  (useTodoList as jest.Mock).mockImplementation(() => mockTodoListHook);
  
  // Reset any previous mock calls
  jest.clearAllMocks();
};

// Test component that uses the TodoContext
const TestComponent: React.FC = () => {
  const {
    tasks,
    filteredTasks,
    filter,
    activeCount,
    completedCount,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    updateTaskPriority,
    setFilter,
    clearCompletedTasks
  } = useTodoContext();

  return (
    <div>
      <h1>Tasks: {tasks.length}</h1>
      <p>Filter: {filter}</p>
      <p>Active: {activeCount}</p>
      <p>Completed: {completedCount}</p>
      <ul>
        {filteredTasks.map(task => (
          <li key={task.id} data-testid={`task-${task.id}`}>
            {task.text} - {task.completed ? 'Completed' : 'Active'} - {task.priority}
          </li>
        ))}
      </ul>
      <button onClick={() => addTask({ text: 'New Task' })}>Add Task</button>
      <button onClick={() => toggleTask('task-1')}>Toggle Task</button>
      <button onClick={() => updateTask({ id: 'task-1', text: 'Updated Task' })}>Update Task</button>
      <button onClick={() => deleteTask('task-1')}>Delete Task</button>
      <button onClick={() => updateTaskPriority('task-1', 'high')}>Update Priority</button>
      <button onClick={() => setFilter(FilterType.ACTIVE)}>Set Filter</button>
      <button onClick={() => clearCompletedTasks()}>Clear Completed</button>
    </div>
  );
};

describe('TodoContext', () => {
  test('should throw an error when used outside of TodoProvider', () => {
    // Suppress console error output during this test
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Expect the render to throw an error
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTodoContext must be used within a TodoProvider');
    
    // Restore console.error
    consoleError.mockRestore();
  });

  test('should provide context values to child components', () => {
    // Arrange
    const mockContextValue = {
      tasks: mockTasks,
      filteredTasks: mockFilteredTasks,
      filter: FilterType.ACTIVE,
      activeCount: 1,
      completedCount: 1,
      addTask: jest.fn(),
      updateTask: jest.fn(),
      toggleTask: jest.fn(),
      deleteTask: jest.fn(),
      updateTaskPriority: jest.fn(),
      setFilter: jest.fn(),
      clearCompletedTasks: jest.fn()
    };
    
    setup(mockContextValue);
    
    // Act
    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );
    
    // Assert
    expect(screen.getByText('Tasks: 2')).toBeInTheDocument();
    expect(screen.getByText('Filter: active')).toBeInTheDocument();
    expect(screen.getByText('Active: 1')).toBeInTheDocument();
    expect(screen.getByText('Completed: 1')).toBeInTheDocument();
    
    // Check that the filtered tasks are displayed correctly
    expect(screen.getByTestId('task-task-1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 1 - Active - medium')).toBeInTheDocument();
    // The filtered tasks should only show the active task
    expect(screen.queryByText('Test Task 2 - Completed - high')).not.toBeInTheDocument();
  });

  test('should allow adding a task', () => {
    // Arrange
    const addTaskMock = jest.fn();
    
    const mockContextValue = {
      tasks: [],
      filteredTasks: [],
      filter: FilterType.ALL,
      activeCount: 0,
      completedCount: 0,
      addTask: addTaskMock,
      updateTask: jest.fn(),
      toggleTask: jest.fn(),
      deleteTask: jest.fn(),
      updateTaskPriority: jest.fn(),
      setFilter: jest.fn(),
      clearCompletedTasks: jest.fn()
    };
    
    setup(mockContextValue);
    
    // Act
    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );
    
    // Click the add task button
    fireEvent.click(screen.getByText('Add Task'));
    
    // Assert
    expect(addTaskMock).toHaveBeenCalledWith({ text: 'New Task' });
  });

  test('should allow toggling a task', () => {
    // Arrange
    const toggleTaskMock = jest.fn();
    
    const mockContextValue = {
      tasks: [mockTasks[0]],
      filteredTasks: [mockTasks[0]],
      filter: FilterType.ALL,
      activeCount: 1,
      completedCount: 0,
      addTask: jest.fn(),
      updateTask: jest.fn(),
      toggleTask: toggleTaskMock,
      deleteTask: jest.fn(),
      updateTaskPriority: jest.fn(),
      setFilter: jest.fn(),
      clearCompletedTasks: jest.fn()
    };
    
    setup(mockContextValue);
    
    // Act
    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );
    
    // Click the toggle task button
    fireEvent.click(screen.getByText('Toggle Task'));
    
    // Assert
    expect(toggleTaskMock).toHaveBeenCalledWith('task-1');
  });

  test('should allow updating a task', () => {
    // Arrange
    const updateTaskMock = jest.fn();
    
    const mockContextValue = {
      tasks: [mockTasks[0]],
      filteredTasks: [mockTasks[0]],
      filter: FilterType.ALL,
      activeCount: 1,
      completedCount: 0,
      addTask: jest.fn(),
      updateTask: updateTaskMock,
      toggleTask: jest.fn(),
      deleteTask: jest.fn(),
      updateTaskPriority: jest.fn(),
      setFilter: jest.fn(),
      clearCompletedTasks: jest.fn()
    };
    
    setup(mockContextValue);
    
    // Act
    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );
    
    // Click the update task button
    fireEvent.click(screen.getByText('Update Task'));
    
    // Assert
    expect(updateTaskMock).toHaveBeenCalledWith({ id: 'task-1', text: 'Updated Task' });
  });

  test('should allow deleting a task', () => {
    // Arrange
    const deleteTaskMock = jest.fn();
    
    const mockContextValue = {
      tasks: [mockTasks[0]],
      filteredTasks: [mockTasks[0]],
      filter: FilterType.ALL,
      activeCount: 1,
      completedCount: 0,
      addTask: jest.fn(),
      updateTask: jest.fn(),
      toggleTask: jest.fn(),
      deleteTask: deleteTaskMock,
      updateTaskPriority: jest.fn(),
      setFilter: jest.fn(),
      clearCompletedTasks: jest.fn()
    };
    
    setup(mockContextValue);
    
    // Act
    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );
    
    // Click the delete task button
    fireEvent.click(screen.getByText('Delete Task'));
    
    // Assert
    expect(deleteTaskMock).toHaveBeenCalledWith('task-1');
  });

  test('should allow changing the filter', () => {
    // Arrange
    const setFilterMock = jest.fn();
    
    const mockContextValue = {
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
      setFilter: setFilterMock,
      clearCompletedTasks: jest.fn()
    };
    
    setup(mockContextValue);
    
    // Act
    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );
    
    // Click the set filter button
    fireEvent.click(screen.getByText('Set Filter'));
    
    // Assert
    expect(setFilterMock).toHaveBeenCalledWith(FilterType.ACTIVE);
  });

  test('should allow updating task priority', () => {
    // Arrange
    const updateTaskPriorityMock = jest.fn();
    
    const mockContextValue = {
      tasks: [mockTasks[0]],
      filteredTasks: [mockTasks[0]],
      filter: FilterType.ALL,
      activeCount: 1,
      completedCount: 0,
      addTask: jest.fn(),
      updateTask: jest.fn(),
      toggleTask: jest.fn(),
      deleteTask: jest.fn(),
      updateTaskPriority: updateTaskPriorityMock,
      setFilter: jest.fn(),
      clearCompletedTasks: jest.fn()
    };
    
    setup(mockContextValue);
    
    // Act
    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );
    
    // Click the update priority button
    fireEvent.click(screen.getByText('Update Priority'));
    
    // Assert
    expect(updateTaskPriorityMock).toHaveBeenCalledWith('task-1', 'high');
  });

  test('should allow clearing completed tasks', () => {
    // Arrange
    const clearCompletedTasksMock = jest.fn();
    
    const mockContextValue = {
      tasks: mockTasks,
      filteredTasks: mockTasks,
      filter: FilterType.ALL,
      activeCount: 1,
      completedCount: 1,
      addTask: jest.fn(),
      updateTask: jest.fn(),
      toggleTask: jest.fn(),
      deleteTask: jest.fn(),
      updateTaskPriority: jest.fn(),
      setFilter: jest.fn(),
      clearCompletedTasks: clearCompletedTasksMock
    };
    
    setup(mockContextValue);
    
    // Act
    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );
    
    // Click the clear completed button
    fireEvent.click(screen.getByText('Clear Completed'));
    
    // Assert
    expect(clearCompletedTasksMock).toHaveBeenCalled();
  });
});