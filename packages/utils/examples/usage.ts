/**
 * Usage examples for @hruf/utils
 * 
 * This file demonstrates how to use the various utility functions
 * provided by the @hruf/utils package across different scenarios.
 */

import {
  // String utilities
  cn,
  capitalize,
  truncate,
  normalizeVitaminName,
  
  // Date utilities
  formatDate,
  addDays,
  isToday,
  getSummaryDateRange,
  
  // Math utilities
  clamp,
  percentage,
  average,
  calculateBMI,
  categorizeBMI,
  
  // Validation utilities
  isValidEmail,
  isStrongPassword,
  combineValidations,
  
  // Data structures
  Trie,
  LRUCache,
  levenshteinDistance,
  
  // Object and array utilities
  objectUtils,
  arrayUtils,
  
  // Constants
  CONSTANTS
} from '@hruf/utils';

// =============================================================================
// STRING UTILITIES EXAMPLES
// =============================================================================

console.log('=== String Utilities ===');

// Class name combining (great for React components with Tailwind)
const buttonClasses = cn(
  'px-4 py-2 rounded-md font-medium',
  'bg-blue-500 hover:bg-blue-600',
  'text-white',
  true && 'shadow-lg', // conditional class
  false && 'disabled' // won't be included
);
console.log('Button classes:', buttonClasses);

// Text formatting
const title = capitalize('welcome to hruf health tracking');
const displayName = truncate('This is a very long user bio that needs to be shortened for display', 50);
console.log('Formatted title:', title);
console.log('Truncated bio:', displayName);

// Supplement name normalization
const searchTerms = ['Vitamin D', 'Vit B12', 'vitamiin c', 'Omega 3'];
const normalizedTerms = searchTerms.map(normalizeVitaminName);
console.log('Normalized supplement names:', normalizedTerms);

// =============================================================================
// DATE UTILITIES EXAMPLES
// =============================================================================

console.log('\n=== Date Utilities ===');

// Date formatting and manipulation
const now = new Date();
const formattedDate = formatDate(now, 'local');
const nextWeek = addDays(now, 7);
const isCurrentDay = isToday(now);

console.log('Current date formatted:', formattedDate);
console.log('Next week:', formatDate(nextWeek, 'local'));
console.log('Is today?', isCurrentDay);

// Date ranges for summaries
const weeklyRange = getSummaryDateRange('weekly');
const dailyRange = getSummaryDateRange('daily');

console.log('Weekly range:', {
  start: formatDate(weeklyRange.startDate, 'local'),
  end: formatDate(weeklyRange.endDate, 'local')
});

// =============================================================================
// MATHEMATICAL UTILITIES EXAMPLES
// =============================================================================

console.log('\n=== Mathematical Utilities ===');

// Health metrics
const weight = 70; // kg
const height = 1.75; // meters
const bmi = calculateBMI(weight, height);
const bmiCategory = categorizeBMI(bmi);

console.log(`BMI: ${bmi} (${bmiCategory})`);

// Statistical calculations
const bloodPressureReadings = [120, 118, 125, 122, 119, 121, 123];
const avgBP = average(bloodPressureReadings);
const clampedReading = clamp(145, 90, 140); // Clamp high reading to safe range

console.log('Average blood pressure:', avgBP);
console.log('Clamped reading:', clampedReading);

// Progress tracking
const completedGoals = 7;
const totalGoals = 10;
const progressPercent = percentage(completedGoals, totalGoals);

console.log(`Progress: ${progressPercent}% (${completedGoals}/${totalGoals} goals)`);

// =============================================================================
// VALIDATION UTILITIES EXAMPLES
// =============================================================================

console.log('\n=== Validation Utilities ===');

// User registration validation
const userEmail = 'user@hruf.com';
const userPassword = 'SecurePassword123!';

const emailValidation = isValidEmail(userEmail);
const passwordValidation = isStrongPassword(userPassword);

const registrationValidation = combineValidations([
  emailValidation,
  passwordValidation
]);

console.log('Email validation:', emailValidation);
console.log('Password validation:', passwordValidation);
console.log('Registration valid:', registrationValidation.isValid);

// =============================================================================
// DATA STRUCTURES EXAMPLES
// =============================================================================

console.log('\n=== Data Structures ===');

// Supplement search with Trie
interface Supplement {
  name: string;
  id: number;
  category: string;
  dosage: string;
}

const supplementTrie = new Trie<Supplement>();

// Load supplement data
const supplements: Supplement[] = [
  { name: 'Vitamin D3', id: 1, category: 'Vitamin', dosage: '1000 IU' },
  { name: 'Vitamin B12', id: 2, category: 'Vitamin', dosage: '500 mcg' },
  { name: 'Vitamin C', id: 3, category: 'Vitamin', dosage: '1000 mg' },
  { name: 'Omega-3 Fish Oil', id: 4, category: 'Fatty Acid', dosage: '1000 mg' },
  { name: 'Magnesium Glycinate', id: 5, category: 'Mineral', dosage: '400 mg' }
];

supplementTrie.loadItems(supplements);

