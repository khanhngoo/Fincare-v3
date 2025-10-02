# Testing Guide for Fincare API Endpoints

## Overview

This guide explains how to set up and run tests for the Fincare application's API endpoints.

## Setup

### 1. Install Test Dependencies

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom @types/jest ts-jest
```

### 2. Configuration Files

The following files have been created for testing:

- **`jest.config.js`** - Jest configuration for Next.js
- **`jest.setup.js`** - Test environment setup
- **`__tests__/`** - Test files directory

### 3. Add Test Script

Add to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test __tests__/api/loans/calculate-baseline.test.ts
```

## Test Files Created

### 1. Calculate Baseline Test
**File:** `__tests__/api/loans/calculate-baseline.test.ts`

Tests the `/api/loans/calculate-baseline` endpoint:
- ✅ Successfully calculates baseline score with valid data
- ✅ Returns 400 when missing required fields
- ✅ Validates loan amount is positive
- ✅ Handles unauthorized requests
- ✅ Handles Gemini API errors gracefully

### 2. Save Data Test
**File:** `__tests__/api/documents/save-data.test.ts`

Tests the `/api/documents/save-data` endpoint:
- ✅ Saves business identity data
- ✅ Saves financial performance data
- ✅ Saves bank statements data
- ✅ Returns 400 for invalid category
- ✅ Returns 400 when missing required fields
- ✅ Fetches all documents for an application (GET)
- ✅ Filters by category when provided (GET)

### 3. Generate Report Test
**File:** `__tests__/api/analysis/generate-report.test.ts`

Tests the `/api/analysis/generate-report` endpoint:
- ✅ Generates new analysis report
- ✅ Returns 400 when missing required fields
- ✅ Handles Gemini API errors
- ✅ Fetches existing analysis report (GET)
- ✅ Returns 404 when report not found
- ✅ Returns 400 when missing query parameters

## Mocking Strategy

### Supabase Client
All tests mock the Supabase client to avoid hitting the actual database:

```typescript
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: jest.fn(() => ({ ... })) },
    from: jest.fn(() => ({ ... }))
  }))
}))
```

### Gemini AI
All tests mock the Gemini AI client to avoid API calls:

```typescript
jest.mock('@/lib/gemini', () => ({
  calculateBaselineScore: jest.fn(() => Promise.resolve({ ... })),
  generateTailoredAnalysis: jest.fn(() => Promise.resolve({ ... }))
}))
```

## Coverage Goals

Target coverage thresholds (set in `jest.config.js`):
- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%
- **Statements:** 70%

## Writing Additional Tests

### Test Structure

```typescript
describe('API Endpoint Name', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should do something', async () => {
    // Arrange
    const request = new NextRequest(...)

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data).toBeDefined()
  })
})
```

### Best Practices

1. **Clear Mocks Between Tests**
   ```typescript
   beforeEach(() => {
     jest.clearAllMocks()
   })
   ```

2. **Test Happy Path and Error Cases**
   - Valid input → Success
   - Invalid input → 400 error
   - Missing auth → 401 error
   - Database error → 500 error

3. **Use Descriptive Test Names**
   ```typescript
   it('should return 400 when missing required fields', async () => {
     // Test implementation
   })
   ```

4. **Test Edge Cases**
   - Empty strings
   - Negative numbers
   - Missing optional fields
   - Large data sets

## Integration Testing

For end-to-end testing, consider:
- **Playwright** or **Cypress** for browser automation
- **Supertest** for API integration tests
- Test complete user flows from loan form → analysis

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
```

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Ensure `moduleNameMapper` is correctly configured in `jest.config.js`
   - Check that `@/` alias points to project root

2. **Async test timeout**
   - Increase timeout: `jest.setTimeout(10000)` in test file
   - Ensure all promises are awaited

3. **Mock not working**
   - Place `jest.mock()` at the top of the test file
   - Use `jest.clearAllMocks()` between tests

4. **Environment variables**
   - Create `.env.test` for test environment
   - Load with `dotenv` in `jest.setup.js`

## Next Steps

### Recommended Additional Tests

1. **Upload Endpoint** (`/api/documents/upload`)
2. **Process CSV Endpoint** (`/api/documents/process`)
3. **Loan Options Endpoint** (`/api/loans/options`)
4. **Component Tests** for React components
5. **E2E Tests** for complete user journeys

### Test Data Factories

Create factories for test data:

```typescript
// __tests__/factories/loan-application.factory.ts
export const createTestApplication = (overrides = {}) => ({
  id: 'test-id',
  user_id: 'test-user-id',
  loan_amount: 50000000,
  baseline_score: 75,
  ...overrides
})
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Supabase Testing](https://supabase.com/docs/guides/testing)

## Summary

✅ **3 test files created** with 15+ test cases
✅ **Jest configuration** ready
✅ **Mocking strategy** for Supabase and Gemini
✅ **Coverage thresholds** set at 70%
✅ **CI/CD ready** for automated testing

Run `npm test` after installing dependencies to verify all tests pass!
