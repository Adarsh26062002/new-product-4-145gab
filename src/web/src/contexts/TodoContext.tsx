import React, { createContext, useContext, ReactNode, FC } from 'react'; // ^18.2.0
import { Task, CreateTaskInput, UpdateTaskInput } from '../types/Task';
import { FilterType } from '../types/Filter';
import useTodoList from '../hooks/useTodoList';

/**
 * Interface defining the shape of the TodoContext value
 */
interface TodoContextType {
  /** All tasks in the todo list */
  tasks: Task[];
  
  /** Tasks filtered according to the current filter */
  filteredTasks: Task[];
  
  /** Current filter selection */
  filter: FilterType;
  
  /** Count of active (incomplete) tasks */
  activeCount: number;
  
  /** Count of completed tasks */
  completedCount: number;
  
  /** Adds a new task to the list */
  addTask: (input: CreateTaskInput) => void;
  
  /** Updates an existing task's text or priority */
  updateTask: (input: UpdateTaskInput) => void;
  
  /** Toggles a task's completion status */
  toggleTask: (id: string) => void;
  
  /** Removes a task from the list */
  deleteTask: (id: string) => void;
  
  /** Updates a task's priority level */
  updateTaskPriority: (id: string, priority: string) => void;
  
  /** Changes the current filter selection */
  setFilter: (filter: FilterType) => void;
  
  /** Removes all completed tasks from the list */
  clearCompletedTasks: () => void;
}

/**
 * Interface defining the props for the TodoProvider component
 */
interface TodoProviderProps {
  children: ReactNode;
}

/**
 * React context for the todo list state and operations
 * Initial value is undefined, will be set by TodoProvider
 */
export const TodoContext = createContext<TodoContextType | undefined>(undefined);

/**
 * Provider component that makes todo list state available to child components
 * Wraps the useTodoList hook to provide its functionality through Context API
 */
export const TodoProvider: FC<TodoProviderProps> = ({ children }) => {
  // Use the custom todo list hook to get state and operations
  const todoList = useTodoList();
  
  // Provide the todo list context to children
  return (
    <TodoContext.Provider value={todoList}>
      {children}
    </TodoContext.Provider>
  );
};

/**
 * Custom hook that provides access to the TodoContext
 * @returns The todo context value containing state and operations
 * @throws Error if used outside of TodoProvider
 */
export const useTodoContext = (): TodoContextType => {
  const context = useContext(TodoContext);
  
  // Make sure we're using this hook within a TodoProvider
  if (context === undefined) {
    throw new Error('useTodoContext must be used within a TodoProvider');
  }
  
  return context;
};