// Search for supplements
const vitaminSearch = supplementTrie.search('vit', 3);
const omegaSearch = supplementTrie.search('omega', 2);

console.log('Vitamin search results:', vitaminSearch.map(s => s.name));
console.log('Omega search results:', omegaSearch.map(s => s.name));

// String similarity for fuzzy matching
const similarity1 = levenshteinDistance('vitamin', 'vitamine'); // Should be 1
const similarity2 = levenshteinDistance('omega', 'omaga'); // Should be 1

console.log('Similarity scores:', { similarity1, similarity2 });

// LRU Cache for expensive operations
const expensiveCalculationCache = new LRUCache<string, number>(5);

// Simulate expensive calculations
function expensiveHealthCalculation(params: string): number {
  // Check cache first
  const cached = expensiveCalculationCache.get(params);
  if (cached !== undefined) {
    console.log('Cache hit for:', params);
    return cached;
  }
  
  // Simulate expensive calculation
  console.log('Computing for:', params);
  const result = Math.random() * 100;
  expensiveCalculationCache.set(params, result);
  return result;
}

// Test cache
expensiveHealthCalculation('user123-bmi');
expensiveHealthCalculation('user123-calories');
expensiveHealthCalculation('user123-bmi'); // Should hit cache

// =============================================================================
// OBJECT AND ARRAY UTILITIES EXAMPLES
// =============================================================================

console.log('\n=== Object and Array Utilities ===');

// Health data processing
const healthData = [
  { date: '2023-01-01', weight: 70, steps: 8000 },
  { date: '2023-01-02', weight: 69.8, steps: 9500 },
  { date: '2023-01-03', weight: 69.5, steps: 7200 },
  { date: '2023-01-04', weight: 69.7, steps: 10200 }
];

// Group by week
const groupedByWeek = arrayUtils.groupBy(healthData, (entry) => {
  const date = new Date(entry.date);
  const weekStart = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
  return `week-${weekStart}`;
});

// Get unique step counts
const stepCounts = healthData.map(d => d.steps);
const uniqueSteps = arrayUtils.unique(stepCounts);

// Chunk data for pagination
const chunkedData = arrayUtils.chunk(healthData, 2);

console.log('Grouped health data keys:', Object.keys(groupedByWeek));
console.log('Unique step counts:', uniqueSteps);
console.log('Chunked data length:', chunkedData.length);

// Safe object operations
const userProfile = {
  name: 'John Doe',
  age: 30,
  preferences: {
    notifications: {
      email: true,
      push: false
    }
  }
};

const emailPref = objectUtils.get(userProfile, 'preferences.notifications.email', false);
const missingPref = objectUtils.get(userProfile, 'preferences.privacy.data', 'default');

console.log('Email preference:', emailPref);
console.log('Missing preference (with default):', missingPref);

// =============================================================================
// CONSTANTS USAGE
// =============================================================================

console.log('\n=== Constants ===');

console.log('Available date formats:', CONSTANTS.DATE_FORMATS);
console.log('BMI categories:', CONSTANTS.BMI_CATEGORIES);
console.log('Validation limits:', CONSTANTS.VALIDATION);

// =============================================================================
// REAL-WORLD HEALTH APP SCENARIO
// =============================================================================

console.log('\n=== Real-world Health App Scenario ===');

// Simulate processing a user's daily health log
function processHealthLog(userInput: {
  date: string;
  weight?: string;
  supplements: string[];
  mood: string;
  notes?: string;
}) {
  console.log('Processing health log for:', userInput.date);
  
  // Validate and format date
  const logDate = new Date(userInput.date);
  const formattedLogDate = formatDate(logDate, 'local');
  
  // Process weight if provided
  let processedWeight: number | null = null;
  if (userInput.weight) {
    const weight = parseFloat(userInput.weight);
    if (!isNaN(weight)) {
      processedWeight = clamp(weight, 30, 300); // Reasonable weight range
    }
  }
  
  // Normalize supplement names for consistent storage
  const normalizedSupplements = userInput.supplements
    .map(normalizeVitaminName)
    .filter(Boolean);
  
  // Validate and sanitize notes
  const mood = capitalize(userInput.mood.toLowerCase());
  const notes = userInput.notes ? truncate(userInput.notes.trim(), 500) : '';
  
  // Calculate days since start of tracking (example: Jan 1, 2023)
  const trackingStart = new Date('2023-01-01');
  const daysSinceStart = Math.floor((logDate.getTime() - trackingStart.getTime()) / (24 * 60 * 60 * 1000));
  
  return {
    date: formattedLogDate,
    weight: processedWeight,
    supplements: normalizedSupplements,
    mood,
    notes,
    daysSinceStart,
    isToday: isToday(logDate)
  };
}

// Example usage
const userLog = processHealthLog({
  date: '2023-06-15',
  weight: '72.5',
  supplements: ['Vitamin D', 'Omega 3', 'Vit B12'],
  mood: 'energetic',
  notes: 'Felt great today! Had a good workout and ate well. Looking forward to tomorrow\'s activities.'
});

console.log('Processed health log:', userLog);

console.log('\n=== Example Complete ===');