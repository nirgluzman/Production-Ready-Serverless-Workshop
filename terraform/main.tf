# main.tf

# This file contains the Terraform configuration for the core infrastructure resources (such as VPC, load balancers, databases, etc.).

# DynamoDB table for storing restaurant data
# https://registry.terraform.io/modules/terraform-aws-modules/dynamodb-table/aws/latest
module "dynamodb_restaurants_table" {
  source  = "terraform-aws-modules/dynamodb-table/aws" # module from serverless.tf
  version = "~> 4.0"

  # Table configuration
  name        = "${var.service_name}-restaurants-${var.stage_name}"  # Naming: service-purpose-environment
  hash_key    = "name"                                               # Primary key: restaurant name

  # Define table attributes (only keys need to be defined upfront)
  attributes  = [
    {
      name = "name"  # Restaurant name attribute
      type = "S"     # String type
    }
  ]
}
