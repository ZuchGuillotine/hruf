/**
    * @description      : 
    * @author           : 
    * @group            : 
    * @created          : 26/05/2025 - 19:37:07
    * 
    * MODIFICATION LOG
    * - Version         : 1.0.0
    * - Date            : 26/05/2025
    * - Author          : 
    * - Modification    : 
**/
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_DIR = path.join(__dirname, '../packages/shared-components');
const SRC_DIR = path.join(PACKAGE_DIR, 'src');

// Package configuration
const packageJson = {
  name: '@hruf/shared-components',
  version: '0.1.0',
  private: true,
  main: './src/index.ts',
  types: './src/index.ts',
  scripts: {
    lint: 'eslint .',
    test: 'jest',
    build: 'tsc',
    dev: 'tsc --watch'
  },
  dependencies: {
    'react': '^18.0.0',
    'react-native': '^0.72.0',
    '@hruf/ui': 'workspace:*',
    '@hruf/core': 'workspace:*'
  },
  devDependencies: {
    '@types/react': '^18.0.0',
    '@types/react-native': '^0.72.0',
    'typescript': '^5.0.0',
    'eslint': '^8.0.0',
    'jest': '^29.0.0'
  },
  peerDependencies: {
    'react': '^18.0.0',
    'react-native': '^0.72.0'
  }
};

const tsconfigJson = {
  extends: '../../tsconfig.json',
  compilerOptions: {
    outDir: './dist',
    rootDir: './src',
    baseUrl: './src'
  },
  include: ['src/**/*'],
  exclude: ['node_modules', 'dist']
};

// Directory structure
const structure = {
  'src/index.ts': '// Export all components\n',
  'src/components': {
    'auth': {
      'index.ts': '// Auth components exports\n',
      'SignupForm': {
        'index.tsx': '// Platform-agnostic types and logic\n',
        'native.tsx': '// React Native implementation\n',
        'types.ts': '// Shared types and interfaces\n'
      },
      'AccountInfo': {
        'index.tsx': '// Platform-agnostic types and logic\n',
        'native.tsx': '// React Native implementation\n',
        'types.ts': '// Shared types and interfaces\n'
      }
    },
    'biomarkers': {
      'index.ts': '// Biomarker components exports\n',
      'BiomarkerHistoryChart': {
        'index.tsx': '// Platform-agnostic types and logic\n',
        'native.tsx': '// React Native implementation\n',
        'types.ts': '// Shared types and interfaces\n'
      },
      'BiomarkerFilter': {
        'index.tsx': '// Platform-agnostic types and logic\n',
        'native.tsx': '// React Native implementation\n',
        'types.ts': '// Shared types and interfaces\n'
      }
    },
    'supplements': {
      'index.ts': '// Supplement components exports\n',
      'SupplementForm': {
        'index.tsx': '// Platform-agnostic types and logic\n',
        'native.tsx': '// React Native implementation\n',
        'types.ts': '// Shared types and interfaces\n'
      },
      'SupplementList': {
        'index.tsx': '// Platform-agnostic types and logic\n',
        'native.tsx': '// React Native implementation\n',
        'types.ts': '// Shared types and interfaces\n'
      }
    },
    'subscription': {
      'index.ts': '// Subscription components exports\n',
      'PaymentOptionsModal': {
        'index.tsx': '// Platform-agnostic types and logic\n',
        'native.tsx': '// React Native implementation\n',
        'types.ts': '// Shared types and interfaces\n'
      },
      'SubscriptionCheck': {
        'index.tsx': '// Platform-agnostic types and logic\n',
        'native.tsx': '// React Native implementation\n',
        'types.ts': '// Shared types and interfaces\n'
      }
    },
    'layout': {
      'index.ts': '// Layout components exports\n',
      'Header': {
        'index.tsx': '// Platform-agnostic types and logic\n',
        'native.tsx': '// React Native implementation\n',
        'types.ts': '// Shared types and interfaces\n'
      },
      'Footer': {
        'index.tsx': '// Platform-agnostic types and logic\n',
        'native.tsx': '// React Native implementation\n',
        'types.ts': '// Shared types and interfaces\n'
      }
    }
  }
};

function createDirectoryStructure(basePath, structure) {
  for (const [name, content] of Object.entries(structure)) {
    const fullPath = path.join(basePath, name);
    
    if (typeof content === 'string') {
      // It's a file
      fs.writeFileSync(fullPath, content);
    } else {
      // It's a directory
      fs.mkdirSync(fullPath, { recursive: true });
      createDirectoryStructure(fullPath, content);
    }
  }
}

// Create the package structure
if (!fs.existsSync(PACKAGE_DIR)) {
  fs.mkdirSync(PACKAGE_DIR, { recursive: true });
  
  // Write package.json and tsconfig.json
  fs.writeFileSync(
    path.join(PACKAGE_DIR, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  fs.writeFileSync(
    path.join(PACKAGE_DIR, 'tsconfig.json'),
    JSON.stringify(tsconfigJson, null, 2)
  );
  
  // Create the rest of the directory structure
  createDirectoryStructure(PACKAGE_DIR, structure);
  console.log('Created shared components package structure at:', PACKAGE_DIR);
} else {
  console.log('Package directory already exists at:', PACKAGE_DIR);
} 