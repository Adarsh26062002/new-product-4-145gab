import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FilterControls from './FilterControls';
import { FilterType } from '../../types/Filter';
import { TodoContext } from '../../contexts/TodoContext';

// Mock the TodoContext module
jest.mock('../../contexts/TodoContext', () => ({
  useTodoContext: jest.fn(),
}));

import { useTodoContext } from '../../contexts/TodoContext';

// Helper function to render components with a mocked TodoContext
const renderWithTodoContext = (ui: React.ReactNode, contextValue = {}) => {
  const defaultContext = {
    filter: FilterType.ALL,
    setFilter: jest.fn(),
  };
  
  const mergedContext = { ...defaultContext, ...contextValue };
  (useTodoContext as jest.Mock).mockReturnValue(mergedContext);
  
  return {
    ...render(ui),
    mockContext: mergedContext,
  };
};

describe('FilterControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter buttons', () => {
    renderWithTodoContext(<FilterControls />);
    
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
  
  it('highlights the active filter button', () => {
    renderWithTodoContext(<FilterControls />, { filter: FilterType.ACTIVE });
    
    // Check Active button has active class
    const activeButton = screen.getByText('Active');
    expect(activeButton.className).toContain('active');
    
    // Check other buttons don't have active class
    expect(screen.getByText('All').className).not.toContain('active');
    expect(screen.getByText('Completed').className).not.toContain('active');
  });
  
  it('calls setFilter when a filter button is clicked', () => {
    const { mockContext } = renderWithTodoContext(<FilterControls />);
    
    fireEvent.click(screen.getByText('Completed'));
    
    expect(mockContext.setFilter).toHaveBeenCalledTimes(1);
    expect(mockContext.setFilter).toHaveBeenCalledWith(FilterType.COMPLETED);
  });
  
  it('has correct ARIA attributes for accessibility', () => {
    renderWithTodoContext(<FilterControls />);
    
    // Check container has correct attributes
    const container = screen.getByRole('tablist');
    expect(container).toHaveAttribute('aria-label', 'Filter tasks');
    
    // Check All button has correct attributes
    const allButton = screen.getByText('All');
    expect(allButton).toHaveAttribute('role', 'tab');
    expect(allButton).toHaveAttribute('aria-selected', 'true');
    
    // Check Active button has correct attributes
    const activeButton = screen.getByText('Active');
    expect(activeButton).toHaveAttribute('role', 'tab');
    expect(activeButton).toHaveAttribute('aria-selected', 'false');
    
    // Check Completed button has correct attributes
    const completedButton = screen.getByText('Completed');
    expect(completedButton).toHaveAttribute('role', 'tab');
    expect(completedButton).toHaveAttribute('aria-selected', 'false');
  });
});