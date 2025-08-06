/**
 * Lambda Function Module Variables
 *
 * This file defines the input variables for our custom Lambda function module.
 * These variables are NOT the same as those in the root terraform/variables.tf file.
 * This module operates in its own scope and requires explicit inputs from the calling module.
 *
 * When the root module calls this module, it must provide values for these variables.
 * The module then uses these inputs to configure the underlying terraform-aws-modules/lambda/aws module.
 */

# =============================================================================
# REQUIRED VARIABLES - Must be provided by the calling module
# =============================================================================

# Service identification variables
variable "service_name" {
  type        = string
  description = "Name of the service - used in function naming and tagging"
}

variable "stage_name" {
  type        = string
  description = "Environment stage (dev, staging, prod) - used in function naming"
}

variable "ssm_stage_name" {
  type        = string
  description = "Stage name for SSM parameter paths - may differ from stage_name"
}

# Function identification
variable "name" {
  type        = string
  description = "Function name suffix (e.g., 'get-restaurants') - combined with service/stage for full name"
}

variable "source_path" {
  type        = string
  description = "Absolute path to the Lambda function source code directory"
}

# =============================================================================
# OPTIONAL VARIABLES - Have sensible defaults but can be overridden
# =============================================================================

# Lambda runtime configuration
variable "handler" {
  type        = string
  default     = "index.handler"
  description = "Lambda function entry point (file.function)"
}

variable "runtime" {
  type        = string
  default     = "nodejs22.x"
  description = "Lambda runtime environment"
}

variable "memory_size" {
  type        = number
  default     = 1024
  description = "Lambda function memory allocation in MB (128-10240)"
}

variable "timeout" {
  type        = number
  default     = 6
  description = "Lambda function timeout in seconds (1-900)"
}

# Function-specific configuration
variable "environment_variables" {
  type        = map(string)
  default     = {}
  description = "Additional environment variables specific to this function (merged with common variables)"
}

variable "policy_statements" {
  type        = any
  default     = {}
  description = "Custom IAM policy statements for function permissions (DynamoDB, SNS, etc.)"
}

variable "allowed_triggers" {
  type        = any
  default     = {}
  description = "Event source configurations (API Gateway, EventBridge, etc.)"
}

# AWS Lambda Powertools logging configuration
variable "log_level" {
  type        = string
  default     = "DEBUG"
  description = "Powertools log level (DEBUG, INFO, WARN, ERROR)"
}

variable "log_sample_rate" {
  type        = string
  default     = "0.1"
  description = "Powertools debug log sampling rate (0.1 = 10% of requests)"
}

variable "log_event" {
  type        = bool
  default     = true
  description = "Whether Powertools should log the full invocation event (may contain PII)"
}

# Resource tagging
variable "tags" {
  type        = map(string)
  default     = {}
  description = "Additional resource tags (merged with default tags from provider)"
}
