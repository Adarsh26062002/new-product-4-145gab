import idGenerator from '../utils/idGenerator';

describe('idGenerator', () => {
  test('should generate a non-empty string ID', () => {
    const id = idGenerator.generate();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  test('should generate unique IDs', () => {
    // Generate a significant number of IDs to test uniqueness
    const ids = Array(100).fill(null).map(() => idGenerator.generate());
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('should generate an ID with the specified prefix', () => {
    const prefix = 'task';
    const id = idGenerator.generateWithPrefix(prefix);
    expect(typeof id).toBe('string');
    expect(id.startsWith(`${prefix}-`)).toBe(true);
  });

  test('should generate unique IDs with the same prefix', () => {
    const prefix = 'task';
    // Generate multiple IDs with the same prefix to test uniqueness
    const ids = Array(100).fill(null).map(() => idGenerator.generateWithPrefix(prefix));
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});