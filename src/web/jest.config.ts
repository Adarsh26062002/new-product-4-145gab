import type { Config } from '@jest/types'; // v29.5.0

/**
 * Creates and returns the Jest configuration object that defines testing environment settings,
 * module transformations, coverage reporting, and other test-related configurations
 */
const createJestConfig = (): Config.InitialOptions => {
  return {
    // Define the root directory for the project
    roots: ['<rootDir>/src'],
    
    // Specify which files to collect coverage from
    collectCoverageFrom: [
      'src/**/*.{js,jsx,ts,tsx}',
      '!src/**/*.d.ts',
      '!src/index.tsx',
      '!src/reportWebVitals.ts',
      '!src/serviceWorker.ts',
    ],
    
    // Setup files to run after the test framework is installed
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    
    // The glob patterns Jest uses to detect test files
    testMatch: [
      '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
      '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
    ],
    
    // The test environment that will be used for testing
    testEnvironment: 'jsdom',
    
    // Transform files with these extensions using specified transformers
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': [
        'babel-jest',
        {
          presets: [
            '@babel/preset-env',
            '@babel/preset-react',
            '@babel/preset-typescript',
          ],
        },
      ],
      '^.+\\.css$': 'identity-obj-proxy',
      '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '<rootDir>/config/jest/fileTransform.js',
    },
    
    // Files that should not be transformed
    transformIgnorePatterns: [
      '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$',
      '^.+\\.module\\.(css|sass|scss)$',
    ],
    
    // Module name mapper for handling aliases and static assets
    moduleNameMapper: {
      '^react-native$': 'react-native-web',
      '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
      '^@/(.*)$': '<rootDir>/src/$1',
    },
    
    // File extensions Jest will look for
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    
    // Watch plugins for use in interactive watch mode
    watchPlugins: [
      'jest-watch-typeahead/filename',
      'jest-watch-typeahead/testname',
    ],
    
    // Automatically reset mock state before every test
    resetMocks: true,
    
    // Minimum threshold enforcement for coverage results
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    
    // The reporters that Jest uses to display test results
    coverageReporters: ['text', 'lcov', 'html'],
    
    // Indicates whether each individual test should be reported during the run
    verbose: true,
  };
};

// Export the Jest configuration
export default createJestConfig();