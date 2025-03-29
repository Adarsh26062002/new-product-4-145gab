import taskUtils from './taskUtils';
import { Task, CreateTaskInput, UpdateTaskInput, Priority } from '../types/Task';
import { FilterType } from '../types/Filter';

// Mock the IdGenerator to ensure consistent IDs in tests
jest.mock('./idGenerator', () => ({
  __esModule: true,
  default: {
    generate: jest.fn().mockReturnValue('123456789'),
    generateWithPrefix: jest.fn((prefix) => `${prefix}-123456789`)
  }
}));

/**
 * Creates a mock task object for testing purposes
 * @param overrides - Object with properties to override default values
 * @returns A mock task object
 */
const createMockTask = (overrides = {}): Task => ({
  id: 'task-123456',
  text: 'Test task',
  completed: false,
  priority: Priority.MEDIUM,
  createdAt: 1623456789000,
  ...overrides
});

/**
 * Creates an array of mock tasks for testing
 * @param count - Number of tasks to create
 * @returns Array of mock task objects
 */
const createMockTasks = (count: number): Task[] => {
  const tasks: Task[] = [];
  for (let i = 0; i < count; i++) {
    tasks.push(createMockTask({
      id: `task-${i}`,
      text: `Task ${i}`,
      completed: i % 2 === 0, // Even tasks are complete, odd are incomplete
      priority: i % 3 === 0 ? Priority.HIGH : (i % 3 === 1 ? Priority.MEDIUM : Priority.LOW),
      createdAt: 1623456789000 + i
    }));
  }
  return tasks;
};

