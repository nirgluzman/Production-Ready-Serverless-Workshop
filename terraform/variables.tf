# Variables that can be overridden via CLI commands.

# AWS region where resources will be deployed
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"  # Default to US East (N. Virginia)
}

# Environment/stage identifier for resource naming and tagging
variable "stage_name" {
  description = "Stage name (e.g. dev, prod)"
  type        = string
  default     = "dev"  # Default to development environment
}

# Service identifier used for resource naming and tagging across all AWS resources
variable "service_name" {
  description = "Service name"
  type        = string
  default     = "prsls-tf-workshop"  # Default service name for the workshop
}
