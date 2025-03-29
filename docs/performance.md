---
title: React Todo List - Performance Guide
---

## Introduction

This document provides comprehensive documentation of performance considerations, optimization techniques, and best practices for the React Todo List application. While the application is relatively simple, implementing proper performance optimizations ensures a smooth user experience even as task lists grow and usage patterns evolve.

## 1. PERFORMANCE OVERVIEW

The React Todo List application follows a performance-first approach to ensure a responsive user experience across devices and usage patterns. This section outlines the key performance considerations and targets.

### 1.1 Performance Goals

The application aims to meet the following performance targets:

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Initial Load Time | < 2 seconds | Lighthouse, Performance API |
| Time to Interactive | < 3 seconds | Lighthouse |
| Input Response Time | < 100ms | Performance API timing |
| Rendering Performance | 60fps | Chrome DevTools Performance panel |
| Memory Usage | < 50MB | Chrome DevTools Memory panel |

These targets ensure the application remains responsive and efficient across various devices and network conditions.

### 1.2 Performance Challenges

Despite being a relatively simple application, several performance challenges need to be addressed:

1. **Large Task Lists**: As users add more tasks, rendering performance could degrade
2. **localStorage Limitations**: Browser storage has size limits and synchronous API
3. **DOM Updates**: Frequent updates to the task list could cause performance issues
4. **Mobile Performance**: Limited resources on mobile devices require optimization
5. **Network Variability**: Users may access the application on slow or unreliable networks

The optimization strategies in this document address these challenges to ensure consistent performance.

### 1.3 Performance Monitoring

Performance is monitored through several approaches:

1. **Development Monitoring**:
   - React DevTools Profiler for component rendering analysis
   - Chrome DevTools Performance panel for runtime performance
   - Memory profiling for leak detection

2. **Production Monitoring**:
   - Lighthouse audits for overall performance
   - Optional Web Vitals tracking for real-user metrics
   - Error tracking for performance-related failures

3. **Continuous Improvement**:
   - Regular performance audits
   - Performance regression testing
   - User feedback on perceived performance

## 2. RENDERING OPTIMIZATION

Efficient rendering is critical for maintaining a responsive user interface, especially when dealing with potentially large task lists.

### 2.1 Component Memoization

The application uses React's memoization features to prevent unnecessary re-renders:

```jsx
// Example from TodoItem.tsx
import React, { memo } from 'react';

const TodoItem = memo(({ task, ...props }) => {
  // Component implementation
});

export default TodoItem;
```

Key components that benefit from memoization include:
- `TodoItem`: Prevents re-rendering when other tasks change
- `FilterControls`: Prevents re-rendering when tasks change
- `TodoList`: Uses conditional rendering optimizations

Memoization is applied selectively to balance performance gains against the overhead of comparison.

### 2.2 List Virtualization

For large task lists, the application implements virtualization to render only the visible items:

```jsx
// Example implementation in TodoList.tsx
import { FixedSizeList } from 'react-window';

const VirtualizedTaskList = ({ tasks }) => {
  return (
    <FixedSizeList
      height={400}
      width="100%"
      itemCount={tasks.length}
      itemSize={50}
    >
      {({ index, style }) => (
        <div style={style}>
          <TodoItem task={tasks[index]} />
        </div>
      )}
    </FixedSizeList>
  );
};
```

Virtualization is conditionally applied when the task list exceeds a threshold (typically 50 items) to avoid the overhead for small lists while ensuring performance for large lists.

### 2.3 Efficient DOM Updates

The application minimizes DOM updates through several techniques:

1. **Key Management**: Proper key usage in lists to optimize React's reconciliation
   ```jsx
   {filteredTasks.map(task => (
     <TodoItem key={task.id} task={task} />
   ))}
   ```

2. **Batched Updates**: Grouping state updates to reduce render cycles
   ```jsx
   // Instead of multiple state updates
   const handleCompletionToggle = (id) => {
     // Single update that handles multiple state changes
     setTasks(prevTasks => TaskUtils.toggleTaskStatus(prevTasks, id));
   };
   ```

3. **CSS Transitions**: Using CSS for animations instead of JavaScript
   ```css
   .task-enter {
     opacity: 0;
     transform: translateY(-10px);
   }
   .task-enter-active {
     opacity: 1;
     transform: translateY(0);
     transition: opacity 300ms, transform 300ms;
   }
   ```

