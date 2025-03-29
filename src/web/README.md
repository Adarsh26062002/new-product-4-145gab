# React Todo List Frontend

This directory contains the frontend implementation of the React Todo List application, a lightweight, user-friendly task management solution built with React and TypeScript.

## Features

- Task creation, editing, and deletion
- Task status tracking (complete/incomplete)
- Task prioritization (high, medium, low)
- Filter tasks by status (all/active/completed)
- Persistent storage using browser's localStorage
- Responsive design for all device sizes
- Accessibility compliant (WCAG 2.1 AA)

## Technology Stack

- React 18.x
- TypeScript 5.x
- CSS Modules for component styling
- Context API for state management
- Custom hooks for business logic
- LocalStorage API for data persistence
- Jest and React Testing Library for testing

## Project Structure

```
src/
├── components/       # React components
│   ├── common/       # Reusable UI components
│   │   ├── Button/   # Button component
│   │   ├── Checkbox/ # Checkbox component
│   │   ├── Input/    # Input component
│   │   └── ErrorBoundary/ # Error handling component
│   ├── TodoForm/     # Task creation form
│   ├── TodoList/     # List of tasks
│   ├── TodoItem/     # Individual task component
│   └── FilterControls/ # Task filtering controls
├── contexts/        # React context providers
│   └── TodoContext.tsx # Global state management
├── hooks/           # Custom React hooks
│   ├── useLocalStorage.ts # Hook for localStorage integration
│   └── useTodoList.ts # Hook for todo list operations
├── services/        # Service modules
│   └── localStorage.ts # LocalStorage service utilities
├── utils/           # Utility functions
│   ├── idGenerator.ts # Unique ID generation
│   └── taskUtils.ts # Task manipulation utilities
├── types/           # TypeScript type definitions
│   ├── Task.ts      # Task-related interfaces
│   └── Filter.ts    # Filter type definitions
└── assets/          # Static assets
    ├── styles/      # Global styles
    └── icons/       # SVG icons
```

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher

### Installation

1. Navigate to the web directory
   ```bash
   cd src/web
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm start
   ```

4. Open your browser and navigate to http://localhost:3000

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run test:coverage` - Runs tests with coverage report
- `npm run build` - Builds the app for production
- `npm run lint` - Lints the codebase
- `npm run lint:fix` - Automatically fixes linting issues
- `npm run format` - Formats code with Prettier
- `npm run typecheck` - Checks TypeScript types

## State Management

The application uses React's Context API for global state management. The main state is managed through the `TodoContext` provider, which leverages the `useTodoList` custom hook for task operations and localStorage persistence.

### Key State Components:

- **TodoContext**: Provides global access to todo list state and operations
- **useTodoList**: Custom hook that implements task CRUD operations
- **useLocalStorage**: Custom hook for synchronizing state with localStorage

## Data Persistence

All todo list data is persisted in the browser's localStorage. The application handles:

- Automatic saving of tasks and filter preferences
- Loading saved data on application startup
- Error handling for storage failures
- Storage quota monitoring

The localStorage service (`services/localStorage.ts`) provides utilities for interacting with the browser's storage API safely.

## Testing

The application uses Jest and React Testing Library for testing. Each component and utility has corresponding test files.

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

Tests are co-located with their corresponding components and utilities, following the naming convention `*.test.tsx` or `*.test.ts`.

## Accessibility

The application is designed to be accessible, following WCAG 2.1 AA guidelines:

- Semantic HTML structure
- Keyboard navigation support
- ARIA attributes where appropriate
- Sufficient color contrast
- Screen reader compatibility

## Browser Compatibility

The application supports the following browsers:

- Chrome 60+
- Firefox 60+
- Safari 11+
- Edge 79+ (Chromium-based)
- Not supported on Internet Explorer

## Performance Considerations

- React.memo for pure components to prevent unnecessary re-renders
- Efficient state updates to minimize renders
- Optimized localStorage operations
- Proper key usage in list rendering

## Contributing

When contributing to this frontend codebase, please follow these guidelines:

1. Follow the established code style (enforced by ESLint and Prettier)
2. Write tests for new features or bug fixes
3. Ensure all tests pass before submitting a pull request
4. Update documentation as needed