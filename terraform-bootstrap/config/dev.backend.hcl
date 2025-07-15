# DEVELOPMENT environment backend configuration
# This file contains backend settings for the DEV environment
# Usage: terraform init -backend-config=config/dev.backend.hcl

bucket         = "prsls-tf-workshop-state-bucket-us-east-1-539323004237"  # S3 bucket for state storage
key            = "terraform-bootstrap.tfstate"                            # State file path within bucket
region         = "us-east-1"                                              # AWS region for backend resources
encrypt        = true                                                     # Enable state file encryption
dynamodb_table = "prsls-tf-workshop-terraform-state-lock"                 # DynamoDB table for state locking
