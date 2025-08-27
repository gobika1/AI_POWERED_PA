module.exports = {
  // Performance optimizations for Metro bundler
  maxWorkers: require('os').cpus().length,
  
  // Optimize memory usage
  transformer: {
    // Enable parallel processing
    unstable_allowRequireContext: true,
  },
  
  // Optimize resolver
  resolver: {
    // Use platform extensions for faster resolution
    platforms: ['ios', 'android', 'native', 'web'],
    // Optimize module resolution
    resolverMainFields: ['react-native', 'browser', 'main'],
  },
};