4. **Throttling/Debouncing**: Limiting frequency of expensive operations
   ```jsx
   import { debounce } from 'lodash-es';
   
   const debouncedSaveToStorage = debounce((tasks) => {
     localStorage.setItem('tasks', JSON.stringify(tasks));
   }, 300);
   ```

### 2.4 Conditional Rendering

The application uses conditional rendering to avoid unnecessary component creation:

```jsx
// Example from TodoList.tsx
const TodoList = () => {
  const { filteredTasks, filter } = useTodoContext();
  
  if (filteredTasks.length === 0) {
    return <EmptyState filter={filter} />;
  }
  
  return (
    <div className={styles.todoList}>
      {/* Task list rendering */}
    </div>
  );
};
```

This approach prevents the creation of empty list containers and task items when there are no tasks to display, reducing memory usage and rendering time.

## 3. STATE MANAGEMENT OPTIMIZATION

Efficient state management is crucial for application performance, especially as the task list grows.

### 3.1 Optimized Hooks

The application uses optimized custom hooks for state management:

```jsx
// Example from useTodoList.ts
import { useState, useEffect, useCallback, useMemo } from 'react';

const useTodoList = () => {
  const [tasks, setTasks] = useLocalStorage('react-todo-list-tasks', []);
  const [filter, setFilter] = useLocalStorage('react-todo-list-filter', FilterType.ALL);
  
  // Memoized filtered tasks
  const filteredTasks = useMemo(() => {
    return TaskUtils.filterTasks(tasks, filter);
  }, [tasks, filter]);
  
  // Memoized task counts
  const activeCount = useMemo(() => {
    return TaskUtils.getActiveTaskCount(tasks);
  }, [tasks]);
  
  // Memoized callback functions
  const addTask = useCallback((input) => {
    setTasks(prevTasks => [...prevTasks, TaskUtils.createTask(input)]);
  }, [setTasks]);
  
  // Additional optimized functions...
  
  return {
    tasks,
    filteredTasks,
    filter,
    activeCount,
    addTask,
    // Other functions...
  };
};
```

These optimizations ensure that:
- Derived state is recalculated only when dependencies change
- Callback functions maintain referential stability
- Component re-renders are minimized

### 3.2 Immutable Updates

The application uses immutable update patterns to optimize React's change detection:

```jsx
// Example from taskUtils.ts
const toggleTaskStatus = (tasks, id) => {
  return tasks.map(task =>
    task.id === id
      ? { ...task, completed: !task.completed }
      : task
  );
};

const deleteTask = (tasks, id) => {
  return tasks.filter(task => task.id !== id);
};
```

These patterns ensure that:
- Only changed objects are created new in memory
- React can efficiently detect changes
- Reference equality checks work as expected with memoization

### 3.3 Context Optimization

The TodoContext is optimized to prevent unnecessary re-renders:

```jsx
// Example from TodoContext.tsx
const TodoContext = createContext(null);

const TodoProvider = ({ children }) => {
  const todoState = useTodoList();
  
  // Memoize the context value to maintain referential equality
  const contextValue = useMemo(() => todoState, [todoState]);
  
  return (
    <TodoContext.Provider value={contextValue}>
      {children}
    </TodoContext.Provider>
  );
};
```

Additionally, components can selectively consume only the context values they need:

```jsx
// Example of selective context consumption
const FilterControls = () => {
  const { filter, setFilter } = useTodoContext();
  // Component only re-renders when filter or setFilter changes
  // ...component implementation
};
```

### 3.4 Batch Processing

For operations that affect multiple tasks, the application uses batch processing to minimize state updates:

```jsx
// Example of batch processing for clearing completed tasks
const clearCompletedTasks = useCallback(() => {
  setTasks(prevTasks => prevTasks.filter(task => !task.completed));
}, [setTasks]);

// Example of batch processing for task prioritization
const prioritizeAllTasks = useCallback((priority) => {
  setTasks(prevTasks => prevTasks.map(task => ({
    ...task,
    priority
  })));
}, [setTasks]);
```

This approach ensures that multiple changes are applied in a single state update, reducing render cycles and improving performance.

## 4. STORAGE OPTIMIZATION

Efficient storage operations are essential for maintaining application responsiveness, especially with larger task lists.

### 4.1 localStorage Performance

The application optimizes localStorage operations to minimize performance impact:

