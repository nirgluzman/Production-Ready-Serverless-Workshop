#!/bin/bash

# Script to create temporary/ephemeral Terraform environment leveraging Terraform Workspace for isolated development or testing.
# Ephemeral environments use the dev backend configuration but separate state.
# Usage: ./script-create-temp-env.sh <environment-name>
# Example: ./script-create-temp-env.sh dev-feature-branch

# Validate command line arguments.
if [ $# -ne 1 ]; then
    echo "Usage: $0 <environment>"
    echo "Example: $0 dev-featureA"
    exit 1
fi

env=$1  # Environment name from command line argument.

# Switch to dev backend configuration first.
# Ephemeral environments share the dev backend but use separate Workspaces.
./script-switch-env.sh dev

echo "Creating ephemeral environment $env"

# Create new Terraform Workspace for isolated state management.
# Each workspace maintains separate state files within the same backend.
terraform workspace new $env
