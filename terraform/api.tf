# API Gateway REST API configuration with Lambda integration.
# Using native Terraform resources instead of serverless.tf modules (which only support HTTP/WebSocket APIs).

# Main REST API resource with regional endpoint for better performance and lower latency.
resource "aws_api_gateway_rest_api" "main" {
  name = "${var.service_name}-${var.stage_name}"  # Naming convention: service-environment

  endpoint_configuration {
    types = ["REGIONAL"]  # Regional endpoints route traffic directly to the API within a specific AWS region, while edge-optimized endpoints use CloudFront to distribute traffic through edge locations.
  }
}

# API Gateway stage - represents a deployment environment (dev, staging, prod).
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.stage_name  # Environment identifier
}

# API Gateway deployment - creates a snapshot of the API configuration
# Must be created after all routes and integrations are defined
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  # Ensure deployment happens after all API components are created
  depends_on = [
    aws_api_gateway_integration.get_index
  ]

  # Control the flow of our Terraform operations
  lifecycle {
    create_before_destroy = true # Ensures new deployment is created before the old one is destroyed
  }
}

# HTTP GET method for the root path (/)
# Allows public access without authentication
resource "aws_api_gateway_method" "get_index" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_rest_api.main.root_resource_id  # Root resource (/)
  http_method   = "GET"                                           # HTTP GET requests
  authorization = "NONE"                                          # No authentication required
}

# Lambda proxy integration for the GET / endpoint
# Routes all requests to the Lambda function with full request context
resource "aws_api_gateway_integration" "get_index" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_rest_api.main.root_resource_id
  http_method = aws_api_gateway_method.get_index.http_method

  integration_http_method = "POST"                                              # What HTTP method API Gateway will use to call the integration target - Lambda always uses POST
  type                    = "AWS_PROXY"                                         # Proxy integration passes full request
  uri                     = module.get_index_lambda.lambda_function_invoke_arn  # Lambda function ARN
}

# Integration type:
# - AWS_PROXY: Full request context is passed to the Lambda function, allowing it to handle routing and response formatting.
# - AWS: For AWS service integrations, where API Gateway calls AWS services directly.
# - HTTP: Directly integrates with HTTP endpoints, useful for external APIs.
# - MOCK: Not calling any real backend; simulates an integration without calling any backend, useful for testing or static responses.
#
# An HTTP or HTTP_PROXY integration with a connect_type of VPC_LINK is referred to as a provate integration and uses
# a VPC link to connect to API Gateway to a NLB of a VPC.
#
