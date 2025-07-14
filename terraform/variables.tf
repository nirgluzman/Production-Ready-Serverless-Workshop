# Variables that can be overridden via CLI commands.

# AWS region where resources will be deployed
variable "aws_region" {
  description = "AWS region"
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
