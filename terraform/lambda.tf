# Lambda function for handling GET requests to the root path (/).
# Uses the terraform-aws-modules/lambda module for simplified Lambda deployment
# https://registry.terraform.io/modules/terraform-aws-modules/lambda/aws/latest
#
module "get_index_lambda" {
  source  = "terraform-aws-modules/lambda/aws"  # Community module for Lambda functions
  version = "~> 8.0"                            # Pin to major version for stability

  # Function configuration
  function_name = "${var.service_name}-get-index"  # Naming convention: service-function
  handler       = "index.handler"                  # Entry point: file.function
  runtime       = "nodejs22.x"                     # Node.js runtime version

  # Source code configuration
  source_path = [{
    path = "${path.module}/../functions/get-index"  # Path to function source code
  }]

  # Environment variables for the Lambda function
  environment_variables = {
    # Add environment-specific variables here as needed
  }

  # Enable function versioning for better deployment management
  publish = true

  # API Gateway trigger permissions
  # Allows API Gateway to invoke this Lambda function
  allowed_triggers = {
    APIGatewayGet = {
      service    = "apigateway"                                                             # AWS service that can invoke
      source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/${var.stage_name}/GET/"  # Specific API Gateway endpoint
    }
  }

  # CloudWatch Logs retention to control costs and storage
  cloudwatch_logs_retention_in_days = 7  # Keep logs for 1 week
}
