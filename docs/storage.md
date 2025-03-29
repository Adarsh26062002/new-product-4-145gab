# React Todo List: Storage Implementation

## 1. STORAGE OVERVIEW

The React Todo List application implements a client-side storage strategy that enables task persistence without requiring a backend server. This document provides a comprehensive explanation of the storage implementation, focusing on data structures, error handling, and optimization techniques.

### 1.1 Storage Strategy

The application employs the browser's localStorage API as its primary storage mechanism. This client-side only approach was selected for several key reasons:

- **Simplicity**: localStorage offers a straightforward key-value storage API that requires minimal setup
- **No Backend Dependency**: Eliminates the need for server infrastructure, reducing complexity and cost
- **Cross-Session Persistence**: Data remains available between browser sessions, supporting the core requirement for task persistence
- **Broad Browser Support**: The localStorage API is supported by all modern browsers
- **Zero Configuration**: Users don't need to create accounts or perform complex setup procedures

The localStorage API stores data as string key-value pairs, requiring serialization and deserialization of application data. The application uses JSON as the serialization format for its simplicity and native browser support.

### 1.2 Integration with Application Architecture

Storage functionality is tightly integrated with the application's state management system, creating a seamless flow of data between the user interface and persistent storage.

The storage implementation follows these architectural principles:

1. **Separation of Concerns**: Storage logic is encapsulated in dedicated service modules and hooks
2. **Unidirectional Data Flow**: Changes flow from UI events → State updates → Storage operations
3. **Abstraction**: Components interact with storage through abstractions that hide implementation details
4. **Error Resilience**: Storage failures are handled gracefully to maintain application functionality

Within the application architecture, storage serves as the persistence layer that maintains state across sessions:

```
React Components → State Management → Storage Layer → Browser localStorage
```

This integration ensures that user actions that modify the task list are automatically persisted, creating a seamless experience where users can exit and return to find their tasks preserved.

### 1.3 Key Benefits and Limitations

**Benefits of the localStorage Approach:**

- **Zero Infrastructure**: No server setup or maintenance required
- **Offline Capability**: Application functions without internet connectivity
- **Privacy**: Data remains on the user's device
- **Performance**: Synchronous API with minimal overhead for small datasets
- **Simplicity**: Straightforward implementation with native browser API

**Limitations:**

- **Storage Capacity**: localStorage is typically limited to 5-10MB per domain
- **Single-Device**: Data remains on a single browser/device with no synchronization
- **Browser Control**: Users can clear localStorage manually or through privacy settings
- **String-Only Storage**: Requires serialization of complex data structures
- **No Query Capabilities**: Limited to basic key-value operations without advanced querying

Despite these limitations, localStorage provides an optimal solution for the application's current requirements, balancing simplicity with functionality while avoiding unnecessary complexity.

## 2. STORAGE IMPLEMENTATION

This section details the core components of the storage implementation, explaining both the low-level utility functions and the React integration through custom hooks.

### 2.1 LocalStorageService

The `LocalStorageService` acts as the application's abstraction layer over the browser's localStorage API. It provides utility functions for common storage operations while adding error handling, type safety, and serialization features.

**Key Functions:**

1. **saveData**: Saves data to localStorage with serialization and error handling
   ```typescript
   function saveData<T>(key: string, data: T): boolean {
     try {
       const serializedData = JSON.stringify(data);
       localStorage.setItem(key, serializedData);
       return true;
     } catch (error) {
       console.error(`Error saving data to localStorage: ${error}`);
       return false;
     }
   }
   ```

2. **loadData**: Retrieves and deserializes data from localStorage
   ```typescript
   function loadData<T>(key: string, defaultValue: T): T {
     try {
       const serializedData = localStorage.getItem(key);
       if (serializedData === null) {
         return defaultValue;
       }
       return JSON.parse(serializedData) as T;
     } catch (error) {
       console.error(`Error loading data from localStorage: ${error}`);
       return defaultValue;
     }
   }
   ```

3. **removeData**: Removes data for a specific key
   ```typescript
   function removeData(key: string): boolean {
     try {
       localStorage.removeItem(key);
       return true;
     } catch (error) {
       console.error(`Error removing data from localStorage: ${error}`);
       return false;
     }
   }
   ```

4. **clearAllData**: Clears all application data
   ```typescript
   function clearAllData(): boolean {
     try {
       // Only clear keys related to the application
       const appKeys = Object.keys(localStorage).filter(
         key => key.startsWith('react-todo-list-')
       );
       appKeys.forEach(key => localStorage.removeItem(key));
       return true;
     } catch (error) {
       console.error(`Error clearing data from localStorage: ${error}`);
       return false;
     }
   }
   ```

5. **isStorageAvailable**: Checks if localStorage is available in the current environment
   ```typescript
   function isStorageAvailable(): boolean {
     try {
       const testKey = '__storage_test__';
       localStorage.setItem(testKey, testKey);
       localStorage.removeItem(testKey);
       return true;
     } catch (e) {
       return false;
     }
   }
   ```

The service handles common errors such as:
- Storage quota exceeded errors
- Invalid JSON format errors
- Storage access denied errors (e.g., in private browsing)
- Unavailable storage errors

### 2.2 useLocalStorage Hook

The `useLocalStorage` custom hook bridges React's state management with localStorage persistence, providing a seamless way for components to maintain state across sessions.

```typescript
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    return LocalStorageService.loadData(key, initialValue);
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = useCallback((value: T) => {
    try {
      // Save state
      setStoredValue(value);
      // Save to localStorage
      LocalStorageService.saveData(key, value);
    } catch (error) {
      console.error(`Error setting localStorage value: ${error}`);
    }
  }, [key]);

  return [storedValue, setValue];
}
```

This hook provides several advantages:
- Lazy initialization that loads from storage only on component mount
- Automatic synchronization between React state and localStorage
- Consistent error handling for storage operations
- Type safety through TypeScript generics
- Familiar API that mirrors React's useState hook

### 2.3 Integration with State Management

The storage implementation integrates with the application's state management through the `useTodoList` hook and `TodoContext`, which leverage `useLocalStorage` to persist application state.

**useTodoList Hook:**

