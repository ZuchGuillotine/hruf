# Integration Guide for @hruf/utils

This guide explains how to integrate the `@hruf/utils` package into your HRUF web and mobile applications.

## Quick Start

### Installation

Since this is a workspace package, it's automatically available in the monorepo:

```bash
# Already available in the monorepo workspace
npm install  # or npm run build to ensure it's built
```

### Basic Usage

```typescript
// Import specific utilities
import { cn, formatDate, isValidEmail } from '@hruf/utils';

// Or import from specific modules for tree-shaking
import { cn } from '@hruf/utils/string';
import { formatDate } from '@hruf/utils/date';
import { isValidEmail } from '@hruf/utils/validation';
```

## Migration Guide

### From Existing Client Utils

**Before:**
```typescript
// client/src/lib/utils.ts
import { cn } from '@/lib/utils';
```

**After:**
```typescript
// Import from shared package
import { cn } from '@hruf/utils';
```

### From Existing Server Utils

**Before:**
```typescript
// server/utils/dateUtils.ts
import { formatDate } from '../utils/dateUtils';
```

**After:**
```typescript
// Import from shared package
import { formatDate } from '@hruf/utils';
```

## Integration Steps

### 1. Update Package Dependencies

Add the utils package to your application's dependencies:

```json
// client/package.json or mobile/package.json
{
  "dependencies": {
    "@hruf/utils": "workspace:*"
  }
}
```

### 2. Update Import Statements

Replace existing utility imports with the new shared package:

```typescript
// Old imports
import { cn } from '../lib/utils';
import { formatDate } from '../utils/dateUtils';
import { Trie } from '../utils/trie';

// New imports
import { cn, formatDate, Trie } from '@hruf/utils';
```

### 3. Update TypeScript Configuration

Ensure your TypeScript configuration can resolve the workspace package:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@hruf/utils": ["../packages/utils/src"],
      "@hruf/utils/*": ["../packages/utils/src/*"]
    }
  }
}
```

### 4. Remove Duplicate Utilities

After migration, remove the original utility files:

```bash
# Remove old client utilities (after migration)
rm client/src/lib/utils.ts

# Remove old server utilities (after migration)
rm server/utils/dateUtils.ts
rm server/utils/trie.ts
```

## Framework-Specific Integration

### React/Next.js (Web Client)

```typescript
// components/ui/Button.tsx
import { cn } from '@hruf/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium',
          'disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-blue-500 text-white hover:bg-blue-600': variant === 'primary',
            'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
```

### React Native (Mobile)

```typescript
// components/HealthMetrics.tsx
import { calculateBMI, categorizeBMI, formatDate } from '@hruf/utils';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HealthMetricsProps {
  weight: number; // kg
  height: number; // meters
  lastUpdated: Date;
}

export const HealthMetrics: React.FC<HealthMetricsProps> = ({
  weight,
  height,
  lastUpdated,
}) => {
  const bmi = calculateBMI(weight, height);
  const bmiCategory = categorizeBMI(bmi);
  const formattedDate = formatDate(lastUpdated, 'local');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Health Metrics</Text>
      <View style={styles.metric}>
        <Text style={styles.label}>BMI:</Text>
        <Text style={styles.value}>{bmi}</Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.label}>Category:</Text>
        <Text style={styles.value}>{bmiCategory}</Text>
      </View>
      <Text style={styles.updated}>Last updated: {formattedDate}</Text>
    </View>
  );
};
```

### Express Server (API)

```typescript
// server/routes/health.ts
import { isValidRange, formatDate, ValidationError } from '@hruf/utils';
import { Request, Response } from 'express';

export const updateHealthStats = async (req: Request, res: Response) => {
  try {
    const { weight, height, bloodPressureSystolic } = req.body;

    // Validate inputs using shared validation utilities
    const weightValidation = isValidRange(weight, 30, 300, 'Weight');
    const heightValidation = isValidRange(height, 0.5, 2.5, 'Height');
    const bpValidation = isValidRange(bloodPressureSystolic, 70, 200, 'Blood Pressure');

    if (!weightValidation.isValid) {
      throw new ValidationError('Invalid weight', [weightValidation.message!]);
    }
    if (!heightValidation.isValid) {
      throw new ValidationError('Invalid height', [heightValidation.message!]);
    }
    if (!bpValidation.isValid) {
      throw new ValidationError('Invalid blood pressure', [bpValidation.message!]);
    }

    // Process the health data
    const updatedAt = formatDate(new Date(), 'iso');
    
    // Save to database...
    // const healthStats = await db.healthStats.update(...)

    res.json({
      success: true,
      data: {
        weight,
        height,
        bloodPressureSystolic,
        updatedAt
      }
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        message: error.message,
        errors: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};
```

## Advanced Usage Patterns

### Supplement Search with Trie

```typescript
// services/supplementSearchService.ts
import { Trie, type TrieSearchable } from '@hruf/utils';

interface Supplement extends TrieSearchable {
  name: string;
  id: number;
  category: string;
  brand?: string;
  dosage?: string;
}

class SupplementSearchService {
  private trie = new Trie<Supplement>();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    // Load supplements from database
    const supplements = await this.loadSupplementsFromDB();
    this.trie.loadItems(supplements);
    this.initialized = true;
  }

  search(query: string, limit: number = 5): Supplement[] {
    if (!this.initialized) {
      throw new Error('Search service not initialized');
    }
    return this.trie.search(query, limit);
  }

  private async loadSupplementsFromDB(): Promise<Supplement[]> {
    // Implementation depends on your database
    // Return supplement data with proper interface
    return [];
  }
}
```

### Form Validation Hook (React)

```typescript
// hooks/useFormValidation.ts
import { useState, useMemo } from 'react';
import { 
  isValidEmail, 
  isStrongPassword, 
  isRequired,
  combineValidations,
  type ValidationResult 
} from '@hruf/utils';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export const useFormValidation = (formData: FormData) => {
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});

  const validations = useMemo(() => {
    const emailValidation = isValidEmail(formData.email);
    const passwordValidation = isStrongPassword(formData.password);
    const confirmPasswordValidation = formData.password === formData.confirmPassword
      ? { isValid: true }
      : { isValid: false, message: 'Passwords do not match' };

    return {
      email: emailValidation,
      password: passwordValidation,
      confirmPassword: confirmPasswordValidation,
      overall: combineValidations([emailValidation, passwordValidation, confirmPasswordValidation])
    };
  }, [formData]);

  const getFieldError = (field: keyof FormData): string | undefined => {
    if (!touched[field]) return undefined;
    return validations[field].message;
  };

  const setFieldTouched = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  return {
    validations,
    getFieldError,
    setFieldTouched,
    isValid: validations.overall.isValid,
    errors: validations.overall.errors
  };
};
```

### Health Calculations Utility

```typescript
// utils/healthCalculations.ts
import { 
  calculateBMI, 
  categorizeBMI, 
  clamp, 
  percentage,
  average 
} from '@hruf/utils';

