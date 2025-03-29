import { useState, useEffect, useCallback } from 'react'; // ^18.2.0
import { LocalStorageService } from '../services/localStorage';

/**
 * A custom hook that synchronizes React state with localStorage.
 * This hook extends useState functionality to automatically persist state changes
 * to the browser's localStorage, enabling data to persist between page refreshes
 * and browser sessions.
 * 
 * @template T The type of the state value
 * @param {string} key - The localStorage key to store the data under
 * @param {T} initialValue - The initial value to use if no value exists in localStorage
 * @returns {[T, (value: T | ((val: T) => T)) => void, () => void]} An array containing:
 *   - The current state value
 *   - A function to update the state (and localStorage)
 *   - A function to remove the item from state and localStorage
 */
const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void, () => void] => {
  // Initialize state with function to avoid unnecessary localStorage access on every render
  const [storedValue, setStoredValue] = useState<T>(() => {
    return LocalStorageService.loadData<T>(key, initialValue);
  });

  // Create a memoized setValue function that updates both React state and localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue((prevValue) => {
      // Handle case where value is a function (similar to useState's functional updates)
      const valueToStore = value instanceof Function ? value(prevValue) : value;
      
      // Save to localStorage
      LocalStorageService.saveData(key, valueToStore);
      
      return valueToStore;
    });
  }, [key]);

  // Create a memoized removeValue function that removes the item from both state and localStorage
  const removeValue = useCallback(() => {
    setStoredValue(initialValue);
    LocalStorageService.removeData(key);
  }, [key, initialValue]);

  // Effect to ensure localStorage stays in sync with the React state
  // This handles edge cases like key changes and provides a safety net
  // for any state changes that might occur outside the setValue function
  useEffect(() => {
    LocalStorageService.saveData(key, storedValue);
  }, [key, storedValue]);

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;