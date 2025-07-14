const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get the default Expo metro config
const config = getDefaultConfig(__dirname);

// Monorepo configuration
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Use alias to ensure React and React Native resolve correctly
config.resolver.alias = {
  'react': path.resolve(workspaceRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

// Only handle expo resolution
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo/package.json') {
    return {
      filePath: path.resolve(projectRoot, 'node_modules/expo/package.json'),
      type: 'sourceFile',
    };
  }
  
  // Default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;