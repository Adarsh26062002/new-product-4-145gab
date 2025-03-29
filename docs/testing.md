# React Todo List - Testing Guide

This document provides comprehensive documentation of the testing strategy and implementation for the React Todo List application. It covers unit testing, integration testing, end-to-end testing, and test automation to ensure application quality and reliability.

## 1. TESTING OVERVIEW

The React Todo List application follows a comprehensive testing approach to ensure code quality, functionality, and reliability. This approach includes multiple testing levels and automated test execution as part of the development workflow.

### 1.1 Testing Philosophy

Our testing philosophy is based on the following principles:

- **Test-driven development**: Writing tests before implementing features
- **Comprehensive coverage**: Testing all critical application functionality
- **Automation**: Automating test execution as part of the CI/CD pipeline
- **Shift-left testing**: Finding and fixing issues early in the development process
- **User-centric testing**: Testing from the user's perspective

These principles guide our testing approach and help ensure the application meets quality standards and user requirements.

### 1.2 Testing Levels

The application employs multiple testing levels to provide comprehensive coverage:

| Testing Level | Focus | Tools | Coverage Target |
|--------------|-------|-------|----------------|
| Unit Testing | Individual components and functions | Jest, React Testing Library | 80% code coverage |
| Integration Testing | Component interactions and data flow | Jest, React Testing Library | Key user flows |
| End-to-End Testing | Complete user journeys | Manual testing | Critical paths |
| Accessibility Testing | WCAG compliance | Manual + automated tools | WCAG 2.1 AA |
| Cross-browser Testing | Browser compatibility | Manual testing | Supported browsers |

Each testing level serves a specific purpose in the overall testing strategy, providing different perspectives on application quality.

### 1.3 Testing Metrics

We track the following metrics to measure testing effectiveness:

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Code Coverage | >80% overall | Jest coverage reports |
| Test Pass Rate | 100% | CI pipeline results |
| Critical Path Coverage | 100% | Manual verification |
| Defect Density | <0.5 defects per 100 LOC | Issue tracking |
| Test Execution Time | <5 minutes | CI pipeline duration |

These metrics help us evaluate the effectiveness of our testing approach and identify areas for improvement.

## 2. TESTING ENVIRONMENT

The testing environment is configured to support all testing levels and provide consistent, reliable test execution.

### 2.1 Environment Setup

The testing environment is configured in `src/web/src/setupTests.ts` and includes:

```typescript
// Import Jest DOM extensions
import '@testing-library/jest-dom';

// Import localStorage mock
import 'jest-localstorage-mock';

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
});

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Mock window.matchMedia for responsive design testing
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn()
  }))
});
```

This setup provides:
- Custom DOM matchers for assertions
- localStorage mock implementation
- Automatic cleanup between tests
- Mock implementations for browser APIs

### 2.2 Jest Configuration

Jest is configured in `src/web/jest.config.ts` with the following settings:

```typescript
const config: Config.InitialOptions = {
  roots: ['<rootDir>/src'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/serviceWorker.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}'
  ],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        '@babel/preset-env',
        '@babel/preset-react',
        '@babel/preset-typescript'
      ]
    }],
    '^.+\\.css$': 'identity-obj-proxy',
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '<rootDir>/config/jest/fileTransform.js'
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$',
    '^.+\\.module\\.(css|sass|scss)$'
  ],
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  resetMocks: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true
};
```

This configuration defines:
- Test file patterns and locations
- Code coverage requirements and reporting
- Test environment (jsdom for browser-like testing)
- Transformations for different file types
- Module name mappings for imports

### 2.3 Test Data Management

Test data is managed using the following approaches:

1. **Mock Data**: Test fixtures and factory functions for creating test data
2. **Mock Services**: Jest mock implementations of services and external dependencies
3. **Mock Storage**: localStorage mock for testing persistence features

Example of a test data factory function:

```typescript
// Create a mock task for testing
const createMockTask = (overrides = {}): Task => ({
  id: 'task-123',
  text: 'Test task',
  completed: false,
  priority: Priority.MEDIUM,
  createdAt: Date.now(),
  ...overrides
});
```

This approach ensures consistent, predictable test data while allowing flexibility for specific test scenarios.

## 3. UNIT TESTING

Unit testing focuses on testing individual components and functions in isolation to verify their behavior and correctness.

### 3.1 Component Testing

Component tests verify that React components render correctly and respond appropriately to user interactions. We use React Testing Library to test components from the user's perspective.

Example component test for TodoItem:

```typescript
describe('TodoItem component', () => {
  // Mock functions for context
  const mockToggleTask = jest.fn();
  const mockDeleteTask = jest.fn();
  const mockUpdateTask = jest.fn();
  
  // Mock context value
  const mockContextValue = {
    toggleTask: mockToggleTask,
    deleteTask: mockDeleteTask,
    updateTask: mockUpdateTask
  };
  
  // Helper function to render with context
  const renderWithContext = (ui: React.ReactElement) => {
    return render(
      <TodoContext.Provider value={mockContextValue as any}>
        {ui}
      </TodoContext.Provider>
    );
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders the task text and completion status', () => {
    const task = createMockTask({ text: 'Test Task', completed: false });
    renderWithContext(<TodoItem task={task} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
  
  test('calls toggleTask when checkbox is clicked', () => {
    const task = createMockTask({ id: 'task-123' });
    renderWithContext(<TodoItem task={task} />);
    
    fireEvent.click(screen.getByRole('checkbox'));
    expect(mockToggleTask).toHaveBeenCalledWith('task-123');
  });
  
  test('enters edit mode when edit button is clicked', () => {
    const task = createMockTask({ text: 'Original Text' });
    renderWithContext(<TodoItem task={task} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByDisplayValue('Original Text')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
  
  // Additional tests...
});
```