This custom hook manages the todo list state and provides functions for task operations, all with built-in persistence:

```typescript
function useTodoList() {
  // Use the custom localStorage hook for tasks
  const [tasks, setTasks] = useLocalStorage<Task[]>('react-todo-list-tasks', []);
  
  // Add a task with localStorage persistence
  const addTask = useCallback((text: string, priority: Priority = 'MEDIUM') => {
    const newTask: Task = {
      id: generateId(),
      text,
      completed: false,
      priority,
      createdAt: Date.now()
    };
    
    setTasks([...tasks, newTask]);
  }, [tasks, setTasks]);
  
  // Other task operations (toggleTask, deleteTask, editTask)
  // All of which automatically persist changes through setTasks
  
  return {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    editTask
  };
}
```

**TodoContext:**

The application uses React Context to provide global access to the todo list state and operations:

```typescript
const TodoContext = createContext<TodoContextType | undefined>(undefined);

export function TodoProvider({ children }: { children: React.ReactNode }) {
  const todoList = useTodoList();
  const [filter, setFilter] = useLocalStorage<FilterType>('react-todo-list-filter', 'ALL');
  
  // Derive filtered tasks based on current filter
  const filteredTasks = useMemo(() => {
    switch(filter) {
      case 'ACTIVE':
        return todoList.tasks.filter(task => !task.completed);
      case 'COMPLETED':
        return todoList.tasks.filter(task => task.completed);
      default:
        return todoList.tasks;
    }
  }, [todoList.tasks, filter]);
  
  const value = {
    ...todoList,
    filteredTasks,
    filter,
    setFilter
  };
  
  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
}
```

This integration ensures that all task operations automatically persist changes to localStorage, making the application's state durable across sessions without requiring explicit save actions from the user.

## 3. DATA STRUCTURES

This section documents the data structures used for storage, including their formats, properties, and relationships.

### 3.1 Task Data Structure

The primary data structure in the application is the Task interface, which represents an individual todo item:

```typescript
interface Task {
  id: string;            // Unique identifier
  text: string;          // Task description
  completed: boolean;    // Completion status
  priority: Priority;    // Task priority (HIGH, MEDIUM, LOW)
  createdAt: number;     // Creation timestamp (milliseconds)
}

type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
```

**Properties Explained:**

- **id**: A unique string identifier generated when the task is created, typically using a combination of timestamp and random values to ensure uniqueness
- **text**: The user-provided description of the task
- **completed**: A boolean flag indicating whether the task has been marked as complete
- **priority**: An enumerated value representing the task's priority level
- **createdAt**: A timestamp (milliseconds since epoch) recording when the task was created, useful for sorting and future date-based features

Tasks are stored as an array in localStorage, allowing for ordered presentation and efficient operations:

```json
[
  {
    "id": "task-1623456789",
    "text": "Complete React project",
    "completed": false,
    "priority": "HIGH",
    "createdAt": 1623456789000
  },
  {
    "id": "task-1623456790",
    "text": "Buy groceries",
    "completed": true,
    "priority": "MEDIUM",
    "createdAt": 1623456790000
  }
]
```

### 3.2 Filter Data Structure

The application also stores the user's filter preference to maintain the view state across sessions:

```typescript
type FilterType = 'ALL' | 'ACTIVE' | 'COMPLETED';
```

This simple string enumeration is stored directly in localStorage as:

```
"ALL" | "ACTIVE" | "COMPLETED"
```

The filter determines which subset of tasks is displayed to the user:
- `ALL`: Shows all tasks regardless of completion status
- `ACTIVE`: Shows only incomplete tasks (where `completed` is `false`)
- `COMPLETED`: Shows only completed tasks (where `completed` is `true`)

### 3.3 Storage Keys

The application uses consistent key naming to organize and access stored data:

| Key | Purpose | Type | Default Value |
|-----|---------|------|--------------|
| `react-todo-list-tasks` | Stores the array of task objects | Task[] | [] |
| `react-todo-list-filter` | Stores the current filter selection | FilterType | "ALL" |
| `react-todo-list-version` | Stores the application version for data migrations | string | "1.0.0" |

This consistent prefix (`react-todo-list-`) serves several purposes:
- Prevents collision with other applications using localStorage on the same domain
- Enables selective clearing of application data without affecting other applications
- Provides clear identification of data ownership

### 3.4 Data Serialization

Since localStorage only supports string values, all data structures must be serialized when saving and deserialized when loading:

**Serialization Process:**
1. Convert JavaScript objects to JSON strings using `JSON.stringify()`
2. Store the resulting string in localStorage

**Deserialization Process:**
1. Retrieve the string value from localStorage
2. Parse the JSON string back to JavaScript objects using `JSON.parse()`
3. Type-cast the resulting value to the expected type (with TypeScript)

**Example:**
```typescript
// Serialization
const tasks: Task[] = [/* task objects */];
const serializedTasks = JSON.stringify(tasks);
localStorage.setItem('react-todo-list-tasks', serializedTasks);

// Deserialization
const serializedTasks = localStorage.getItem('react-todo-list-tasks');
const tasks: Task[] = serializedTasks ? JSON.parse(serializedTasks) : [];
```

The application handles serialization edge cases, including:
- `undefined` values (converted to `null` in JSON)
- Circular references (avoided in data structures)
- Special data types like `Date` objects (stored as timestamps)

## 4. ERROR HANDLING

Robust error handling is critical for a reliable storage implementation. This section details the application's approach to detecting and recovering from storage-related errors.

### 4.1 Storage Availability Detection

The application proactively checks whether localStorage is available in the current browser environment before attempting operations. This handles scenarios like:

- Private browsing modes with restricted storage
- Browsers with localStorage disabled
- Excessive storage quota usage

**Detection Implementation:**

```typescript
function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}
```

This function attempts a test write and read operation, catching any exceptions that indicate storage is unavailable. The application calls this function during initialization and before critical storage operations.

### 4.2 Error Recovery

When storage operations fail, the application implements several recovery strategies:

**1. Default Values:**
The `loadData` function includes a default value parameter that's returned when data can't be retrieved:

```typescript
function loadData<T>(key: string, defaultValue: T): T {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData) as T;
  } catch (error) {
    console.error(`Error loading data from localStorage: ${error}`);
    return defaultValue;
  }
}
```

