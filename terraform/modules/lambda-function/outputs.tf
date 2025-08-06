/**
 * Lambda Function Module Outputs
 *
 * This file defines the output values that calling modules can access after creating a Lambda function.
 * These outputs expose key information about the created Lambda function that other resources need.
 *
 * IMPORTANT: Output names are intentionally matched to the terraform-aws-modules/lambda/aws module
 * to maintain compatibility when switching from the upstream module to this custom wrapper.
 * This ensures existing code referencing these outputs continues to work without modification.
 *
 * The outputs are pass-through values from the underlying lambda module, providing a consistent
 * interface while hiding the internal module implementation details.
 */

# Lambda function identification outputs
output "lambda_function_arn" {
  description = "The ARN of the Lambda Function - used for IAM policies and resource references"
  value       = module.lambda.lambda_function_arn
}

output "lambda_function_name" {
  description = "The name of the Lambda Function - used for CloudWatch logs and AWS CLI operations"
  value       = module.lambda.lambda_function_name
}

# Lambda function invocation outputs
output "lambda_function_invoke_arn" {
  description = "The Invoke ARN for API Gateway integrations - used in aws_api_gateway_integration"
  value       = module.lambda.lambda_function_invoke_arn
}

output "lambda_function_qualified_arn" {
  description = "The versioned ARN of the Lambda Function - includes version/alias for blue-green deployments"
  value       = module.lambda.lambda_function_qualified_arn
}