Component tests focus on:
- Correct rendering of component UI
- Proper handling of props and state
- User interactions and event handling
- Component state transitions
- Integration with context providers

### 3.2 Hook Testing

Custom hooks are tested using the `@testing-library/react-hooks` library, which allows testing hooks in isolation.

Example hook test for useTodoList:

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useTodoList } from './useTodoList';
import { Priority } from '../types/Task';

// Mock localStorage
jest.mock('../services/localStorage', () => ({
  saveData: jest.fn(),
  loadData: jest.fn().mockReturnValue([])
}));

describe('useTodoList hook', () => {
  test('should initialize with empty tasks', () => {
    const { result } = renderHook(() => useTodoList());
    expect(result.current.tasks).toEqual([]);
  });
  
  test('should add a new task', () => {
    const { result } = renderHook(() => useTodoList());
    
    act(() => {
      result.current.addTask('New Task', Priority.HIGH);
    });
    
    expect(result.current.tasks.length).toBe(1);
    expect(result.current.tasks[0].text).toBe('New Task');
    expect(result.current.tasks[0].priority).toBe(Priority.HIGH);
  });
  
  test('should toggle task completion', () => {
    const { result } = renderHook(() => useTodoList());
    
    act(() => {
      result.current.addTask('Test Task');
    });
    
    const taskId = result.current.tasks[0].id;
    
    act(() => {
      result.current.toggleTask(taskId);
    });
    
    expect(result.current.tasks[0].completed).toBe(true);
    
    act(() => {
      result.current.toggleTask(taskId);
    });
    
    expect(result.current.tasks[0].completed).toBe(false);
  });
  
  // Additional tests...
});
```

Hook tests focus on:
- Correct initialization of hook state
- Proper state updates in response to actions
- Side effects like localStorage interactions
- Error handling and edge cases

### 3.3 Utility Function Testing

Utility functions are tested using standard Jest tests to verify their behavior.

Example utility function test for taskUtils:

```typescript
import { filterTasks, sortTasksByPriority } from './taskUtils';
import { Task, Priority, FilterType } from '../types/Task';

describe('taskUtils', () => {
  const mockTasks: Task[] = [
    { id: '1', text: 'Task 1', completed: false, priority: Priority.HIGH, createdAt: 1000 },
    { id: '2', text: 'Task 2', completed: true, priority: Priority.MEDIUM, createdAt: 2000 },
    { id: '3', text: 'Task 3', completed: false, priority: Priority.LOW, createdAt: 3000 }
  ];
  
  describe('filterTasks', () => {
    test('should return all tasks when filter is ALL', () => {
      const result = filterTasks(mockTasks, FilterType.ALL);
      expect(result.length).toBe(3);
    });
    
    test('should return only active tasks when filter is ACTIVE', () => {
      const result = filterTasks(mockTasks, FilterType.ACTIVE);
      expect(result.length).toBe(2);
      expect(result.every(task => !task.completed)).toBe(true);
    });
    
    test('should return only completed tasks when filter is COMPLETED', () => {
      const result = filterTasks(mockTasks, FilterType.COMPLETED);
      expect(result.length).toBe(1);
      expect(result.every(task => task.completed)).toBe(true);
    });
  });
  
  describe('sortTasksByPriority', () => {
    test('should sort tasks by priority (HIGH > MEDIUM > LOW)', () => {
      const unsortedTasks = [
        { id: '1', text: 'Low Priority', completed: false, priority: Priority.LOW, createdAt: 1000 },
        { id: '2', text: 'High Priority', completed: false, priority: Priority.HIGH, createdAt: 2000 },
        { id: '3', text: 'Medium Priority', completed: false, priority: Priority.MEDIUM, createdAt: 3000 }
      ];
      
      const result = sortTasksByPriority(unsortedTasks);
      
      expect(result[0].priority).toBe(Priority.HIGH);
      expect(result[1].priority).toBe(Priority.MEDIUM);
      expect(result[2].priority).toBe(Priority.LOW);
    });
  });
});
```

Utility function tests focus on:
- Input validation and error handling
- Correct transformation of data
- Edge cases and boundary conditions
- Performance considerations for complex operations

### 3.4 Context Testing

Context providers are tested to verify they provide the correct values and update them appropriately.

Example context test for TodoContext:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TodoContext, TodoProvider } from './TodoContext';
import { useContext } from 'react';

// Test component that consumes the context
const TestConsumer = () => {
  const { tasks, addTask, toggleTask } = useContext(TodoContext);
  
  return (
    <div>
      <div data-testid="task-count">{tasks.length}</div>
      <button onClick={() => addTask('New Task')}>Add Task</button>
      {tasks.map(task => (
        <div key={task.id}>
          <span>{task.text}</span>
          <input 
            type="checkbox" 
            checked={task.completed} 
            onChange={() => toggleTask(task.id)} 
          />
        </div>
      ))}
    </div>
  );
};

describe('TodoContext', () => {
  test('provides initial empty tasks array', () => {
    render(
      <TodoProvider>
        <TestConsumer />
      </TodoProvider>
    );
    
    expect(screen.getByTestId('task-count')).toHaveTextContent('0');
  });
  
  test('allows adding tasks', () => {
    render(
      <TodoProvider>
        <TestConsumer />
      </TodoProvider>
    );
    
    fireEvent.click(screen.getByText('Add Task'));
    expect(screen.getByTestId('task-count')).toHaveTextContent('1');
    expect(screen.getByText('New Task')).toBeInTheDocument();
  });
  
  test('allows toggling task completion', () => {
    render(
      <TodoProvider>
        <TestConsumer />
      </TodoProvider>
    );
    
    fireEvent.click(screen.getByText('Add Task'));
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
```