**2. Retry Mechanism:**
For transient errors, the application implements an exponential backoff retry mechanism:

```typescript
async function saveDataWithRetry<T>(
  key: string, 
  data: T, 
  maxRetries = 3, 
  delayMs = 100
): Promise<boolean> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        console.error(`Failed to save data after ${maxRetries} attempts`);
        return false;
      }
      
      // Wait with exponential backoff before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, retries - 1)));
    }
  }
  
  return false;
}
```

**3. Data Validation:**
The application validates data after retrieval to detect corruption:

```typescript
function loadTasksWithValidation(): Task[] {
  try {
    const serializedTasks = localStorage.getItem('react-todo-list-tasks');
    if (!serializedTasks) return [];
    
    const parsedData = JSON.parse(serializedTasks);
    
    // Validate that the data is an array
    if (!Array.isArray(parsedData)) {
      console.error('Corrupted task data: not an array');
      return [];
    }
    
    // Validate each task object has required properties
    const validTasks = parsedData.filter(task => 
      typeof task === 'object' &&
      task !== null &&
      typeof task.id === 'string' &&
      typeof task.text === 'string' &&
      typeof task.completed === 'boolean'
    );
    
    // If data was partially corrupted, save the valid subset
    if (validTasks.length !== parsedData.length) {
      console.warn('Some tasks were corrupted and have been filtered out');
      saveData('react-todo-list-tasks', validTasks);
    }
    
    return validTasks;
  } catch (error) {
    console.error('Failed to load tasks:', error);
    return [];
  }
}
```

### 4.3 Graceful Degradation

When localStorage is completely unavailable, the application degrades gracefully to maintain core functionality:

1. **In-Memory Only Mode:**
   The application falls back to using only in-memory state, maintaining functionality for the current session without persistence.

2. **Feature Limitation Indicators:**
   Users are notified that their data won't persist between sessions with a non-intrusive warning.

3. **Periodic Availability Checks:**
   The application periodically rechecks storage availability to recover if conditions change.

```typescript
function useDegradableStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Check if storage is available
  const storageAvailable = isStorageAvailable();
  
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (storageAvailable) {
      return LocalStorageService.loadData(key, initialValue);
    }
    return initialValue;
  });
  
  // If storage wasn't available initially, periodically recheck
  useEffect(() => {
    if (!storageAvailable) {
      const checkInterval = setInterval(() => {
        if (isStorageAvailable()) {
          // Storage is now available, save current state
          LocalStorageService.saveData(key, storedValue);
          clearInterval(checkInterval);
        }
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(checkInterval);
    }
  }, [key, storedValue, storageAvailable]);

  // Return a wrapped version of useState's setter function
  const setValue = useCallback((value: T) => {
    // Save state
    setStoredValue(value);
    
    // Only attempt localStorage if it's available
    if (storageAvailable) {
      LocalStorageService.saveData(key, value);
    }
  }, [key, storageAvailable]);

  return [storedValue, setValue];
}
```

### 4.4 User Feedback

The application communicates storage issues to users through a dedicated notification system:

1. **Storage Error Banner:**
   A non-blocking notification appears when persistent storage is unavailable, explaining the limitation.

2. **Dismissible Warnings:**
   Users can acknowledge and dismiss warnings while continuing to use the application.

3. **Recovery Notifications:**
   If storage becomes available again, users receive a positive notification indicating that persistence has been restored.

```tsx
function StorageStatusNotification() {
  const [storageAvailable, setStorageAvailable] = useState(isStorageAvailable());
  const [dismissed, setDismissed] = useState(false);
  
  // Periodically check storage availability
  useEffect(() => {
    if (!storageAvailable) {
      const checkInterval = setInterval(() => {
        const available = isStorageAvailable();
        setStorageAvailable(available);
        if (available) clearInterval(checkInterval);
      }, 10000);
      
      return () => clearInterval(checkInterval);
    }
  }, [storageAvailable]);
  
  if (storageAvailable || dismissed) return null;
  
  return (
    <div className="storage-notification error">
      <p>
        <strong>Note:</strong> Local storage is not available. Your tasks will not be saved between sessions.
      </p>
      <button onClick={() => setDismissed(true)}>Dismiss</button>
    </div>
  );
}
```

This component integrates into the main App component, providing contextual feedback without disrupting the user experience.

## 5. STORAGE OPTIMIZATION

This section covers techniques employed to optimize localStorage usage, balancing persistence needs with browser limitations.

### 5.1 Storage Size Management

localStorage typically has a 5-10MB limit per domain, necessitating careful management of storage size:

**1. Minimal Data Structure:**
The application uses a compact task representation, storing only essential properties:

```typescript
interface Task {
  id: string;            // Short unique identifier
  text: string;          // Task description
  completed: boolean;    // Completion status (true/false)
  priority: Priority;    // Enum value as string
  createdAt: number;     // Unix timestamp
}
```

This optimized structure avoids redundant data while maintaining all necessary functionality.

**2. Storage Quota Monitoring:**
The application tracks approximate storage usage to prevent quota exceeded errors:

```typescript
function getStorageUsage(): { bytesUsed: number, percentUsed: number } {
  try {
    let totalSize = 0;
    const appPrefix = 'react-todo-list-';
    
    // Calculate size of all application items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(appPrefix)) {
        const value = localStorage.getItem(key) || '';
        totalSize += key.length + value.length;
      }
    }
    
    // Convert to bytes (2 bytes per character in UTF-16)
    const bytesUsed = totalSize * 2;
    
    // Estimate quota (5MB is a conservative estimate)
    const estimatedQuota = 5 * 1024 * 1024;
    const percentUsed = (bytesUsed / estimatedQuota) * 100;
    
    return { bytesUsed, percentUsed };
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    return { bytesUsed: 0, percentUsed: 0 };
  }
}
```

**3. Automated Task Pruning:**
When approaching storage limits, the application can automatically archive or remove old completed tasks:

```typescript
function pruneTasksIfNeeded(tasks: Task[], thresholdPercent = 80): Task[] {
  const { percentUsed } = getStorageUsage();
  
  if (percentUsed > thresholdPercent) {
    console.warn(`Storage usage high (${percentUsed.toFixed(1)}%), pruning old completed tasks`);
    
    // Sort tasks by completion status and date
    const sortedTasks = [...tasks].sort((a, b) => {
      // Keep all incomplete tasks
      if (!a.completed && b.completed) return -1;
      if (a.completed && !b.completed) return 1;
      
      // For completed tasks, sort by creation date (oldest first)
      if (a.completed && b.completed) {
        return a.createdAt - b.createdAt;
      }
      
      return 0;
    });
    
    // Calculate how many tasks to remove (25% of completed tasks)
    const completedTasks = sortedTasks.filter(t => t.completed);
    const tasksToRemove = Math.ceil(completedTasks.length * 0.25);
    
    if (tasksToRemove > 0) {
      // Remove oldest completed tasks
      const prunedTasks = sortedTasks.filter((task, index) => {
        if (!task.completed) return true;
        const completedIndex = completedTasks.indexOf(task);
        return completedIndex >= tasksToRemove;
      });
      
      return prunedTasks;
    }
  }
  
  // No pruning needed
  return tasks;
}
```

### 5.2 Performance Considerations

While localStorage operations are generally fast, optimizing for performance ensures a smooth user experience:

**1. Batch Updates:**
The application batches multiple task changes into a single localStorage update:

```typescript
function batchUpdateTasks(operations: Array<(tasks: Task[]) => Task[]>): Task[] {
  const currentTasks = loadData<Task[]>('react-todo-list-tasks', []);
  
  // Apply all operations sequentially
  const updatedTasks = operations.reduce(
    (tasks, operation) => operation(tasks),
    currentTasks
  );
  
  // Single save operation
  saveData('react-todo-list-tasks', updatedTasks);
  
  return updatedTasks;
}

// Example usage
batchUpdateTasks([
  tasks => [...tasks, newTask],                    // Add task
  tasks => tasks.filter(t => t.id !== taskToDeleteId) // Delete task
]);
```

**2. Debounced Storage:**
For frequent updates, the application uses debounced storage to prevent excessive write operations:

```typescript
function useDebouncedStorage<T>(key: string, initialValue: T, delay = 500): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    return LocalStorageService.loadData(key, initialValue);
  });
  
  // Use useRef for the timeout
  const timeoutRef = useRef<number | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  
  // Create a debounced setter
  const debouncedSetValue = useCallback((newValue: T) => {
    // Update state immediately
    setValue(newValue);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for storage operation
    timeoutRef.current = window.setTimeout(() => {
      LocalStorageService.saveData(key, newValue);
      timeoutRef.current = null;
    }, delay);
  }, [key, delay]);
  
  return [value, debouncedSetValue];
}
```

**3. Memoized Selectors:**
The application uses memoization to avoid unnecessary recalculations of derived data:

```typescript
const useFilteredTasks = (tasks: Task[], filter: FilterType) => {
  return useMemo(() => {
    switch(filter) {
      case 'ACTIVE':
        return tasks.filter(task => !task.completed);
      case 'COMPLETED':
        return tasks.filter(task => task.completed);
      default:
        return tasks;
    }
  }, [tasks, filter]);
};
```

### 5.3 Storage Monitoring

The application implements storage monitoring to detect and prevent issues:

**1. Usage Tracking:**
A monitoring system tracks localStorage usage and provides warnings when approaching limits:

```typescript
function StorageMonitor({ warningThreshold = 70 }) {
  const [usage, setUsage] = useState({ bytesUsed: 0, percentUsed: 0 });
  
  // Update usage periodically
  useEffect(() => {
    const calculateUsage = () => {
      const newUsage = getStorageUsage();
      setUsage(newUsage);
    };
    
    // Calculate initial usage
    calculateUsage();
    
    // Update every minute
    const interval = setInterval(calculateUsage, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Show warning when approaching limit
  if (usage.percentUsed > warningThreshold) {
    return (
      <div className="storage-warning">
        <p>
          <strong>Warning:</strong> Storage usage is high ({usage.percentUsed.toFixed(1)}%).
          Consider removing unnecessary tasks.
        </p>
      </div>
    );
  }
  
  return null;
}
```

**2. Automatic Recovery:**
The application implements recovery mechanisms for storage corruption:

```typescript
function ensureValidStorage() {
  try {
    // Check tasks
    const tasksData = localStorage.getItem('react-todo-list-tasks');
    if (tasksData) {
      try {
        const parsed = JSON.parse(tasksData);
        if (!Array.isArray(parsed)) {
          throw new Error('Tasks data is not an array');
        }
      } catch {
        console.warn('Corrupted tasks data detected, resetting');
        localStorage.setItem('react-todo-list-tasks', '[]');
      }
    }
    
    // Check filter
    const filterData = localStorage.getItem('react-todo-list-filter');
    if (filterData) {
      const validFilters = ['ALL', 'ACTIVE', 'COMPLETED'];
      if (!validFilters.includes(filterData)) {
        console.warn('Invalid filter value detected, resetting');
        localStorage.setItem('react-todo-list-filter', 'ALL');
      }
    }
  } catch (error) {
    console.error('Error during storage validation:', error);
  }
}
```

**3. Storage Event Listeners:**
The application listens for storage events to detect changes made in other tabs:

```typescript
function useStorageSync<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return LocalStorageService.loadData(key, initialValue);
  });
  
  // Listen for changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          const newValue = JSON.parse(event.newValue) as T;
          setStoredValue(newValue);
        } catch (error) {
          console.error(`Error parsing storage change: ${error}`);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);
  
  // Update function
  const setValue = useCallback((value: T) => {
    setStoredValue(value);
    LocalStorageService.saveData(key, value);
  }, [key]);
  
  return [storedValue, setValue];
}
```

## 6. STORAGE OPERATIONS

This section provides a detailed explanation of key storage operations in the application, focusing on data flow and implementation details.

### 6.1 Task Persistence Flow

The task persistence flow encompasses the complete lifecycle of tasks in storage, from creation to deletion:

**1. Initial Loading:**
When the application starts, it loads existing tasks from localStorage:

```typescript
function initializeTasksFromStorage(): Task[] {
  // Attempt to load tasks
  const savedTasks = LocalStorageService.loadData<Task[]>('react-todo-list-tasks', []);
  
  // Validate and repair if necessary
  const validTasks = savedTasks.filter(task => (
    typeof task.id === 'string' &&
    typeof task.text === 'string' &&
    typeof task.completed === 'boolean'
  ));
  
  // If we filtered out invalid tasks, save the cleaned list
  if (validTasks.length !== savedTasks.length) {
    console.warn('Some tasks were invalid and have been removed');
    LocalStorageService.saveData('react-todo-list-tasks', validTasks);
  }
  
  return validTasks;
}
```

**2. Task Creation:**
When a user creates a new task, it's added to both state and localStorage:

```typescript
function addTask(text: string, priority: Priority = 'MEDIUM'): Task {
  // Create new task object
  const newTask: Task = {
    id: generateId(),
    text: text.trim(),
    completed: false,
    priority,
    createdAt: Date.now()
  };
  
  // Update state and storage in a single operation
  setTasks(currentTasks => {
    const updatedTasks = [...currentTasks, newTask];
    LocalStorageService.saveData('react-todo-list-tasks', updatedTasks);
    return updatedTasks;
  });
  
  return newTask;
}
```

**3. Task Update:**
Task modifications (completion toggling, text editing, priority changes) update both state and storage:

```typescript
function toggleTaskCompletion(taskId: string) {
  setTasks(currentTasks => {
    const updatedTasks = currentTasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    LocalStorageService.saveData('react-todo-list-tasks', updatedTasks);
    return updatedTasks;
  });
}

function editTaskText(taskId: string, newText: string) {
  setTasks(currentTasks => {
    const updatedTasks = currentTasks.map(task =>
      task.id === taskId ? { ...task, text: newText.trim() } : task
    );
    LocalStorageService.saveData('react-todo-list-tasks', updatedTasks);
    return updatedTasks;
  });
}

function updateTaskPriority(taskId: string, priority: Priority) {
  setTasks(currentTasks => {
    const updatedTasks = currentTasks.map(task =>
      task.id === taskId ? { ...task, priority } : task
    );
    LocalStorageService.saveData('react-todo-list-tasks', updatedTasks);
    return updatedTasks;
  });
}
```

**4. Task Deletion:**
When a user deletes a task, it's removed from both state and localStorage:

```typescript
function deleteTask(taskId: string) {
  setTasks(currentTasks => {
    const updatedTasks = currentTasks.filter(task => task.id !== taskId);
    LocalStorageService.saveData('react-todo-list-tasks', updatedTasks);
    return updatedTasks;
  });
}
```

**5. Bulk Operations:**
For efficiency, bulk operations like clearing completed tasks update storage once:

```typescript
function clearCompletedTasks() {
  setTasks(currentTasks => {
    const updatedTasks = currentTasks.filter(task => !task.completed);
    LocalStorageService.saveData('react-todo-list-tasks', updatedTasks);
    return updatedTasks;
  });
}
```

### 6.2 Filter Persistence Flow

The application also persists the user's filter preference to maintain a consistent view across sessions:

**1. Initial Loading:**
On application start, the stored filter preference is loaded:

```typescript
function initializeFilterFromStorage(): FilterType {
  const savedFilter = LocalStorageService.loadData<string>('react-todo-list-filter', 'ALL');
  
  // Validate that it's a valid filter type
  if (['ALL', 'ACTIVE', 'COMPLETED'].includes(savedFilter)) {
    return savedFilter as FilterType;
  }
  
  // Reset to default if invalid
  console.warn('Invalid filter value detected, resetting to ALL');
  LocalStorageService.saveData('react-todo-list-filter', 'ALL');
  return 'ALL';
}
```

**2. Filter Updates:**
When the user changes the filter, the preference is saved to localStorage:

```typescript
function setFilter(filter: FilterType) {
  // Update state
  setCurrentFilter(filter);
  
  // Persist preference
  LocalStorageService.saveData('react-todo-list-filter', filter);
}
```

This ensures the application reopens with the user's last-used filter selection, maintaining a consistent user experience.

### 6.3 Data Clearing

The application provides functionality to clear stored data, either selectively or completely:

**1. Clear All Tasks:**
Removes all tasks while maintaining other settings:

```typescript
function clearAllTasks() {
  // Clear tasks from state
  setTasks([]);
  
  // Clear tasks from storage
  LocalStorageService.saveData('react-todo-list-tasks', []);
}
```

**2. Clear Completed Tasks:**
Removes only completed tasks:

```typescript
function clearCompletedTasks() {
  setTasks(currentTasks => {
    const activeTasks = currentTasks.filter(task => !task.completed);
    LocalStorageService.saveData('react-todo-list-tasks', activeTasks);
    return activeTasks;
  });
}
```

**3. Reset Application:**
Resets the application to its initial state, clearing all application data:

```typescript
function resetApplication() {
  // Clear all application data
  LocalStorageService.clearAllData();
  
  // Reset state to defaults
  setTasks([]);
  setCurrentFilter('ALL');
}
```

**4. Export/Import Data:**
The application provides utilities to export and import data for backup or transfer:

```typescript
function exportData(): string {
  const appData = {
    tasks: LocalStorageService.loadData<Task[]>('react-todo-list-tasks', []),
    filter: LocalStorageService.loadData<FilterType>('react-todo-list-filter', 'ALL'),
    version: LocalStorageService.loadData<string>('react-todo-list-version', '1.0.0')
  };
  
  return JSON.stringify(appData);
}

function importData(jsonData: string): boolean {
  try {
    const appData = JSON.parse(jsonData);
    
    // Validate data structure
    if (!appData.tasks || !Array.isArray(appData.tasks)) {
      throw new Error('Invalid tasks data');
    }
    
    // Import data to localStorage
    LocalStorageService.saveData('react-todo-list-tasks', appData.tasks);
    
    if (appData.filter) {
      LocalStorageService.saveData('react-todo-list-filter', appData.filter);
    }
    
    if (appData.version) {
      LocalStorageService.saveData('react-todo-list-version', appData.version);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
}
```

## 7. BROWSER COMPATIBILITY

This section addresses browser compatibility considerations for the localStorage implementation.