```jsx
// Example from useLocalStorage.ts
import { useState, useEffect, useCallback } from 'react';

const useLocalStorage = (key, initialValue) => {
  // State to store our value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Debounced version of localStorage setter
  const debouncedSetItem = useCallback(
    debounce((key, value) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    }, 300),
    []
  );

  // Return a wrapped version of useState's setter function
  const setValue = useCallback(
    (value) => {
      try {
        // Allow value to be a function
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        // Save state
        setStoredValue(valueToStore);
        // Save to localStorage with debounce
        debouncedSetItem(key, valueToStore);
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, debouncedSetItem]
  );

  return [storedValue, setValue];
};
```

Key optimizations include:
- Debouncing writes to reduce frequency of expensive operations
- Lazy initialization to avoid blocking the initial render
- Error handling to prevent application crashes
- Memoization of the setter function to maintain referential stability

### 4.2 Data Structure Optimization

The application uses optimized data structures to minimize storage size and parsing time:

```typescript
// Example task object structure
interface Task {
  id: string;        // Unique identifier
  text: string;      // Task description
  completed: boolean; // Completion status
  priority: string;  // Task priority
  createdAt: number; // Creation timestamp
}
```

Optimizations include:
- Minimal property set to reduce storage size
- Simple data types for efficient serialization/deserialization
- Avoiding nested objects when possible
- Using numeric timestamps instead of Date objects

For large task lists, the application implements pagination or archiving strategies to prevent exceeding localStorage limits.

### 4.3 Storage Monitoring

The application monitors storage usage to prevent exceeding browser limits:

```jsx
// Example storage monitoring implementation
const checkStorageQuota = () => {
  try {
    const tasks = JSON.parse(localStorage.getItem('react-todo-list-tasks') || '[]');
    const tasksSize = new Blob([JSON.stringify(tasks)]).size;
    const estimatedTotalSize = tasksSize * 1.1; // Add 10% for other storage
    
    // Check if approaching storage limit (typically 5MB)
    if (estimatedTotalSize > 4 * 1024 * 1024) { // 4MB warning threshold
      console.warn('Approaching localStorage limit. Consider clearing completed tasks.');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking storage quota:', error);
    return false;
  }
};
```

When approaching storage limits, the application can:
- Notify users to clear completed tasks
- Automatically archive older completed tasks
- Implement data compression techniques
- Provide export functionality for backup

### 4.4 Fallback Mechanisms

The application implements fallback mechanisms for storage failures:

```jsx
// Example fallback implementation
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    // Handle QuotaExceededError
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Attempt to free space by removing old data
      const success = attemptStorageRecovery();
      if (success) {
        // Retry save operation
        try {
          localStorage.setItem(key, JSON.stringify(data));
          return true;
        } catch {
          // Fall back to in-memory only
          return false;
        }
      }
    }
    // Fall back to in-memory only for other errors
    return false;
  }
};
```

These fallback mechanisms ensure the application remains functional even when storage operations fail, providing a degraded but usable experience.

## 5. NETWORK OPTIMIZATION

While the React Todo List is primarily a client-side application, network optimization is still important for initial loading and potential future API integration.

### 5.1 Asset Optimization

The application optimizes assets to reduce initial load time:

| Asset Type | Optimization Technique | Impact |
|-----------|------------------------|--------|
| JavaScript | Code splitting, minification, tree shaking | Reduced bundle size |
| CSS | Minification, unused CSS removal | Smaller stylesheet size |
| Images | Compression, appropriate formats, lazy loading | Faster image loading |
| Fonts | WOFF2 format, font subsetting | Reduced font file size |

These optimizations are applied during the build process using Create React App's built-in optimization features and additional plugins as needed.

### 5.2 Code Splitting

The application uses code splitting to load only the necessary code for the current view:

```jsx
// Example code splitting implementation
import React, { lazy, Suspense } from 'react';

// Lazy-loaded components
const TaskStatistics = lazy(() => import('./TaskStatistics'));
const TaskExport = lazy(() => import('./TaskExport'));

const App = () => {
  const [showStats, setShowStats] = useState(false);
  const [showExport, setShowExport] = useState(false);
  
  return (
    <div className="app">
      {/* Core components loaded immediately */}
      <TodoForm />
      <TodoList />
      
      {/* Optional components loaded on demand */}
      {showStats && (
        <Suspense fallback={<div>Loading statistics...</div>}>
          <TaskStatistics />
        </Suspense>
      )}
      
      {showExport && (
        <Suspense fallback={<div>Loading export tool...</div>}>
          <TaskExport />
        </Suspense>
      )}
    </div>
  );
};
```

