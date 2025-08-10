# Testing Strategy

## Testing Framework
- **Vitest**: Modern testing framework with native ES modules support
- **Test Environment**: Node.js environment for serverless functions
- **Configuration**: `vitest.config.mjs` with environment variable loading

## Test Types

### Integration Tests (`[int]`)
- **Purpose**: Test Lambda handlers directly without HTTP layer
- **Mode**: `TEST_MODE=handler`
- **Command**: `npm run test:int`
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
- **Special Tests**: `notify-restaurant.idempotency.test.mjs` for idempotency testing
- **Message Testing**: `messages.mjs` for EventBridge and SNS message verification

## Testing Dependencies
- **`cheerio`**: HTML parsing and DOM manipulation for frontend tests
- **`chance`**: Random data generation for test scenarios
- **`lodash`**: Utility functions for data manipulation
- **`rxjs`**: Reactive programming for async test operations
- **`@aws-sdk/client-*`**: AWS service clients for setup/teardown
  - `client-cognito-identity-provider`: User management in tests
  - `client-dynamodb` & `lib-dynamodb`: Database operations
  - `client-eventbridge`: Event publishing verification
  - `client-sns`: SNS message verification
  - `client-sqs`: Queue message polling for E2E tests
  - `client-ssm`: Parameter Store access
- **`aws4fetch`**: AWS request signing for authenticated API calls

## Best Practices
- Use descriptive test names with `[int]` or `[e2e]` tags
- Separate test setup (given) from actions (when) and assertions
- Clean up resources after tests to avoid interference
- Use environment variables for configuration (loaded via Vitest config)
- Test both success and error scenarios
- Mock external dependencies when appropriate
- Test idempotency for event-driven functions
- Verify EventBridge events and SNS messages in E2E tests
- Use temporary environments for isolated testing

## Event-Driven Testing
- **EventBridge Verification**: Tests capture and verify events published to custom bus
- **SNS Message Testing**: E2E tests verify restaurant notifications via SQS subscriptions
- **Idempotency Testing**: Specialized tests ensure duplicate events are handled correctly
- **Message Polling**: Tests use SQS polling to verify async event processing

## Environment Setup
Tests automatically load environment variables from `.env` file via Vitest configuration, ensuring consistent test environment setup. E2E tests require deployed infrastructure with temporary SQS queues for message verification.
