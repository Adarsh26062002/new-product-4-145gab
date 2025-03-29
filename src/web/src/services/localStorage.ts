import { Task } from '../types/Task';
import { FilterType } from '../types/Filter';

/**
 * Storage keys used for localStorage persistence.
 * These constants prevent typos and provide a central location for key management.
 */
const STORAGE_KEYS = {
  TASKS: 'react-todo-list-tasks',
  FILTER: 'react-todo-list-filter',
  VERSION: 'react-todo-list-version'
};

/**
 * Current application version.
 * Used for data migration in future updates.
 */
const CURRENT_VERSION = '1.0';

/**
 * Checks if localStorage is available in the current browser environment.
 * 
 * @returns {boolean} True if localStorage is available, false otherwise
 */
const isStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.error('localStorage is not available:', e);
    return false;
  }
};

/**
 * Saves data to localStorage with the specified key.
 * 
 * @param {string} key - The key to store the data under
 * @param {any} data - The data to store
 * @returns {boolean} True if save was successful, false otherwise
 */
const saveData = (key: string, data: any): boolean => {
  if (!isStorageAvailable()) {
    console.error('Unable to save data: localStorage is not available');
    return false;
  }

  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
    return true;
  } catch (e) {
    console.error(`Error saving data for key "${key}":`, e);
    return false;
  }
};

/**
 * Loads and parses data from localStorage for the specified key.
 * 
 * @param {string} key - The key to retrieve data from
 * @param {any} defaultValue - The default value to return if data doesn't exist
 * @returns {any} The parsed data from localStorage or defaultValue if not found
 */
const loadData = <T>(key: string, defaultValue: T): T => {
  if (!isStorageAvailable()) {
    console.error('Unable to load data: localStorage is not available');
    return defaultValue;
  }

  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData) as T;
  } catch (e) {
    console.error(`Error loading data for key "${key}":`, e);
    return defaultValue;
  }
};

/**
 * Removes data from localStorage for the specified key.
 * 
 * @param {string} key - The key to remove
 * @returns {boolean} True if removal was successful, false otherwise
 */
const removeData = (key: string): boolean => {
  if (!isStorageAvailable()) {
    console.error('Unable to remove data: localStorage is not available');
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error(`Error removing data for key "${key}":`, e);
    return false;
  }
};

/**
 * Clears all application data from localStorage.
 * 
 * @returns {boolean} True if clearing was successful, false otherwise
 */
const clearAll = (): boolean => {
  if (!isStorageAvailable()) {
    console.error('Unable to clear data: localStorage is not available');
    return false;
  }

  try {
    // Only remove app-specific keys to avoid clearing other applications' data
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (e) {
    console.error('Error clearing application data:', e);
    return false;
  }
};

/**
 * Saves the tasks array to localStorage.
 * 
 * @param {Task[]} tasks - The tasks array to save
 * @returns {boolean} True if save was successful, false otherwise
 */
const saveTasks = (tasks: Task[]): boolean => {
  return saveData(STORAGE_KEYS.TASKS, tasks);
};

/**
 * Loads the tasks array from localStorage.
 * 
 * @returns {Task[]} The tasks array from localStorage or an empty array if not found
 */
const loadTasks = (): Task[] => {
  return loadData<Task[]>(STORAGE_KEYS.TASKS, []);
};

/**
 * Saves the current filter selection to localStorage.
 * 
 * @param {FilterType} filter - The filter value to save
 * @returns {boolean} True if save was successful, false otherwise
 */
const saveFilter = (filter: FilterType): boolean => {
  return saveData(STORAGE_KEYS.FILTER, filter);
};

/**
 * Loads the filter selection from localStorage.
 * 
 * @returns {FilterType} The filter value from localStorage or FilterType.ALL if not found
 */
const loadFilter = (): FilterType => {
  return loadData<FilterType>(STORAGE_KEYS.FILTER, FilterType.ALL);
};

/**
 * Saves the application version to localStorage for data migration purposes.
 * 
 * @returns {boolean} True if save was successful, false otherwise
 */
const saveVersion = (): boolean => {
  return saveData(STORAGE_KEYS.VERSION, CURRENT_VERSION);
};

/**
 * Calculates the current localStorage usage in bytes.
 * 
 * @returns {number} The number of bytes used in localStorage
 */
const getStorageUsage = (): number => {
  if (!isStorageAvailable()) {
    return 0;
  }

  try {
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        // Calculate size: key length + value length in UTF-16 (2 bytes per character)
        totalSize += (key.length + value.length) * 2;
      }
    }
    
    return totalSize;
  } catch (e) {
    console.error('Error calculating storage usage:', e);
    return 0;
  }
};

/**
 * Service for interacting with browser's localStorage.
 * Provides methods for saving, loading, and managing application data.
 */
export const LocalStorageService = {
  STORAGE_KEYS,
  isStorageAvailable,
  saveData,
  loadData,
  removeData,
  clearAll,
  saveTasks,
  loadTasks,
  saveFilter,
  loadFilter,
  saveVersion,
  getStorageUsage
};