Context tests focus on:
- Correct initial context values
- Context updates in response to actions
- Integration with consuming components
- State persistence and retrieval

## 4. INTEGRATION TESTING

Integration testing verifies that components work together correctly and that data flows properly through the application.

### 4.1 Component Integration

Component integration tests verify that components interact correctly with each other and with the application state.

Example integration test for TodoForm and TodoList:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TodoProvider } from '../contexts/TodoContext';
import TodoForm from './TodoForm';
import TodoList from './TodoList';

describe('TodoForm and TodoList integration', () => {
  test('adding a task via TodoForm should display it in TodoList', () => {
    render(
      <TodoProvider>
        <TodoForm />
        <TodoList />
      </TodoProvider>
    );
    
    // Initially, no tasks should be displayed
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    
    // Add a new task
    const input = screen.getByPlaceholderText('Add a new task...');
    fireEvent.change(input, { target: { value: 'Integration Test Task' } });
    fireEvent.click(screen.getByText('Add Task'));
    
    // The task should now be displayed in the list
    expect(screen.getByText('Integration Test Task')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    
    // Input should be cleared after submission
    expect(input).toHaveValue('');
  });
  
  test('toggling a task in TodoList should update its completion status', () => {
    render(
      <TodoProvider>
        <TodoForm />
        <TodoList />
      </TodoProvider>
    );
    
    // Add a new task
    const input = screen.getByPlaceholderText('Add a new task...');
    fireEvent.change(input, { target: { value: 'Toggle Test Task' } });
    fireEvent.click(screen.getByText('Add Task'));
    
    // Toggle the task completion
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    // The checkbox should now be checked
    expect(checkbox).toBeChecked();
    
    // The task should have the completed class
    expect(screen.getByText('Toggle Test Task').closest('.todo-item')).toHaveClass('completed');
  });
});
```

Component integration tests focus on:
- Data flow between components
- State updates affecting multiple components
- User interactions that span components
- Context provider integration

### 4.2 State Management Integration

State management integration tests verify that application state is correctly managed and persisted.

Example state management integration test:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TodoProvider } from '../contexts/TodoContext';
import App from '../App';
import { loadData } from '../services/localStorage';

// Mock localStorage service
jest.mock('../services/localStorage', () => ({
  saveData: jest.fn(),
  loadData: jest.fn().mockReturnValue([])
}));

describe('State Management Integration', () => {
  test('application state should be persisted to localStorage', () => {
    const saveDataMock = require('../services/localStorage').saveData;
    
    render(
      <TodoProvider>
        <App />
      </TodoProvider>
    );
    
    // Add a new task
    const input = screen.getByPlaceholderText('Add a new task...');
    fireEvent.change(input, { target: { value: 'Persistence Test Task' } });
    fireEvent.click(screen.getByText('Add Task'));
    
    // Verify localStorage was called with the updated tasks
    expect(saveDataMock).toHaveBeenCalled();
    expect(saveDataMock.mock.calls[0][0]).toBe('react-todo-list-tasks');
    expect(saveDataMock.mock.calls[0][1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'Persistence Test Task',
          completed: false
        })
      ])
    );
  });
  
  test('application should load initial state from localStorage', () => {
    // Mock localStorage to return initial tasks
    const loadDataMock = require('../services/localStorage').loadData;
    loadDataMock.mockReturnValueOnce([
      { id: 'saved-task-1', text: 'Saved Task', completed: true, priority: 'medium', createdAt: 1000 }
    ]);
    
    render(
      <TodoProvider>
        <App />
      </TodoProvider>
    );
    
    // Verify the saved task is displayed
    expect(screen.getByText('Saved Task')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
    
    // Verify localStorage was called to load the tasks
    expect(loadDataMock).toHaveBeenCalledWith('react-todo-list-tasks', []);
  });
});
```

State management integration tests focus on:
- State initialization from persistent storage
- State updates being correctly persisted
- State consistency across components
- Error handling for state operations

### 4.3 Filter Integration

Filter integration tests verify that task filtering works correctly across components.

Example filter integration test:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TodoProvider } from '../contexts/TodoContext';
import App from '../App';

