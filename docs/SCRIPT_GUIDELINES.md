
# Script Guidelines

## ES Module Compatibility

This project uses ES Modules (`"type": "module"` in package.json), which affects how scripts should be written:

### Do:
- Use ES Module imports: `import { something } from './somewhere.js'`
- Include the `.js` extension in imports
- Use dynamic imports when needed: `const module = await import('./path/to/module.js')`

### Don't:
- Use CommonJS require: `const something = require('./somewhere')` ❌
- Omit file extensions in imports
- Mix import styles within the same file

### Examples

#### ✅ Correct (ES Module style):
```javascript
import { functionName } from '../path/to/module.js';

// For dynamic imports:
const { otherFunction } = await import('../path/to/other-module.js');
```

#### ❌ Incorrect (CommonJS style):
```javascript
const { functionName } = require('../path/to/module');
```

## Running Scripts

To run scripts properly:

```bash
node scripts/script-name.js
```

For TypeScript scripts:

```bash
tsx scripts/script-name.ts
```

## Troubleshooting

If you encounter "require is not defined in ES module scope" errors:
1. Convert require statements to ES Module imports
2. Ensure all imported paths include the `.js` extension 
3. For TypeScript files imported from JS, use the `.js` extension (not `.ts`) in the import path