This approach ensures that users only download the code they need, improving initial load performance.

### 5.3 Caching Strategy

The application implements an effective caching strategy for static assets:

```html
<!-- Example cache control in index.html -->
<meta http-equiv="Cache-Control" content="max-age=31536000, immutable" />
```

For deployment, the following cache headers are recommended:

| Resource Type | Cache-Control Header | Purpose |
|--------------|----------------------|--------|
| HTML | no-cache | Ensure latest version is always loaded |
| JS/CSS (with hash) | max-age=31536000, immutable | Long-term caching for versioned assets |
| Images | max-age=86400 | Daily caching for images |
| Fonts | max-age=31536000, immutable | Long-term caching for fonts |

These caching strategies are implemented through the hosting platform's configuration as documented in the deployment guide.

### 5.4 Preloading and Prefetching

The application uses preloading and prefetching to improve perceived performance:

```html
<!-- Example preloading critical resources -->
<link rel="preload" href="/static/fonts/roboto-v20-latin-regular.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/static/css/main.chunk.css" as="style" />
<link rel="preload" href="/static/js/main.chunk.js" as="script" />

<!-- Example prefetching likely-needed resources -->
<link rel="prefetch" href="/static/js/statistics.chunk.js" />
```

These techniques ensure that:
- Critical resources load as early as possible
- Likely-needed resources are fetched during idle time
- User experience feels faster and more responsive

## 6. BUILD OPTIMIZATION

Build-time optimizations ensure the application is delivered in the most efficient form possible.

### 6.1 Bundle Analysis

Regular bundle analysis helps identify opportunities for optimization:

```bash
# Example bundle analysis command
npm run build -- --stats
npx webpack-bundle-analyzer build/bundle-stats.json
```

Key metrics to monitor include:
- Total bundle size
- Individual chunk sizes
- Duplicate dependencies
- Unused code
- Large dependencies

Based on analysis results, optimizations might include:
- Replacing large libraries with smaller alternatives
- Removing unused features
- Implementing code splitting
- Optimizing import statements

### 6.2 Tree Shaking

The application leverages tree shaking to eliminate unused code:

```jsx
// Example of tree-shakable imports
// Good: Named imports allow tree shaking
import { debounce } from 'lodash-es';

// Bad: Default imports may prevent tree shaking
// import _ from 'lodash';
// const debounce = _.debounce;
```

To maximize tree shaking effectiveness:
- Use ES modules (import/export) syntax
- Prefer named imports over namespace imports
- Use package.json "sideEffects" field
- Configure babel-preset-env appropriately
- Use lodash-es or other ES module libraries

### 6.3 Dependency Optimization

The application carefully manages dependencies to minimize bundle size:

| Dependency Management Technique | Implementation |
|--------------------------------|----------------|
| Regular dependency audits | `npm audit` and manual review |
| Selective importing | Import only needed functions |
| Avoiding large libraries | Use smaller alternatives when possible |
| Shared dependencies | Leverage shared chunks for common code |
| Development dependencies | Keep build-only tools in devDependencies |

Example of selective importing:

```jsx
// Good: Import only what's needed
import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash-es';

// Bad: Import entire libraries
// import React from 'react';
// import _ from 'lodash';
```

### 6.4 Progressive Web App

The application is configured as a Progressive Web App (PWA) for improved performance:

```jsx
// Example service worker registration in index.tsx
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
serviceWorkerRegistration.register();
```

PWA features that improve performance include:
- Service worker for caching and offline support
- App shell architecture for instant loading
- Asset caching for reduced network requests
- Background sync for offline operations

These features are configured in the application manifest and service worker files.

## 7. PERFORMANCE TESTING

Regular performance testing ensures the application meets performance targets and identifies regressions.

### 7.1 Automated Performance Testing

The application includes automated performance tests:

```jsx
// Example performance test for rendering large lists
import { render, screen } from '@testing-library/react';
import { TodoProvider } from '../contexts/TodoContext';
import TodoList from './TodoList';

// Mock a large number of tasks
const createManyTasks = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `task-${i}`,
    text: `Task ${i}`,
    completed: i % 2 === 0,
    priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
    createdAt: Date.now() - i * 1000
  }));
};

// Mock context with large task list
const mockLargeTaskList = createManyTasks(100);

jest.mock('../contexts/TodoContext', () => ({
  useTodoContext: () => ({
    filteredTasks: mockLargeTaskList,
    filter: 'all'
  })
}));

test('renders large task list efficiently', () => {
  // Measure rendering time
  const startTime = performance.now();
  
  render(<TodoList />);
  
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  // Verify all tasks were rendered
  expect(screen.getAllByRole('listitem').length).toBe(100);
  
  // Assert rendering time is within acceptable limits
  expect(renderTime).toBeLessThan(500); // 500ms threshold
});
```

These tests are run as part of the CI/CD pipeline to catch performance regressions.

### 7.2 Lighthouse Integration

Lighthouse audits are integrated into the CI/CD pipeline:

```yaml
# Example GitHub Actions workflow for Lighthouse testing
name: Lighthouse CI
on: [push, pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build app
        run: |
          npm ci
          npm run build
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v8
        with:
          uploadArtifacts: true
          temporaryPublicStorage: true
          configPath: './lighthouserc.json'
```

The Lighthouse configuration includes performance thresholds:

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./build"
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "interactive": ["error", {"maxNumericValue": 3000}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}]
      }
    }
  }
}
```

### 7.3 React Profiler

The React Profiler is used to identify rendering performance issues:

```jsx
// Example profiler integration for development
import { Profiler } from 'react';

const onRenderCallback = (
  id, // the "id" prop of the Profiler tree
  phase, // "mount" or "update"
  actualDuration, // time spent rendering
  baseDuration, // estimated time for the entire subtree
  startTime, // when React began rendering
  commitTime // when React committed the updates
) => {
  if (actualDuration > 5) { // 5ms threshold
    console.warn(`Slow render detected in ${id}: ${actualDuration.toFixed(2)}ms`);
  }
};

const App = () => (
  <Profiler id="App" onRender={onRenderCallback}>
    <TodoProvider>
      <TodoForm />
      <FilterControls />
      <TodoList />
    </TodoProvider>
  </Profiler>
);
```

This approach helps identify components that would benefit from optimization during development.

### 7.4 User-Centric Performance Metrics

The application tracks user-centric performance metrics:

```jsx
// Example Web Vitals integration
import { getCLS, getFID, getLCP } from 'web-vitals';

function sendToAnalytics({ name, delta, id }) {
  // Send metrics to analytics service
  console.log(`Metric: ${name} | Value: ${delta} | ID: ${id}`);
}

getCLS(sendToAnalytics); // Cumulative Layout Shift
getFID(sendToAnalytics); // First Input Delay
getLCP(sendToAnalytics); // Largest Contentful Paint
```

These metrics provide real-world performance data that can be used to identify issues affecting actual users.

## 8. MOBILE OPTIMIZATION

Mobile devices often have limited resources, making optimization particularly important for mobile users.

### 8.1 Touch Optimization

The application is optimized for touch interactions:

```css
/* Example touch optimization in CSS */
.todo-item {
  min-height: 44px; /* Minimum touch target size */
}

.todo-actions button {
  min-width: 44px;
  min-height: 44px;
  margin: 0 8px; /* Spacing between touch targets */
}

@media (pointer: coarse) {
  /* Additional optimizations for touch devices */
  .todo-actions button {
    padding: 12px; /* Larger padding on touch devices */
  }
}
```

These optimizations ensure that:
- Touch targets meet the recommended minimum size (44x44px)
- Touch targets have sufficient spacing
- Interactive elements are easily tappable
- The interface adapts to touch input

### 8.2 Responsive Performance

The application adapts its performance strategy based on device capabilities:

```jsx
// Example device capability detection
const isLowEndDevice = () => {
  // Check for low memory
  if ('deviceMemory' in navigator) {
    if (navigator.deviceMemory < 4) return true;
  }
  
  // Check for slow CPU
  if ('hardwareConcurrency' in navigator) {
    if (navigator.hardwareConcurrency < 4) return true;
  }
  
  // Check for battery status
  if ('getBattery' in navigator) {
    navigator.getBattery().then(battery => {
      if (battery.charging === false && battery.level < 0.15) {
        // Enable power saving mode
        enablePowerSaving();
      }
    });
  }
  
  return false;
};