describe('Filter Integration', () => {
  beforeEach(() => {
    render(
      <TodoProvider>
        <App />
      </TodoProvider>
    );
    
    // Add three tasks with different completion statuses
    const input = screen.getByPlaceholderText('Add a new task...');
    
    // Task 1 (active)
    fireEvent.change(input, { target: { value: 'Active Task 1' } });
    fireEvent.click(screen.getByText('Add Task'));
    
    // Task 2 (active)
    fireEvent.change(input, { target: { value: 'Active Task 2' } });
    fireEvent.click(screen.getByText('Add Task'));
    
    // Task 3 (completed)
    fireEvent.change(input, { target: { value: 'Completed Task' } });
    fireEvent.click(screen.getByText('Add Task'));
    
    // Mark the third task as completed
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[2]);
  });
  
  test('should show all tasks when All filter is selected', () => {
    // Click the All filter (should be selected by default)
    fireEvent.click(screen.getByText('All'));
    
    // All three tasks should be visible
    expect(screen.getByText('Active Task 1')).toBeInTheDocument();
    expect(screen.getByText('Active Task 2')).toBeInTheDocument();
    expect(screen.getByText('Completed Task')).toBeInTheDocument();
  });
  
  test('should show only active tasks when Active filter is selected', () => {
    // Click the Active filter
    fireEvent.click(screen.getByText('Active'));
    
    // Only active tasks should be visible
    expect(screen.getByText('Active Task 1')).toBeInTheDocument();
    expect(screen.getByText('Active Task 2')).toBeInTheDocument();
    expect(screen.queryByText('Completed Task')).not.toBeInTheDocument();
  });
  
  test('should show only completed tasks when Completed filter is selected', () => {
    // Click the Completed filter
    fireEvent.click(screen.getByText('Completed'));
    
    // Only completed tasks should be visible
    expect(screen.queryByText('Active Task 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Active Task 2')).not.toBeInTheDocument();
    expect(screen.getByText('Completed Task')).toBeInTheDocument();
  });
});
```

Filter integration tests focus on:
- Filter selection affecting task visibility
- Filter state persistence
- Filter interactions with task operations
- Empty state handling for filters

## 5. ACCESSIBILITY TESTING

Accessibility testing ensures the application is usable by people with disabilities and complies with WCAG guidelines.

### 5.1 Keyboard Navigation

Keyboard navigation tests verify that all interactive elements are accessible via keyboard.

Example keyboard navigation test:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoProvider } from '../contexts/TodoContext';
import App from '../App';

describe('Keyboard Navigation', () => {
  test('should allow adding a task using keyboard', async () => {
    render(
      <TodoProvider>
        <App />
      </TodoProvider>
    );
    
    // Focus the input field
    const input = screen.getByPlaceholderText('Add a new task...');
    input.focus();
    
    // Type a task description
    userEvent.type(input, 'Keyboard Task');
    
    // Press Enter to submit
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    // Verify the task was added
    expect(screen.getByText('Keyboard Task')).toBeInTheDocument();
  });
  
  test('should allow toggling task completion using keyboard', async () => {
    render(
      <TodoProvider>
        <App />
      </TodoProvider>
    );
    
    // Add a task
    const input = screen.getByPlaceholderText('Add a new task...');
    fireEvent.change(input, { target: { value: 'Keyboard Toggle Task' } });
    fireEvent.click(screen.getByText('Add Task'));
    
    // Focus the checkbox
    const checkbox = screen.getByRole('checkbox');
    checkbox.focus();
    
    // Press Space to toggle
    fireEvent.keyDown(checkbox, { key: ' ', code: 'Space' });
    
    // Verify the task was toggled
    expect(checkbox).toBeChecked();
  });
  
  test('should allow navigating between interactive elements', async () => {
    render(
      <TodoProvider>
        <App />
      </TodoProvider>
    );
    
    // Add a task
    const input = screen.getByPlaceholderText('Add a new task...');
    fireEvent.change(input, { target: { value: 'Navigation Task' } });
    fireEvent.click(screen.getByText('Add Task'));
    
    // Start with focus on input
    input.focus();
    
    // Tab to Add Task button
    userEvent.tab();
    expect(document.activeElement).toBe(screen.getByText('Add Task'));
    
    // Tab to All filter
    userEvent.tab();
    expect(document.activeElement).toBe(screen.getByText('All'));
    
    // Tab to Active filter
    userEvent.tab();
    expect(document.activeElement).toBe(screen.getByText('Active'));
    
    // Tab to Completed filter
    userEvent.tab();
    expect(document.activeElement).toBe(screen.getByText('Completed'));
    
    // Tab to task checkbox
    userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('checkbox'));
    
    // Tab to Edit button
    userEvent.tab();
    expect(document.activeElement).toBe(screen.getByText('Edit'));
    
    // Tab to Delete button
    userEvent.tab();
    expect(document.activeElement).toBe(screen.getByText('Delete'));
  });
});
```

Keyboard navigation tests focus on:
- Tab order and focus management
- Keyboard shortcuts and interactions
- Focus indicators and visibility
- Keyboard traps and accessibility barriers

### 5.2 Screen Reader Compatibility

Screen reader compatibility tests verify that the application is usable with screen readers.

Example screen reader compatibility test:

