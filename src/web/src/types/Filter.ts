/**
 * Enumeration of possible task filter types
 * Used for filtering tasks by completion status in the Todo List application
 */
export enum FilterType {
  /**
   * Show all tasks regardless of completion status
   */
  ALL = 'all',
  
  /**
   * Show only active (incomplete) tasks
   */
  ACTIVE = 'active',
  
  /**
   * Show only completed tasks
   */
  COMPLETED = 'completed',
}