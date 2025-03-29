/**
 * Enumeration of possible task priority levels
 * Used for categorizing and visually distinguishing tasks
 */
export enum Priority {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low"
}

/**
 * Interface defining the structure of a task in the todo list
 * Represents a single task item with all its properties
 */
export interface Task {
  /**
   * Unique identifier for the task
   */
  id: string;
  
  /**
   * The text description of the task
   */
  text: string;
  
  /**
   * Whether the task has been completed
   */
  completed: boolean;
  
  /**
   * The priority level of the task
   */
  priority: string;
  
  /**
   * Timestamp when the task was created
   */
  createdAt: number;
}

/**
 * Interface defining the input required to create a new task
 * Only requires the necessary information, as other fields
 * will be generated automatically (id, completed, createdAt)
 */
export interface CreateTaskInput {
  /**
   * The text description of the task
   */
  text: string;
  
  /**
   * Optional priority level, defaults to medium if not specified
   */
  priority?: string;
}

/**
 * Interface defining the input required to update an existing task
 * All fields except id are optional as updates may be partial
 */
export interface UpdateTaskInput {
  /**
   * The unique identifier of the task to update
   */
  id: string;
  
  /**
   * Optional updated text description
   */
  text?: string;
  
  /**
   * Optional updated priority level
   */
  priority?: string;
}