```typescript
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TodoProvider } from '../contexts/TodoContext';
import App from '../App';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

describe('Screen Reader Compatibility', () => {
  test('should have no accessibility violations', async () => {
    const { container } = render(
      <TodoProvider>
        <App />
      </TodoProvider>
    );
    
    // Run axe accessibility tests
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  test('should have appropriate ARIA attributes', () => {
    render(
      <TodoProvider>
        <App />
      </TodoProvider>
    );
    
    // Add a task
    const input = screen.getByPlaceholderText('Add a new task...');
    input.value = 'ARIA Test Task';
    screen.getByText('Add Task').click();
    
    // Check for appropriate ARIA attributes
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toBeInTheDocument();
    
    // Check for appropriate labels
    expect(screen.getByLabelText(/add a new task/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mark .* as complete/i)).toBeInTheDocument();
  });
});
```

Screen reader compatibility tests focus on:
- ARIA attributes and roles
- Semantic HTML structure
- Text alternatives for non-text content
- Meaningful sequence and context

### 5.3 Color Contrast

Color contrast tests verify that text and interactive elements have sufficient contrast for readability.

Example color contrast test approach:

```typescript
// Note: Automated color contrast testing is typically done with specialized tools
// rather than unit tests. This is a simplified example of how you might approach it.

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TodoProvider } from '../contexts/TodoContext';
import App from '../App';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

describe('Color Contrast', () => {
  test('should have no contrast violations', async () => {
    const { container } = render(
      <TodoProvider>
        <App />
      </TodoProvider>
    );
    
    // Run axe accessibility tests with a focus on color contrast
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
    
    expect(results).toHaveNoViolations();
  });
});
```

In practice, color contrast testing is often performed using:
- Lighthouse audits
- WebAIM Color Contrast Checker
- axe DevTools
- Manual testing with color contrast analyzers

## 6. TEST AUTOMATION

Test automation ensures tests are run consistently and automatically as part of the development workflow.

### 6.1 CI/CD Integration

Tests are automatically run as part of the CI/CD pipeline using GitHub Actions.

The CI workflow is defined in `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
    paths: [src/web/**]
  pull_request:
    branches: [main, develop]
    paths: [src/web/**]

jobs:
  validate:
    name: Validate
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: src/web
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm
          cache-dependency-path: src/web/package-lock.json
      - name: Install dependencies
        run: npm ci
      - name: Lint code
        run: npm run lint
      - name: Type check
        run: npm run typecheck

  test:
    name: Test
    needs: validate
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: src/web
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm
          cache-dependency-path: src/web/package-lock.json
      - name: Install dependencies
        run: npm ci
      - name: Run tests with coverage
        run: npm run test:coverage
      - name: Upload coverage report
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: src/web/coverage
          retention-days: 7

  build:
    name: Build
    needs: test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: src/web
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm
          cache-dependency-path: src/web/package-lock.json
      - name: Install dependencies
        run: npm ci
      - name: Build application
        run: npm run build
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: src/web/build
          retention-days: 7
```

This workflow:
1. Validates the code with linting and type checking
2. Runs tests with coverage reporting
3. Builds the application if tests pass
4. Uploads coverage reports and build artifacts

The workflow is triggered on pushes to main and develop branches, as well as pull requests to these branches.

### 6.2 Pre-commit Hooks

Pre-commit hooks ensure code quality and test passing before commits are made.

The pre-commit hooks are configured using Husky and lint-staged in `package.json`:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "npm run test:related"
    ],
    "*.{css,md}": [
      "prettier --write"
    ]
  }
}
```

These hooks:
1. Run ESLint to fix code style issues
2. Run Prettier to format code
3. Run tests related to changed files
4. Format CSS and Markdown files

This ensures that only code that passes linting and tests can be committed.

### 6.3 Test Scripts

Various npm scripts are available for running tests in different modes.

The test scripts are defined in `package.json`:

```json
{
  "scripts": {
    "test": "react-scripts test",
    "test:coverage": "react-scripts test --coverage --watchAll=false",
    "test:watch": "react-scripts test --watch",
    "test:related": "react-scripts test --findRelatedTests",
    "test:ci": "react-scripts test --ci --coverage --watchAll=false"
  }
}
```

These scripts provide different options for running tests:
- `test`: Run tests in interactive watch mode
- `test:coverage`: Run tests with coverage reporting
- `test:watch`: Run tests in watch mode
- `test:related`: Run tests related to changed files
- `test:ci`: Run tests in CI mode with coverage reporting

Developers can choose the appropriate script based on their current needs.

### 6.4 Coverage Reporting

Code coverage reporting helps identify areas of the codebase that need additional testing.

Coverage thresholds are defined in `jest.config.ts`:

```typescript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

These thresholds require at least 80% coverage for branches, functions, lines, and statements. If coverage falls below these thresholds, the tests will fail.

Coverage reports are generated in multiple formats:

```typescript
coverageReporters: ['text', 'lcov', 'html']
```

These formats provide:
- Text output in the console
- LCOV format for integration with coverage tools
- HTML reports for visual inspection

In the CI pipeline, coverage reports are uploaded as artifacts for later review.

## 7. CROSS-BROWSER TESTING

Cross-browser testing ensures the application works correctly across different browsers and devices.

### 7.1 Browser Compatibility

The application is tested on the following browsers:

| Browser | Minimum Version | Testing Approach |
|---------|-----------------|------------------|
| Chrome | 60+ | Primary development target, automated tests |
| Firefox | 60+ | Manual testing, visual verification |
| Safari | 11+ | Manual testing, visual verification |
| Edge | 79+ (Chromium-based) | Manual testing, visual verification |

