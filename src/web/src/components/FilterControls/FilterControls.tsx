import React, { FC } from 'react'; // ^18.2.0
import classNames from 'classnames'; // ^2.3.1
import styles from './FilterControls.module.css';
import { FilterType } from '../../types/Filter';
import Button from '../common/Button/Button';
import { useTodoContext } from '../../contexts/TodoContext';

/**
 * A component that provides buttons for filtering tasks by completion status
 */
const FilterControls: FC = () => {
  // Access todo context to get current filter and setFilter function
  const { filter, setFilter } = useTodoContext();
  
  /**
   * Updates the current filter when a filter button is clicked
   * @param newFilter - The new filter to apply
   */
  const handleFilterChange = (newFilter: FilterType): void => {
    setFilter(newFilter);
  };
  
  return (
    <div 
      className={styles.container} 
      role="tablist" 
      aria-label="Filter tasks"
    >
      <Button
        className={classNames(
          styles.filterButton,
          filter === FilterType.ALL && styles.active
        )}
        onClick={() => handleFilterChange(FilterType.ALL)}
        role="tab"
        aria-selected={filter === FilterType.ALL}
      >
        All
      </Button>
      
      <Button
        className={classNames(
          styles.filterButton,
          filter === FilterType.ACTIVE && styles.active
        )}
        onClick={() => handleFilterChange(FilterType.ACTIVE)}
        role="tab"
        aria-selected={filter === FilterType.ACTIVE}
      >
        Active
      </Button>
      
      <Button
        className={classNames(
          styles.filterButton,
          filter === FilterType.COMPLETED && styles.active
        )}
        onClick={() => handleFilterChange(FilterType.COMPLETED)}
        role="tab"
        aria-selected={filter === FilterType.COMPLETED}
      >
        Completed
      </Button>
    </div>
  );
};

export default FilterControls;