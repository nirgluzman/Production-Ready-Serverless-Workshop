# Project Structure

## Root Directory

```
├── .github/                # GitHub Actions workflows and CI/CD configuration
├── functions/              # Lambda function source code
├── terraform/              # Main infrastructure configuration
├── terraform-bootstrap/    # Bootstrap infrastructure (S3, DynamoDB for state)
├── tests/                  # Test files and utilities
├── .env                    # Environment variables (local development)
├── package.json            # Root package.json with test scripts
├── seed-restaurants.mjs    # Database seeding script
├── vitest.config.mjs       # Test configuration
└── docs/                   # Project documentation
    ├── terraform-guide.md     # Infrastructure deployment guide
    └── step-functions-workflow.md  # Step Functions workflow documentation
```

## Lambda Functions (`functions/`)

Each function follows a consistent structure:

```
functions/
├── get-index/             # Landing page handler with Cognito auth
├── get-restaurants/       # Restaurant listing API
├── search-restaurants/    # Restaurant search API with SSM config
├── place-order/           # Order placement with EventBridge publishing
├── notify-restaurant/     # Restaurant notifications via SNS + EventBridge
└── seed-orders/           # Order data persistence from EventBridge events

# Each function contains:
├── index.js               # Main handler (CommonJS)
├── package.json           # Function dependencies with build script
├── node_modules/          # Dependencies (generated)
└── static/                # Static assets (if needed)
```

## Test Structure (`tests/`)

```
tests/
├── steps/              # Test utilities and setup
│   ├── given.mjs       # Test data setup
│   ├── init.mjs        # Test initialization
│   ├── teardown.mjs    # Test cleanup
│   └── when.mjs        # Test actions
└── test_cases/         # Actual test files
    ├── get-index.test.mjs
    ├── get-restaurants.test.mjs
    └── search-restaurants.test.mjs
```

## Terraform Structure (`terraform/`)

```
terraform/
├── main.tf               # Core resources (DynamoDB, Cognito, EventBridge, SNS)
├── lambda.tf             # Lambda function definitions with IAM policies
├── api.tf                # API Gateway configuration
├── step-functions.tf     # Step Functions state machine for order workflow
├── data.tf               # Data sources
├── locals.tf             # Local values and computed expressions
├── ssm.tf                # SSM Parameter Store resources
├── variables.tf          # Input variables
├── outputs.tf            # Output values for testing and integration
├── providers.tf          # AWS provider configuration
├── backend.tf            # Remote state configuration
├── versions.tf           # Terraform version constraints
├── environments/         # Environment-specific variables (.tfvars)
├── config/               # Backend configuration files (.backend.hcl)
├── builds/               # Lambda deployment packages (generated)
├── state_machines/       # Step Functions ASL definitions
└── script-*.sh           # Workspace management scripts
```

## Naming Conventions

### Resources

- **Lambda Functions**: `${service_name}-${stage_name}-${function_name}`
- **DynamoDB Tables**: `${service_name}-${purpose}-${stage_name}`
- **API Gateway**: `${service_name}-${stage_name}`
- **Cognito User Pool**: `${service_name}-${stage_name}-UserPool`

### Files

- **Lambda Handlers**: `index.js` (CommonJS) - all functions use CommonJS
- **Terraform Files**: Descriptive names (`main.tf`, `lambda.tf`, `api.tf`, `data.tf`, `locals.tf`, `ssm.tf`)
- **Environment Files**: `${environment}.tfvars`
- **Backend Config**: `${environment}.backend.hcl`
- **Test Files**: `*.test.mjs` (ES modules for Vitest)

## GitHub Actions Structure (`.github/`)

```
.github/
└── workflows/
    └── dev.yml           # CI/CD pipeline for development deployment
```

### CI/CD Pipeline (`dev.yml`)

The GitHub Actions workflow provides automated deployment with the following stages:

1. **Setup**: Node.js, Terraform, and AWS credentials (OIDC)
2. **Temporary Environment**: Creates ephemeral environment for testing
3. **Testing**: Runs integration and e2e tests against deployed infrastructure
4. **Cleanup**: Destroys temporary environment after testing
5. **Deployment**: Deploys to development environment

**Triggers**:
- Manual dispatch via GitHub Actions UI
- Automatic on push to main branch (commented out by default)

**Security**:
- Uses AWS OIDC for secure authentication (no long-lived credentials)
- Concurrency controls prevent simultaneous deployments
- Temporary environments ensure isolated testing

## Key Patterns

- Each Lambda function is self-contained with its own dependencies
- Terraform modules are used for complex resources (DynamoDB, Lambda, EventBridge, SNS)
- Environment-specific configuration via `.tfvars` files
- Remote state management with S3 backend and DynamoDB locking
- Workspace-based ephemeral environments for feature development
- Event-driven architecture with EventBridge custom bus
- Idempotency handling with DynamoDB table and Lambda Powertools
- Dead letter queues for failed Lambda invocations
- CloudWatch alarms for monitoring and alerting
- Automated CI/CD pipeline with temporary environment testing
- Step Functions for complex workflow orchestration