Browser compatibility is defined in `package.json` browserslist configuration:

```json
"browserslist": {
  "production": [
    ">0.2%",
    "not dead",
    "not op_mini all",
    "chrome >= 60",
    "firefox >= 60",
    "safari >= 11",
    "edge >= 79",
    "not ie 11"
  ],
  "development": [
    "last 1 chrome version",
    "last 1 firefox version",
    "last 1 safari version"
  ]
}
```

This configuration ensures that the application is built with appropriate polyfills and transformations for the target browsers.

### 7.2 Responsive Design Testing

The application is tested on different screen sizes to ensure responsive design:

| Device Type | Screen Width | Testing Approach |
|-------------|-------------|------------------|
| Mobile | 320-480px | Browser dev tools, manual testing |
| Tablet | 768-1024px | Browser dev tools, manual testing |
| Desktop | 1200px+ | Automated tests, manual verification |

Responsive design testing includes:
- Layout verification at different breakpoints
- Touch interaction testing for mobile devices
- Font size and spacing verification
- Element visibility and accessibility

The application uses CSS media queries and flexible layouts to adapt to different screen sizes.

### 7.3 Device Testing

The application is tested on various devices to ensure compatibility:

| Device Category | Examples | Testing Approach |
|----------------|----------|------------------|
| iOS Devices | iPhone, iPad | Manual testing on physical devices |
| Android Devices | Various phones and tablets | Manual testing on physical devices |
| Desktop Computers | Windows, macOS, Linux | Automated tests, manual verification |

Device testing focuses on:
- Touch interactions and gestures
- Keyboard input and virtual keyboards
- Performance and responsiveness
- Device-specific quirks and limitations

While automated tests run primarily in a simulated browser environment, manual testing on real devices is essential for verifying the actual user experience.

## 8. PERFORMANCE TESTING

Performance testing ensures the application meets performance requirements and provides a smooth user experience.

### 8.1 Rendering Performance

Rendering performance tests verify that the application renders efficiently, especially with large task lists.

Example rendering performance test approach:

```typescript
import { render, screen } from '@testing-library/react';
import { TodoProvider } from '../contexts/TodoContext';
import TodoList from './TodoList';
import { Task, Priority } from '../types/Task';

// Create a large number of tasks for performance testing
const createManyTasks = (count: number): Task[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `task-${i}`,
    text: `Task ${i}`,
    completed: i % 2 === 0,
    priority: i % 3 === 0 ? Priority.HIGH : i % 3 === 1 ? Priority.MEDIUM : Priority.LOW,
    createdAt: Date.now() - i * 1000
  }));
};

// Mock context with many tasks
const mockLargeTaskList = createManyTasks(100);

jest.mock('../contexts/TodoContext', () => ({
  useTodoContext: () => ({
    tasks: mockLargeTaskList,
    filter: 'all',
    toggleTask: jest.fn(),
    deleteTask: jest.fn(),
    updateTask: jest.fn()
  })
}));

describe('Rendering Performance', () => {
  test('should render large task list efficiently', () => {
    // Measure rendering time
    const startTime = performance.now();
    
    render(
      <TodoProvider>
        <TodoList />
      </TodoProvider>
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Log rendering time for analysis
    console.log(`Rendered 100 tasks in ${renderTime}ms`);
    
    // Verify all tasks were rendered
    expect(screen.getAllByRole('listitem').length).toBe(100);
    
    // Assert rendering time is within acceptable limits
    // Note: This is a simplified approach and may vary based on test environment
    expect(renderTime).toBeLessThan(500); // 500ms threshold
  });
});
```

In practice, performance testing often involves:
- React DevTools Profiler for component rendering analysis
- Performance monitoring in production
- Lighthouse performance audits
- Manual testing with large datasets

### 8.2 State Update Performance

State update performance tests verify that state updates are efficient and don't cause unnecessary re-renders.

Example state update performance test approach:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TodoProvider } from '../contexts/TodoContext';
import App from '../App';

// Mock React's useEffect for tracking renders
jest.spyOn(React, 'useEffect');

