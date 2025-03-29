import { renderHook, act } from '@testing-library/react-hooks'; // ^8.0.1
import { act as reactAct } from '@testing-library/react'; // ^14.0.0
import useTodoList from './useTodoList';
import { Task, Priority } from '../types/Task';
import { FilterType } from '../types/Filter';
import { LocalStorageService } from '../services/localStorage';
import TaskUtils from '../utils/taskUtils';
import useLocalStorage from './useLocalStorage';

// Mock dependencies
jest.mock('./useLocalStorage');
jest.mock('../utils/taskUtils');

/**
 * Helper function to create mock task objects for testing
 */
const createMockTask = (taskProps: Partial<Task> = {}): Task => ({
  id: taskProps.id || 'mock-id-1',
  text: taskProps.text || 'Mock Task',
  completed: taskProps.completed ?? false,
  priority: taskProps.priority || Priority.MEDIUM,
  createdAt: taskProps.createdAt || 1623456789000,
});

describe('useTodoList', () => {
  // Reset mock implementations before each test
  beforeEach(() => {
    jest.resetAllMocks();

    // Default mock implementation for useLocalStorage
    (useLocalStorage as jest.Mock).mockImplementation((key, initialValue) => [
      initialValue,
      jest.fn(),
      jest.fn()
    ]);

    // Default mock implementations for TaskUtils methods
    TaskUtils.getActiveTaskCount = jest.fn().mockReturnValue(0);
    TaskUtils.getCompletedTaskCount = jest.fn().mockReturnValue(0);
    TaskUtils.filterTasks = jest.fn().mockImplementation((tasks) => tasks);
    TaskUtils.sortTasksByPriority = jest.fn().mockImplementation((tasks) => tasks);
    TaskUtils.createTask = jest.fn();
    TaskUtils.updateTask = jest.fn();
    TaskUtils.toggleTaskStatus = jest.fn();
    TaskUtils.deleteTask = jest.fn();
    TaskUtils.updateTaskPriority = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with empty tasks and default filter', () => {
    // Arrange & Act
    const { result } = renderHook(() => useTodoList());

    // Assert
    expect(result.current.tasks).toEqual([]);
    expect(result.current.filter).toBe(FilterType.ALL);
    expect(result.current.activeCount).toBe(0);
    expect(result.current.completedCount).toBe(0);
  });

  test('should add a new task', () => {
    // Arrange
    const mockTask = createMockTask({ text: 'New Task', priority: Priority.HIGH });
    const setTasksMock = jest.fn();
    
    (useLocalStorage as jest.Mock).mockImplementation((key) => {
      if (key === LocalStorageService.STORAGE_KEYS.TASKS) {
        return [[], setTasksMock];
      }
      return [FilterType.ALL, jest.fn()];
    });

    TaskUtils.createTask = jest.fn().mockReturnValue(mockTask);

    // Act
    const { result } = renderHook(() => useTodoList());
    act(() => {
      result.current.addTask({ text: 'New Task', priority: Priority.HIGH });
    });

    // Assert
    expect(TaskUtils.createTask).toHaveBeenCalledWith({ 
      text: 'New Task', 
      priority: Priority.HIGH 
    });
    expect(setTasksMock).toHaveBeenCalledWith(expect.any(Function));
    
    // Verify the state update function works correctly
    const setTasksCallback = setTasksMock.mock.calls[0][0];
    const updatedTasks = setTasksCallback([]);
    expect(updatedTasks).toEqual([mockTask]);
  });

  test('should update an existing task', () => {
    // Arrange
    const initialTasks = [createMockTask({ id: 'task-1', text: 'Original Text' })];
    const updatedTasks = [createMockTask({ id: 'task-1', text: 'Updated Text' })];
    const setTasksMock = jest.fn();
    
    (useLocalStorage as jest.Mock).mockImplementation((key) => {
      if (key === LocalStorageService.STORAGE_KEYS.TASKS) {
        return [initialTasks, setTasksMock];
      }
      return [FilterType.ALL, jest.fn()];
    });

    TaskUtils.updateTask = jest.fn().mockReturnValue(updatedTasks);

    // Act
    const { result } = renderHook(() => useTodoList());
    act(() => {
      result.current.updateTask({ id: 'task-1', text: 'Updated Text' });
    });

    // Assert
    expect(TaskUtils.updateTask).toHaveBeenCalledWith(
      initialTasks,
      { id: 'task-1', text: 'Updated Text' }
    );
    expect(setTasksMock).toHaveBeenCalled();
  });

  test('should toggle task completion status', () => {
    // Arrange
    const initialTasks = [createMockTask({ id: 'task-1', completed: false })];
    const toggledTasks = [createMockTask({ id: 'task-1', completed: true })];
    const setTasksMock = jest.fn();
    
    (useLocalStorage as jest.Mock).mockImplementation((key) => {
      if (key === LocalStorageService.STORAGE_KEYS.TASKS) {
        return [initialTasks, setTasksMock];
      }
      return [FilterType.ALL, jest.fn()];
    });

    TaskUtils.toggleTaskStatus = jest.fn().mockReturnValue(toggledTasks);

    // Act
    const { result } = renderHook(() => useTodoList());
    act(() => {
      result.current.toggleTask('task-1');
    });

    // Assert
    expect(TaskUtils.toggleTaskStatus).toHaveBeenCalledWith(initialTasks, 'task-1');
    expect(setTasksMock).toHaveBeenCalled();
  });

  test('should delete a task', () => {
    // Arrange
    const initialTasks = [
      createMockTask({ id: 'task-1' }),
      createMockTask({ id: 'task-2' })
    ];
    const tasksAfterDeletion = [createMockTask({ id: 'task-2' })];
    const setTasksMock = jest.fn();
    
    (useLocalStorage as jest.Mock).mockImplementation((key) => {
      if (key === LocalStorageService.STORAGE_KEYS.TASKS) {
        return [initialTasks, setTasksMock];
      }
      return [FilterType.ALL, jest.fn()];
    });

    TaskUtils.deleteTask = jest.fn().mockReturnValue(tasksAfterDeletion);

    // Act
    const { result } = renderHook(() => useTodoList());
    act(() => {
      result.current.deleteTask('task-1');
    });

    // Assert
    expect(TaskUtils.deleteTask).toHaveBeenCalledWith(initialTasks, 'task-1');
    expect(setTasksMock).toHaveBeenCalled();
  });

  test('should update task priority', () => {
    // Arrange
    const initialTasks = [createMockTask({ id: 'task-1', priority: Priority.MEDIUM })];
    const updatedTasks = [createMockTask({ id: 'task-1', priority: Priority.HIGH })];
    const setTasksMock = jest.fn();
    
    (useLocalStorage as jest.Mock).mockImplementation((key) => {
      if (key === LocalStorageService.STORAGE_KEYS.TASKS) {
        return [initialTasks, setTasksMock];
      }
      return [FilterType.ALL, jest.fn()];
    });

    TaskUtils.updateTaskPriority = jest.fn().mockReturnValue(updatedTasks);

    // Act
    const { result } = renderHook(() => useTodoList());
    act(() => {
      result.current.updateTaskPriority('task-1', Priority.HIGH);
    });

    // Assert
    expect(TaskUtils.updateTaskPriority).toHaveBeenCalledWith(
      initialTasks,
      'task-1',
      Priority.HIGH
    );
    expect(setTasksMock).toHaveBeenCalled();
  });

  test('should filter tasks correctly', () => {
    // Arrange
    const allTasks = [
      createMockTask({ id: 'task-1', completed: false }),
      createMockTask({ id: 'task-2', completed: true })
    ];
    const activeTasks = [createMockTask({ id: 'task-1', completed: false })];
    const completedTasks = [createMockTask({ id: 'task-2', completed: true })];
    const sortedAllTasks = [...allTasks];
    const sortedActiveTasks = [...activeTasks];
    const sortedCompletedTasks = [...completedTasks];
    
    let currentFilter = FilterType.ALL;
    const setFilterMock = jest.fn((newFilter) => {
      currentFilter = newFilter;
    });
    
    (useLocalStorage as jest.Mock).mockImplementation((key) => {
      if (key === LocalStorageService.STORAGE_KEYS.TASKS) {
        return [allTasks, jest.fn()];
      }
      if (key === LocalStorageService.STORAGE_KEYS.FILTER) {
        return [currentFilter, setFilterMock];
      }
      return [null, jest.fn()];
    });

    TaskUtils.filterTasks = jest.fn().mockImplementation((tasks, filter) => {
      if (filter === FilterType.ACTIVE) return activeTasks;
      if (filter === FilterType.COMPLETED) return completedTasks;
      return allTasks;
    });
    
    TaskUtils.sortTasksByPriority = jest.fn().mockImplementation((tasks) => {
      if (tasks === activeTasks) return sortedActiveTasks;
      if (tasks === completedTasks) return sortedCompletedTasks;
      return sortedAllTasks;
    });

    // Act & Assert - Initial state
    const { result, rerender } = renderHook(() => useTodoList());
    
    expect(TaskUtils.filterTasks).toHaveBeenCalledWith(allTasks, FilterType.ALL);
    expect(TaskUtils.sortTasksByPriority).toHaveBeenCalledWith(allTasks);
    expect(result.current.filteredTasks).toEqual(sortedAllTasks);
    
    // Act & Assert - Filter active tasks
    act(() => {
      result.current.setFilter(FilterType.ACTIVE);
    });
    
    // Re-render to trigger useMemo recalculation
    rerender();
    
    expect(setFilterMock).toHaveBeenCalledWith(FilterType.ACTIVE);
    expect(TaskUtils.filterTasks).toHaveBeenCalledWith(allTasks, FilterType.ACTIVE);
    expect(TaskUtils.sortTasksByPriority).toHaveBeenCalledWith(activeTasks);
    expect(result.current.filteredTasks).toEqual(sortedActiveTasks);
    
    // Act & Assert - Filter completed tasks
    TaskUtils.filterTasks.mockClear();
    TaskUtils.sortTasksByPriority.mockClear();
    
    act(() => {
      result.current.setFilter(FilterType.COMPLETED);
    });
    
    // Re-render to trigger useMemo recalculation
    rerender();
    
    expect(setFilterMock).toHaveBeenCalledWith(FilterType.COMPLETED);
    expect(TaskUtils.filterTasks).toHaveBeenCalledWith(allTasks, FilterType.COMPLETED);
    expect(TaskUtils.sortTasksByPriority).toHaveBeenCalledWith(completedTasks);
    expect(result.current.filteredTasks).toEqual(sortedCompletedTasks);
  });

  test('should calculate active and completed counts correctly', () => {
    // Arrange
    const tasks = [
      createMockTask({ id: 'task-1', completed: false }),
      createMockTask({ id: 'task-2', completed: true }),
      createMockTask({ id: 'task-3', completed: false })
    ];
    
    (useLocalStorage as jest.Mock).mockImplementation((key) => {
      if (key === LocalStorageService.STORAGE_KEYS.TASKS) {
        return [tasks, jest.fn()];
      }
      return [FilterType.ALL, jest.fn()];
    });

    TaskUtils.getActiveTaskCount = jest.fn().mockReturnValue(2);
    TaskUtils.getCompletedTaskCount = jest.fn().mockReturnValue(1);

    // Act
    const { result } = renderHook(() => useTodoList());

    // Assert
    expect(TaskUtils.getActiveTaskCount).toHaveBeenCalledWith(tasks);
    expect(TaskUtils.getCompletedTaskCount).toHaveBeenCalledWith(tasks);
    expect(result.current.activeCount).toBe(2);
    expect(result.current.completedCount).toBe(1);
  });

  test('should clear completed tasks', () => {
    // Arrange
    const initialTasks = [
      createMockTask({ id: 'task-1', completed: false }),
      createMockTask({ id: 'task-2', completed: true }),
      createMockTask({ id: 'task-3', completed: true })
    ];
    const activeTasks = [createMockTask({ id: 'task-1', completed: false })];
    const setTasksMock = jest.fn();
    
    (useLocalStorage as jest.Mock).mockImplementation((key) => {
      if (key === LocalStorageService.STORAGE_KEYS.TASKS) {
        return [initialTasks, setTasksMock];
      }
      return [FilterType.ALL, jest.fn()];
    });

    // Act
    const { result } = renderHook(() => useTodoList());
    act(() => {
      result.current.clearCompletedTasks();
    });

    // Assert
    expect(setTasksMock).toHaveBeenCalled();
    // Verify the state update function filters out completed tasks
    const setTasksCallback = setTasksMock.mock.calls[0][0];
    expect(setTasksCallback(initialTasks)).toEqual(
      initialTasks.filter(task => !task.completed)
    );
  });
});