describe('taskUtils', () => {
  describe('createTask', () => {
    test('should create a task with the provided text and default values', () => {
      const input: CreateTaskInput = { text: 'New Task' };
      const task = taskUtils.createTask(input);
      
      expect(task).toHaveProperty('id');
      expect(task.id).toMatch(/^task-/);
      expect(task.text).toBe('New Task');
      expect(task.completed).toBe(false);
      expect(task.priority).toBe(Priority.MEDIUM);
      expect(task).toHaveProperty('createdAt');
      expect(task.createdAt).toBeLessThanOrEqual(Date.now());
    });

    test('should create a task with specified priority', () => {
      const input: CreateTaskInput = { text: 'High Priority Task', priority: Priority.HIGH };
      const task = taskUtils.createTask(input);
      
      expect(task.priority).toBe(Priority.HIGH);
    });

    test('should throw an error when text is empty', () => {
      const input: CreateTaskInput = { text: '' };
      
      expect(() => taskUtils.createTask(input)).toThrow('Task text cannot be empty');
    });

    test('should sanitize task text', () => {
      const input: CreateTaskInput = { text: '  <script>alert("XSS")</script>  ' };
      const task = taskUtils.createTask(input);
      
      expect(task.text).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });
  });

  describe('updateTask', () => {
    let tasks: Task[];
    
    beforeEach(() => {
      tasks = createMockTasks(3);
    });

    test('should update a task text', () => {
      const input: UpdateTaskInput = { id: 'task-1', text: 'Updated Task' };
      const updatedTasks = taskUtils.updateTask(tasks, input);
      
      expect(updatedTasks[1].text).toBe('Updated Task');
      expect(updatedTasks).not.toBe(tasks); // Should be a new array
    });

    test('should update a task priority', () => {
      const input: UpdateTaskInput = { id: 'task-1', priority: Priority.HIGH };
      const updatedTasks = taskUtils.updateTask(tasks, input);
      
      expect(updatedTasks[1].priority).toBe(Priority.HIGH);
    });

    test('should update both text and priority', () => {
      const input: UpdateTaskInput = { 
        id: 'task-1', 
        text: 'Updated Task',
        priority: Priority.LOW
      };
      const updatedTasks = taskUtils.updateTask(tasks, input);
      
      expect(updatedTasks[1].text).toBe('Updated Task');
      expect(updatedTasks[1].priority).toBe(Priority.LOW);
    });

    test('should return the original array if task not found', () => {
      const input: UpdateTaskInput = { id: 'non-existent', text: 'Updated Task' };
      const updatedTasks = taskUtils.updateTask(tasks, input);
      
      expect(updatedTasks).toEqual(tasks);
    });

    test('should throw an error when id is not provided', () => {
      const input = { text: 'Updated Task' } as UpdateTaskInput;
      
      expect(() => taskUtils.updateTask(tasks, input)).toThrow('Task ID is required for updates');
    });

    test('should sanitize updated text', () => {
      const input: UpdateTaskInput = { id: 'task-1', text: '  Updated Task with <b>HTML</b>  ' };
      const updatedTasks = taskUtils.updateTask(tasks, input);
      
      expect(updatedTasks[1].text).toBe('Updated Task with &lt;b&gt;HTML&lt;/b&gt;');
    });
  });

  describe('toggleTaskStatus', () => {
    let tasks: Task[];
    
    beforeEach(() => {
      tasks = createMockTasks(3);
    });

    test('should toggle a task from incomplete to complete', () => {
      // Task-1 is incomplete (odd number)
      const updatedTasks = taskUtils.toggleTaskStatus(tasks, 'task-1');
      
      expect(updatedTasks[1].completed).toBe(true);
      expect(updatedTasks).not.toBe(tasks); // Should be a new array
    });

    test('should toggle a task from complete to incomplete', () => {
      // Task-0 is complete (even number)
      const updatedTasks = taskUtils.toggleTaskStatus(tasks, 'task-0');
      
      expect(updatedTasks[0].completed).toBe(false);
    });

    test('should return the original array if task not found', () => {
      const updatedTasks = taskUtils.toggleTaskStatus(tasks, 'non-existent');
      
      expect(updatedTasks).toEqual(tasks);
    });

    test('should throw an error when id is not provided', () => {
      expect(() => taskUtils.toggleTaskStatus(tasks, '')).toThrow('Task ID is required');
    });
  });

  describe('deleteTask', () => {
    let tasks: Task[];
    
    beforeEach(() => {
      tasks = createMockTasks(3);
    });

    test('should remove a task from the array', () => {
      const updatedTasks = taskUtils.deleteTask(tasks, 'task-1');
      
      expect(updatedTasks.length).toBe(2);
      expect(updatedTasks.find(t => t.id === 'task-1')).toBeUndefined();
      expect(updatedTasks).not.toBe(tasks); // Should be a new array
    });

    test('should return a new array if task not found', () => {
      const updatedTasks = taskUtils.deleteTask(tasks, 'non-existent');
      
      expect(updatedTasks.length).toBe(3);
      expect(updatedTasks).not.toBe(tasks); // Should still be a new array
      expect(updatedTasks).toEqual(tasks); // but with same content
    });

    test('should throw an error when id is not provided', () => {
      expect(() => taskUtils.deleteTask(tasks, '')).toThrow('Task ID is required');
    });
  });

  describe('filterTasks', () => {
    let tasks: Task[];
    
    beforeEach(() => {
      tasks = createMockTasks(4); // 2 complete, 2 incomplete
    });

    test('should return all tasks when filter is ALL', () => {
      const filteredTasks = taskUtils.filterTasks(tasks, FilterType.ALL);
      
      expect(filteredTasks.length).toBe(4);
      expect(filteredTasks).toEqual(tasks);
    });

    test('should return only active tasks when filter is ACTIVE', () => {
      const filteredTasks = taskUtils.filterTasks(tasks, FilterType.ACTIVE);
      
      expect(filteredTasks.length).toBe(2);
      expect(filteredTasks.every(t => !t.completed)).toBe(true);
    });

    test('should return only completed tasks when filter is COMPLETED', () => {
      const filteredTasks = taskUtils.filterTasks(tasks, FilterType.COMPLETED);
      
      expect(filteredTasks.length).toBe(2);
      expect(filteredTasks.every(t => t.completed)).toBe(true);
    });

    test('should return all tasks for unknown filter type', () => {
      const filteredTasks = taskUtils.filterTasks(tasks, 'invalid' as FilterType);
      
      expect(filteredTasks.length).toBe(4);
      expect(filteredTasks).toEqual(tasks);
    });
  });

  describe('updateTaskPriority', () => {
    let tasks: Task[];
    
    beforeEach(() => {
      tasks = createMockTasks(3);
    });

    test('should update a task priority', () => {
      const updatedTasks = taskUtils.updateTaskPriority(tasks, 'task-1', Priority.HIGH);
      
      expect(updatedTasks[1].priority).toBe(Priority.HIGH);
      expect(updatedTasks).not.toBe(tasks); // Should be a new array
    });

    test('should return the original array if task not found', () => {
      const updatedTasks = taskUtils.updateTaskPriority(tasks, 'non-existent', Priority.HIGH);
      
      expect(updatedTasks).toEqual(tasks);
    });

    test('should throw an error when id is not provided', () => {
      expect(() => taskUtils.updateTaskPriority(tasks, '', Priority.HIGH)).toThrow('Task ID is required');
    });

    test('should throw an error when priority is invalid', () => {
      expect(() => taskUtils.updateTaskPriority(tasks, 'task-1', 'invalid' as Priority)).toThrow('Invalid priority value');
    });
  });

  describe('sortTasksByPriority', () => {
    test('should sort tasks by priority (HIGH, MEDIUM, LOW)', () => {
      const tasks = [
        createMockTask({ id: 'task-1', priority: Priority.LOW }),
        createMockTask({ id: 'task-2', priority: Priority.HIGH }),
        createMockTask({ id: 'task-3', priority: Priority.MEDIUM })
      ];
      
      const sortedTasks = taskUtils.sortTasksByPriority(tasks);
      
      expect(sortedTasks[0].id).toBe('task-2'); // HIGH
      expect(sortedTasks[1].id).toBe('task-3'); // MEDIUM
      expect(sortedTasks[2].id).toBe('task-1'); // LOW
      expect(sortedTasks).not.toBe(tasks); // Should be a new array
    });

    test('should maintain order for same priority tasks', () => {
      const tasks = [
        createMockTask({ id: 'task-1', priority: Priority.MEDIUM }),
        createMockTask({ id: 'task-2', priority: Priority.MEDIUM }),
      ];
      
      const sortedTasks = taskUtils.sortTasksByPriority(tasks);
      
      expect(sortedTasks[0].id).toBe('task-1');
      expect(sortedTasks[1].id).toBe('task-2');
    });

    test('should handle invalid priority values', () => {
      const tasks = [
        createMockTask({ id: 'task-1', priority: Priority.LOW }),
        createMockTask({ id: 'task-2', priority: 'invalid' as Priority })
      ];
      
      const sortedTasks = taskUtils.sortTasksByPriority(tasks);
      
      expect(sortedTasks[0].id).toBe('task-1'); // LOW
      expect(sortedTasks[1].id).toBe('task-2'); // Invalid (lowest priority)
    });
  });

  describe('getActiveTaskCount', () => {
    test('should return the number of active tasks', () => {
      const tasks = createMockTasks(4); // 2 complete, 2 incomplete
      
      const count = taskUtils.getActiveTaskCount(tasks);
      
      expect(count).toBe(2);
    });

    test('should return 0 when there are no active tasks', () => {
      const tasks = [
        createMockTask({ completed: true }),
        createMockTask({ completed: true })
      ];
      
      const count = taskUtils.getActiveTaskCount(tasks);
      
      expect(count).toBe(0);
    });

    test('should return 0 when tasks array is empty', () => {
      const count = taskUtils.getActiveTaskCount([]);
      
      expect(count).toBe(0);
    });
  });

  describe('getCompletedTaskCount', () => {
    test('should return the number of completed tasks', () => {
      const tasks = createMockTasks(4); // 2 complete, 2 incomplete
      
      const count = taskUtils.getCompletedTaskCount(tasks);
      
      expect(count).toBe(2);
    });

    test('should return 0 when there are no completed tasks', () => {
      const tasks = [
        createMockTask({ completed: false }),
        createMockTask({ completed: false })
      ];
      
      const count = taskUtils.getCompletedTaskCount(tasks);
      
      expect(count).toBe(0);
    });

    test('should return 0 when tasks array is empty', () => {
      const count = taskUtils.getCompletedTaskCount([]);
      
      expect(count).toBe(0);
    });
  });

  describe('validateTaskText', () => {
    test('should return true for valid text', () => {
      expect(taskUtils.validateTaskText('Valid task')).toBe(true);
    });

    test('should return false for empty string', () => {
      expect(taskUtils.validateTaskText('')).toBe(false);
    });

    test('should return false for string with only whitespace', () => {
      expect(taskUtils.validateTaskText('   ')).toBe(false);
    });

    test('should return false for undefined', () => {
      expect(taskUtils.validateTaskText(undefined as unknown as string)).toBe(false);
    });

    test('should return false for null', () => {
      expect(taskUtils.validateTaskText(null as unknown as string)).toBe(false);
    });
  });

  describe('sanitizeTaskText', () => {
    test('should trim whitespace from text', () => {
      expect(taskUtils.sanitizeTaskText('  Text with whitespace  ')).toBe('Text with whitespace');
    });

    test('should escape HTML characters', () => {
      expect(taskUtils.sanitizeTaskText('<script>alert("XSS")</script>')).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
      expect(taskUtils.sanitizeTaskText("Task with ' and &")).toBe('Task with &#039; and &amp;');
    });
    
    test('should handle empty string', () => {
      expect(taskUtils.sanitizeTaskText('')).toBe('');
    });
  });
});