/**
 * Utility module for generating unique identifiers for tasks in the React Todo List application.
 * Ensures each task has a unique ID for reliable identification, manipulation, and persistence.
 */

/**
 * Generates a unique identifier string by combining timestamp and random number
 * @returns A unique identifier string
 */
const generate = (): string => {
  // Combine current timestamp with a random number for uniqueness
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  
  // Convert the combined value to a string
  return `${timestamp}${random}`;
};

/**
 * Generates a unique identifier with the specified prefix
 * @param prefix - String prefix to prepend to the identifier
 * @returns A unique identifier string with the specified prefix
 */
const generateWithPrefix = (prefix: string): string => {
  // Validate that prefix is a string
  if (typeof prefix !== 'string') {
    throw new Error('Prefix must be a string');
  }
  
  // Call the generate function to get a unique identifier
  const id = generate();
  
  // Concatenate the prefix with the generated identifier
  return `${prefix}-${id}`;
};

// Export ID generation functions as a default object for convenient importing
export default {
  generate,
  generateWithPrefix
};