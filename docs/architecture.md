# React Todo List Application Architecture

## 1. ARCHITECTURE OVERVIEW

### 1.1 Architectural Style

The React Todo List application follows a client-side single-page application (SPA) architecture with a component-based structure. This architectural style was selected for its simplicity, direct alignment with React's design philosophy, and appropriateness for the application's scope.

The application architecture is characterized by:
- **Component-based frontend architecture**: Modular UI components with clear separation of concerns
- **Client-side rendering**: All rendering occurs in the user's browser using React
- **Browser-native persistence**: Leveraging localStorage for data persistence without backend dependencies
- **Unidirectional data flow**: Predictable state management with clear data movement

### 1.2 Key Architectural Principles

The architecture is guided by the following key principles:

- **Separation of concerns**: Each component has a single responsibility and encapsulates its own logic
- **Unidirectional data flow**: Data flows down the component hierarchy while events flow up
- **Container/Presentational pattern**: Smart components manage state and logic, while presentational components focus on UI
- **Progressive enhancement**: Core functionality works in most environments, with enhancements for modern browsers
- **State isolation**: Managing state at appropriate levels to minimize complexity

These principles ensure that the application remains maintainable, testable, and extensible as requirements evolve.

### 1.3 System Boundaries

The React Todo List application operates within clear system boundaries:

- **Client-side boundary**: Runs entirely in the user's browser without server components
- **Browser API boundary**: Interfaces with browser APIs, primarily localStorage for persistence
- **DOM boundary**: Interacts with the Document Object Model for rendering and user interaction
- **Storage boundary**: Limited to browser's localStorage capacity (typically 5-10MB)

There are no external system dependencies or integrations, making the application self-contained and portable.

## 2. COMPONENT ARCHITECTURE

### 2.1 Component Hierarchy

The React Todo List application follows a hierarchical component structure:

```
App
├── TodoContext.Provider
│   ├── TodoForm
│   ├── FilterControls
│   └── TodoList
│       └── TodoItem (multiple)
└── ErrorBoundary
```

This hierarchy promotes:
- Logical grouping of related UI elements
- Clear parent-child relationships
- Appropriate state management at each level
- Reusability of lower-level components

### 2.2 Core Components

#### App Component

**Purpose**: Serves as the application's entry point and main container.

**Responsibilities**:
- Initializes the application
- Provides global error boundary
- Renders the main application layout
- Orchestrates the TodoContext provider

**Key Interfaces**:
- Renders the TodoContext provider
- Positions core UI components

**Implementation Details**:
```jsx
function App() {
  return (
    <ErrorBoundary>
      <TodoProvider>
        <div className="todo-app">
          <h1>React Todo List</h1>
          <TodoForm />
          <FilterControls />
          <TodoList />
        </div>
      </TodoProvider>
    </ErrorBoundary>
  );
}
```

#### TodoForm Component

**Purpose**: Provides user interface for creating new tasks.

**Responsibilities**:
- Captures user input for task description
- Validates input before submission
- Communicates with TodoContext to create tasks
- Manages its own input field state

**Key Interfaces**:
- Consumes TodoContext for task creation
- Form submission handling
- Input validation

**Implementation Details**:
```jsx
function TodoForm() {
  const [inputValue, setInputValue] = useState('');
  const { addTask } = useTodoContext();
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedValue = inputValue.trim();
    if (trimmedValue) {
      addTask(trimmedValue);
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="todo-form">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Add a new task..."
      />
      <button type="submit">Add Task</button>
    </form>
  );
}
```

#### TodoList Component

**Purpose**: Renders the collection of todo items.

**Responsibilities**:
- Retrieves tasks from TodoContext
- Applies current filter to tasks
- Renders individual TodoItem components
- Handles empty state display

**Key Interfaces**:
- Consumes TodoContext for tasks and filter state
- Maps tasks to TodoItem components

**Implementation Details**:
```jsx
function TodoList() {
  const { tasks, filter } = useTodoContext();
  
  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'active':
        return tasks.filter(task => !task.completed);
      case 'completed':
        return tasks.filter(task => task.completed);
      default:
        return tasks;
    }
  }, [tasks, filter]);
  
  if (filteredTasks.length === 0) {
    return <div className="empty-state">No tasks to display</div>;
  }
  
  return (
    <div className="todo-list">
      {filteredTasks.map(task => (
        <TodoItem key={task.id} task={task} />
      ))}
    </div>
  );
}
```

#### TodoItem Component

**Purpose**: Renders an individual todo item with its controls.

**Responsibilities**:
- Displays task information
- Provides controls for task manipulation (toggle, edit, delete)
- Manages edit mode state
- Communicates with TodoContext for task operations

**Key Interfaces**:
- Receives task object as prop
- Consumes TodoContext for task operations
- Manages local edit state