// Adjust features based on device capabilities
const enablePowerSaving = () => {
  // Disable animations
  document.body.classList.add('reduce-motion');
  
  // Reduce update frequency
  setUpdateFrequency('low');
  
  // Disable non-essential features
  disableNonEssentialFeatures();
};
```

This approach ensures the application remains responsive even on low-end devices.

### 8.3 Offline Support

The application provides offline support for mobile users:

```jsx
// Example service worker registration with offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
      })
      .catch(error => {
        console.error('ServiceWorker registration failed:', error);
      });
  });
}
```

The service worker implements a cache-first strategy for application assets and falls back to localStorage for data persistence when offline.

### 8.4 Reduced Motion

The application respects user preferences for reduced motion:

```css
/* Example reduced motion implementation */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
  
  .task-enter-active,
  .task-exit-active {
    transition: opacity 0.001ms !important;
    transform: none !important;
  }
}

/* Alternative implementation with CSS variables */
:root {
  --transition-duration: 300ms;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-duration: 0.001ms;
  }
}

.task-enter-active {
  transition: opacity var(--transition-duration);
}
```

This approach ensures that users who prefer reduced motion or have vestibular disorders can use the application comfortably.

## 9. PERFORMANCE MONITORING

Ongoing performance monitoring helps identify issues and opportunities for improvement.

### 9.1 Runtime Performance Monitoring

The application includes runtime performance monitoring:

```jsx
// Example performance monitoring implementation
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.thresholds = {
      renderTime: 16, // 60fps target (16ms)
      interactionTime: 100, // 100ms response time target
      storageTime: 50 // 50ms storage operation target
    };
  }
  
  startMeasure(metricName) {
    this.metrics[metricName] = {
      startTime: performance.now()
    };
  }
  
  endMeasure(metricName) {
    if (!this.metrics[metricName]) return;
    
    const startTime = this.metrics[metricName].startTime;
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.metrics[metricName].duration = duration;
    this.metrics[metricName].timestamp = new Date().toISOString();
    
    // Check against thresholds
    const threshold = this.thresholds[metricName];
    if (threshold && duration > threshold) {
      console.warn(`Performance threshold exceeded for ${metricName}: ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
      // Could send to monitoring service
    }
    
    return duration;
  }
  
  getMetrics() {
    return this.metrics;
  }
}

// Usage example
const performanceMonitor = new PerformanceMonitor();

const handleTaskToggle = (id) => {
  performanceMonitor.startMeasure('interactionTime');
  
  // Toggle task logic
  toggleTask(id);
  
  const duration = performanceMonitor.endMeasure('interactionTime');
  console.log(`Task toggle took ${duration.toFixed(2)}ms`);
};
```

This monitoring helps identify performance issues during actual usage.

### 9.2 Error Tracking

Performance-related errors are tracked and analyzed:

```jsx
// Example error tracking for performance issues
window.addEventListener('error', (event) => {
  // Check if error is performance-related
  if (event.message.includes('script timeout') ||
      event.message.includes('unresponsive')) {
    // Log performance error
    logPerformanceError({
      type: 'runtime_error',
      message: event.message,
      stack: event.error?.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// Track long tasks
if ('PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) { // 50ms threshold
        console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
        // Log long task
        logPerformanceError({
          type: 'long_task',
          duration: entry.duration,
          timestamp: new Date().toISOString()
        });
      }
    }
  });
  
  observer.observe({ entryTypes: ['longtask'] });
}
```

Tracking performance-related errors helps identify issues that affect real users.

### 9.3 User Feedback

The application collects user feedback on performance:

```jsx
// Example user feedback collection
const collectPerformanceFeedback = () => {
  // Calculate perceived performance score
  const pageLoadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
  const isPageLoadSlow = pageLoadTime > 3000; // 3 seconds threshold
  
  // Only ask for feedback if performance might be an issue
  if (isPageLoadSlow) {
    // Show feedback dialog after user has interacted with the app
    setTimeout(() => {
      const feedbackResponse = window.confirm(
        'We noticed the app might be running slowly. Would you like to provide feedback to help us improve?'
      );
      
      if (feedbackResponse) {
        // Redirect to feedback form or show in-app form
        showFeedbackForm();
      }
    }, 60000); // Wait 1 minute before asking
  }
};
```

User feedback provides valuable insights into perceived performance issues that might not be captured by automated monitoring.

### 9.4 Performance Dashboards

Performance metrics are visualized in dashboards: