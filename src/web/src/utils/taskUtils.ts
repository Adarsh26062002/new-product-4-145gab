import { Task, CreateTaskInput, UpdateTaskInput, Priority } from '../types/Task';
import { FilterType } from '../types/Filter';
import IdGenerator from './idGenerator';

/**
 * Creates a new task object with the provided text and priority
 * @param input - Object containing task text and optional priority
 * @returns A new task object with generated ID and default values
 */
const createTask = (input: CreateTaskInput): Task => {
  // Validate that input text is not empty
  if (!validateTaskText(input.text)) {
    throw new Error('Task text cannot be empty');
  }

  // Trim whitespace from input text
  const sanitizedText = sanitizeTaskText(input.text);

  // Generate a unique ID for the task
  const id = IdGenerator.generateWithPrefix('task-');

  // Set default priority to MEDIUM if not provided
  const priority = input.priority || Priority.MEDIUM;

  // Create and return a new task object
  return {
    id,
    text: sanitizedText,
    completed: false,
    priority,
    createdAt: Date.now()
  };
};

/**
 * Updates an existing task with new text and/or priority
 * @param tasks - The current array of tasks
 * @param input - Object containing task ID and updated properties
 * @returns A new array with the updated task
 */
const updateTask = (tasks: Task[], input: UpdateTaskInput): Task[] => {
  // Validate that input ID exists
  if (!input.id) {
    throw new Error('Task ID is required for updates');
  }

  // Find the task with the matching ID
  const taskIndex = tasks.findIndex(task => task.id === input.id);

  // If task not found, return the original array
  if (taskIndex === -1) {
    return tasks;
  }

  // Create a new array with all tasks
  const updatedTasks = [...tasks];

  // Replace the found task with an updated version containing new text and/or priority
  updatedTasks[taskIndex] = {
    ...updatedTasks[taskIndex],
    ...(input.text !== undefined && { text: sanitizeTaskText(input.text) }),
    ...(input.priority !== undefined && { priority: input.priority })
  };

  // Return the new tasks array
  return updatedTasks;
};

/**
 * Toggles the completion status of a task
 * @param tasks - The current array of tasks
 * @param taskId - The ID of the task to toggle
 * @returns A new array with the toggled task
 */
const toggleTaskStatus = (tasks: Task[], taskId: string): Task[] => {
  // Validate that taskId exists
  if (!taskId) {
    throw new Error('Task ID is required');
  }

  // Find the task with the matching ID
  const taskIndex = tasks.findIndex(task => task.id === taskId);

  // If task not found, return the original array
  if (taskIndex === -1) {
    return tasks;
  }

  // Create a new array with all tasks
  const updatedTasks = [...tasks];

  // Replace the found task with an updated version with the completed status toggled
  updatedTasks[taskIndex] = {
    ...updatedTasks[taskIndex],
    completed: !updatedTasks[taskIndex].completed
  };

  // Return the new tasks array
  return updatedTasks;
};

/**
 * Removes a task from the tasks array
 * @param tasks - The current array of tasks
 * @param taskId - The ID of the task to delete
 * @returns A new array without the deleted task
 */
const deleteTask = (tasks: Task[], taskId: string): Task[] => {
  // Validate that taskId exists
  if (!taskId) {
    throw new Error('Task ID is required');
  }

  // Filter the tasks array to exclude the task with the matching ID
  return tasks.filter(task => task.id !== taskId);
};

/**
 * Filters tasks based on the specified filter type
 * @param tasks - The array of tasks to filter
 * @param filterType - The type of filter to apply
 * @returns A filtered array of tasks
 */
const filterTasks = (tasks: Task[], filterType: FilterType): Task[] => {
  // If filter is ALL, return all tasks
  if (filterType === FilterType.ALL) {
    return tasks;
  }
  
  // If filter is ACTIVE, return only tasks where completed is false
  if (filterType === FilterType.ACTIVE) {
    return tasks.filter(task => !task.completed);
  }
  
  // If filter is COMPLETED, return only tasks where completed is true
  if (filterType === FilterType.COMPLETED) {
    return tasks.filter(task => task.completed);
  }
  
  // For any other filter value, return all tasks as a fallback
  return tasks;
};

/**
 * Updates the priority of a specific task
 * @param tasks - The current array of tasks
 * @param taskId - The ID of the task to update
 * @param priority - The new priority value
 * @returns A new array with the updated task priority
 */
const updateTaskPriority = (tasks: Task[], taskId: string, priority: string): Task[] => {
  // Validate that taskId exists
  if (!taskId) {
    throw new Error('Task ID is required');
  }

  // Validate that priority is a valid Priority value
  const validPriorities = Object.values(Priority);
  if (!validPriorities.includes(priority as Priority)) {
    throw new Error('Invalid priority value');
  }

  // Find the task with the matching ID
  const taskIndex = tasks.findIndex(task => task.id === taskId);

  // If task not found, return the original array
  if (taskIndex === -1) {
    return tasks;
  }

  // Create a new array with all tasks
  const updatedTasks = [...tasks];

  // Replace the found task with an updated version with the new priority
  updatedTasks[taskIndex] = {
    ...updatedTasks[taskIndex],
    priority
  };

  // Return the new tasks array
  return updatedTasks;
};

/**
 * Sorts tasks by priority (HIGH > MEDIUM > LOW)
 * @param tasks - The array of tasks to sort
 * @returns A new array with tasks sorted by priority
 */
const sortTasksByPriority = (tasks: Task[]): Task[] => {
  // Create a priority order mapping (HIGH: 0, MEDIUM: 1, LOW: 2)
  const priorityOrder = {
    [Priority.HIGH]: 0,
    [Priority.MEDIUM]: 1,
    [Priority.LOW]: 2
  };

  // Create a copy of the tasks array
  const sortedTasks = [...tasks];

  // Sort the copy based on priority order (higher priority first)
  return sortedTasks.sort((a, b) => {
    const priorityA = priorityOrder[a.priority as Priority] ?? 99; // Default to lowest priority if invalid
    const priorityB = priorityOrder[b.priority as Priority] ?? 99;
    return priorityA - priorityB;
  });
};

/**
 * Counts the number of active (incomplete) tasks
 * @param tasks - The array of tasks to count
 * @returns The count of active tasks
 */
const getActiveTaskCount = (tasks: Task[]): number => {
  // Filter the tasks array to include only tasks where completed is false
  return tasks.filter(task => !task.completed).length;
};

/**
 * Counts the number of completed tasks
 * @param tasks - The array of tasks to count
 * @returns The count of completed tasks
 */
const getCompletedTaskCount = (tasks: Task[]): number => {
  // Filter the tasks array to include only tasks where completed is true
  return tasks.filter(task => task.completed).length;
};

/**
 * Validates that task text is not empty or just whitespace
 * @param text - The task text to validate
 * @returns True if text is valid, false otherwise
 */
const validateTaskText = (text: string): boolean => {
  // Check if text is undefined or null
  if (text === undefined || text === null) {
    return false;
  }

  // Trim whitespace from text
  const trimmedText = text.trim();
  
  // Check if trimmed text length is greater than 0
  return trimmedText.length > 0;
};

/**
 * Sanitizes task text by trimming whitespace and preventing XSS
 * @param text - The task text to sanitize
 * @returns Sanitized task text
 */
const sanitizeTaskText = (text: string): string => {
  // Trim whitespace from text
  const trimmedText = text.trim();
  
  // Replace potentially dangerous HTML characters with their entity equivalents
  return trimmedText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Export all task utility functions as a default object for convenient importing
export default {
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask,
  filterTasks,
  updateTaskPriority,
  sortTasksByPriority,
  getActiveTaskCount,
  getCompletedTaskCount,
  validateTaskText,
  sanitizeTaskText
};