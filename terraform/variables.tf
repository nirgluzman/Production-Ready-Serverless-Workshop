# Variables that can be overridden via CLI commands.

# AWS region where resources will be deployed
variable "aws_region" {
  description = "AWS region"
  type        = string
}

# AWS profile used for deployment
variable "aws_profile" {
  description = "AWS profile"
  type        = string
}

# Environment/stage identifier for resource naming and tagging
variable "stage_name" {
  description = "Stage name (e.g. dev, prod)"
  type        = string
}

# Service identifier used for resource naming and tagging across all AWS resources
variable "service_name" {
  description = "Service name"
  type        = string
}

# Stage name used specifically for SSM parameter paths
# This allows for more flexible parameter organization strategies
# For example, you might want dev, test, and staging environments to share the same SSM parameters
variable "ssm_stage_name" {
  description = "Stage name used in SSM parameter paths (e.g., /service/stage/...). If not provided, defaults to stage_name value."
  type        = string
  default     = null # When null, the main stage_name will be used instead
}
