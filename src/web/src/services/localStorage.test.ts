import '@testing-library/jest-dom'; // version ^5.16.5
import { LocalStorageService } from './localStorage';
import { Task } from '../types/Task';
import { FilterType } from '../types/Filter';

// Helper function to create a mock task for testing
const createMockTask = (overrides = {}): Task => {
  return {
    id: 'task-123',
    text: 'Test task',
    completed: false,
    priority: 'medium',
    createdAt: Date.now(),
    ...overrides
  };
};

// Helper function to create multiple mock tasks
const createMockTasks = (count: number): Task[] => {
  const tasks: Task[] = [];
  for (let i = 0; i < count; i++) {
    tasks.push(createMockTask({
      id: `task-${i}`,
      text: `Test task ${i}`,
      completed: i % 2 === 0,
      priority: i % 3 === 0 ? 'high' : (i % 3 === 1 ? 'medium' : 'low'),
      createdAt: Date.now() - i * 1000
    }));
  }
  return tasks;
};

// Mock localStorage implementation
let mockLocalStorage: Record<string, string> = {};

beforeEach(() => {
  // Clear mock localStorage before each test
  mockLocalStorage = {};
  
  // Mock localStorage methods
  const localStorageMock = {
    getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      mockLocalStorage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete mockLocalStorage[key];
    }),
    clear: jest.fn(() => {
      mockLocalStorage = {};
    }),
    key: jest.fn((index: number) => {
      return Object.keys(mockLocalStorage)[index] || null;
    }),
    length: 0
  };
  
  // Update length property to reflect the current state
  Object.defineProperty(localStorageMock, 'length', {
    get: () => Object.keys(mockLocalStorage).length
  });
  
  // Mock window.localStorage
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });
  
  // Mock console.error to prevent actual logging in tests
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  // Restore all mocks
  jest.restoreAllMocks();
});

