
// jest.config.js

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    // Match the path aliases in tsconfig.json
    '^@db$': '<rootDir>/db/index.ts',
    '^@db/schema$': '<rootDir>/db/schema.ts',
    '^@db/(.*)$': '<rootDir>/db/$1',
    '^@server/(.*)$': '<rootDir>/server/$1'
  },
  setupFilesAfterEnv: [
    '<rootDir>/server/tests/setup.ts'
  ],
  testMatch: [
    '**/server/tests/**/*.test.ts'
  ],
  verbose: true,
  testTimeout: 10000, // 10 second timeout for tests
  collectCoverage: true,
  collectCoverageFrom: [
    'server/services/**/*.ts',
    'server/cron/**/*.ts',
    'server/openai.ts',
    '!**/node_modules/**'
  ],
  coverageDirectory: './coverage'
};