export class HealthCalculations {
  static calculateHealthScore(metrics: {
    weight: number;
    height: number;
    steps: number;
    sleepHours: number;
    exerciseMinutes: number;
  }): {
    bmi: number;
    bmiCategory: string;
    activityScore: number;
    sleepScore: number;
    overallScore: number;
  } {
    const bmi = calculateBMI(metrics.weight, metrics.height);
    const bmiCategory = categorizeBMI(bmi);

    // Activity score based on steps and exercise
    const stepScore = clamp(percentage(metrics.steps, 10000), 0, 100);
    const exerciseScore = clamp(percentage(metrics.exerciseMinutes, 30), 0, 100);
    const activityScore = average([stepScore, exerciseScore]);

    // Sleep score
    const optimalSleep = 8;
    const sleepScore = 100 - Math.abs(metrics.sleepHours - optimalSleep) * 12.5;
    const clampedSleepScore = clamp(sleepScore, 0, 100);

    // BMI score (closer to normal weight = higher score)
    let bmiScore = 100;
    if (bmi < 18.5) bmiScore = 70; // underweight
    else if (bmi >= 25 && bmi < 30) bmiScore = 80; // overweight
    else if (bmi >= 30) bmiScore = 60; // obese

    const overallScore = average([activityScore, clampedSleepScore, bmiScore]);

    return {
      bmi,
      bmiCategory,
      activityScore: Math.round(activityScore),
      sleepScore: Math.round(clampedSleepScore),
      overallScore: Math.round(overallScore)
    };
  }
}
```

## Performance Considerations

### Tree Shaking

Import only what you need for optimal bundle size:

```typescript
// Good - only imports specific functions
import { cn, capitalize } from '@hruf/utils/string';
import { formatDate } from '@hruf/utils/date';

// Less optimal - imports entire package
import { cn, capitalize, formatDate } from '@hruf/utils';
```

### Caching Expensive Operations

Use the LRUCache for expensive calculations:

```typescript
import { LRUCache } from '@hruf/utils';

const healthCalculationCache = new LRUCache<string, any>(100);

function expensiveHealthCalculation(userId: string, data: any) {
  const cacheKey = `${userId}-${JSON.stringify(data)}`;
  
  const cached = healthCalculationCache.get(cacheKey);
  if (cached) return cached;
  
  // Perform expensive calculation
  const result = /* ... */;
  
  healthCalculationCache.set(cacheKey, result);
  return result;
}
```

## Testing

### Unit Testing Utilities

```typescript
// __tests__/healthUtils.test.ts
import { calculateBMI, categorizeBMI } from '@hruf/utils';

describe('Health Calculations', () => {
  describe('BMI calculations', () => {
    it('should calculate BMI correctly', () => {
      expect(calculateBMI(70, 1.75)).toBeCloseTo(22.86, 2);
      expect(calculateBMI(80, 1.8)).toBeCloseTo(24.69, 2);
    });

    it('should categorize BMI correctly', () => {
      expect(categorizeBMI(18)).toBe('Underweight');
      expect(categorizeBMI(22)).toBe('Normal weight');
      expect(categorizeBMI(27)).toBe('Overweight');
      expect(categorizeBMI(32)).toBe('Obese');
    });
  });
});
```

## Troubleshooting

### Common Issues

1. **Module Resolution Error**
   ```
   Cannot find module '@hruf/utils'
   ```
   **Solution:** Ensure workspace is properly installed: `npm install`

2. **TypeScript Import Errors**
   ```
   Module '"@hruf/utils"' has no exported member 'someFunction'
   ```
   **Solution:** Check the export in `/packages/utils/src/index.ts`

3. **Build Errors**
   ```
   Package '@hruf/utils' not found
   ```
   **Solution:** Build the utils package first: `npm run build` in `/packages/utils`

### Development Workflow

1. Make changes to utils package
2. Build the package: `cd packages/utils && npm run build`
3. Test changes in your application
4. Run tests: `npm test` in utils package
5. Update version and changelog when ready

## Contributing

When adding new utilities:

1. Add the function to the appropriate module (`string.ts`, `date.ts`, etc.)
2. Export it from the module
3. Add it to the main `index.ts` exports
4. Write comprehensive tests
5. Update documentation with examples
6. Update the CHANGELOG.md

## Support

For questions or issues with the utils package:

1. Check this integration guide
2. Review the main README.md
3. Look at the examples in `/packages/utils/examples/`
4. Check existing tests for usage patterns