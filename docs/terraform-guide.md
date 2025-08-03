# Terraform Infrastructure Guide

## Overview
This project uses Terraform to manage AWS infrastructure for the Production Ready Serverless Workshop.

## Prerequisites
- AWS CLI configured with valid credentials
- Terraform installed

## Project Structure
```
terraform/
├── bootstrap.tf      # Remote backend infrastructure
├── backend.tf        # Backend configuration
├── providers.tf      # AWS provider setup
├── variables.tf      # Input variables
└── config/
    └── dev.backend.hcl  # Environment-specific backend config
```

## Getting Started

### 1. Bootstrap Remote Backend
```bash
# Navigate to terraform directory
cd terraform

# Initialize and apply bootstrap resources
terraform init
terraform plan
terraform apply
```

### 2. Configure Remote Backend
```bash
# Initialize with remote backend
terraform init -backend-config=config/dev.backend.hcl

# Verify backend configuration
terraform show
```

### 3. Deploy Infrastructure
```bash
# Plan deployment
terraform plan -var-file=environments/dev.tfvars

# Apply changes
terraform apply -var-file=environments/dev.tfvars

# Destroy resources (when needed)
terraform destroy -var-file=environments/dev.tfvars
```

## Configuration

### Configure AWS Credentials and Region via Environment Variables
```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

### Configure AWS Access and Profile Management with AWS CLI
```bash
aws configure --profile <profile name>
export AWS_PROFILE=<profile name>
```

### Custom Variables
```bash
# Override default values
terraform apply -var="aws_region=us-west-2" -var="stage_name=prod"
```

## Troubleshooting

### Credential Issues
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Configure AWS CLI
aws configure
```

### State Lock Issues
```bash
# Force unlock (use with caution)
terraform force-unlock LOCK_ID
```

## [Terraform Remote Backend](https://developer.hashicorp.com/terraform/language/backend/remote)

Terraform stores the current state of the resources it has created in .tfstate files.
Terraform remote backend stores the Terraform state file in a remote location, rather than on our local machine.

Remote backend on AWS requires:
- An encrypted S3 bucket for the state files.
- A DynamoDB table for locking, to ensure that only one update can be performed at a time.

### When to Run `terraform init -reconfigure`

Execute `terraform init -reconfigure` when we modify our backend configuration (e.g., changing S3 bucket details or backend type), or to resolve local state and provider synchronization issues.
This command forces Terraform to fully re-evaluate and re-initialize its backend and provider connections, ensuring consistency with our latest settings.

## [Terraform Workspaces](https://developer.hashicorp.com/terraform/cli/workspaces) for Ephemeral (Temporary) Environments

Terraform Workspaces let us manage multiple distinct states from a single configuration for feature development or testing.
Workspaces let us quickly switch between multiple instances of a single configuration within its single backend.

Workspace is basically a "state container", it lets us reuse the same `.tf` files against multiple independent state snapshots, so we can use Workspace to represent different environments.


```bash
terraform workspace <subcommand> [options] [args]

Subcommands:
    delete    Delete a workspace
    list      List Workspaces
    new       Create a new workspace
    select    Select a workspace
    show      Show the name of the current workspace
```

**Create an ephemeral environment (Terrafrom Workspace):**
```bash
terraform workspace new dev-featureA
```

**Deploy the latest code to the ephemeral environment:**
After creating a Workspace, any `terraform plan` & `terraform apply` commands will be running against the new ephemeral environment.

We can override the `stage_name` variable in the CLI, e.g.
```bash
terraform plan -var-file=environments/dev.tfvars -var "stage_name=dev-featureA"
```

**Destroy all AWS resources in the ephemeral environment:**
When we're done with the test, we can delete the ephemeral environment. The first step - destroy the AWS resources:
```bash
terraform destroy -var-file=environments/dev.tfvars -var "stage_name=dev-featureA"
```

**Delete the Workspace in Terrafrom:**
```bash
terraform workspace select default       # switch out of the "dev-featureA" workspace to "default".
terraform workspace delete dev-featureA  # delete "dev-featureA" workspace.
```

### Scripts to encapsulate the workflow

```bash
./script-create-temp-env.sh dev-featureA    # create a new ephemeral environment called "dev-featureA"
./script-deploy-temp-env.sh dev-featureA    # deploy the latest code to the "dev-featureA" ephemeral environment
./script-destroy-temp-env.sh dev-featureA   # delete the "dev-featureA" ephemeral environment
```bash
