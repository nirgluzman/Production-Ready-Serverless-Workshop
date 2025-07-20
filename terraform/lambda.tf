# Lambda function for handling GET requests to the root path (/).
# Uses the terraform-aws-modules/lambda module for simplified Lambda deployment
# https://registry.terraform.io/modules/terraform-aws-modules/lambda/aws/latest
#
module "get_index_lambda" {
  source  = "terraform-aws-modules/lambda/aws"  # Community module for Lambda functions
  version = "~> 8.0"                            # Pin to major version for stability

  # Function configuration
  function_name = "${var.service_name}-${var.stage_name}-get-index"  # Naming convention: service-function
  handler       = "index.handler"     # Entry point: file.function
  runtime       = "nodejs22.x"        # Node.js runtime version
  memory_size   = 1024                # Memory allocated to the function in MB
  timeout       = 6                   # Lambda function timeout in seconds

  # Source code configuration
  source_path = [{
    path = "${path.module}/../functions/get-index",  # Path to function source code
    commands = [ # build commands that Terraform executes when packaging the Lambda function
      "rm -rf node_modules", # Remove the existing node_modules directory
      "npm run build",       # Install dependencies, exclude development dependencies
      ":zip"                 # Special Terraform command to create a zip package of the source code. This ZIP file becomes the Lambda deployment package
    ]
  }]

  # Environment variables for the Lambda function
  environment_variables = {
    restaurants_api      = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.stage_name}/restaurants"
    cognito_user_pool_id = aws_cognito_user_pool.main.id                 # Cognito User Pool ID
    cognito_client_id    = aws_cognito_user_pool_client.web_client.id    # Cognito App Client ID
  }

  # IAM permissions attached to the Lambda function's execution role
  attach_policy_statements = true
  policy_statements = {
    # IAM statements which will be generated as IAM policy
    restaurants_api_access = {
      effect = "Allow"
      actions = [
        "execute-api:Invoke"  # Allow invoking the API Gateway /restaurants endpoint
      ]
      resources = [
        "${aws_api_gateway_rest_api.main.execution_arn}/${var.stage_name}/GET/restaurants" # API Gateway endpoint ARN
        ]
    }
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


module "get_restaurants_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 8.0"

  function_name = "${var.service_name}-${var.stage_name}-get-restaurants"
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  memory_size   = 1024        # Memory allocated to the function in MB
  timeout       = 6           # Lambda function timeout in seconds


  source_path = [{
    path = "${path.module}/../functions/get-restaurants",
    commands = [
      "rm -rf node_modules", # Remove the existing node_modules directory
      "npm run build",       # Install dependencies, exclude development dependencies
      ":zip"                 # Special Terraform command to create a zip package of the source code. This ZIP file becomes the Lambda deployment package
    ]
  }]

  environment_variables = {
    restaurants_table = module.dynamodb_restaurants_table.dynamodb_table_id
    service_name      = var.service_name
    stage_name        = var.stage_name
    ssm_stage_name    = local.ssm_stage_name
  }

  attach_policy_statements = true
  policy_statements = {
    # Allow read access to the DynamoDB table
    dynamodb_read = {
      effect = "Allow"
      actions = [
        "dynamodb:Scan"
      ]
      resources = [module.dynamodb_restaurants_table.dynamodb_table_arn]
    }
    # Allow access to SSM parameters for configuration
    ssm_access = {
      effect = "Allow"
      actions = [
        # The asterisk (*) in 'ssm:GetParameters*' grants permissions for both 'ssm:GetParameters' and 'ssm:GetParametersByPath' operations
        "ssm:GetParameters*"
      ]
      resources = [
        "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.service_name}/${local.ssm_stage_name}/get-restaurants/config"
      ]
    }
  }

  publish = true

  allowed_triggers = {
    APIGatewayGet = {
      service    = "apigateway"
      source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/${var.stage_name}/GET/restaurants"
    }
  }

  # CloudWatch Logs retention to control costs and storage
  cloudwatch_logs_retention_in_days = 7  # Keep logs for 1 week
}


module "search_restaurants_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 8.0"

  function_name = "${var.service_name}-${var.stage_name}-search-restaurants"
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  memory_size   = 1024        # Memory allocated to the function in MB
  timeout       = 6           # Lambda function timeout in seconds

  source_path = [{
    path = "${path.module}/../functions/search-restaurants"
    commands = [
      "rm -rf node_modules", # Remove the existing node_modules directory
      "npm run build",       # Install dependencies, exclude development dependencies
      ":zip"                 # Special Terraform command to create a zip package of the source code. This ZIP file becomes the Lambda deployment package
    ]
  }]

  environment_variables = {
    restaurants_table = module.dynamodb_restaurants_table.dynamodb_table_id
    service_name      = var.service_name
    stage_name        = var.stage_name
    ssm_stage_name    = local.ssm_stage_name
  }

  attach_policy_statements = true
  policy_statements = {
    # Allow read access to the DynamoDB table
    dynamodb_read = {
      effect = "Allow"
      actions = [
        "dynamodb:Scan"
      ]
      resources = [module.dynamodb_restaurants_table.dynamodb_table_arn]
    }
    # Allow access to SSM parameters for configuration
    ssm_access = {
      effect = "Allow"
      actions = [
        # The asterisk (*) in 'ssm:GetParameters*' grants permissions for both 'ssm:GetParameters' and 'ssm:GetParametersByPath' operations
        "ssm:GetParameters*"
      ]
      resources = [
        "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.service_name}/${local.ssm_stage_name}/search-restaurants/config"
      ]
    }
  }

  publish = true

  allowed_triggers = {
    APIGatewayGet = {
      service    = "apigateway"
      source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/${var.stage_name}/POST/restaurants/search"
    }
  }

  # CloudWatch Logs retention to control costs and storage
  cloudwatch_logs_retention_in_days = 7  # Keep logs for 1 week
}
