# Technology Stack

## Runtime & Languages
- **Node.js**: v22.x runtime for Lambda functions
- **JavaScript**: ES modules (.mjs) and CommonJS
- **Terraform**: Infrastructure as Code (IaC)

## AWS Services
- **Lambda**: Serverless compute functions
- **API Gateway**: REST API with regional endpoints
- **DynamoDB**: NoSQL database for restaurant data
- **Cognito**: User authentication and authorization
- **CloudWatch**: Logging and monitoring

## Key Dependencies
- `@aws-sdk/client-dynamodb` & `@aws-sdk/lib-dynamodb`: AWS SDK v3
- `aws4fetch`: AWS request signing
- `mustache`: Template rendering

## Build System
Each Lambda function has its own `package.json` with a `build` script:
```bash
npm run build  # Installs production dependencies only
```

## Common Commands

### Development
```bash
# Seed database with sample data
npm run dev

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
