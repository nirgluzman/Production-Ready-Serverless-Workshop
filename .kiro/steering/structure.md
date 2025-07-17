# Project Structure

## Root Directory
```
├── functions/              # Lambda function source code
├── terraform/ain infrastructure configuration
├── terraform-bootstrap/    # Bootstrap infrastructure (S3, DynamoDB for state)
├── .env                   # Environment variables (local development)
├── package.json           # Root package.json with dev script
└── seed-restaurants.mjs   # Database seeding script
```

## Lambda Functions (`functions/`)
Each function follows a consistent structure:
```
functions/
├── get-index/             # Landing page handler
├── get-restaurants/       # Restaurant listing API
└── search-restaurants/    # Restaurant search API

# Each function contains:
├── index.mjs    # Main handler (ES modules)
├── package.json          # Function dependencies
├── node_modules/         # Dependencies (generated)
└── static/              # Static assets (if needed)
```

## Terraform Structure (`terraform/`)
```
terraform/
├── main.tf               # Core resources (DynamoDB, Cognito)
├── lambda.tf             # Lambda function definitions
├── api.tf                # API Gateway configuration
├── variables.tf          # Input variables
├── outputs.tf            # Output values
├── providers.tf          # AWS provider configuration
├── backend.tf            # Remote state configuration
├── versions.tf           # Terraform version constraints
├── environments/         # Environment-specific variables
├── config/              # Backend configuration files
├── builds/              # Lambda deployment packages (generated)
└── script-*.sh          # Workspace management scripts
```

## Naming Conventions

### Resources
- **Lambda Functions**: `${service_name}-${stage_name}-${function_name}`
- **DynamoDB Tables**: `${service_name}-${purpose}-${stage_name}`
- **API Gateway**: `${service_name}-${stage_name}`
- **Cognito User Pool**: `${service_name}-${stage_name}-UserPool`

### Files
- **Lambda Handlers**: `index.mjs` (ES modules) or `index.js` (CommonJS)
- **Terraform Files**: Descriptive names (`main.tf`, `lambda.tf`, `api.tf`)
- **Environment Files**: `${environment}.tfvars`

## Key Patterns
- Each Lambda function is self-contained with its own dependencies
- Terraform modules are used for complex resources (DynamoDB, Lambda)
- Environment-specific configuration via `.tfvars` files
- Remote state management with S3 backend and DynamoDB locking
- Workspace-based ephemeral environments for feature development