**Implementation Details**:
```jsx
function TodoItem({ task }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const { toggleTask, deleteTask, editTask } = useTodoContext();
  
  const handleEditSubmit = (e) => {
    e.preventDefault();
    const trimmedValue = editText.trim();
    if (trimmedValue) {
      editTask(task.id, trimmedValue);
      setIsEditing(false);
    }
  };
  
  if (isEditing) {
    return (
      <form onSubmit={handleEditSubmit} className="todo-item editing">
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          autoFocus
        />
        <button type="submit">Save</button>
        <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
      </form>
    );
  }
  
  return (
    <div className={`todo-item ${task.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => toggleTask(task.id)}
      />
      <span className="todo-text">{task.text}</span>
      <div className="todo-actions">
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <button onClick={() => deleteTask(task.id)}>Delete</button>
      </div>
    </div>
  );
}
```

#### FilterControls Component

**Purpose**: Provides interface for filtering tasks.

**Responsibilities**:
- Displays filter options (All, Active, Completed)
- Maintains visual indication of active filter
- Communicates with TodoContext to change filter

**Key Interfaces**:
- Consumes TodoContext for filter state and operations
- Provides filter selection UI

**Implementation Details**:
```jsx
function FilterControls() {
  const { filter, setFilter } = useTodoContext();
  
  return (
    <div className="filter-controls">
      <button 
        className={filter === 'all' ? 'active' : ''}
        onClick={() => setFilter('all')}
      >
        All
      </button>
      <button 
        className={filter === 'active' ? 'active' : ''}
        onClick={() => setFilter('active')}
      >
        Active
      </button>
      <button 
        className={filter === 'completed' ? 'active' : ''}
        onClick={() => setFilter('completed')}
      >
        Completed
      </button>
    </div>
  );
}
```

### 2.3 Common Components

#### Button Component

**Purpose**: Provides a consistent button UI across the application.

**Implementation Details**:
```jsx
function Button({ children, className, ...props }) {
  return (
    <button 
      className={`app-button ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

#### Checkbox Component

**Purpose**: Provides a consistent checkbox UI for task completion status.

**Implementation Details**:
```jsx
function Checkbox({ checked, onChange, label }) {
  return (
    <label className="app-checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
      <span className="checkbox-label">{label}</span>
    </label>
  );
}
```

#### Input Component

**Purpose**: Provides a consistent text input UI for task entry and editing.

**Implementation Details**:
```jsx
function Input({ value, onChange, placeholder, ...props }) {
  return (
    <input
      type="text"
      className="app-input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
    />
  );
}
```

#### ErrorBoundary Component

**Purpose**: Catches and handles errors in the component tree.

**Implementation Details**:
```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error("Todo application error:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### 2.4 Component Communication

The components in the React Todo List application communicate through:

1. **Props**: For parent-to-child communication
2. **Context API**: For accessing global state without prop drilling
3. **Event callbacks**: For child-to-parent communication

This communication pattern follows React's unidirectional data flow principle, where data flows down through props and events flow up through callbacks.

**Example of Context-based Communication**:
```jsx
// In TodoProvider
export const TodoContext = createContext();

export function TodoProvider({ children }) {
  const { tasks, addTask, toggleTask, deleteTask, editTask } = useTodoList();
  const [filter, setFilter] = useState('all');
  
  const contextValue = {
    tasks,
    filter,
    addTask,
    toggleTask,
    deleteTask,
    editTask,
    setFilter
  };
  
  return (
    <TodoContext.Provider value={contextValue}>
      {children}
    </TodoContext.Provider>
  );
}

// In any component
function SomeComponent() {
  const { tasks, addTask } = useContext(TodoContext);
  // Use tasks or addTask as needed
}
```

## 3. STATE MANAGEMENT

### 3.1 Context API Implementation

The application uses React's Context API for global state management, avoiding prop drilling and centralizing state logic.

**TodoContext Implementation**:
```jsx
import { createContext, useContext, useState } from 'react';
import { useTodoList } from '../hooks/useTodoList';

export const TodoContext = createContext();

export function TodoProvider({ children }) {
  const { 
    tasks, 
    addTask, 
    toggleTask, 
    deleteTask, 
    editTask 
  } = useTodoList();
  
  const [filter, setFilter] = useState('all');
  
  // Pack all state and functions into the context value
  const contextValue = {
    tasks,
    filter,
    addTask,
    toggleTask,
    deleteTask,
    editTask,
    setFilter
  };
  
  return (
    <TodoContext.Provider value={contextValue}>
      {children}
    </TodoContext.Provider>
  );
}

// Custom hook for easy context consumption
export function useTodoContext() {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodoContext must be used within a TodoProvider');
  }
  return context;
}
```

This implementation:
- Creates a context for todo list state and operations
- Provides a custom hook for consuming the context
- Centralizes state logic in the TodoProvider component
- Includes error handling for improper context usage

### 3.2 Custom Hooks

The application uses custom hooks to encapsulate and reuse stateful logic.

#### useTodoList Hook

**Purpose**: Manages the core todo list state and operations.

**Implementation**:
```jsx
import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { v4 as uuidv4 } from 'uuid';

export function useTodoList() {
  const [tasks, setTasks] = useLocalStorage('react-todo-list-tasks', []);
  
  // Add a new task
  const addTask = (text) => {
    const newTask = {
      id: uuidv4(),
      text,
      completed: false,
      createdAt: Date.now()
    };
    setTasks([...tasks, newTask]);
  };
  
  // Toggle task completion status
  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id 
        ? { ...task, completed: !task.completed } 
        : task
    ));
  };
  
  // Delete a task
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };
  
  // Edit task text
  const editTask = (id, newText) => {
    setTasks(tasks.map(task => 
      task.id === id 
        ? { ...task, text: newText } 
        : task
    ));
  };
  
  return {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    editTask
  };
}
```

#### useLocalStorage Hook

**Purpose**: Synchronizes state with localStorage for persistence.

**Implementation**:
```jsx
import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  // Initialize state with value from localStorage or initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });
  
  // Update localStorage when state changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);
  
  return [storedValue, setStoredValue];
}
```

#### usePrevious Hook

**Purpose**: Tracks previous values for comparison in effects.

**Implementation**:
```jsx
import { useRef, useEffect } from 'react';

export function usePrevious(value) {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}
```

### 3.3 State Structure

The application's global state is structured as follows:

```javascript
{
  // Array of task objects
  tasks: [
    {
      id: "unique-id-1",
      text: "Complete project documentation",
      completed: false,
      createdAt: 1623456789000
    },
    {
      id: "unique-id-2",
      text: "Implement localStorage persistence",
      completed: true,
      createdAt: 1623456790000
    }
  ],
  
  // Current filter selection
  filter: "all" // "all", "active", or "completed"
}
```

**Task Object Structure**:
- `id`: Unique identifier (string)
- `text`: Task description (string)
- `completed`: Completion status (boolean)
- `createdAt`: Creation timestamp (number)
- `priority`: Task priority (optional, string - "high", "medium", "low")

This structure keeps state minimal while providing all necessary information for the application's functionality.

### 3.4 State Updates

State updates follow a consistent pattern to ensure predictability:

1. **Immutable Updates**: Always create new state objects/arrays rather than mutating existing ones
2. **Single Source of Truth**: State operations are centralized in the useTodoList hook
3. **Functional Updates**: Use functional form of setState when the new state depends on the previous state
4. **Batch Updates**: React's batching mechanism is leveraged for performance

**Example of Immutable State Update**:
```javascript
// Toggle task completion status
const toggleTask = (id) => {
  setTasks(prevTasks => prevTasks.map(task => 
    task.id === id 
      ? { ...task, completed: !task.completed } 
      : task
  ));
};
```

## 4. DATA PERSISTENCE

### 4.1 LocalStorage Service

The application uses a dedicated service for localStorage interactions to encapsulate storage logic and error handling.

**LocalStorageService Implementation**:
```javascript
export const LocalStorageService = {
  saveData(key, data) {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  },
  
  loadData(key, defaultValue = null) {
    try {
      const serializedData = localStorage.getItem(key);
      return serializedData ? JSON.parse(serializedData) : defaultValue;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return defaultValue;
    }
  },
  
  removeData(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },
  
  clearAll() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },
  
  isAvailable() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }
};
```

This service is used by the useLocalStorage hook for state persistence.

### 4.2 Data Structure

Data in localStorage is structured as follows:

```
localStorage = {
  'react-todo-list-tasks': '[{"id":"unique-id-1","text":"Complete project documentation","completed":false,"createdAt":1623456789000},{"id":"unique-id-2","text":"Implement localStorage persistence","completed":true,"createdAt":1623456790000}]',
  'react-todo-list-filter': '"all"'
}
```

Key naming follows a consistent pattern with application-specific prefixes to avoid conflicts with other applications using localStorage on the same domain.

### 4.3 Error Handling

The persistence layer includes comprehensive error handling:

1. **Storage Detection**: Check if localStorage is available
2. **Exception Handling**: Try-catch blocks around all storage operations
3. **Fallback Mechanisms**: Default values when data cannot be retrieved
4. **Error Logging**: Console errors for debugging purposes
5. **Recovery Strategy**: Graceful degradation to in-memory operation

**Example of Storage Availability Detection**:
```javascript
function isStorageAvailable() {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

// Usage
if (!isStorageAvailable()) {
  // Notify user of storage unavailability
  // Fall back to in-memory operation
}
```

### 4.4 Storage Limitations

Browser localStorage has several limitations addressed by the application:

1. **Size Limit** (typically 5-10MB):
   - Efficient data structure to minimize storage usage
   - Potential future implementation of task archiving

2. **String-Only Storage**:
   - JSON serialization/deserialization for complex data types
   - Proper error handling for malformed JSON

3. **Same-Origin Restriction**:
   - Application designed to work within a single origin
   - No cross-origin data sharing requirements

4. **No Expiration Mechanism**:
   - Application manages its own data lifecycle
   - Clear functionality provided to users

5. **Synchronous API**:
   - Minimal performance impact due to small data size
   - Strategic timing of storage operations to avoid UI blocking

## 5. DATA FLOW

### 5.1 Unidirectional Data Flow

The application implements React's unidirectional data flow pattern:

1. **State**: Centralized in TodoContext
2. **Props**: Data flows down the component hierarchy through props
3. **Events**: User interactions trigger events that flow up through callbacks
4. **Updates**: State changes trigger re-rendering of affected components

This pattern makes data flow predictable and easier to debug.

**Visual Representation**:
```
State (TodoContext)
    ↓ 
Component Props
    ↓
UI Rendering
    ↓
User Interaction
    ↓
Event Handlers
    ↓
State Updates
    ↓
(Cycle repeats)
```

### 5.2 Task Creation Flow

The task creation flow illustrates the unidirectional data pattern:

1. **User Input**: User enters task text in TodoForm
2. **Form Submission**: User submits the form (click or Enter key)
3. **Input Validation**: TodoForm validates the input
4. **Context Access**: TodoForm accesses the addTask function from TodoContext
5. **State Update**: addTask function creates a new task and updates the tasks array
6. **Storage Update**: useLocalStorage effect detects state change and updates localStorage
7. **UI Update**: React re-renders the TodoList with the new task

**Flow Diagram**:
```
User → TodoForm → Input Validation → TodoContext.addTask → 
State Update → localStorage Update → UI Re-render
```

### 5.3 Task Update Flow

The task update flow (toggling completion, editing, or deleting):

1. **User Interaction**: User interacts with a TodoItem (toggle checkbox, edit, delete)
2. **Event Triggering**: TodoItem triggers the appropriate function from TodoContext
3. **State Update**: Function updates the tasks array with the change
4. **Storage Update**: useLocalStorage effect detects state change and updates localStorage
5. **UI Update**: React re-renders the TodoList with the updated task state

**Flow Diagram for Toggle**:
```
User → TodoItem Checkbox → TodoContext.toggleTask → 
State Update → localStorage Update → UI Re-render
```

### 5.4 Task Filtering Flow

The task filtering flow:

1. **Filter Selection**: User selects a filter option in FilterControls
2. **Context Update**: FilterControls calls setFilter from TodoContext
3. **State Update**: Filter state is updated in TodoContext
4. **Filtered Rendering**: TodoList re-renders with filtered tasks based on current filter
5. **Storage Update**: Optional persistence of filter preference to localStorage

**Flow Diagram**:
```
User → FilterControls → TodoContext.setFilter → 
State Update → TodoList Filtered Rendering → UI Update
```

## 6. TYPE SYSTEM

### 6.1 Core Types

The application uses TypeScript to define clear interfaces for its data structures:

```typescript
// Task interface
interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority?: Priority;
}

// Priority enum
enum Priority {
  High = 'high',
  Medium = 'medium',
  Low = 'low'
}

// Filter type
type FilterType = 'all' | 'active' | 'completed';

// Task input interfaces
interface CreateTaskInput {
  text: string;
  priority?: Priority;
}

interface UpdateTaskInput {
  id: string;
  text?: string;
  completed?: boolean;
  priority?: Priority;
}
```

These types ensure consistency across the application and provide compile-time checking.

### 6.2 Component Props

Each component has clearly defined prop types:

```typescript
// TodoItem props
interface TodoItemProps {
  task: Task;
}

// TodoList props (none required as it uses context)
interface TodoListProps {}

// TodoForm props (none required as it uses context)
interface TodoFormProps {}

// FilterControls props (none required as it uses context)
interface FilterControlsProps {}

// Button props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

// Checkbox props
interface CheckboxProps {
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
}

// Input props
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}
```

### 6.3 State Types

The application's state types are defined to ensure type safety:

```typescript
// Todo context state
interface TodoContextState {
  tasks: Task[];
  filter: FilterType;
  addTask: (text: string, priority?: Priority) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  editTask: (id: string, text: string) => void;
  setFilter: (filter: FilterType) => void;
}

// Local component state types
interface TodoItemState {
  isEditing: boolean;
  editText: string;
}

interface TodoFormState {
  inputValue: string;
}
```

### 6.4 Utility Types

Additional utility types support various operations:

```typescript
// Generic localStorage hook type
type UseLocalStorageReturn<T> = [T, React.Dispatch<React.SetStateAction<T>>];

// Task operation result type
interface TaskOperationResult {
  success: boolean;
  error?: string;
}

// Sort options
type SortOption = 'createdAt' | 'priority' | 'alphabetical';

// Sort direction
type SortDirection = 'asc' | 'desc';
```

## 7. ERROR HANDLING

### 7.1 Input Validation

The application implements thorough input validation:

1. **Empty Input Prevention**: 
```javascript
const handleSubmit = (e) => {
  e.preventDefault();
  const trimmedValue = inputValue.trim();
  if (!trimmedValue) {
    // Show validation error
    setError('Task cannot be empty');
    return;
  }
  addTask(trimmedValue);
  setInputValue('');
  setError('');
};
```

2. **Input Sanitization**:
```javascript
const sanitizeInput = (input) => {
  // Simple sanitization example
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

// Usage
addTask(sanitizeInput(inputValue));
```

3. **Length Limitations**:
```javascript
const isValidInput = (input) => {
  const trimmed = input.trim();
  return trimmed.length > 0 && trimmed.length <= 250;
};
```

### 7.2 Storage Error Handling

The application implements robust storage error handling:

1. **Detection**:
```javascript
const isStorageAvailable = () => {
  // Implementation from section 4.3
};
```

2. **Recovery**:
```javascript
const [storedValue, setStoredValue] = useState(() => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return initialValue;
  }
});
```

3. **User Notification**:
```javascript
const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Show error notification to user
    showNotification('Storage error: Your changes may not persist when you leave the page.');
  }
};
```

### 7.3 Error Boundaries

The application uses React Error Boundaries to catch and handle component errors:

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error("Todo application error:", error, errorInfo);
    // Optional: send to error reporting service
  }
  
  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>The application encountered an unexpected error.</p>
          <button onClick={this.resetErrorBoundary}>
            Try again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

The Error Boundary is applied at strategic points:
```jsx
function App() {
  return (
    <ErrorBoundary>
      <TodoProvider>
        {/* Application components */}
      </TodoProvider>
    </ErrorBoundary>
  );
}
```

### 7.4 Graceful Degradation

The application implements graceful degradation when encountering errors:

1. **Storage Unavailability**:
```javascript
function TodoProvider({ children }) {
  const [storageAvailable] = useState(() => isStorageAvailable());
  
  // Use in-memory state if storage is unavailable
  const stateHook = storageAvailable 
    ? useLocalStorage('react-todo-list-tasks', [])
    : useState([]);
  
  const [tasks, setTasks] = stateHook;
  
  // Rest of the provider implementation
  
  // Notify user if storage is unavailable
  useEffect(() => {
    if (!storageAvailable) {
      showNotification('Local storage is unavailable. Your tasks will not persist between sessions.');
    }
  }, [storageAvailable]);
  
  // ...
}
```

2. **Component Failure Isolation**:
```jsx
function TodoList() {
  // ...
  
  return (
    <div className="todo-list">
      {filteredTasks.map(task => (
        <ErrorBoundary key={task.id} fallback={<div>Error displaying this task</div>}>
          <TodoItem task={task} />
        </ErrorBoundary>
      ))}
    </div>
  );
}
```

3. **Network Failure Handling** (for future API integrations):
```javascript
const fetchTasks = async () => {
  try {
    setLoading(true);
    const response = await fetch('/api/tasks');
    if (!response.ok) throw new Error('Failed to fetch tasks');
    const data = await response.json();
    setTasks(data);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    setError('Failed to load tasks. Using cached data.');
    // Use cached data from localStorage as fallback
    const cachedTasks = LocalStorageService.loadData('cached-tasks', []);
    setTasks(cachedTasks);
  } finally {
    setLoading(false);
  }
};
```

## 8. PERFORMANCE CONSIDERATIONS

### 8.1 Component Optimization

The application implements several component optimization techniques:

1. **Memoization with React.memo**:
```jsx
const TodoItem = React.memo(function TodoItem({ task }) {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.task.id === nextProps.task.id &&
    prevProps.task.text === nextProps.task.text &&
    prevProps.task.completed === nextProps.task.completed;
});
```

2. **Code Splitting**:
```jsx
const TodoStatistics = React.lazy(() => import('./TodoStatistics'));

function App() {
  return (
    <div className="todo-app">
      {/* Regular components */}
      <React.Suspense fallback={<div>Loading statistics...</div>}>
        <TodoStatistics />
      </React.Suspense>
    </div>
  );
}
```

3. **Efficient Event Handlers**:
```jsx
// Instead of creating a new function on each render
<button onClick={() => deleteTask(task.id)}>Delete</button>

// Use useCallback to memoize the function
const handleDelete = useCallback(() => {
  deleteTask(task.id);
}, [deleteTask, task.id]);

<button onClick={handleDelete}>Delete</button>
```

### 8.2 Memoization

The application uses memoization to prevent unnecessary calculations and renders:

1. **useMemo for Computed Values**:
```jsx
function TodoList() {
  const { tasks, filter } = useTodoContext();
  
  const filteredTasks = useMemo(() => {
    console.log('Filtering tasks');
    switch (filter) {
      case 'active':
        return tasks.filter(task => !task.completed);
      case 'completed':
        return tasks.filter(task => task.completed);
      default:
        return tasks;
    }
  }, [tasks, filter]);
  
  // Rest of component
}
```

2. **useCallback for Stable Functions**:
```jsx
function TodoProvider({ children }) {
  const [tasks, setTasks] = useLocalStorage('react-todo-list-tasks', []);
  
  const addTask = useCallback((text) => {
    const newTask = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: Date.now()
    };
    setTasks(prev => [...prev, newTask]);
  }, [setTasks]);
  
  // Other functions with useCallback
  
  // Rest of provider
}
```

3. **Object Literal Memoization**:
```jsx
function Component() {
  // Bad: Creates a new object every render
  const style = { color: 'red', margin: '10px' };
  
  // Good: Memoized object
  const style = useMemo(() => ({
    color: 'red',
    margin: '10px'
  }), []);
  
  return <div style={style}>Content</div>;
}
```

### 8.3 Storage Optimization

The application optimizes localStorage usage:

1. **Minimal Data Structure**:
```javascript
// Efficient data structure
const task = {
  id: '123',
  text: 'Buy groceries',
  completed: false,
  createdAt: Date.now()
};

// Avoid unnecessary properties
// Bad:
const task = {
  id: '123',
  text: 'Buy groceries',
  completed: false,
  createdAt: Date.now(),
  lastModified: Date.now(),
  description: '',  // Empty string
  tags: [],         // Empty array
  subtasks: []      // Empty array
};
```

2. **Batch Updates**:
```javascript
// Bad: Multiple storage operations
addTask(text) {
  const newTask = createTask(text);
  const newTasks = [...tasks, newTask];
  setTasks(newTasks);
  localStorage.setItem('react-todo-list-tasks', JSON.stringify(newTasks));
}

// Good: Single storage operation via effect
useEffect(() => {
  localStorage.setItem('react-todo-list-tasks', JSON.stringify(tasks));
}, [tasks]);
```

3. **Throttled Storage Updates**:
```javascript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    localStorage.setItem('react-todo-list-tasks', JSON.stringify(tasks));
  }, 500);
  
  return () => clearTimeout(timeoutId);
}, [tasks]);
```

### 8.4 Rendering Optimization

The application optimizes rendering performance:

1. **Virtualized Lists** (for future large task lists):
```jsx
import { FixedSizeList } from 'react-window';

function TodoList() {
  const { filteredTasks } = useTodoContext();
  
  return (
    <div className="todo-list">
      <FixedSizeList
        height={400}
        width="100%"
        itemCount={filteredTasks.length}
        itemSize={50}
      >
        {({ index, style }) => (
          <div style={style}>
            <TodoItem task={filteredTasks[index]} />
          </div>
        )}
      </FixedSizeList>
    </div>
  );
}
```

2. **Key Optimization**:
```jsx
// Bad: Using index as key
{tasks.map((task, index) => (
  <TodoItem key={index} task={task} />
))}

// Good: Using stable, unique IDs
{tasks.map(task => (
  <TodoItem key={task.id} task={task} />
))}
```

3. **Conditional Rendering**:
```jsx
// Bad: Unnecessary div in the DOM
{tasks.length > 0 ? (
  <div className="task-list">
    {tasks.map(task => <TodoItem key={task.id} task={task} />)}
  </div>
) : (
  <div className="empty-state">No tasks</div>
)}

// Good: Avoiding unnecessary elements
<div className="task-container">
  {tasks.length > 0 ? (
    tasks.map(task => <TodoItem key={task.id} task={task} />)
  ) : (
    <div className="empty-state">No tasks</div>
  )}
</div>
```

## 9. ACCESSIBILITY

### 9.1 Keyboard Navigation

The application ensures complete keyboard navigation:

1. **Focus Management**:
```jsx
function TodoForm() {
  const inputRef = useRef(null);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Form submission logic
    
    // Return focus to input after submission
    inputRef.current.focus();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleChange}
      />
      <button type="submit">Add Task</button>
    </form>
  );
}
```

2. **Accessible Buttons**:
```jsx
// Ensure buttons have accessible names
<button aria-label="Delete task">×</button>

// Use keyboard event handlers
<button 
  onClick={handleDelete}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleDelete();
    }
  }}
>
  Delete
</button>
```

3. **Skip Links** (for larger applications):
```jsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

### 9.2 Screen Reader Support

The application implements proper ARIA attributes and semantic HTML:

1. **Semantic HTML**:
```jsx
<main>
  <h1>Todo List</h1>
  <form>
    {/* Form elements */}
  </form>
  <section aria-label="Todo Items">
    <ul role="list">
      {tasks.map(task => (
        <li key={task.id} role="listitem">
          {/* TodoItem content */}
        </li>
      ))}
    </ul>
  </section>
</main>
```

2. **ARIA Attributes**:
```jsx
<div className="todo-app" role="application" aria-label="Todo List Application">
  <form aria-labelledby="form-title">
    <h2 id="form-title">Add New Task</h2>
    <input 
      aria-label="Task description" 
      type="text" 
    />
    <button type="submit">Add Task</button>
  </form>
  
  <div role="tablist" aria-label="Filter tasks">
    <button 
      role="tab" 
      aria-selected={filter === 'all'} 
      onClick={() => setFilter('all')}
    >
      All
    </button>
    {/* Other filter tabs */}
  </div>
  
  <ul role="list" aria-label="Todo items">
    {/* List items */}
  </ul>
</div>
```

3. **Status Announcements**:
```jsx
function TodoApp() {
  const [status, setStatus] = useState('');
  
  const addTask = (text) => {
    // Task addition logic
    
    // Set status for screen readers
    setStatus(`Task added: ${text}`);
  };
  
  return (
    <div>
      {/* App components */}
      
      <div 
        aria-live="polite" 
        className="sr-only"
      >
        {status}
      </div>
    </div>
  );
}
```

### 9.3 Focus Management

The application implements proper focus management for dynamic content:

1. **Focus After Task Creation**:
```jsx
function TodoForm() {
  const inputRef = useRef(null);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit task
    
    // Return focus to input
    inputRef.current.focus();
  };
  
  // Form JSX
}
```

2. **Focus After Deletion**:
```jsx
function TodoItem({ task, index, totalTasks }) {
  const nextItemRef = useRef(null);
  
  const handleDelete = () => {
    // If there's a next item, prepare to focus it
    const shouldFocusNext = index < totalTasks - 1;
    
    // Delete the task
    deleteTask(task.id);
    
    // Focus the next item or the list container
    if (shouldFocusNext && nextItemRef.current) {
      nextItemRef.current.focus();
    } else {
      document.querySelector('.todo-list').focus();
    }
  };
  
  // Component JSX
}
```

3. **Focus Trap for Modals**:
```jsx
function EditTaskModal({ task, onSave, onClose }) {
  // Focus trap implementation
  useEffect(() => {
    const dialog = dialogRef.current;
    
    // Save previous active element
    const previousActive = document.activeElement;
    
    // Focus the dialog on mount
    dialog.focus();
    
    // Set up focus trap
    const focusableElements = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    function handleKeyDown(e) {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
      
      if (e.key === 'Escape') {
        onClose();
      }
    }
    
    dialog.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
      previousActive.focus();
    };
  }, [onClose]);
  
  // Modal JSX
}
```

### 9.4 Color Contrast

The application ensures sufficient color contrast for all UI elements:

1. **Contrast Ratios**:
- Text to background: minimum 4.5:1
- Large text to background: minimum 3:1
- UI elements to surroundings: minimum 3:1

2. **CSS Implementation**:
```css
:root {
  /* High-contrast colors */
  --text-color: #333333; /* Dark gray for text */
  --background-color: #ffffff; /* White background */
  --primary-color: #0056b3; /* Accessible blue */
  --completed-color: #707070; /* Accessible gray */
  --error-color: #d32f2f; /* Accessible red */
}

body {
  color: var(--text-color);
  background-color: var(--background-color);
}

.todo-item.completed {
  color: var(--completed-color);
}

.error-message {
  color: var(--error-color);
}
```

3. **Not Relying on Color Alone**:
```jsx
<div className={`todo-item ${task.completed ? 'completed' : ''}`}>
  <input 
    type="checkbox" 
    checked={task.completed} 
    onChange={() => toggleTask(task.id)}
    id={`task-${task.id}`}
  />
  
  {/* Use text decoration in addition to color */}
  <label 
    htmlFor={`task-${task.id}`}
    className={task.completed ? 'completed-text' : ''}
  >
    {task.text}
  </label>
  
  {/* Use icons with labels */}
  <button className="delete-btn" aria-label="Delete task">
    <span aria-hidden="true">×</span>
  </button>
</div>
```

## 10. FUTURE CONSIDERATIONS

### 10.1 Scaling Considerations

As the application grows, several scaling considerations should be addressed:

1. **State Management Evolution**:
   - Consider moving from Context API to Redux or Zustand for more complex state
   - Implement more sophisticated state selectors for performance
   - Add middleware for side effects (e.g., Redux Saga/Thunk)

2. **Performance Optimization**:
   - Implement virtualized lists for handling large numbers of tasks
   - Add pagination or infinite scrolling for task history
   - Optimize rendering with more granular component memoization

3. **Storage Evolution**:
   - Consider migrating from localStorage to IndexedDB for larger storage capacity
   - Implement data archiving for historical tasks
   - Add data compression for efficient storage usage

4. **Feature Expansion**:
   - Task categories/tags
   - Advanced filtering and search
   - Task analytics and statistics
   - Due dates and reminders

### 10.2 Backend Integration

Future backend integration considerations:

1. **API Service Layer**:
```javascript
// API service abstraction
const TodoApi = {
  async getTasks() {
    const response = await fetch('/api/tasks');
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },
  
  async createTask(task) {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },
  
  // Other API methods
};
```

2. **Offline-First Approach**:
```javascript
function useTodoList() {
  const [tasks, setTasks] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState([]);
  
  // Online status detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Sync with server when online
  useEffect(() => {
    if (isOnline && pendingChanges.length > 0) {
      const syncChanges = async () => {
        // Process pending changes
        for (const change of pendingChanges) {
          try {
            switch (change.type) {
              case 'add':
                await TodoApi.createTask(change.task);
                break;
              case 'update':
                await TodoApi.updateTask(change.task.id, change.task);
                break;
              case 'delete':
                await TodoApi.deleteTask(change.taskId);
                break;
              default:
                console.warn('Unknown change type:', change.type);
            }
          } catch (error) {
            console.error('Failed to sync change:', error);
            // Keep failed changes for retry
            return;
          }
        }
        
        // Clear successfully synced changes
        setPendingChanges([]);
        
        // Refresh tasks from server
        const latestTasks = await TodoApi.getTasks();
        setTasks(latestTasks);
      };
      
      syncChanges();
    }
  }, [isOnline, pendingChanges]);
  
  // Modified task operations to work offline
  const addTask = (text) => {
    const newTask = {
      id: `local-${Date.now()}`, // Local ID until synced
      text,
      completed: false,
      createdAt: Date.now()
    };
    
    // Update local state
    setTasks(prev => [...prev, newTask]);
    
    // Track change for sync
    if (!isOnline) {
      setPendingChanges(prev => [...prev, { type: 'add', task: newTask }]);
    } else {
      // Immediate API call when online
      TodoApi.createTask(newTask)
        .catch(error => {
          console.error('Failed to create task:', error);
          // Add to pending changes on failure
          setPendingChanges(prev => [...prev, { type: 'add', task: newTask }]);
        });
    }
  };
  
  // Other operations with similar offline support
  
  return {
    tasks,
    addTask,
    // Other operations
    isOnline,
    hasPendingChanges: pendingChanges.length > 0
  };
}
```

3. **Authentication Integration**:
```javascript
const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const login = async (credentials) => {
    // Login implementation
  };
  
  const logout = async () => {
    // Logout implementation
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Usage with todo context
function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <TodoProvider>
          {/* Todo app components */}
        </TodoProvider>
      </AuthGuard>
    </AuthProvider>
  );
}

