# Technology Stack

## Runtime & Languages
- **Node.js**: Runtime for Lambda functions
- **JavaScript**: ES modules (.mjs) - all Lambda functions use ES modules with import/export syntax
- **Terraform**: Infrastructure as Code (IaC)

## AWS Services
- **Lambda**: Serverless compute functions with async event configuration
- **API Gateway**: REST API with regional endpoints and CORS
- **DynamoDB**: NoSQL database for restaurant, order, and idempotency data
- **Cognito**: User authentication with SRP protocol and JWT tokens
- **EventBridge**: Custom event bus for order processing events
- **SNS**: Topics for restaurant and user notifications
- **SQS**: Dead letter queues and E2E test queues
- **Step Functions**: State machine for complex order workflows
- **CloudWatch**: Logging, monitoring, and alarms
- **S3**: Terraform state storage
- **SSM**: Parameter Store for configuration with KMS encryption
- **KMS**: Key management for encrypted parameters

## Key Dependencies

### Lambda Function Dependencies
- `@aws-lambda-powertools/logger`: Structured logging with JSON output
- `@aws-lambda-powertools/tracer`: X-Ray distributed tracing wrapper
- `@middy/core`: Lambda middleware engine for common tasks
- `@middy/ssm`: SSM Parameter Store middleware for Middy
- `aws4fetch`: AWS request signing for authenticated API calls
- `mustache`: Template rendering for HTML responses (get-index function)

### AWS SDK v3 (Testing Dependencies)
- `@aws-sdk/client-dynamodb` & `@aws-sdk/lib-dynamodb`: DynamoDB operations
- `@aws-sdk/client-cognito-identity-provider`: Cognito user management
- `@aws-sdk/client-eventbridge`: EventBridge event publishing
- `@aws-sdk/client-sns`: SNS notifications
- `@aws-sdk/client-sqs`: SQS queue operations for testing
- `@aws-sdk/client-ssm`: Parameter Store access
- `@aws-sdk/credential-providers`: AWS credential management

### Testing Framework Dependencies
- `vitest`: Modern testing framework with ES modules support
- `cheerio`: HTML parsing for frontend tests
- `chance`: Random data generation for test scenarios
- `lodash`: Utility functions for data manipulation
- `rxjs`: Reactive programming for async test operations (message polling)
- `cross-env`: Cross-platform environment variables

## Build System
Each Lambda function has its own `package.json` with a `build` script:
```bash
npm run build  # Installs production dependencies only (npm ci --omit=dev)
```

Terraform handles Lambda packaging automatically with build commands:
- `rm -rf node_modules` - Clean existing dependencies
- `npm run build` or `npm ci --omit=dev` - Install production dependencies
- `:zip` - Terraform special command to create deployment package

## Testing Framework
- **Vitest**: Modern testing framework with ES modules support
- **Integration Tests**: Handler-level testing (`TEST_MODE=handler`)
- **E2E Tests**: HTTP endpoint testing (`TEST_MODE=http`)

## Common Commands

### Development
```bash
# Seed database with sample data
npm run bootstrap-db

# Run integration tests
npm run test:int

# Run end-to-end tests
npm run test:e2e

# Individual Lambda function builds
cd functions/[function-name]
npm run build
```

### Infrastructure Management
```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init
terraform init -backend-config=config/dev.backend.hcl

# Plan and apply changes
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars

# Destroy resources
terraform destroy -var-file=environments/dev.tfvars
```

### Workspace Management (Ephemeral Environments)
```bash
# Create temporary environment
./script-create-temp-env.sh [env-name]

# Deploy to temporary environment
./script-deploy-temp-env.sh [env-name]

# Destroy temporary environment
./script-destroy-temp-env.sh [env-name]
```

## Configuration
- Environment variables via `.env` file
- Terraform variables in `environments/*.tfvars`
- AWS credentials via AWS CLI or environment variables