describe('LocalStorageService', () => {
  // Tests for isStorageAvailable
  describe('isStorageAvailable', () => {
    test('should return true when localStorage is available', () => {
      expect(LocalStorageService.isStorageAvailable()).toBe(true);
    });

    test('should return false when localStorage is not available', () => {
      // Simulate localStorage not being available by making setItem throw
      jest.spyOn(window.localStorage, 'setItem').mockImplementationOnce(() => {
        throw new Error('localStorage is not available');
      });
      
      expect(LocalStorageService.isStorageAvailable()).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    test('should return false when localStorage throws an exception', () => {
      // Simulate localStorage throwing an exception
      jest.spyOn(window.localStorage, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      expect(LocalStorageService.isStorageAvailable()).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  // Tests for saveData
  describe('saveData', () => {
    test('should save data to localStorage successfully', () => {
      const testKey = 'test-key';
      const testData = { name: 'Test' };
      
      const result = LocalStorageService.saveData(testKey, testData);
      
      expect(result).toBe(true);
      expect(window.localStorage.setItem).toHaveBeenCalledWith(testKey, JSON.stringify(testData));
    });

    test('should return false when localStorage is not available', () => {
      // Mock isStorageAvailable to return false
      jest.spyOn(LocalStorageService, 'isStorageAvailable').mockReturnValueOnce(false);
      
      const result = LocalStorageService.saveData('test-key', { name: 'Test' });
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
      expect(window.localStorage.setItem).not.toHaveBeenCalled();
    });

    test('should return false when JSON.stringify throws an error', () => {
      // Create a circular reference that will cause JSON.stringify to throw
      const circularObj: any = {};
      circularObj.self = circularObj;
      
      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;
      JSON.stringify = jest.fn().mockImplementationOnce(() => {
        throw new Error('JSON error');
      });
      
      const result = LocalStorageService.saveData('test-key', circularObj);
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
      expect(window.localStorage.setItem).not.toHaveBeenCalled();
      
      // Restore original JSON.stringify
      JSON.stringify = originalStringify;
    });

    test('should return false when setItem throws an error', () => {
      jest.spyOn(window.localStorage, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      const result = LocalStorageService.saveData('test-key', { name: 'Test' });
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  // Tests for loadData
  describe('loadData', () => {
    test('should load and parse data from localStorage successfully', () => {
      const testKey = 'test-key';
      const testData = { name: 'Test' };
      mockLocalStorage[testKey] = JSON.stringify(testData);
      
      const result = LocalStorageService.loadData(testKey, null);
      
      expect(result).toEqual(testData);
      expect(window.localStorage.getItem).toHaveBeenCalledWith(testKey);
    });

    test('should return defaultValue when localStorage is not available', () => {
      // Mock isStorageAvailable to return false
      jest.spyOn(LocalStorageService, 'isStorageAvailable').mockReturnValueOnce(false);
      
      const defaultValue = { default: true };
      const result = LocalStorageService.loadData('test-key', defaultValue);
      
      expect(result).toBe(defaultValue);
      expect(console.error).toHaveBeenCalled();
      expect(window.localStorage.getItem).not.toHaveBeenCalled();
    });

    test('should return defaultValue when data is not found in localStorage', () => {
      const defaultValue = { default: true };
      const result = LocalStorageService.loadData('non-existent-key', defaultValue);
      
      expect(result).toBe(defaultValue);
      expect(window.localStorage.getItem).toHaveBeenCalledWith('non-existent-key');
    });

    test('should return defaultValue when JSON.parse throws an error', () => {
      const testKey = 'test-key';
      // Store invalid JSON
      mockLocalStorage[testKey] = 'invalid{json';
      
      const defaultValue = { default: true };
      const result = LocalStorageService.loadData(testKey, defaultValue);
      
      expect(result).toBe(defaultValue);
      expect(console.error).toHaveBeenCalled();
      expect(window.localStorage.getItem).toHaveBeenCalledWith(testKey);
    });
  });

  // Tests for removeData
  describe('removeData', () => {
    test('should remove data from localStorage successfully', () => {
      const testKey = 'test-key';
      mockLocalStorage[testKey] = 'test-value';
      
      const result = LocalStorageService.removeData(testKey);
      
      expect(result).toBe(true);
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(testKey);
      expect(mockLocalStorage[testKey]).toBeUndefined();
    });

    test('should return false when localStorage is not available', () => {
      // Mock isStorageAvailable to return false
      jest.spyOn(LocalStorageService, 'isStorageAvailable').mockReturnValueOnce(false);
      
      const result = LocalStorageService.removeData('test-key');
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
      expect(window.localStorage.removeItem).not.toHaveBeenCalled();
    });

    test('should return false when removeItem throws an error', () => {
      jest.spyOn(window.localStorage, 'removeItem').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      const result = LocalStorageService.removeData('test-key');
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  // Tests for clearAll
  describe('clearAll', () => {
    test('should clear all application data from localStorage successfully', () => {
      // Set some application keys and a non-application key
      mockLocalStorage[LocalStorageService.STORAGE_KEYS.TASKS] = 'tasks-data';
      mockLocalStorage[LocalStorageService.STORAGE_KEYS.FILTER] = 'filter-data';
      mockLocalStorage['other-app-key'] = 'other-data';
      
      const result = LocalStorageService.clearAll();
      
      expect(result).toBe(true);
      // Each app key should have been removed
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(LocalStorageService.STORAGE_KEYS.TASKS);
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(LocalStorageService.STORAGE_KEYS.FILTER);
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(LocalStorageService.STORAGE_KEYS.VERSION);
      // Non-app keys should not be touched
      expect(mockLocalStorage['other-app-key']).toBe('other-data');
    });

    test('should return false when localStorage is not available', () => {
      // Mock isStorageAvailable to return false
      jest.spyOn(LocalStorageService, 'isStorageAvailable').mockReturnValueOnce(false);
      
      const result = LocalStorageService.clearAll();
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    test('should return false when removeItem throws an error', () => {
      jest.spyOn(window.localStorage, 'removeItem').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      // Set some application keys
      mockLocalStorage[LocalStorageService.STORAGE_KEYS.TASKS] = 'tasks-data';
      
      const result = LocalStorageService.clearAll();
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  // Tests for task-specific functions
  describe('saveTasks', () => {
    test('should save tasks to localStorage successfully', () => {
      const tasks = createMockTasks(3);
      jest.spyOn(LocalStorageService, 'saveData').mockReturnValueOnce(true);
      
      const result = LocalStorageService.saveTasks(tasks);
      
      expect(result).toBe(true);
      expect(LocalStorageService.saveData).toHaveBeenCalledWith(
        LocalStorageService.STORAGE_KEYS.TASKS,
        tasks
      );
    });

    test('should call saveData with correct key and tasks', () => {
      const tasks = createMockTasks(3);
      jest.spyOn(LocalStorageService, 'saveData');
      
      LocalStorageService.saveTasks(tasks);
      
      expect(LocalStorageService.saveData).toHaveBeenCalledWith(
        LocalStorageService.STORAGE_KEYS.TASKS,
        tasks
      );
    });
  });

  describe('loadTasks', () => {
    test('should load tasks from localStorage successfully', () => {
      const tasks = createMockTasks(3);
      jest.spyOn(LocalStorageService, 'loadData').mockReturnValueOnce(tasks);
      
      const result = LocalStorageService.loadTasks();
      
      expect(result).toEqual(tasks);
      expect(LocalStorageService.loadData).toHaveBeenCalledWith(
        LocalStorageService.STORAGE_KEYS.TASKS,
        []
      );
    });

    test('should call loadData with correct key and default value', () => {
      jest.spyOn(LocalStorageService, 'loadData');
      
      LocalStorageService.loadTasks();
      
      expect(LocalStorageService.loadData).toHaveBeenCalledWith(
        LocalStorageService.STORAGE_KEYS.TASKS,
        []
      );
    });
  });

  // Tests for filter-specific functions
  describe('saveFilter', () => {
    test('should save filter to localStorage successfully', () => {
      const filter = FilterType.ACTIVE;
      jest.spyOn(LocalStorageService, 'saveData').mockReturnValueOnce(true);
      
      const result = LocalStorageService.saveFilter(filter);
      
      expect(result).toBe(true);
      expect(LocalStorageService.saveData).toHaveBeenCalledWith(
        LocalStorageService.STORAGE_KEYS.FILTER,
        filter
      );
    });

    test('should call saveData with correct key and filter value', () => {
      const filter = FilterType.COMPLETED;
      jest.spyOn(LocalStorageService, 'saveData');
      
      LocalStorageService.saveFilter(filter);
      
      expect(LocalStorageService.saveData).toHaveBeenCalledWith(
        LocalStorageService.STORAGE_KEYS.FILTER,
        filter
      );
    });
  });

  describe('loadFilter', () => {
    test('should load filter from localStorage successfully', () => {
      const filter = FilterType.COMPLETED;
      jest.spyOn(LocalStorageService, 'loadData').mockReturnValueOnce(filter);
      
      const result = LocalStorageService.loadFilter();
      
      expect(result).toBe(filter);
      expect(LocalStorageService.loadData).toHaveBeenCalledWith(
        LocalStorageService.STORAGE_KEYS.FILTER,
        FilterType.ALL
      );
    });

    test('should call loadData with correct key and default value', () => {
      jest.spyOn(LocalStorageService, 'loadData');
      
      LocalStorageService.loadFilter();
      
      expect(LocalStorageService.loadData).toHaveBeenCalledWith(
        LocalStorageService.STORAGE_KEYS.FILTER,
        FilterType.ALL
      );
    });
  });

  // Tests for version-specific functions
  describe('saveVersion', () => {
    test('should save version to localStorage successfully', () => {
      jest.spyOn(LocalStorageService, 'saveData').mockReturnValueOnce(true);
      
      const result = LocalStorageService.saveVersion();
      
      expect(result).toBe(true);
      expect(LocalStorageService.saveData).toHaveBeenCalledWith(
        LocalStorageService.STORAGE_KEYS.VERSION,
        '1.0' // This is the CURRENT_VERSION value from the localStorage.ts file
      );
    });

    test('should call saveData with correct key and version value', () => {
      jest.spyOn(LocalStorageService, 'saveData');
      
      LocalStorageService.saveVersion();
      
      expect(LocalStorageService.saveData).toHaveBeenCalledWith(
        LocalStorageService.STORAGE_KEYS.VERSION,
        '1.0'
      );
    });
  });

  // Tests for storage usage monitoring
  describe('getStorageUsage', () => {
    test('should calculate storage usage correctly', () => {
      // Add some data to mock localStorage
      mockLocalStorage['key1'] = 'value1'; // 5 + 6 characters = 11 * 2 = 22 bytes
      mockLocalStorage['key2'] = 'value2'; // 5 + 6 characters = 11 * 2 = 22 bytes
      
      // Update length and key method for accurate calculation
      Object.defineProperty(window.localStorage, 'length', {
        get: () => Object.keys(mockLocalStorage).length,
        configurable: true
      });
      
      jest.spyOn(window.localStorage, 'key').mockImplementation((index: number) => {
        return Object.keys(mockLocalStorage)[index] || null;
      });
      
      const result = LocalStorageService.getStorageUsage();
      
      expect(result).toBe(44); // (5+6)*2 + (5+6)*2 = 44 bytes
    });

    test('should return 0 when localStorage is not available', () => {
      // Mock isStorageAvailable to return false
      jest.spyOn(LocalStorageService, 'isStorageAvailable').mockReturnValueOnce(false);
      
      const result = LocalStorageService.getStorageUsage();
      
      expect(result).toBe(0);
    });
  });
});