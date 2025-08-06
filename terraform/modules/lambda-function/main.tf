/**
 * Lambda Function Module
 *
 * This is a custom Terraform module that wraps the terraform-aws-modules/lambda/aws module
 * with opinionated defaults for our serverless application.
 * https://registry.terraform.io/modules/terraform-aws-modules/lambda/aws/latest
 *
 * IMPORTANT: This module belongs to a different Terraform scope from our main application
 * and has no access to the variables and outputs defined in the root module.
 * Any information needed must be passed in explicitly via module inputs.
 * The variables referenced here (var.service_name, var.stage_name, etc.) are NOT from
 * terraform/variables.tf - they are defined in this module's own variables.tf file.
 *
 * Default configurations:
 * - CloudWatch log retention: 7 days
 * - X-Ray tracing: enabled
 * - Powertools environment variables
 * - NPM packaging commands
 * - Default timeout and memory settings
 */

# Terraform AWS Lambda module from serverless.tf framework:
# Provides comprehensive Lambda function management with packaging, permissions, and monitoring

module "lambda" {
  source  = "terraform-aws-modules/lambda/aws" # Community module for Lambda functions
  version = "~> 8.0"                           # Pin to major version for stability

  # Function configuration
  function_name = "${var.service_name}-${var.stage_name}-${var.name}" # Naming convention: service-environment-function
  handler       = var.handler                                         # Entry point (e.g., "index.handler")
  runtime       = var.runtime                                         # Node.js runtime version
  memory_size   = var.memory_size                                     # Memory allocated to the function in MB
  timeout       = var.timeout                                         # Lambda function timeout in seconds

  # Source code packaging configuration
  source_path = [{
    path = var.source_path   # Path to function source code
    commands = [             # build commands that Terraform executes when packaging the Lambda function
      "rm -rf node_modules", # Remove the existing node_modules directory
      "npm ci --omit=dev",   # Install dependencies, exclude development dependencies
      ":zip"                 # Special Terraform command to create a zip package of the source code. This ZIP file becomes the Lambda deployment package
    ]
  }]

  # Environment variables - merge common variables with function-specific ones
  # Terraform `merge` takes an arbitrary number of maps or objects, and returns a single map or object that
  # contains a merged set of elements from all arguments.
  # https://developer.hashicorp.com/terraform/language/functions/merge
  environment_variables = merge(
    {
      # Standard application variables
      service_name   = var.service_name
      stage_name     = var.stage_name
      ssm_stage_name = var.ssm_stage_name

      # AWS Lambda Powertools configuration
      POWERTOOLS_LOG_LEVEL          = var.log_level       # INFO for prod, DEBUG for dev
      POWERTOOLS_LOGGER_SAMPLE_RATE = var.log_sample_rate # Sample 10% of logs regardless of log level
      POWERTOOLS_LOGGER_LOG_EVENT   = "${var.log_event}"  # Log the incoming Lambda event payload; NOTE: may include PII/sensitive info
    },
    var.environment_variables # Function-specific environment variables
  )

  # IAM permissions attached to the Lambda function's execution role
  attach_policy_statements = true
  policy_statements        = var.policy_statements

  # X-Ray distributed tracing configuration
  tracing_mode          = "Active" # Enable X-Ray tracing for all requests
  attach_tracing_policy = true     # Attach IAM policy for X-Ray write access

  # Enable function versioning for better deployment management (e.g. blue/green deployments)
  publish = true

  # Event source permissions (API Gateway, EventBridge, etc.)
  allowed_triggers = var.allowed_triggers

  # CloudWatch Logs retention to control costs
  cloudwatch_logs_retention_in_days = 7 # Keep logs for 1 week

  # Resource tagging
  tags = var.tags
}
