import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '../apps/web/client/src/components/ui');
const DEST_DIR = path.join(__dirname, '../packages/ui/src/components');
const INDEX_FILE = path.join(__dirname, '../packages/ui/src/index.ts');

function pascalToKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function getComponentName(filename) {
  return path.basename(filename, '.tsx');
}

function updateImports(content, componentName) {
  // Update @/lib/utils to relative import
  content = content.replace(/@\/lib\/utils/g, '../../lib/utils');
  // Update @/types to relative import
  content = content.replace(/@\/types/g, '../../types');
  // Update @/ to ../../ if needed
  content = content.replace(/@\//g, '../../');
  return content;
}

function migrateComponents() {
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
  }
  const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.tsx'));
  const exported = [];
  for (const file of files) {
    const componentName = getComponentName(file);
    const srcPath = path.join(SRC_DIR, file);
    const destFolder = path.join(DEST_DIR, componentName);
    const destPath = path.join(destFolder, 'index.tsx');
    if (fs.existsSync(destPath)) {
      console.log(`Skipping ${componentName}: already exists.`);
      continue;
    }
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }
    let content = fs.readFileSync(srcPath, 'utf8');
    content = updateImports(content, componentName);
    fs.writeFileSync(destPath, content, 'utf8');
    exported.push(`export * from './components/${componentName}';`);
    console.log(`Migrated: ${componentName}`);
  }
  // Update index.ts
  let indexContent = '';
  if (fs.existsSync(INDEX_FILE)) {
    indexContent = fs.readFileSync(INDEX_FILE, 'utf8');
  }
  // Remove old auto-generated exports
  indexContent = indexContent.replace(/export \* from '\.\/components\/.*';\n?/g, '');
  // Add new exports
  indexContent += '\n' + exported.join('\n') + '\n';
  fs.writeFileSync(INDEX_FILE, indexContent.trim() + '\n', 'utf8');
  console.log('Updated index.ts exports.');
}

migrateComponents(); 