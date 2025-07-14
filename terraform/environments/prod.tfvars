# PRODUCTION environment variable values
# Usage: terraform apply -var-file="environments/dev.tfvars"

aws_region   = "us-west-1"           # AWS region for resource deployment
stage_name   = "prod"                # Environment identifier (dev/staging/prod)
service_name = "prsls-tf-workshop"   # Service name for resource naming and tagging
