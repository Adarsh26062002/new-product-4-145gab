/**
 * Babel configuration for React Todo List application
 * This configuration handles:
 * - ES6+ JavaScript transpilation
 * - React JSX syntax support
 * - TypeScript transpilation
 * - Environment-specific optimizations
 * 
 * @version 7.x
 */

module.exports = function(api) {
  // Cache the configuration for better performance
  api.cache(true);

  // Base configuration for all environments
  const config = {
    presets: [
      ['@babel/preset-env', {
        // Use browserslist config from package.json
        targets: 'defaults',
        useBuiltIns: 'usage',
        corejs: 3,
      }],
      ['@babel/preset-react', {
        runtime: 'automatic', // Uses React 17+ JSX transform
      }],
      '@babel/preset-typescript'
    ],
    plugins: [
      ['@babel/plugin-transform-runtime', {
        regenerator: true, // Needed for async/await support
      }],
    ],
  };

  // Add production-specific optimizations
  if (process.env.NODE_ENV === 'production') {
    config.plugins.push(
      // Hoists elements to the highest possible scope
      '@babel/plugin-transform-react-constant-elements',
      // Inline elements to avoid unnecessary function calls
      '@babel/plugin-transform-react-inline-elements',
      // Remove prop types from production build
      'transform-react-remove-prop-types'
    );
  }

  // Special configuration for test environment
  config.env = {
    test: {
      presets: [
        ['@babel/preset-env', {
          targets: {
            node: 'current', // Use current node version for tests
          },
        }],
      ],
    },
  };

  return config;
};