
# Testing Framework

This directory contains automated tests for the backend services of our application.

## Test Structure

- **Unit Tests**: Test individual functions and services in isolation
- **Integration Tests**: Test services working together
- **Mock Tests**: Use Jest mocks to simulate dependencies

## Running Tests

Run all tests:
```
npm test
```

Run specific test suites:
```
npm run test:summary     # Test summary services
npm run test:embedding   # Test embedding services
npm run test:context     # Test context building services
npm run test:openai      # Test OpenAI integration
```

Run tests in watch mode (automatically re-runs when files change):
```
npm run test:watch
```

## Adding New Tests

1. Create a new file named `[feature].test.ts` in this directory
2. Import the services you want to test
3. Structure tests with `describe` and `test` blocks
4. Use `expect()` to make assertions about behavior

## Mock Data

When testing services that require database access, consider:
1. Using the existing test helpers in `setup.ts`
2. Creating specific test fixtures for your service
3. Using in-memory data when possible to avoid database dependencies

## Best Practices

1. Keep tests independent - each test should run in isolation
2. Clean up test data after tests run
3. Mock external services like OpenAI API for reliable testing
4. Use descriptive test names that explain what is being tested
