# DEVELOPMENT environment backend configuration
# This file contains backend settings for the DEV environment
# Usage: terraform init -backend-config=config/dev.backend.hcl

bucket         = "prsls-tf-workshop-state-bucket-us-east-1-539323004237"  # S3 bucket for state storage
key            = "terraform.tfstate"                                      # Path to the state file inside the S3 Bucket
region         = "us-east-1"                                              # AWS Region of the S3 Bucket and DynamoDB Table (if used)
encrypt        = true                                                     # Enable SSE (server side encryption) of the state and lock files
use_lockfile   = true                                                     # Use lock file for state locking
profile        = "workshop-serverless"                                    # AWS profile for authentication (this can also be sourced from the AWS_PROFILE environment variable)

#
# Locking can be enabled via S3 or DynamoDB.
# However, DynamoDB-based locking is deprecated and will be removed in a future minor version.
# https://developer.hashicorp.com/terraform/language/backend/s3#state-locking
# dynamodb_table = "prsls-tf-workshop-terraform-state-lock"               # DynamoDB table for state locking
