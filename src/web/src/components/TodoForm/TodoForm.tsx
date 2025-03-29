import React, { FormEvent, useState, useRef } from 'react'; // ^18.2.0
import styles from './TodoForm.module.css';
import Button from '../common/Button/Button';
import Input from '../common/Input/Input';
import { useTodoContext } from '../../contexts/TodoContext';
import TaskUtils from '../../utils/taskUtils';
import { Priority } from '../../types/Task';

/**
 * Props interface for the TodoForm component
 */
interface TodoFormProps {
  className?: string;
  fullWidth?: boolean;
}

/**
 * Form component for creating new tasks in the todo list
 * Implements requirements for task creation (F-001) with input validation
 */
const TodoForm: React.FC<TodoFormProps> = ({ className, fullWidth = false }) => {
  // Access the addTask function from context
  const { addTask } = useTodoContext();
  
  // State for form input and validation
  const [inputValue, setInputValue] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Reference to input element for focus management
  const inputRef = useRef<HTMLInputElement>(null);
  
  /**
   * Handle input changes and clear validation errors
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Clear validation errors when user starts typing
    if (isInvalid) {
      setIsInvalid(false);
      setErrorMessage('');
    }
  };
  
  /**
   * Handle form submission with validation
   */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validate task text is not empty
    if (!TaskUtils.validateTaskText(inputValue)) {
      setIsInvalid(true);
      setErrorMessage('Task cannot be empty');
      return;
    }
    
    // Sanitize the task text to prevent XSS
    const sanitizedText = TaskUtils.sanitizeTaskText(inputValue);
    
    // Create and add the task with medium priority by default
    addTask({
      text: sanitizedText,
      priority: Priority.MEDIUM
    });
    
    // Reset form and focus input for next entry
    setInputValue('');
    inputRef.current?.focus();
  };
  
  // Combine class names for styling
  const formClassName = `${styles.form} ${fullWidth ? styles.fullWidth : ''} ${className || ''}`;
  
  return (
    <form 
      className={formClassName.trim()}
      onSubmit={handleSubmit}
      aria-label="Add task form"
    >
      <div className={styles.inputContainer}>
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Add a new task..."
          isInvalid={isInvalid}
          errorMessage={errorMessage}
          aria-label="Task description"
          fullWidth
        />
      </div>
      <div className={styles.buttonContainer}>
        <Button type="submit">Add Task</Button>
      </div>
    </form>
  );
};

export default TodoForm;