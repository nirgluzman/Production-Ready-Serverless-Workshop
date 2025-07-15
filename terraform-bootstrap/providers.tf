# Configure the AWS Provider.
#

provider "aws" {
  # Set the AWS region from variable
  region = var.aws_region

  # Apply default tags to all resources
  default_tags {
    tags = {
      Terraform   = "true"           # Mark resources as managed by Terraform
      Environment = var.stage_name   # Tag with environment/stage name
    }
  }
}