describe('State Update Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should not cause unnecessary re-renders when toggling a task', () => {
    render(
      <TodoProvider>
        <App />
      </TodoProvider>
    );
    
    // Add multiple tasks
    const input = screen.getByPlaceholderText('Add a new task...');
    
    for (let i = 0; i < 3; i++) {
      fireEvent.change(input, { target: { value: `Task ${i}` } });
      fireEvent.click(screen.getByText('Add Task'));
    }
    
    // Reset the useEffect spy count
    jest.clearAllMocks();
    
    // Toggle the first task
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    
    // Count the number of useEffect calls (as a proxy for render count)
    const effectCount = (React.useEffect as jest.Mock).mock.calls.length;
    
    // Log the effect count for analysis
    console.log(`useEffect called ${effectCount} times after toggling a task`);
    
    // We expect a limited number of effects based on our component structure
    // This is a simplified approach and the exact number depends on the implementation
    expect(effectCount).toBeLessThan(10); // Arbitrary threshold
  });
});
```

In practice, state update performance is often analyzed using:
- React DevTools Profiler
- Performance monitoring tools
- Custom instrumentation
- Manual testing with complex state changes

### 8.3 Storage Performance

Storage performance tests verify that localStorage operations are efficient and don't impact user experience.

Example storage performance test approach:

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useTodoList } from '../hooks/useTodoList';
import { saveData, loadData } from '../services/localStorage';
import { Task, Priority } from '../types/Task';

// Mock localStorage service
jest.mock('../services/localStorage', () => ({
  saveData: jest.fn(),
  loadData: jest.fn().mockReturnValue([])
}));

// Create a large number of tasks for performance testing
const createManyTasks = (count: number): Task[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `task-${i}`,
    text: `Task ${i}`,
    completed: i % 2 === 0,
    priority: i % 3 === 0 ? Priority.HIGH : i % 3 === 1 ? Priority.MEDIUM : Priority.LOW,
    createdAt: Date.now() - i * 1000
  }));
};

describe('Storage Performance', () => {
  test('should efficiently save large task lists', () => {
    // Mock loadData to return a large task list
    const largeTasks = createManyTasks(100);
    (loadData as jest.Mock).mockReturnValueOnce(largeTasks);
    
    // Render the hook
    const { result } = renderHook(() => useTodoList());
    
    // Measure the time to add a new task (which triggers a save)
    const startTime = performance.now();
    
    act(() => {
      result.current.addTask('New Task');
    });
    
    const endTime = performance.now();
    const saveTime = endTime - startTime;
    
    // Log save time for analysis
    console.log(`Saved 101 tasks in ${saveTime}ms`);
    
    // Verify saveData was called
    expect(saveData).toHaveBeenCalled();
    
    // Assert save time is within acceptable limits
    // Note: This is a simplified approach and may vary based on test environment
    expect(saveTime).toBeLessThan(100); // 100ms threshold
  });
});
```

In practice, storage performance is often analyzed using:
- Browser performance tools
- Custom timing measurements
- Monitoring in production
- Testing with various data volumes

## 9. SECURITY TESTING

Security testing ensures the application is protected against common security vulnerabilities.

### 9.1 Input Validation

Input validation tests verify that user input is properly validated and sanitized.

Example input validation test:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TodoProvider } from '../contexts/TodoContext';
import TodoForm from './TodoForm';

describe('Input Validation', () => {
  test('should prevent empty task submission', () => {
    const mockAddTask = jest.fn();
    
    render(
      <TodoProvider>
        <TodoForm onAddTask={mockAddTask} />
      </TodoProvider>
    );
    
    // Try to submit an empty task
    const input = screen.getByPlaceholderText('Add a new task...');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(screen.getByText('Add Task'));
    
    // Verify addTask was not called
    expect(mockAddTask).not.toHaveBeenCalled();
    
    // Verify validation error is displayed
    expect(screen.getByText(/cannot be empty/i)).toBeInTheDocument();
  });
  
  test('should trim whitespace from task input', () => {
    const mockAddTask = jest.fn();
    
    render(
      <TodoProvider>
        <TodoForm onAddTask={mockAddTask} />
      </TodoProvider>
    );
    
    // Submit a task with leading/trailing whitespace
    const input = screen.getByPlaceholderText('Add a new task...');
    fireEvent.change(input, { target: { value: '  Whitespace Task  ' } });
    fireEvent.click(screen.getByText('Add Task'));
    
    // Verify addTask was called with trimmed value
    expect(mockAddTask).toHaveBeenCalledWith('Whitespace Task');
  });
  
  test('should sanitize HTML in task input', () => {
    const mockAddTask = jest.fn();
    
    render(
      <TodoProvider>
        <TodoForm onAddTask={mockAddTask} />
      </TodoProvider>
    );
    
    // Submit a task with HTML content
    const input = screen.getByPlaceholderText('Add a new task...');
    fireEvent.change(input, { target: { value: '<script>alert("XSS")</script>Task with HTML' } });
    fireEvent.click(screen.getByText('Add Task'));
    
    // Verify task is displayed with sanitized content
    expect(screen.getByText(/Task with HTML/)).toBeInTheDocument();
    expect(screen.queryByText(/<script>/)).not.toBeInTheDocument();
  });
});
```

Input validation tests focus on:
- Preventing empty or invalid input
- Trimming whitespace
- Sanitizing potentially dangerous content
- Handling edge cases and special characters

### 9.2 XSS Prevention

Cross-site scripting (XSS) prevention tests verify that user input cannot be used to inject malicious scripts.

Example XSS prevention test:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TodoProvider } from '../contexts/TodoContext';
import App from '../App';

describe('XSS Prevention', () => {
  test('should render HTML content as text, not HTML', () => {
    render(
      <TodoProvider>
        <App />
      </TodoProvider>
    );
    
    // Add a task with HTML content
    const input = screen.getByPlaceholderText('Add a new task...');
    const htmlContent = '<img src="x" onerror="alert(\'XSS\')">';
    fireEvent.change(input, { target: { value: htmlContent } });
    fireEvent.click(screen.getByText('Add Task'));
    
    // Get the task element
    const taskElement = screen.getByText(htmlContent);
    
    // Verify the content is rendered as text, not HTML
    expect(taskElement.innerHTML).not.toBe(htmlContent);
    expect(taskElement.textContent).toBe(htmlContent);
    
    // Verify no img element was created
    expect(document.querySelector('img')).toBeNull();
  });
  
  test('should escape special characters in task text', () => {
    render(
      <TodoProvider>
        <App />
      </TodoProvider>
    );
    
    // Add a task with special characters
    const input = screen.getByPlaceholderText('Add a new task...');
    const specialChars = '&<>"\'';
    fireEvent.change(input, { target: { value: specialChars } });
    fireEvent.click(screen.getByText('Add Task'));
    
    // Verify the content is displayed correctly
    expect(screen.getByText(specialChars)).toBeInTheDocument();
    
    // Verify the HTML is escaped
    const taskElement = screen.getByText(specialChars);
    expect(taskElement.innerHTML).not.toBe(specialChars);
  });
});
```

