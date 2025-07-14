#!/bin/bash

# Script to switch between different Terraform environments.
# This script reconfigures the Terraform backend to use environment-specific settings.
# Usage: ./script-switch-env.sh <environment>
# Example: ./script-switch-env.sh dev

if [ $# -ne 1 ]; then
    echo "Usage: $0 <environment>"
    echo "Example: $0 dev"
    exit 1
fi

env=$1

if [ ! -f "config/${env}.backend.hcl" ]; then
    echo "Error: Backend config file config/${env}.backend.hcl does not exist"
    exit 1
fi

terraform init -backend-config=config/${env}.backend.hcl -reconfigure
