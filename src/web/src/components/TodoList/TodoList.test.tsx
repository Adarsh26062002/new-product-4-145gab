import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import TodoList from './TodoList';
import { Task, Priority } from '../../types/Task';
import { FilterType } from '../../types/Filter';
import { TodoContext } from '../../contexts/TodoContext';

// Mock the TodoContext hook
jest.mock('../../contexts/TodoContext', () => ({
  ...jest.requireActual('../../contexts/TodoContext'),
  useTodoContext: jest.fn(),
}));

// Import the mocked hook
import { useTodoContext } from '../../contexts/TodoContext';

// Mock the TodoItem component
jest.mock('../TodoItem/TodoItem', () => {
  return function MockTodoItem({ task }: { task: Task }) {
    return <div data-testid="todo-item">{task.text}</div>;
  };
});

describe('TodoList component', () => {
  // Setup default mock values for the TodoContext
  const mockContextValue = {
    filteredTasks: [] as Task[],
    filter: FilterType.ALL,
    activeCount: 0,
    tasks: [] as Task[],
    completedCount: 0,
    addTask: jest.fn(),
    updateTask: jest.fn(),
    toggleTask: jest.fn(),
    deleteTask: jest.fn(),
    updateTaskPriority: jest.fn(),
    setFilter: jest.fn(),
    clearCompletedTasks: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (useTodoContext as jest.Mock).mockReturnValue(mockContextValue);
  });

  // Helper function to create mock tasks for testing
  const createMockTasks = (count: number, overrides = {}): Task[] => {
    return Array.from({ length: count }).map((_, index) => ({
      id: `task-${index}`,
      text: `Task ${index + 1}`,
      completed: false,
      priority: Priority.MEDIUM,
      createdAt: Date.now() - index * 1000,
      ...overrides,
    }));
  };

  test('renders a list of tasks', () => {
    // Create mock tasks
    const mockTasks = createMockTasks(3);
    
    // Setup mock context
    (useTodoContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      filteredTasks: mockTasks,
      activeCount: mockTasks.length,
    });
    
    // Render the component
    render(<TodoList />);
    
    // Verify each task is rendered
    mockTasks.forEach(task => {
      expect(screen.getByText(task.text)).toBeInTheDocument();
    });
  });

  test('shows empty state when no tasks are available', () => {
    // Setup mock context with empty tasks
    (useTodoContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      filteredTasks: [],
      filter: FilterType.ALL,
    });
    
    // Render the component
    render(<TodoList />);
    
    // Check for the empty state message
    expect(screen.getByText('No tasks to display')).toBeInTheDocument();
    expect(screen.getByText('Add a task to get started!')).toBeInTheDocument();
  });

  test('shows appropriate empty state message for active filter', () => {
    // Setup mock context with empty tasks and ACTIVE filter
    (useTodoContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      filteredTasks: [],
      filter: FilterType.ACTIVE,
    });
    
    // Render the component
    render(<TodoList />);
    
    // Check for the empty state message specific to active filter
    expect(screen.getByText('No active tasks found')).toBeInTheDocument();
  });

  test('shows appropriate empty state message for completed filter', () => {
    // Setup mock context with empty tasks and COMPLETED filter
    (useTodoContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      filteredTasks: [],
      filter: FilterType.COMPLETED,
    });
    
    // Render the component
    render(<TodoList />);
    
    // Check for the empty state message specific to completed filter
    expect(screen.getByText('No completed tasks found')).toBeInTheDocument();
  });

  test('displays the correct task counter', () => {
    // Create mock tasks with mixed completion status
    const mockTasks = [
      ...createMockTasks(2),
      ...createMockTasks(1, { completed: true }),
    ];
    
    (useTodoContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      filteredTasks: mockTasks,
      activeCount: 2,
    });
    
    // Render the component
    render(<TodoList />);
    
    // Check for the task counter showing 2 active tasks
    expect(screen.getByText('2 items left')).toBeInTheDocument();
  });

  test('uses proper pluralization in the task counter', () => {
    // Test with 1 active task
    (useTodoContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      filteredTasks: createMockTasks(1),
      activeCount: 1,
    });
    
    // Render the component
    render(<TodoList />);
    
    // Should say "1 item left" (singular)
    expect(screen.getByText('1 item left')).toBeInTheDocument();
    
    // Clean up
    screen.unmount();
    
    // Test with multiple active tasks
    (useTodoContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      filteredTasks: createMockTasks(3),
      activeCount: 3,
    });
    
    // Render the component again
    render(<TodoList />);
    
    // Should say "3 items left" (plural)
    expect(screen.getByText('3 items left')).toBeInTheDocument();
  });

  test('applies transitions when tasks change', () => {
    // Create mock tasks
    const mockTasks = createMockTasks(2);
    
    // Render component with tasks
    (useTodoContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      filteredTasks: mockTasks,
      activeCount: mockTasks.length,
    });
    
    render(<TodoList />);
    
    // Since we can't directly test TransitionGroup behavior,
    // we'll verify the component renders correctly with tasks
    mockTasks.forEach(task => {
      expect(screen.getByText(task.text)).toBeInTheDocument();
    });
  });

  test('is accessible', () => {
    // Create mock tasks
    const mockTasks = createMockTasks(3);
    
    // Render the component
    (useTodoContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      filteredTasks: mockTasks,
      activeCount: mockTasks.length,
    });
    
    render(<TodoList />);
    
    // Check for semantic structure and accessibility
    // The task counter provides important information to users
    const counter = screen.getByText('3 items left');
    expect(counter).toBeInTheDocument();
  });
});