XSS prevention tests focus on:
- Escaping HTML in user input
- Preventing script execution
- Handling special characters
- Verifying React's built-in XSS protection

### 9.3 localStorage Security

localStorage security tests verify that data is stored and retrieved securely.

Example localStorage security test:

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useTodoList } from '../hooks/useTodoList';
import { saveData, loadData } from '../services/localStorage';

// Mock localStorage service
jest.mock('../services/localStorage', () => ({
  saveData: jest.fn(),
  loadData: jest.fn().mockReturnValue([])
}));

describe('localStorage Security', () => {
  test('should validate data structure when loading from localStorage', () => {
    // Mock loadData to return invalid data
    (loadData as jest.Mock).mockReturnValueOnce('not an array');
    
    // Render the hook and expect it to handle the invalid data gracefully
    const { result } = renderHook(() => useTodoList());
    
    // Verify the hook initialized with an empty array instead of the invalid data
    expect(result.current.tasks).toEqual([]);
  });
  
  test('should handle corrupted task objects', () => {
    // Mock loadData to return corrupted task objects
    (loadData as jest.Mock).mockReturnValueOnce([
      { id: 'task-1', text: 'Valid Task', completed: false },
      { notATask: true }, // Missing required properties
      { id: 'task-3', text: 'Another Valid Task', completed: true }
    ]);
    
    // Render the hook
    const { result } = renderHook(() => useTodoList());
    
    // Verify only valid tasks are loaded
    expect(result.current.tasks.length).toBe(2);
    expect(result.current.tasks[0].id).toBe('task-1');
    expect(result.current.tasks[1].id).toBe('task-3');
  });
  
  test('should handle localStorage access errors', () => {
    // Mock loadData to throw an error
    (loadData as jest.Mock).mockImplementationOnce(() => {
      throw new Error('localStorage access denied');
    });
    
    // Render the hook and expect it to handle the error gracefully
    const { result } = renderHook(() => useTodoList());
    
    // Verify the hook initialized with an empty array
    expect(result.current.tasks).toEqual([]);
    
    // Verify we can still add tasks (in-memory operation)
    act(() => {
      result.current.addTask('New Task');
    });
    
    expect(result.current.tasks.length).toBe(1);
    expect(result.current.tasks[0].text).toBe('New Task');
  });
});
```

localStorage security tests focus on:
- Validating data structure and integrity
- Handling corrupted or invalid data
- Graceful degradation when storage is unavailable
- Preventing data loss or corruption

## 10. CONTINUOUS IMPROVEMENT

Continuous improvement ensures the testing approach evolves with the application and development practices.

### 10.1 Test Metrics Analysis

Regular analysis of test metrics helps identify areas for improvement in the testing approach.

Key metrics to analyze include:

| Metric | Purpose | Target |
|--------|---------|--------|
| Code Coverage | Identify untested code | >80% overall |
| Test Execution Time | Identify slow tests | <5 minutes total |
| Test Failures | Identify flaky tests | <1% failure rate |
| Defect Escape Rate | Measure testing effectiveness | <10% of defects found in production |

These metrics should be tracked over time to identify trends and areas for improvement. Regular retrospectives should be conducted to discuss testing challenges and opportunities.

### 10.2 Test Refactoring

Regular test refactoring helps maintain test quality and efficiency.

Test refactoring activities include:

1. **Removing Duplication**: Extract common setup and assertion code into helper functions
2. **Improving Readability**: Ensure test names and assertions clearly communicate intent
3. **Enhancing Performance**: Identify and optimize slow tests
4. **Reducing Flakiness**: Fix tests that fail intermittently
5. **Updating Patterns**: Adopt new testing patterns and best practices

Test refactoring should be treated with the same care as application code refactoring, with a focus on maintaining test reliability and readability.

### 10.3 Future Testing Enhancements

Several enhancements could be made to the testing approach in the future:

1. **End-to-End Testing**: Implement Cypress for comprehensive end-to-end testing
2. **Visual Regression Testing**: Add visual testing to catch UI changes
3. **Performance Monitoring**: Implement continuous performance testing
4. **Mutation Testing**: Add mutation testing to verify test quality
5. **Property-Based Testing**: Implement property-based testing for complex logic

These enhancements should be prioritized based on project needs and resource availability. Each enhancement should be evaluated for its potential impact on test quality and development efficiency.

This testing guide provides a comprehensive approach to ensuring the quality and reliability of the React Todo List application. By following these testing practices, developers can have confidence in the application's functionality, performance, and user experience. The testing strategy will continue to evolve as the application grows and new requirements emerge.