import { renderHook, act } from '@testing-library/react-hooks'; // ^8.0.1
import { jest } from '@jest/globals'; // ^29.5.0
import useLocalStorage from './useLocalStorage';
import { LocalStorageService } from '../services/localStorage';

// Mock the LocalStorageService to avoid actual localStorage operations during tests
jest.mock('../services/localStorage', () => ({
  LocalStorageService: {
    saveData: jest.fn(),
    loadData: jest.fn(),
    removeData: jest.fn()
  }
}));

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Reset all mocks before each test to ensure clean test environment
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset all mocks after each test
    jest.resetAllMocks();
  });

  test('should initialize with value from localStorage if available', () => {
    // Arrange
    const mockStoredData = { test: 'data from storage' };
    (LocalStorageService.loadData as jest.Mock).mockReturnValue(mockStoredData);
    
    // Act
    const { result } = renderHook(() => useLocalStorage('test-key', { default: 'value' }));
    
    // Assert
    expect(result.current[0]).toEqual(mockStoredData);
    expect(LocalStorageService.loadData).toHaveBeenCalledWith('test-key', { default: 'value' });
  });

  test('should initialize with default value if localStorage is empty', () => {
    // Arrange
    const defaultValue = { default: 'value' };
    (LocalStorageService.loadData as jest.Mock).mockReturnValue(defaultValue);
    
    // Act
    const { result } = renderHook(() => useLocalStorage('test-key', defaultValue));
    
    // Assert
    expect(result.current[0]).toEqual(defaultValue);
    expect(LocalStorageService.loadData).toHaveBeenCalledWith('test-key', defaultValue);
  });

  test('should update localStorage when state changes', () => {
    // Arrange
    const initialValue = { initial: 'value' };
    const newValue = { new: 'value' };
    (LocalStorageService.loadData as jest.Mock).mockReturnValue(initialValue);
    
    // Act
    const { result } = renderHook(() => useLocalStorage('test-key', initialValue));
    
    act(() => {
      // Call the setValue function (second item in the returned array)
      result.current[1](newValue);
    });
    
    // Assert
    expect(result.current[0]).toEqual(newValue);
    expect(LocalStorageService.saveData).toHaveBeenCalledWith('test-key', newValue);
  });

  test('should handle localStorage errors gracefully', () => {
    // Arrange
    const defaultValue = { default: 'value' };
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock loadData to throw an error
    (LocalStorageService.loadData as jest.Mock).mockImplementation(() => {
      throw new Error('Storage error');
    });
    
    // Act & Assert
    expect(() => {
      renderHook(() => useLocalStorage('test-key', defaultValue));
    }).toThrow('Storage error');
    
    // Cleanup
    consoleErrorSpy.mockRestore();
  });

  test('should remove item from localStorage when removeValue is called', () => {
    // Arrange
    const initialValue = { initial: 'value' };
    (LocalStorageService.loadData as jest.Mock).mockReturnValue(initialValue);
    
    // Act
    const { result } = renderHook(() => useLocalStorage('test-key', initialValue));
    
    act(() => {
      // Call the removeValue function (third item in the returned array)
      result.current[2]();
    });
    
    // Assert
    expect(LocalStorageService.removeData).toHaveBeenCalledWith('test-key');
    expect(result.current[0]).toEqual(initialValue); // State resets to initial value after removal
  });

  test('should accept a function as initialValue', () => {
    // Arrange
    const initialValueFn = jest.fn().mockReturnValue({ computed: 'value' });
    const mockReturnValue = { computed: 'value' };
    
    // Mock the loadData implementation to simulate it calling the function
    (LocalStorageService.loadData as jest.Mock).mockImplementation((key, defaultValue) => {
      if (typeof defaultValue === 'function') {
        return defaultValue();
      }
      return defaultValue;
    });
    
    // Act
    const { result } = renderHook(() => useLocalStorage('test-key', initialValueFn));
    
    // Assert
    expect(result.current[0]).toEqual(mockReturnValue);
    expect(initialValueFn).toHaveBeenCalledTimes(1);
  });
});