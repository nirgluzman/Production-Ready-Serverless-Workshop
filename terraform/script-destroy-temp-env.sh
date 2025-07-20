#!/bin/bash

# Script to completely destroy temporary/ephemeral Terraform environments (destroys all AWS resources
# and removes the Terraform Workspace).
# Use with caution - this permanently deletes infrastructure and state.
# Usage: ./script-destroy-temp-env.sh <environment-name>
# Example: ./script-destroy-temp-env.sh dev-feature-branch

# Validate command line arguments.
if [ $# -ne 1 ]; then
    echo "Usage: $0 <environment>"
    echo "Example: $0 featureA"
    exit 1
fi

env=$1  # Environment name from command line argument

# Switch to dev backend configuration.
# Ephemeral environments use dev backend settings.
./script-switch-env.sh dev

echo "Destroying ephemeral environment $env"

# Select target Workspace and destroy all resources.
terraform workspace select $env                                             # Switch to ephemeral Workspace.
terraform destroy -auto-approve -var-file=environments/dev.tfvars -var "stage_name=$env"  # Destroy AWS resources.

# Clean up Workspace after resource destruction
terraform workspace select default  # Switch away from target workspace.
terraform workspace delete $env     # Remove Workspace and its state file.