function AuthGuard({ children }) {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <LoginScreen />;
  }
  
  return children;
}
```

### 10.3 Advanced State Management

Considerations for more complex state management:

1. **Redux Integration**:
```javascript
// Actions
const ADD_TASK = 'ADD_TASK';
const TOGGLE_TASK = 'TOGGLE_TASK';
const DELETE_TASK = 'DELETE_TASK';
const EDIT_TASK = 'EDIT_TASK';
const SET_FILTER = 'SET_FILTER';

// Action creators
const addTask = (text) => ({
  type: ADD_TASK,
  payload: {
    id: Date.now().toString(),
    text,
    completed: false,
    createdAt: Date.now()
  }
});

// Reducer
const initialState = {
  tasks: [],
  filter: 'all'
};

function todoReducer(state = initialState, action) {
  switch (action.type) {
    case ADD_TASK:
      return {
        ...state,
        tasks: [...state.tasks, action.payload]
      };
    case TOGGLE_TASK:
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? { ...task, completed: !task.completed }
            : task
        )
      };
    // Other cases
    default:
      return state;
  }
}

// Middleware for localStorage persistence
const persistenceMiddleware = store => next => action => {
  const result = next(action);
  const state = store.getState();
  
  // Actions that modify tasks
  if (
    action.type === ADD_TASK ||
    action.type === TOGGLE_TASK ||
    action.type === DELETE_TASK ||
    action.type === EDIT_TASK
  ) {
    localStorage.setItem('react-todo-list-tasks', JSON.stringify(state.tasks));
  }
  
  if (action.type === SET_FILTER) {
    localStorage.setItem('react-todo-list-filter', state.filter);
  }
  
  return result;
};