### 7.1 Browser Support

localStorage enjoys broad support across modern browsers:

| Browser | Version Support | Notes |
|---------|----------------|-------|
| Chrome | 4+ | Full support |
| Firefox | 3.5+ | Full support |
| Safari | 4+ | Full support |
| Edge | 12+ | Full support |
| Internet Explorer | 8+ | Limited support in IE8 |
| Opera | 10.5+ | Full support |
| Mobile Chrome | All versions | Full support |
| Mobile Safari | All versions | Full support with limitations in private mode |
| Mobile Firefox | All versions | Full support |

**Implementation Strategy:**
The application uses feature detection rather than browser detection to ensure compatibility:

```typescript
function isLocalStorageSupported() {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    const result = localStorage.getItem(testKey) === testKey;
    localStorage.removeItem(testKey);
    return result;
  } catch (e) {
    return false;
  }
}
```

This approach accommodates all browsers with localStorage support regardless of version or platform.

### 7.2 Private Browsing Mode

Many browsers impose stricter limitations on localStorage in private browsing modes:

| Browser | Private Mode Behavior | Storage Limit |
|---------|----------------------|---------------|
| Safari | Throws exception on write | 0 (No storage) |
| Firefox | Writes to in-memory storage | Session only |
| Chrome | Normal functionality with separate store | 5-10MB |
| Edge | Normal functionality with separate store | 5-10MB |

**Handling Strategy:**
The application detects private mode limitations and adapts accordingly:

```typescript
function detectPrivateBrowsing(): Promise<boolean> {
  return new Promise(resolve => {
    try {
      // Try to use localStorage
      const testKey = `__private_test_${Date.now()}`;
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      
      // If we reach here in Safari private mode, it's not private
      // (other browsers won't throw in private mode)
      resolve(false);
    } catch (e) {
      // In Safari private mode, localStorage.setItem throws
      // This indicates private browsing
      resolve(true);
    }
  });
}

// Usage example
useEffect(() => {
  async function checkBrowsingMode() {
    const isPrivate = await detectPrivateBrowsing();
    if (isPrivate) {
      setStoragePersistent(false);
      setPrivateBrowsingDetected(true);
    }
  }
  
  checkBrowsingMode();
}, []);
```

When private browsing is detected, the application notifies users that their data may not persist between sessions and falls back to session-only operation.

### 7.3 Mobile Considerations

Mobile browsers have some specific considerations for localStorage:

**1. Storage Limits:**
Mobile browsers may have lower storage limits compared to desktop browsers, particularly on older or lower-end devices.

**2. Storage Clearing:**
Mobile browsers are more aggressive in clearing site data, especially when device storage runs low.

**3. Application Lifecycle:**
Mobile browsers may terminate background tabs/applications more aggressively, potentially interrupting storage operations.

**Mobile-Specific Implementation Strategies:**

```typescript
// Detect if running on mobile device
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Optimize storage for mobile
function optimizeStorageForMobile() {
  if (isMobileDevice()) {
    // More frequent saves for smaller batches of data
    // to reduce the risk of data loss on sudden termination
    setDebouncedSaveDelay(300);
    
    // More aggressive data pruning to manage storage constraints
    setPruningThreshold(60); // Lower threshold for mobile
    
    // Simplified data structure if needed
    setUseCompactTasks(true);
  }
}
```

For mobile browsers, the application implements:
- More frequent but smaller state saves to prevent data loss
- More aggressive monitoring of storage usage
- Optimized data structures to reduce storage requirements
- Clear user messaging about storage limitations

## 8. FUTURE ENHANCEMENTS

While the current localStorage implementation meets the application's immediate needs, several enhancements could improve functionality, performance, and user experience.

### 8.1 IndexedDB Migration

IndexedDB provides a more powerful alternative to localStorage with several advantages:

- **Larger Storage Capacity**: Typically 50MB-250MB vs. 5-10MB for localStorage
- **Complex Data Structures**: Support for indexes, multiple object stores, and transactions
- **Asynchronous API**: Better performance for large datasets
- **Better Concurrency**: Structured transaction model

**Potential Implementation:**

```typescript
// Simple IndexedDB wrapper service
class IndexedDBService {
  private dbName = 'react-todo-list-db';
  private version = 1;
  private db: IDBDatabase | null = null;
  
  async connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        resolve(false);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(true);
      };
      
      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        // Create object stores
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('completed', 'completed', { unique: false });
        taskStore.createIndex('createdAt', 'createdAt', { unique: false });
        
        db.createObjectStore('settings', { keyPath: 'key' });
      };
    });
  }
  
  async saveTasks(tasks: Task[]): Promise<boolean> {
    if (!this.db) await this.connect();
    if (!this.db) return false;
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction('tasks', 'readwrite');
      const store = transaction.objectStore('tasks');
      
      // Clear existing tasks
      store.clear();
      
      // Add all tasks
      for (const task of tasks) {
        store.add(task);
      }
      
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => resolve(false);
    });
  }
  
  async getTasks(): Promise<Task[]> {
    if (!this.db) await this.connect();
    if (!this.db) return [];
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction('tasks', 'readonly');
      const store = transaction.objectStore('tasks');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  }
  
  // Additional methods for settings, individual task operations, etc.
}
```

**Migration Strategy:**
A phased approach would allow smooth transition from localStorage to IndexedDB:

1. Dual-write phase: Write to both localStorage and IndexedDB
2. Read preference: Try IndexedDB first, fall back to localStorage
3. Complete migration: Use IndexedDB exclusively with localStorage as fallback

### 8.2 Offline Support

Service Workers could enhance the application's offline capabilities beyond simple data persistence:

**Benefits:**
- Full offline functionality
- Background synchronization
- Improved load performance
- Update notifications

**Implementation Approach:**

```typescript
// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('ServiceWorker registration successful');
    }).catch(error => {
      console.error('ServiceWorker registration failed:', error);
    });
  });
}

// Service worker implementation (sw.js)
const CACHE_NAME = 'react-todo-list-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  // Other assets
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Return cached response if found
      if (response) {
        return response;
      }
      
      // Clone the request
      const fetchRequest = event.request.clone();
      
      // Try network request
      return fetch(fetchRequest).then(response => {
        // Check for valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response
        const responseToCache = response.clone();
        
        // Cache the network response
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      });
    })
  );
});
```

