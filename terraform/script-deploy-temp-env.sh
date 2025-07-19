#!/bin/bash

# Script to deploy updates to temporary/ephemeral Terraform environments.
# Uses dev configuration but overrides stage_name for resource isolation.
# Usage: ./script-deploy-temp-env.sh <environment-name>
# Example: ./script-deploy-temp-env.sh dev-feature-branch

# NOTE:
# We're making the assumption that the ephemeral environment will be created in the dev account
# and shares all the same variables as dev, except for the stage name.
# This allows us to use the same dev backend configuration but deploy isolated resources.

# Validate command line arguments.
if [ $# -ne 1 ]; then
    echo "Usage: $0 <environment>"
    echo "Example: $0 dev-featureA"
    exit 1
fi

env=$1  # Environment name from command line argument.

# Switch to dev backend configuration.
# Ephemeral environments use dev backend settings but separate Workspaces.
./script-switch-env.sh dev

echo "Deploying updates to ephemeral environment $env"

# Select the target Workspace and deploy.
terraform workspace select $env                                           # Switch to ephemeral Workspace
terraform apply -var-file=environments/dev.tfvars -var "stage_name=$env"  # Deploy with custom stage_name

# Seed data for the ephemeral environment.
echo "Seeding data for ephemeral environment $env"
terraform output > ../.env
cd ..
npm run bootstrap-db
