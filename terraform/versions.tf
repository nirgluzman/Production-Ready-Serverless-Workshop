# Terraform provider configuration, https://registry.terraform.io/browse/providers
# This file specifies the required providers and their versions for the Terraform configuration.
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}
