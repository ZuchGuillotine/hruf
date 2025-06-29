const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

// Watch for changes in shared packages
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Ensure Metro can resolve our shared packages
config.resolver.alias = {
  '@hruf/shared-types': path.resolve(workspaceRoot, 'packages/shared-types/src'),
  '@hruf/utils': path.resolve(workspaceRoot, 'packages/utils/src'),
};

module.exports = config;