// Store setup
const store = createStore(
  todoReducer,
  applyMiddleware(persistenceMiddleware)
);
```

2. **Zustand Integration**:
```javascript
import create from 'zustand';
import { persist } from 'zustand/middleware';

const useTodoStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      filter: 'all',
      
      addTask: (text) => set(state => ({
        tasks: [...state.tasks, {
          id: Date.now().toString(),
          text,
          completed: false,
          createdAt: Date.now()
        }]
      })),
      
      toggleTask: (id) => set(state => ({
        tasks: state.tasks.map(task =>
          task.id === id 
            ? { ...task, completed: !task.completed } 
            : task
        )
      })),
      
      // Other actions
      
      setFilter: (filter) => set({ filter })
    }),
    {
      name: 'todo-storage',
      getStorage: () => localStorage
    }
  )
);
```

3. **Immer for Immutable Updates**:
```javascript
import produce from 'immer';

// In Redux reducer
case TOGGLE_TASK:
  return produce(state, draft => {
    const task = draft.tasks.find(t => t.id === action.payload);
    if (task) {
      task.completed = !task.completed;
    }
  });

// Or in React useState
const toggleTask = (id) => {
  setTasks(produce(tasks, draft => {
    const task = draft.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
    }
  }));
};
```

### 10.4 Progressive Web App

To transform the application into a Progressive Web App (PWA):

1. **Service Worker Implementation**:
```javascript
// src/serviceWorker.js
export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
      
      navigator.serviceWorker.register(swUrl)
        .then(registration => {
          console.log('ServiceWorker registered:', registration);
        })
        .catch(error => {
          console.error('ServiceWorker registration failed:', error);
        });
    });
  }
}

