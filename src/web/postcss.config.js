/**
 * PostCSS Configuration
 * 
 * This file configures PostCSS plugins used to process CSS in the React Todo List application.
 * It enables modern CSS features and ensures cross-browser compatibility.
 */

module.exports = {
  plugins: [
    // Fix known flexbox bugs in various browsers
    require('postcss-flexbugs-fixes'),
    
    // Convert modern CSS into something most browsers can understand
    require('postcss-preset-env')({
      autoprefixer: {
        // Disable outdated 2009 flexbox spec
        flexbox: 'no-2009'
      },
      // Stage 3 represents features in candidate recommendation
      stage: 3,
      // Enable specific features
      features: {
        'custom-properties': true,  // CSS Variables support
        'nesting-rules': true,      // CSS nesting
        'color-mod-function': true, // Color modification functions
        'color-functional-notation': true // Modern color syntax
      }
    }),
    
    // Import normalize.css when using @import-normalize
    require('postcss-normalize'),
    
    // Add vendor prefixes automatically based on browserslist
    require('autoprefixer')({
      flexbox: 'no-2009', // Disable outdated flexbox spec
      grid: true          // Enable Grid Layout prefixing for IE
    })
  ]
};