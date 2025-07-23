# Terraform outputs - values that are displayed after deployment.
# These outputs can be referenced by other Terraform configurations or used for testing

# AWS_REGION is the standard and most widely adopted environment variable for specifying the AWS region,
# making it the default across all services for consistent and predictable behavior.
output "AWS_REGION" {
  description = "AWS region"
  value       = "${var.aws_region}"
}

# Service name - used for resource naming and organization
output "service_name" {
  description = "Service name"
  value       = "${var.service_name}"
}

# Stage name - identifies the deployment environment (dev, prod, etc.)
output "stage_name" {
  description = "Stage name"
  value       = "${var.stage_name}"
}

# SSM stage name - used for parameter paths in SSM Parameter Store
output "ssm_stage_name" {
  description = "SSM stage name"
  value       = "${local.ssm_stage_name}"
}

# API Gateway URL - base URL for all API endpoints
output "api_gateway_url" {
  description = "The URL of the API Gateway"
  value       = "${aws_api_gateway_stage.main.invoke_url}"  # API Gateway invoke URL
}

# DynamoDB table name - used by Lambda functions to access restaurant data
output "restaurants_table" {
  description = "The name of the restaurants table"
  value       = "${module.dynamodb_restaurants_table.dynamodb_table_id}"  # DynamoDB table ID
}

# Restaurants API endpoint - full URL to the restaurants resource
output "restaurants_api" {
  description = "URL to the GET /restaurants endpoint"
  value       = "${aws_api_gateway_stage.main.invoke_url}/restaurants"
}

# Cognito User Pool ID - required for authentication configuration
output "cognito_user_pool_id" {
  description = "ID of the Cognito user pool"
  value       = "${aws_cognito_user_pool.main.id}"
}

# Cognito web client ID - used by frontend for user authentication
# This client ID is configured for browser-based authentication flows:
# - User sign-up and registration through the web interface
# - User sign-in with Secure Remote Password (SRP) protocol
# - Token refresh for maintaining user sessions
# - Used in the index.html page to configure the Cognito authentication widget
output "cognito_client_id" {
  description = "ID of the web Cognito client"
  value       = "${aws_cognito_user_pool_client.web_client.id}"
}

# Cognito server client ID - used for server-side authentication flows
# This client ID is specifically configured for admin operations like:
# - Creating users programmatically via AdminCreateUser
# - Authenticating with ALLOW_ADMIN_USER_PASSWORD_AUTH flow
# - Running integration tests that need to create test users
# - Performing user management operations from backend services
output "cognito_server_client_id" {
  description = "ID of the server Cognito client"
  value       = "${aws_cognito_user_pool_client.server_client.id}"
}

# EventBridge bus name - used to publish and subscribe to events
output "eventbridge_bus_name" {
  description = "EventBridge bus name"
  value       = "${module.eventbridge.eventbridge_bus_name}"
}

# EventBridge bus ARN - used for IAM permissions and cross-account integrations
output "eventbridge_bus_arn" {
  description = "EventBridge bus ARN"
  value       = "${module.eventbridge.eventbridge_bus_arn}"
}