// Registration in index.js
import { register } from './serviceWorker';
register();
```

2. **Offline Support with Workbox**:
```javascript
// In service-worker.js (generated by workbox-cli)
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js');

// Cache the Google Fonts stylesheets
workbox.routing.registerRoute(
  ({url}) => url.origin === 'https://fonts.googleapis.com',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

// Cache the app shell
workbox.routing.registerRoute(
  ({request}) => request.destination === 'document',
  new workbox.strategies.NetworkFirst({
    cacheName: 'document-cache',
  })
);

// Cache static assets
workbox.routing.registerRoute(
  ({request}) => 
    request.destination === 'script' ||
    request.destination === 'style',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);
```

3. **Web App Manifest**:
```json
{
  "short_name": "Todo List",
  "name": "React Todo List",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#4a90e2",
  "background_color": "#ffffff"
}
```

4. **IndexedDB for Robust Offline Storage**:
```javascript
// IndexedDB service
const TodoDB = {
  db: null,
  
  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TodoApp', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };
      
      request.onerror = (event) => {
        reject('IndexedDB error: ' + event.target.errorCode);
      };
    });
  },
  
  async getTasks() {
    await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['tasks'], 'readonly');
      const store = transaction.objectStore('tasks');
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject('Error fetching tasks');
      };
    });
  },
  
  async addTask(task) {
    await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['tasks'], 'readwrite');
      const store = transaction.objectStore('tasks');
      const request = store.add(task);
      
      request.onsuccess = () => {
        resolve(task);
      };
      
      request.onerror = () => {
        reject('Error adding task');
      };
    });
  },
  
  // Other CRUD operations
  
  async ensureDb() {
    if (!this.db) {
      await this.open();
    }
  }
};
```

## APPENDIX A: ARCHITECTURE DIAGRAMS

### A.1 Component Hierarchy Diagram

```
App
├── ErrorBoundary
│   └── TodoProvider (Context)
│       ├── TodoForm
│       │   ├── Input
│       │   └── Button
│       ├── FilterControls
│       │   └── Button (x3)
│       └── TodoList
│           ├── TodoItem
│           │   ├── Checkbox
│           │   ├── Button (Edit)
│           │   └── Button (Delete)
│           └── TodoItem (multiple)
```

### A.2 Data Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User Input  │────▶│    Events   │────▶│State Updates│
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
┌─────────────┐     ┌─────────────┐     ┌──────▼──────┐
│     UI      │◀────│  React DOM  │◀────│  App State  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                         ┌──────▼──────┐
                                         │ LocalStorage │
                                         └─────────────┘
```

