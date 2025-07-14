# PRODUCTION environment backend configuration
# This file contains backend settings for the PROD environment
# Usage: terraform init -backend-config=config/dev.backend.hcl

bucket         = "prsls-tf-workshop-state-bucket-us-west-1-539323004237"  # S3 bucket for state storage
key            = "terraform.tfstate"                                      # State file path within bucket
region         = "us-west-1"                                              # AWS region for backend resources
encrypt        = true                                                     # Enable state file encryption
dynamodb_table = "prsls-tf-workshop-terraform-state-lock"                 # DynamoDB table for state locking
