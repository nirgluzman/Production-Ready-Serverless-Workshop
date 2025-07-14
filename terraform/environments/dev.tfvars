# DEVELOPMENT environment variable values
# Every user who wishes to work on the project needs to create their own .tfvars files for the environments they wish to work on.
# Usage: terraform apply -var-file="environments/dev.tfvars"
#
# NOTES:
# - This file contains variable overrides for the development environment.
# - .tfvars files often contain sensitive information. Therefore, they are typically not source controlled.
#

aws_region   = "us-east-1"           # AWS region for resource deployment
stage_name   = "dev"                 # Environment identifier (dev/staging/prod)
service_name = "prsls-tf-workshop"   # Service name for resource naming and tagging