### A.3 State Management Diagram

```
┌───────────────────────────────────────┐
│           TodoContext.Provider        │
│ ┌─────────────┐     ┌──────────────┐  │
│ │   Tasks[]   │     │   Filter     │  │
│ └─────┬───────┘     └──────┬───────┘  │
│       │                    │          │
│ ┌─────▼───────┐     ┌──────▼───────┐  │
│ │ Task Methods│     │Filter Methods│  │
│ └─────────────┘     └──────────────┘  │
└───────┬───────────────────┬───────────┘
        │                   │
┌───────▼───────┐   ┌───────▼───────┐
│  Components   │   │ localStorage  │
└───────────────┘   └───────────────┘
```

### A.4 Storage Integration Diagram

```
┌───────────────┐    ┌────────────────┐
│ React State   │◀──▶│ useLocalStorage │
└───────┬───────┘    └────────┬───────┘
        │                     │
┌───────▼───────┐    ┌────────▼───────┐
│  Components   │    │  localStorage  │
└───────────────┘    └────────────────┘
```

## APPENDIX B: TECHNICAL DECISIONS

### B.1 React Hooks vs. Class Components

The application uses functional components with hooks instead of class components for several reasons:

1. **Simplicity and Readability**:
   - Hooks lead to more concise, easier-to-read code
   - Functional components are simpler to understand and maintain
   - Logic organization is more flexible with hooks

