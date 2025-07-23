# Technology Stack

## Runtime & Languages
- **Node.js**: Runtime for Lambda functions
- **JavaScript**: CommonJS modules (.js) - all Lambda functions use CommonJS
- **Terraform**: Infrastructure as Code (IaC)

## AWS Services
- **Lambda**: Serverless compute functions
- **API Gateway**: REST API with regional endpoints
- **DynamoDB**: NoSQL database for restaurant data
- **Cognito**: User authentication and authorization
- **CloudWatch**: Logging and monitoring
- **S3**: Terraform state storage
- **SSM**: Parameter Store for configuration

## Key Dependencies
- `@aws-sdk/client-dynamodb` & `@aws-sdk/lib-dynamodb`: AWS SDK v3
- `@aws-sdk/client-cognito-identity-provider`: Cognito operations
- `@aws-sdk/client-ssm`: Parameter Store access
- `@middy/core` & `@middy/ssm`: Lambda middleware framework
- `aws4fetch`: AWS request signing
- `mustache`: Template rendering
- `vitest`: Testing framework
- `cheerio`: HTML parsing for tests
- `chance`: Random data generation

## Build System
Each Lambda function has its own `package.json` with a `build` script:
```bash
npm run build  # Installs production dependencies only (npm ci --omit=dev)
```

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
npm run test:integration

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
