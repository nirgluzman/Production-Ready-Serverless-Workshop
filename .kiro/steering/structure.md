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
└── TERRAFORM_GUIDE.md      # Infrastructure deployment guide
```

## Lambda Functions (`functions/`)

Each function follows a consistent structure:

```
functions/
├── get-index/             # Landing page handler
├── get-restaurants/       # Restaurant listing API
└── search-restaurants/    # Restaurant search API

# Each function contains:
├── index.js               # Main handler (CommonJS)
├── package.json           # Function dependencies
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
├── main.tf               # Core resources (DynamoDB, Cognito)
├── lambda.tf             # Lambda function definitions
├── api.tf                # API Gateway configuration
├── data.tf               # Data sources
├── locals.tf             # Local values
├── ssm.tf                # SSM Parameter Store resources
├── variables.tf          # Input variables
├── outputs.tf            # Output values
├── providers.tf          # AWS provider configuration
├── backend.tf            # Remote state configuration
├── versions.tf           # Terraform version constraints
├── environments/         # Environment-specific variables (.tfvars)
├── config/               # Backend configuration files (.backend.hcl)
├── builds/               # Lambda deployment packages (generated)
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
- Terraform modules are used for complex resources (DynamoDB, Lambda)
- Environment-specific configuration via `.tfvars` files
- Remote state management with S3 backend and DynamoDB locking
- Workspace-based ephemeral environments for feature development
- Automated CI/CD pipeline with temporary environment testing