2. **Better Logic Reuse**:
   - Custom hooks enable reusing stateful logic between components
   - No need for higher-order components or render props patterns
   - Separation of concerns is more natural

3. **Reduced Boilerplate**:
   - No binding of event handlers in constructor
   - No need for this keyword, avoiding common pitfalls
   - Simpler lifecycle management

4. **Modern React Paradigm**:
   - Hooks represent React's current recommended approach
   - Better aligned with future React development
   - Growing ecosystem of hook-based libraries

### B.2 Context API vs. Redux

The application uses React's Context API instead of Redux for state management:

1. **Appropriate Complexity Level**:
   - Application state is relatively simple
   - No complex state interactions or middleware requirements
   - Context API provides sufficient functionality without overhead

2. **Built-in Solution**:
   - No additional dependencies required
   - Simplifies the build and reduces bundle size
   - Easier learning curve for developers

3. **Component-Centric Approach**:
   - State closely tied to component hierarchy
   - Natural integration with React's rendering model
   - Fits well with the component-based architecture

4. **Future Scalability**:
   - Can be incrementally replaced with Redux if needed
   - Easy migration path as application complexity grows
   - Good starting point for evaluating actual state management needs

### B.3 localStorage vs. IndexedDB

The application uses localStorage for persistence instead of IndexedDB:

