import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '../apps/web/client/src/components');
const DEST_DIR = path.join(__dirname, '../packages/shared-components/src/components');

// Component categorization
const componentCategories = {
  auth: ['SignupForm', 'AccountInfo'],
  biomarkers: ['BiomarkerHistoryChart', 'BiomarkerFilter'],
  supplements: ['supplement-form', 'supplement-list', 'supplement-search'],
  subscription: ['PaymentOptionsModal', 'SubscriptionCheck'],
  layout: ['header', 'footer', 'mobile-nav', 'landing-header'],
  other: [] // For components that don't fit other categories
};

function getComponentCategory(filename) {
  const name = path.basename(filename, '.tsx');
  for (const [category, components] of Object.entries(componentCategories)) {
    if (components.includes(name)) {
      return category;
    }
  }
  return 'other';
}

function updateImports(content, componentName) {
  // Update @/lib/utils to relative import
  content = content.replace(/@\/lib\/utils/g, '../../../lib/utils');
  // Update @/types to relative import
  content = content.replace(/@\/types/g, '../../../types');
  // Update @/ to ../../../ if needed
  content = content.replace(/@\//g, '../../../');
  return content;
}

function createSharedComponentStructure(componentName, category, content) {
  const componentDir = path.join(DEST_DIR, category, componentName);
  const typesPath = path.join(componentDir, 'types.ts');
  const indexPath = path.join(componentDir, 'index.tsx');
  const nativePath = path.join(componentDir, 'native.tsx');

  // Create component directory
  fs.mkdirSync(componentDir, { recursive: true });

  // Create types.ts with basic interface
  const typesContent = `export interface ${componentName}Props {
  // Add shared props here
}

export interface ${componentName}State {
  // Add shared state here
}
`;
  fs.writeFileSync(typesPath, typesContent);

  // Create index.tsx with platform-agnostic logic
  const indexContent = `import { ${componentName}Props, ${componentName}State } from './types';

// Platform-agnostic logic and types
export const ${componentName} = (props: ${componentName}Props) => {
  // Add shared logic here
  return null;
};
`;
  fs.writeFileSync(indexPath, indexContent);

  // Create native.tsx with React Native implementation
  const nativeContent = `import { ${componentName}Props } from './types';
import { ${componentName} as WebComponent } from '../../../../apps/web/client/src/components/${componentName}';

// React Native implementation
export const ${componentName} = (props: ${componentName}Props) => {
  // TODO: Implement React Native version
  // For now, we can use the web component as a reference
  return null;
};
`;
  fs.writeFileSync(nativePath, nativeContent);

  // Create category index.ts if it doesn't exist
  const categoryIndexPath = path.join(DEST_DIR, category, 'index.ts');
  if (!fs.existsSync(categoryIndexPath)) {
    fs.writeFileSync(categoryIndexPath, '// Export components from this category\n');
  }

  // Update category index.ts
  let categoryIndexContent = fs.readFileSync(categoryIndexPath, 'utf8');
  if (!categoryIndexContent.includes(`export * from './${componentName}'`)) {
    categoryIndexContent += `export * from './${componentName}';\n`;
    fs.writeFileSync(categoryIndexPath, categoryIndexContent);
  }
}

function migrateComponents() {
  // Read all .tsx files from source directory
  const files = fs.readdirSync(SRC_DIR)
    .filter(f => f.endsWith('.tsx') && !f.endsWith('.test.tsx'));

  for (const file of files) {
    const componentName = path.basename(file, '.tsx');
    const category = getComponentCategory(file);
    const srcPath = path.join(SRC_DIR, file);
    
    console.log(`Migrating ${componentName} to ${category} category...`);
    
    // Read the original component
    const content = fs.readFileSync(srcPath, 'utf8');
    
    // Create the shared component structure
    createSharedComponentStructure(componentName, category, content);
    
    console.log(`✓ Migrated ${componentName}`);
  }

  // Update main index.ts
  const mainIndexPath = path.join(DEST_DIR, '..', 'index.ts');
  let mainIndexContent = '// Export all components\n\n';
  
  // Add exports for each category
  for (const category of Object.keys(componentCategories)) {
    mainIndexContent += `export * from './components/${category}';\n`;
  }
  
  fs.writeFileSync(mainIndexPath, mainIndexContent);
  console.log('Updated main index.ts with all component exports');
}

// Run the migration
migrateComponents(); 