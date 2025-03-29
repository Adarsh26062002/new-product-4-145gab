// Import testing libraries
import '@testing-library/jest-dom'; // v5.16.5 - Extends Jest with custom DOM element matchers
import 'jest-localstorage-mock'; // v2.4.26 - Provides mock implementation for localStorage

/**
 * Sets up a mock implementation of localStorage for testing
 * Note: This functionality is primarily provided by jest-localstorage-mock,
 * but can be extended here if needed
 */
function mockLocalStorage() {
  // jest-localstorage-mock already provides the mock implementation
  // This function is included for documentation purposes
}

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
});

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Mock window.matchMedia for testing responsive components
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn()
  }))
});