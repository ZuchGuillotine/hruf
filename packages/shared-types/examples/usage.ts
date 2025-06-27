/**
 * Example usage of @hruf/shared-types package
 * This file demonstrates how to import and use the shared types and schemas
 */

// Database schema imports
import { 
  users, 
  supplements, 
  labResults, 
  biomarkerResults 
} from '@hruf/shared-types/database';

// Type imports
import type { 
  SelectUser, 
  InsertUser, 
  SelectSupplement, 
  BiomarkerDataPoint,
  ChartApiResponse,
  UserProfile 
} from '@hruf/shared-types';

// Zod schema imports
import { 
  insertUserSchema, 
  selectUserSchema 
} from '@hruf/shared-types/database';

// Example 1: Using database schemas with Drizzle
async function createUser(userData: InsertUser) {
  // Validate data with Zod schema
  const validatedData = insertUserSchema.parse(userData);
  
  // Use with Drizzle ORM (pseudo code)
  // const newUser = await db.insert(users).values(validatedData).returning();
  
  return validatedData;
}

// Example 2: Type-safe API response
function formatChartResponse(biomarkers: BiomarkerDataPoint[]): ChartApiResponse {
  return {
    success: true,
    data: biomarkers,
    pagination: {
      page: 1,
      pageSize: biomarkers.length,
      total: biomarkers.length
    }
  };
}

// Example 3: Using type guards
function isValidUser(user: any): user is SelectUser {
  return typeof user === 'object' && 
         typeof user.id === 'number' && 
         typeof user.email === 'string';
}

// Example 4: Creating chart data
const sampleBiomarkerData: BiomarkerDataPoint[] = [
  {
    name: "HDL Cholesterol",
    value: 65,
    unit: "mg/dL",
    testDate: "2024-01-15",
    category: "lipid",
    referenceRange: "40-60 mg/dL"
  },
  {
    name: "LDL Cholesterol", 
    value: 95,
    unit: "mg/dL",
    testDate: "2024-01-15",
    category: "lipid",
    referenceRange: "<100 mg/dL"
  }
];

// Example 5: User profile
const userProfile: UserProfile = {
  id: 1,
  username: "john_doe",
  email: "john@example.com",
  name: "John Doe",
  phoneNumber: "+1234567890",
  subscriptionTier: "pro",
  isAdmin: false,
  emailVerified: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
};

export {
  createUser,
  formatChartResponse,
  isValidUser,
  sampleBiomarkerData,
  userProfile
};