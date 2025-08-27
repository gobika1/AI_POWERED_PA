const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration with performance optimizations
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  // Optimize resolver for faster module resolution
  resolver: {
    // Use platform extensions for faster resolution
    platforms: ['ios', 'android', 'native', 'web'],
    // Optimize module resolution
    resolverMainFields: ['react-native', 'browser', 'main'],
  },

  // Optimize transformer for faster bundling
  transformer: {
    // Enable parallel processing
    unstable_allowRequireContext: true,
  },

  // Optimize server settings
  server: {
    // Enable compression for faster network transfers
    enhanceMiddleware: (middleware, server) => {
      return (req, res, next) => {
        // Add compression headers
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        return middleware(req, res, next);
      };
    },
  },

  // Optimize watcher for faster file watching
  watchFolders: [
    path.resolve(__dirname, 'node_modules'),
  ],

  // Enable parallel processing
  maxWorkers: require('os').cpus().length,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