This Service Worker implementation would cache application assets, enabling full offline functionality even when the network is unavailable.

### 8.3 Cloud Synchronization

Adding backend storage with synchronization would address the primary limitation of localStorage: single-device restriction.

**Implementation Approach:**

```typescript
class SyncService {
  private localStore: LocalStorageService;
  private apiClient: ApiClient;
  private syncInProgress = false;
  private lastSyncTime = 0;
  
  constructor() {
    this.localStore = new LocalStorageService();
    this.apiClient = new ApiClient();
  }
  
  // Push local changes to server
  async pushChanges(): Promise<boolean> {
    if (this.syncInProgress) return false;
    
    try {
      this.syncInProgress = true;
      
      // Get local data
      const tasks = this.localStore.loadData<Task[]>('react-todo-list-tasks', []);
      const lastSync = this.localStore.loadData<number>('last-sync-time', 0);
      
      // Get server changes since last sync
      const serverChanges = await this.apiClient.getChangesSince(lastSync);
      
      // Merge changes (this would need a more sophisticated merge algorithm)
      const mergedTasks = this.mergeTasks(tasks, serverChanges);
      
      // Save merged tasks locally
      this.localStore.saveData('react-todo-list-tasks', mergedTasks);
      
      // Push merged state to server
      await this.apiClient.updateTasks(mergedTasks);
      
      // Update last sync time
      const now = Date.now();
      this.lastSyncTime = now;
      this.localStore.saveData('last-sync-time', now);
      
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }
  
  // Merge local and server tasks
  private mergeTasks(localTasks: Task[], serverTasks: Task[]): Task[] {
    // This would require a proper merge algorithm considering
    // timestamps, conflict resolution, etc.
    // Simplified version:
    const taskMap = new Map<string, Task>();
    
    // Add all local tasks
    localTasks.forEach(task => taskMap.set(task.id, task));
    
    // Override with server tasks that are newer
    serverTasks.forEach(serverTask => {
      const localTask = taskMap.get(serverTask.id);
      
      if (!localTask || serverTask.updatedAt > localTask.updatedAt) {
        taskMap.set(serverTask.id, serverTask);
      }
    });
    
    return Array.from(taskMap.values());
  }
}
```

This synchronization service would enable cross-device access to tasks while maintaining offline capability through local storage.

### 8.4 Data Export/Import

Implementing data export and import functionality would provide users with backup options and data portability:

**Export Implementation:**

```typescript
function exportData() {
  try {
    // Collect all application data
    const appData = {
      tasks: LocalStorageService.loadData<Task[]>('react-todo-list-tasks', []),
      filter: LocalStorageService.loadData<FilterType>('react-todo-list-filter', 'ALL'),
      version: '1.0.0', // Application version
      exportDate: new Date().toISOString()
    };
    
    // Create JSON string
    const jsonData = JSON.stringify(appData, null, 2);
    
    // Create download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download element
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-list-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    return false;
  }
}
```

**Import Implementation:**

```tsx
function ImportDataComponent() {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Read file
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate data
      if (!data.tasks || !Array.isArray(data.tasks)) {
        throw new Error('Invalid backup file: missing tasks array');
      }
      
      // Import data
      LocalStorageService.saveData('react-todo-list-tasks', data.tasks);
      
      if (data.filter) {
        LocalStorageService.saveData('react-todo-list-filter', data.filter);
      }
      
      setSuccess(true);
      
      // Reload application to reflect changes
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Import failed:', error);
      setError('Failed to import data. Please ensure the file is a valid todo list backup.');
    } finally {
      setImporting(false);
    }
  };
  
  return (
    <div className="import-container">
      <h3>Import Data</h3>
      
      <input
        type="file"
        accept=".json"
        onChange={handleFileChange}
        disabled={importing}
      />
      
      {importing && <p>Importing data...</p>}
      {error && <p className="error">{error}</p>}
      {success && <p className="success">Data imported successfully! Reloading...</p>}
      
      <p className="note">
        Note: Importing data will replace your current tasks.
      </p>
    </div>
  );
}
```

These features would enhance data portability and provide users with backup and recovery options.

## APPENDIX A: STORAGE CODE EXAMPLES

### A.1 LocalStorageService Usage

**Basic Storage Operations:**

```typescript
// Import the service
import { LocalStorageService } from './services/localStorage';

// Save data
const tasks = [
  { id: 'task-1', text: 'Learn React', completed: false, priority: 'HIGH', createdAt: Date.now() }
];
LocalStorageService.saveData('react-todo-list-tasks', tasks);

// Load data with default value
const savedTasks = LocalStorageService.loadData('react-todo-list-tasks', []);

// Check if storage is available
if (LocalStorageService.isStorageAvailable()) {
  // Perform storage operations
} else {
  // Show warning and use in-memory fallback
}

// Remove specific data
LocalStorageService.removeData('react-todo-list-tasks');

// Clear all application data
LocalStorageService.clearAllData();
```

**Error Handling Example:**

```typescript
// Save with error handling
function saveTasksWithRetry(tasks: Task[], maxRetries = 3): boolean {
  let retries = 0;
  
  while (retries < maxRetries) {
    const success = LocalStorageService.saveData('react-todo-list-tasks', tasks);
    
    if (success) {
      return true;
    }
    
    retries++;
    console.warn(`Save attempt ${retries} failed, retrying...`);
  }
  
  console.error(`Failed to save tasks after ${maxRetries} attempts`);
  return false;
}

// Load with validation
function loadTasksWithValidation(): Task[] {
  const tasks = LocalStorageService.loadData<Task[]>('react-todo-list-tasks', []);
  
  // Validate each task has required properties
  const validTasks = tasks.filter(task => (
    task &&
    typeof task.id === 'string' &&
    typeof task.text === 'string' &&
    typeof task.completed === 'boolean'
  ));
  
  // If we filtered out any tasks, save the valid subset
  if (validTasks.length !== tasks.length) {
    console.warn(`Found ${tasks.length - validTasks.length} invalid tasks, removing them`);
    LocalStorageService.saveData('react-todo-list-tasks', validTasks);
  }
  
  return validTasks;
}
```

