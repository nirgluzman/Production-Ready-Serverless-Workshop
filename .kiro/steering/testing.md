# Testing Strategy

## Testing Framework
- **Vitest**: Modern testing framework with native ES modules support
- **Test Environment**: Node.js environment for serverless functions
- **Configuration**: `vitest.config.mjs` with environment variable loading

## Test Types

### Integration Tests (`[int]`)
- **Purpose**: Test Lambda handlers directly without HTTP layer
- **Mode**: `TEST_MODE=handler`
- **Command**: `npm run test:integration`
- **Focus**: Business logic, AWS service integrations, data transformations

### End-to-End Tests (`[e2e]`)
- **Purpose**: Test complete HTTP request/response cycle
- **Mode**: `TEST_MODE=http`
- **Command**: `npm run test:e2e`
- **Focus**: API Gateway integration, authentication, full user workflows

## Test Structure

### Test Utilities (`tests/steps/`)
- **`given.mjs`**: Test data setup and preconditions
- **`when.mjs`**: Test actions and API calls
- **`init.mjs`**: Test environment initialization
- **`teardown.mjs`**: Test cleanup and resource disposal

### Test Cases (`tests/test_cases/`)
- **Naming**: `{function-name}.test.mjs`
- **Organization**: One test file per Lambda function
- **Coverage**: Both integration and e2e tests in same file

## Testing Dependencies
- **`cheerio`**: HTML parsing and DOM manipulation for frontend tests
- **`chance`**: Random data generation for test scenarios
- **`lodash`**: Utility functions for data manipulation
- **`@aws-sdk/*`**: AWS service clients for setup/teardown

## Best Practices
- Use descriptive test names with `[int]` or `[e2e]` tags
- Separate test setup (given) from actions (when) and assertions
- Clean up resources after tests to avoid interference
- Use environment variables for configuration (loaded via Vitest config)
- Test both success and error scenarios
- Mock external dependencies when appropriate

## Environment Setup
Tests automatically load environment variables from `.env` file via Vitest configuration, ensuring consistent test environment setup.
