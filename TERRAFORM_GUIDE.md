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