1. **Simplicity and Ease of Use**:
   - Simple, synchronous API requiring minimal setup
   - No complex transaction or cursor management
   - Direct key-value storage model fits the application needs

2. **Sufficient Storage Capacity**:
   - 5-10MB limit sufficient for typical todo list usage
   - Simple text-based tasks have minimal storage requirements
   - No need for binary data storage (e.g., images, files)

3. **Broad Browser Support**:
   - Excellent compatibility across browsers
   - Minimal polyfill requirements
   - Consistent implementation across platforms

4. **Performance Considerations**:
   - Fast access for small datasets
   - Synchronous API simplifies state management
   - Adequate performance for the application's needs

Future versions might migrate to IndexedDB for:
- Larger storage capacity
- Structured data queries
- Better performance with large datasets
- Background synchronization capabilities

### B.4 CSS Modules vs. Styled Components

The application uses CSS Modules for styling:

1. **Simplicity and Familiarity**:
   - Uses standard CSS syntax
   - Easier to understand for developers familiar with CSS
   - No additional syntax or abstractions to learn

2. **Build-Time Processing**:
   - Styles processed at build time rather than runtime
   - No runtime style injection overhead
   - Potentially better performance

3. **Isolation Benefits**:
   - Local class name scoping prevents style conflicts
   - Explicit composition model
   - Clear separation of styles and components

4. **Tool Compatibility**:
   - Works well with existing CSS tools and linters
   - Easier integration with design systems
   - Direct support in Create React App

This approach combines the benefits of component-scoped CSS while maintaining the familiarity and tooling of traditional CSS.