import { useState, useEffect, useCallback, useMemo } from 'react'; // ^18.2.0
import { Task, CreateTaskInput, UpdateTaskInput } from '../types/Task';
import { FilterType } from '../types/Filter';
import useLocalStorage from './useLocalStorage';
import TaskUtils from '../utils/taskUtils';
import { LocalStorageService } from '../services/localStorage';

/**
 * Custom hook that provides state and operations for managing a todo list with localStorage persistence
 * @returns Object containing todo list state and operations
 */
const useTodoList = (): TodoListHook => {
  // Initialize tasks state with localStorage persistence
  const [tasks, setTasks] = useLocalStorage<Task[]>(
    LocalStorageService.STORAGE_KEYS.TASKS,
    []
  );
  
  // Initialize filter state with localStorage persistence
  const [filter, setFilter] = useLocalStorage<FilterType>(
    LocalStorageService.STORAGE_KEYS.FILTER,
    FilterType.ALL
  );
  
  // Memoize filtered and sorted tasks based on current tasks and filter
  const filteredTasks = useMemo(() => {
    const filtered = TaskUtils.filterTasks(tasks, filter);
    return TaskUtils.sortTasksByPriority(filtered);
  }, [tasks, filter]);
  
  // Calculate active and completed task counts
  const activeCount = useMemo(() => TaskUtils.getActiveTaskCount(tasks), [tasks]);
  const completedCount = useMemo(() => TaskUtils.getCompletedTaskCount(tasks), [tasks]);
  
  // Add a new task to the list
  const addTask = useCallback((input: CreateTaskInput) => {
    try {
      const newTask = TaskUtils.createTask(input);
      setTasks((prevTasks) => [...prevTasks, newTask]);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  }, [setTasks]);
  
  // Update an existing task
  const updateTask = useCallback((input: UpdateTaskInput) => {
    try {
      setTasks((prevTasks) => TaskUtils.updateTask(prevTasks, input));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }, [setTasks]);
  
  // Toggle a task's completion status
  const toggleTask = useCallback((id: string) => {
    try {
      setTasks((prevTasks) => TaskUtils.toggleTaskStatus(prevTasks, id));
    } catch (error) {
      console.error('Error toggling task status:', error);
    }
  }, [setTasks]);
  
  // Delete a task from the list
  const deleteTask = useCallback((id: string) => {
    try {
      setTasks((prevTasks) => TaskUtils.deleteTask(prevTasks, id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }, [setTasks]);
  
  // Update a task's priority
  const updateTaskPriority = useCallback((id: string, priority: string) => {
    try {
      setTasks((prevTasks) => TaskUtils.updateTaskPriority(prevTasks, id, priority));
    } catch (error) {
      console.error('Error updating task priority:', error);
    }
  }, [setTasks]);
  
  // Clear all completed tasks
  const clearCompletedTasks = useCallback(() => {
    setTasks((prevTasks) => prevTasks.filter(task => !task.completed));
  }, [setTasks]);
  
  // Return the hook API
  return {
    tasks,
    filteredTasks,
    filter,
    activeCount,
    completedCount,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    updateTaskPriority,
    setFilter,
    clearCompletedTasks
  };
};

/**
 * Interface defining the return value of the useTodoList hook
 */
export interface TodoListHook {
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

export default useTodoList;