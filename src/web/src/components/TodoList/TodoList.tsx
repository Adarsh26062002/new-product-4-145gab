import React, { FC, memo } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group'; // ^4.4.5
import styles from './TodoList.module.css';
import TodoItem from '../TodoItem/TodoItem';
import { Task } from '../../types/Task';
import { FilterType } from '../../types/Filter';
import { useTodoContext } from '../../contexts/TodoContext';

/**
 * Props interface for the TodoList component
 */
interface TodoListProps {}

/**
 * Determines the appropriate empty state message based on the current filter
 * @param filter The current filter type
 * @returns The appropriate empty state message
 */
const getEmptyStateMessage = (filter: FilterType): string => {
  switch (filter) {
    case FilterType.ALL:
      return 'No tasks to display';
    case FilterType.ACTIVE:
      return 'No active tasks found';
    case FilterType.COMPLETED:
      return 'No completed tasks found';
    default:
      return 'No tasks to display';
  }
};

/**
 * Component that renders the collection of todo items with filtering and empty state handling
 */
const TodoList: FC<TodoListProps> = () => {
  // Access filtered tasks, filter, and active count from the todo context
  const { filteredTasks, filter, activeCount } = useTodoContext();

  /**
   * Renders the empty state message when no tasks are available
   * @returns The empty state JSX
   */
  const renderEmptyState = () => (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateMessage}>
        {getEmptyStateMessage(filter)}
      </div>
      <div className={styles.emptyStateAction}>
        Add a task to get started!
      </div>
    </div>
  );

  /**
   * Renders the list of todo items with transition effects
   * @returns The task list JSX
   */
  const renderTaskList = () => (
    <TransitionGroup component="div">
      {filteredTasks.map((task) => (
        <CSSTransition
          key={task.id}
          timeout={200}
          classNames={{
            enter: styles['taskItem-enter'],
            enterActive: styles['taskItem-enter-active'],
            exit: styles['taskItem-exit'],
            exitActive: styles['taskItem-exit-active']
          }}
        >
          <TodoItem task={task} />
        </CSSTransition>
      ))}
    </TransitionGroup>
  );

  /**
   * Renders the counter showing the number of active tasks
   * @returns The task counter JSX
   */
  const renderTaskCounter = () => (
    <div className={styles.taskCounter}>
      {activeCount} {activeCount === 1 ? 'item' : 'items'} left
    </div>
  );

  return (
    <div className={styles.todoList}>
      <div className={styles.listContainer}>
        {filteredTasks.length === 0 ? renderEmptyState() : renderTaskList()}
      </div>
      {renderTaskCounter()}
    </div>
  );
};

export default memo(TodoList);