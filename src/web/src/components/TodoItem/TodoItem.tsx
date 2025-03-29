import React, { useState, useRef, useEffect, FC } from 'react';
import classNames from 'classnames'; // v2.3.1
import styles from './TodoItem.module.css';
import { Task, Priority } from '../../types/Task';
import Button from '../common/Button/Button';
import Checkbox from '../common/Checkbox/Checkbox';
import Input from '../common/Input/Input';
import { useTodoContext } from '../../contexts/TodoContext';

/**
 * Props interface for the TodoItem component
 */
interface TodoItemProps {
  task: Task;
}

/**
 * Component that renders an individual todo item with functionality for viewing,
 * toggling completion status, editing, and deleting tasks. It also displays
 * priority indicators and supports both view and edit modes.
 */
const TodoItem: FC<TodoItemProps> = ({ task }) => {
  // Extract properties from task
  const { id, text, completed, priority } = task;
  
  // State for managing edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);
  
  // Reference for auto-focusing the input field when editing
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Access todo context for task operations
  const { toggleTask, deleteTask, updateTask } = useTodoContext();
  
  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);
  
  /**
   * Toggles the completion status of the task
   */
  const handleToggle = () => {
    toggleTask(id);
  };
  
  /**
   * Deletes the task from the todo list
   */
  const handleDelete = () => {
    deleteTask(id);
  };
  
  /**
   * Enters edit mode for the task
   */
  const handleEditStart = () => {
    setEditText(text);
    setIsEditing(true);
  };
  
  /**
   * Updates the editText state as user types
   */
  const handleEditChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditText(event.target.value);
  };
  
  /**
   * Saves the edited task text
   */
  const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedText = editText.trim();
    if (trimmedText) {
      updateTask({ id, text: trimmedText });
      setIsEditing(false);
    }
  };
  
  /**
   * Cancels the edit operation without saving changes
   */
  const handleEditCancel = () => {
    setIsEditing(false);
  };
  
  /**
   * Determines the CSS class based on task priority
   */
  const getPriorityClass = () => {
    switch (priority) {
      case Priority.HIGH:
        return styles.highPriority;
      case Priority.MEDIUM:
        return styles.mediumPriority;
      case Priority.LOW:
        return styles.lowPriority;
      default:
        return '';
    }
  };
  
  /**
   * Renders the task in normal view mode
   */
  const renderViewMode = () => (
    <div className={classNames(styles.todoItem, { [styles.completed]: completed })}>
      <div className={styles.leftSection}>
        <Checkbox 
          checked={completed} 
          onChange={handleToggle} 
          aria-label={`Mark task "${text}" as ${completed ? 'incomplete' : 'complete'}`}
        />
        <div 
          className={classNames(styles.priorityIndicator, getPriorityClass())} 
          aria-hidden="true"
        />
        <span className={styles.todoText}>{text}</span>
      </div>
      <div className={styles.todoActions}>
        <Button 
          variant="secondary" 
          size="small" 
          onClick={handleEditStart} 
          className={styles.actionButton}
          aria-label={`Edit task: ${text}`}
        >
          Edit
        </Button>
        <Button 
          variant="danger" 
          size="small" 
          onClick={handleDelete} 
          className={styles.actionButton}
          aria-label={`Delete task: ${text}`}
        >
          Delete
        </Button>
      </div>
    </div>
  );
  
  /**
   * Renders the task in edit mode
   */
  const renderEditMode = () => (
    <div className={styles.todoItem}>
      <form className={styles.editForm} onSubmit={handleEditSubmit}>
        <Input
          value={editText}
          onChange={handleEditChange}
          ref={inputRef}
          aria-label="Edit task text"
          placeholder="Edit task..."
          isInvalid={editText.trim().length === 0}
          errorMessage="Task text cannot be empty"
        />
        <Button type="submit" variant="primary" size="small">
          Save
        </Button>
        <Button type="button" variant="secondary" size="small" onClick={handleEditCancel}>
          Cancel
        </Button>
      </form>
    </div>
  );
  
  // Conditionally render either view mode or edit mode
  return isEditing ? renderEditMode() : renderViewMode();
};

export default TodoItem;