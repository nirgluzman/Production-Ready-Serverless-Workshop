# Terraform backend configuration for remote state storage.
# This file configures Terraform to store state remotely in S3 with DynamoDB locking.
#
# NOTES:
# 1) Ensure that the S3 bucket and DynamoDB table are created before running this configuration.
# 2) Execute `terraform init` to initialize the backend configuration.
#

terraform {
backend "s3" {
    bucket         = "prsls-tf-workshop-state-bucket-us-east-1-539323004237"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "prsls-tf-workshop-terraform-state-lock"
  }
}