### A.2 useLocalStorage Hook Usage

**Basic Hook Usage:**

```tsx
import { useLocalStorage } from './hooks/useLocalStorage';

function TaskList() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('react-todo-list-tasks', []);
  
  const addTask = (text: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      text,
      completed: false,
      priority: 'MEDIUM',
      createdAt: Date.now()
    };
    
    setTasks([...tasks, newTask]);
  };
  
  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };
  
  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };
  
  return (
    <div>
      {tasks.map(task => (
        <div key={task.id}>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => toggleTask(task.id)}
          />
          <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
            {task.text}
          </span>
          <button onClick={() => deleteTask(task.id)}>Delete</button>
        </div>
      ))}
      <button onClick={() => addTask('New Task')}>Add Task</button>
    </div>
  );
}
```

**Using with Multiple Values:**

```tsx
function AppSettings() {
  const [filter, setFilter] = useLocalStorage<FilterType>('react-todo-list-filter', 'ALL');
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('react-todo-list-theme', 'light');
  const [sortOrder, setSortOrder] = useLocalStorage<'asc' | 'desc'>('react-todo-list-sort', 'asc');
  
  return (
    <div>
      <div>
        <h3>Filter</h3>
        <select value={filter} onChange={e => setFilter(e.target.value as FilterType)}>
          <option value="ALL">All</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>
      
      <div>
        <h3>Theme</h3>
        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
        </button>
      </div>
      
      <div>
        <h3>Sort Order</h3>
        <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
          {sortOrder === 'asc' ? 'Newest First' : 'Oldest First'}
        </button>
      </div>
    </div>
  );
}
```

### A.3 Error Handling Examples

**Storage Availability Check:**

```tsx
function StorageWarning() {
  const [storageAvailable, setStorageAvailable] = useState(true);
  
  useEffect(() => {
    // Check storage availability
    const checkStorage = () => {
      try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        setStorageAvailable(true);
      } catch (e) {
        setStorageAvailable(false);
      }
    };
    
    checkStorage();
    
    // Recheck periodically in case conditions change
    const interval = setInterval(checkStorage, 30000);
    return () => clearInterval(interval);
  }, []);
  
  if (storageAvailable) {
    return null;
  }
  
  return (
    <div className="storage-warning">
      <p>
        <strong>Warning:</strong> Local storage is not available in your browser.
        Your tasks will not be saved between sessions.
      </p>
    </div>
  );
}
```

**Quota Exceeded Handling:**

```tsx
function saveWithQuotaHandling<T>(key: string, data: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    // Check if it's a quota exceeded error
    if (isQuotaExceededError(error)) {
      // Try to free up space by removing old data
      const freed = attemptStorageCleanup();
      
      if (freed) {
        // Try again after cleanup
        try {
          localStorage.setItem(key, JSON.stringify(data));
          return true;
        } catch {
          // Still failed after cleanup
          return false;
        }
      }
      
      return false;
    }
    
    // Other error
    console.error('Storage error:', error);
    return false;
  }
}

function isQuotaExceededError(error: any): boolean {
  return (
    error instanceof DOMException &&
    // Firefox
    (error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
     // Chrome
     error.name === 'QuotaExceededError' ||
     // Safari
     error.name === 'QUOTA_EXCEEDED_ERR')
  );
}

function attemptStorageCleanup(): boolean {
  try {
    // Find old completed tasks and remove them
    const tasks = JSON.parse(localStorage.getItem('react-todo-list-tasks') || '[]');
    const completedTasks = tasks.filter((t: Task) => t.completed);
    
    // Sort by creation date (oldest first)
    completedTasks.sort((a: Task, b: Task) => a.createdAt - b.createdAt);
    
    // Remove the oldest 25% of completed tasks
    const tasksToRemove = Math.ceil(completedTasks.length * 0.25);
    const tasksToRemoveIds = new Set(
      completedTasks.slice(0, tasksToRemove).map((t: Task) => t.id)
    );
    
    // Filter out the tasks to remove
    const remainingTasks = tasks.filter((t: Task) => !tasksToRemoveIds.has(t.id));
    
    // Save the reduced task list
    localStorage.setItem('react-todo-list-tasks', JSON.stringify(remainingTasks));
    
    console.log(`Removed ${tasksToRemove} old completed tasks to free up storage space`);
    return true;
  } catch (error) {
    console.error('Failed to clean up storage:', error);
    return false;
  }
}
```

## APPENDIX B: STORAGE DIAGRAMS

### B.1 Storage Integration Diagram

The storage layer integrates with the application architecture as follows:

```
User Interface Components <--> State Management <--> LocalStorage Hooks <--> LocalStorageService <--> Browser Storage
```

### B.2 Data Flow Diagram

1. **Initial Loading:**
   - App initializes
   - LocalStorageService loads data from browser storage
   - Data is parsed and validated
   - State management is initialized with loaded data
   - UI renders initial state

2. **State Updates:**
   - User interacts with UI (creates/edits/deletes tasks)
   - Component handlers update application state
   - State changes trigger storage updates via useLocalStorage hook
   - LocalStorageService serializes and saves data
   - Browser persists data to localStorage

3. **Error Handling:**
   - Storage operation fails
   - Error is caught by LocalStorageService
   - Application continues with in-memory state
   - User is notified of persistence issues
   - Periodic retries attempt to restore persistence

### B.3 Error Handling Flow Diagram

1. **Storage Operation Initiated**
2. **Check Storage Availability**
   - If available: Continue with operation
   - If unavailable: Enter fallback mode, notify user

3. **Attempt Storage Operation**
   - If successful: Operation complete
   - If failed: Identify error type

4. **Error Type Handling**
   - Quota exceeded: Clean up old data, retry operation
   - Parse error: Reset to default state
   - Access denied: Check for private browsing mode
   - Other errors: Apply generic error handling

5. **Recovery Strategies**
   - In-memory fallback: Continue operating without persistence
   - Periodic availability checks: Monitor for storage availability
   - Data validation: Prevent corruption and ensure data integrity
   - User notification: Provide clear feedback on storage issues