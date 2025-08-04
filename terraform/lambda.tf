# Lambda function for handling GET requests to the root path (/).
# Uses the terraform-aws-modules/lambda module for simplified Lambda deployment
# https://registry.terraform.io/modules/terraform-aws-modules/lambda/aws/latest
#
module "get_index_lambda" {
  source  = "terraform-aws-modules/lambda/aws" # Community module for Lambda functions
  version = "~> 8.0"                           # Pin to major version for stability

  # Function configuration
  function_name = "${var.service_name}-${var.stage_name}-get-index" # Naming convention: service-function
  handler       = "index.handler"                                   # Entry point: file.function
  runtime       = "nodejs22.x"                                      # Node.js runtime version
  memory_size   = 1024                                              # Memory allocated to the function in MB
  timeout       = 6                                                 # Lambda function timeout in seconds

  # Source code configuration
  source_path = [{
    path = "${path.module}/../functions/get-index", # Path to function source code
    commands = [                                    # build commands that Terraform executes when packaging the Lambda function
      "rm -rf node_modules",                        # Remove the existing node_modules directory
      "npm run build",                              # Install dependencies, exclude development dependencies
      ":zip"                                        # Special Terraform command to create a zip package of the source code. This ZIP file becomes the Lambda deployment package
    ]
  }]

  # Environment variables for the Lambda function
  # Terraform `merge` takes an arbitrary number of maps or objects, and returns a single map or object that
  # contains a merged set of elements from all arguments.
  # https://developer.hashicorp.com/terraform/language/functions/merge
  environment_variables = merge(
    local.common_lambda_env_vars,
    {
      cognito_user_pool_id = aws_cognito_user_pool.main.id              # Cognito User Pool ID
      cognito_client_id    = aws_cognito_user_pool_client.web_client.id # Cognito App Client ID
      restaurants_api      = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.stage_name}/restaurants"
      orders_api           = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.stage_name}/orders"
    }
  )

  # IAM permissions attached to the Lambda function's execution role
  attach_policy_statements = true
  policy_statements = {
    # IAM statements which will be generated as IAM policy
    restaurants_api_access = {
      effect = "Allow"
      actions = [
        "execute-api:Invoke" # Allow invoking the API Gateway /restaurants endpoint
      ]
      resources = [
        "${aws_api_gateway_rest_api.main.execution_arn}/${var.stage_name}/GET/restaurants" # API Gateway endpoint ARN
      ]
    }
  }

  # Enable function versioning for better deployment management
  publish = true

  # Lambda trigger permissions
  # Allows API Gateway to invoke this Lambda function
  allowed_triggers = {
    APIGatewayGet = {
      service    = "apigateway"                                                            # AWS service that can invoke
      source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/${var.stage_name}/GET/" # Specific API Gateway endpoint
    }
  }

  # CloudWatch Logs retention to control costs and storage
  cloudwatch_logs_retention_in_days = 7 # Keep logs for 1 week
}


module "get_restaurants_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 8.0"

  function_name = "${var.service_name}-${var.stage_name}-get-restaurants"
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  memory_size   = 1024 # Memory allocated to the function in MB
  timeout       = 6    # Lambda function timeout in seconds


  source_path = [{
    path = "${path.module}/../functions/get-restaurants",
    commands = [
      "rm -rf node_modules", # Remove the existing node_modules directory
      "npm run build",       # Install dependencies, exclude development dependencies
      ":zip"                 # Special Terraform command to create a zip package of the source code. This ZIP file becomes the Lambda deployment package
    ]
  }]

  environment_variables = merge(
    local.common_lambda_env_vars,
    {
      restaurants_table = module.dynamodb_restaurants_table.dynamodb_table_id
    }
  )

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

  # Lambda trigger permissions
  # Allows API Gateway to invoke this Lambda function
  allowed_triggers = {
    APIGatewayGet = {
      service    = "apigateway"
      source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/${var.stage_name}/GET/restaurants"
    }
  }

  # CloudWatch Logs retention to control costs and storage
  cloudwatch_logs_retention_in_days = 7 # Keep logs for 1 week
}


module "search_restaurants_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 8.0"

  function_name = "${var.service_name}-${var.stage_name}-search-restaurants"
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  memory_size   = 1024 # Memory allocated to the function in MB
  timeout       = 6    # Lambda function timeout in seconds

  source_path = [{
    path = "${path.module}/../functions/search-restaurants"
    commands = [
      "rm -rf node_modules", # Remove the existing node_modules directory
      "npm run build",       # Install dependencies, exclude development dependencies
      ":zip"                 # Special Terraform command to create a zip package of the source code. This ZIP file becomes the Lambda deployment package
    ]
  }]

  environment_variables = merge(
    local.common_lambda_env_vars,
    {
      restaurants_table = module.dynamodb_restaurants_table.dynamodb_table_id
    }
  )

  attach_policy_statements = true
  policy_statements = {
    # Allow read access to DynamoDB restaurants table
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
        "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.service_name}/${local.ssm_stage_name}/search-restaurants/config",
        "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.service_name}/${local.ssm_stage_name}/search-restaurants/secretString"
      ]
    }
    # Allow decryption of KMS-encrypted SSM parameters
    kms_access = {
      effect = "Allow"
      actions = [
        "kms:Decrypt"
      ]
      resources = [data.aws_ssm_parameter.kms_arn.value]
    }
  }

  publish = true

  # Lambda trigger permissions
  # Allows API Gateway to invoke this Lambda function
  allowed_triggers = {
    APIGatewayGet = {
      service    = "apigateway"
      source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/${var.stage_name}/POST/restaurants/search"
    }
  }

  # CloudWatch Logs retention to control costs and storage
  cloudwatch_logs_retention_in_days = 7 # Keep logs for 1 week
}

# Lambda function for handling POST requests to the /orders endpoint
# This function processes order placement and publishes events to EventBridge
module "place_order_lambda" {
  source  = "terraform-aws-modules/lambda/aws" # Community module for Lambda functions
  version = "~> 8.0"                           # Pin to major version for stability

  # Function configuration
  function_name = "${var.service_name}-${var.stage_name}-place-order" # Naming convention: service-function
  handler       = "index.handler"                                     # Entry point: file.function
  runtime       = "nodejs22.x"                                        # Node.js runtime version
  memory_size   = 1024                                                # Memory allocated to the function in MB
  timeout       = 6                                                   # Lambda function timeout in seconds

  # Source code configuration
  source_path = [{
    path = "${path.module}/../functions/place-order" # Path to function source code
    commands = [
      "rm -rf node_modules", # Remove existing node_modules directory
      "npm ci --omit=dev",   # Install production dependencies only
      ":zip"                 # Create deployment package
    ]
  }]

  # Environment variables for the Lambda function
  environment_variables = merge(
    local.common_lambda_env_vars,
    {
      bus_name = module.eventbridge.eventbridge_bus_name # EventBridge bus for publishing order events
    }
  )

  # IAM permissions attached to the Lambda function's execution role
  attach_policy_statements = true
  policy_statements = {
    # Allow publishing events to EventBridge
    eventbridge_put = {
      effect = "Allow"
      actions = [
        "events:PutEvents" # Permission to publish events
      ]
      resources = [module.eventbridge.eventbridge_bus_arn] # Specific EventBridge bus ARN
    }
  }

  # Enable function versioning for better deployment management
  publish = true

  # Lambda trigger permissions
  # Allows API Gateway to invoke this Lambda function
  allowed_triggers = {
    APIGatewayPost = {
      service    = "apigateway"                                                                   # AWS service that can invoke
      source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/${var.stage_name}/POST/orders" # Specific API Gateway endpoint
    }
  }

  # CloudWatch Logs retention to control costs and storage
  cloudwatch_logs_retention_in_days = 7 # Keep logs for 1 week
}

# Lambda function to handle orders (restaurant notifications via SNS & EventBridge status updates)
module "notify_restaurant_lambda" {
  source  = "terraform-aws-modules/lambda/aws" # Community module for Lambda functions
  version = "~> 8.0"                           # Pin to major version for stability

  # Function configuration
  function_name = "${var.service_name}-${var.stage_name}-notify-restaurant" # Naming convention: service-function
  handler       = "index.handler"                                           # Entry point: file.function
  runtime       = "nodejs22.x"                                              # Node.js runtime version
  memory_size   = 1024                                                      # Memory allocated to the function in MB
  timeout       = 6                                                         # Lambda function timeout in seconds

  # Source code configuration
  source_path = [{
    path = "${path.module}/../functions/notify-restaurant" # Path to function source code
    commands = [
      "rm -rf node_modules",
      "npm ci --omit=dev",
      ":zip"
    ]
  }]

  # Environment variables for the Lambda function
  environment_variables = merge(
    local.common_lambda_env_vars,
    {
      bus_name                      = module.eventbridge.eventbridge_bus_name             # EventBridge bus for publishing events
      restaurant_notification_topic = module.sns_restaurant_notifications.topic_arn       # SNS topic for restaurant notifications
      idempotency_table             = module.dynamodb_idempotency_table.dynamodb_table_id # DynamoDB table for idempotency checks
    }
  )

  # IAM permissions attached to the Lambda function's execution role
  attach_policy_statements = true
  policy_statements = {
    # Allow publishing events to EventBridge (for restaurant_notified events)
    eventbridge_put = {
      effect = "Allow"
      actions = [
        "events:PutEvents" # Permission to publish events
      ]
      resources = [module.eventbridge.eventbridge_bus_arn] # Specific EventBridge bus ARN
    },

    # Allow publishing messages to SNS (for restaurant notifications)
    sns_publish = {
      effect = "Allow"
      actions = [
        "sns:Publish" # Permission to publish to SNS topics
      ]
      resources = [module.sns_restaurant_notifications.topic_arn] # Specific SNS topic ARN
    }

    # Allow idempotency table operations
    dynamodb_access = {
      effect = "Allow"
      actions = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ]
      resources = [module.dynamodb_idempotency_table.dynamodb_table_arn]
    }

    # Allow sending failed events to queue
    dlq_send = {
      effect = "Allow"
      actions = [
        "sqs:GetQueueAttributes",
        "sqs:GetQueueUrl",
        "sqs:SendMessage"
      ]
      resources = [aws_sqs_queue.notify_restaurant_dlq.arn]
    }
  }

  # Enable function versioning for better deployment management
  publish = true

  # Lambda trigger permissions
  # Allows EventBridge to invoke this Lambda function (rule)
  allowed_triggers = {
    EventBridge = {
      service    = "events"
      source_arn = module.eventbridge.eventbridge_rule_arns["notify_restaurant"]
    }
  }

  # OnFailure destination
  create_async_event_config = true                                    # Controls whether async event configuration for Lambda Function/Alias should be created
  destination_on_failure    = aws_sqs_queue.notify_restaurant_dlq.arn # ARN of the destination resource for failed asynchronous invocations

  # CloudWatch Logs retention to control costs and storage
  cloudwatch_logs_retention_in_days = 7 # Keep logs for 1 week
}

# DLQ (Dead Letter Queue) for OnFailure destination of notify_restaurant Lambda invocations
resource "aws_sqs_queue" "notify_restaurant_dlq" {
  name = "${var.service_name}-${var.stage_name}-notify-restaurant-dlq"
}

# NOTE: OnFailure destination is now configured using destination_on_failure setting in the Lambda module above
# instead of using a separate aws_lambda_function_event_invoke_config resource
#
# # Configure OnFailure destination for notify_restaurant Lambda
# resource "aws_lambda_function_event_invoke_config" "notify_restaurant" {
#   function_name = module.notify_restaurant_lambda.lambda_function_name

#   destination_config {
#     # Destination configuration for failed asynchronous invocations
#     on_failure {
#       destination = aws_sqs_queue.notify_restaurant_dlq.arn
#     }
#   }
# }

# Alarm for failed events in the DLQ
# Default SNS Topic Policy: the default policy allows any AWS service within our account to publish to the topic
resource "aws_cloudwatch_metric_alarm" "on_failure_queue" {
  alarm_name          = "[${var.stage_name}][notify-restaurant function] Failed events detected in OnFailure destination"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300 # 5 minutes
  statistic           = "Average"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  # Services to publish metrics to CloudWatch
  dimensions = {
    QueueName = aws_sqs_queue.notify_restaurant_dlq.name
  }

  # List of actions to execute when this alarm transitions into an ALARM state from any other state.
  alarm_actions = [module.sns_alarm_topic.topic_arn]
}

# Alarm for DLQ delivery failures (DestinationDeliveryFailures) - triggers when Lambda cannot send failed events to the OnFailure destination
# Default SNS Topic Policy: the default policy allows any AWS service within our account to publish to the topic
resource "aws_cloudwatch_metric_alarm" "destination_delivery_failures" {
  alarm_name          = "[${var.stage_name}][notify-restaurant function] Failed to deliver failed events to OnFailure destination"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "DestinationDeliveryFailures"
  namespace           = "AWS/Lambda"
  period              = 300 # 5 minutes
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  # Services to publish metrics to CloudWatch
  dimensions = {
    FunctionName = module.notify_restaurant_lambda.lambda_function_name
  }

  # List of actions to execute when this alarm transitions into an ALARM state from any other state.
  alarm_actions = [module.sns_alarm_topic.topic_arn]
}


# Lambda function for saving order data in DynamoDB table from EventBridge events.
# This function writes the order information from the "order_placed" events into the "orders" DynamoDB table.
# Function is triggered by EventBridge rule "seed_orders" which filter for "order_placed" events.
module "seed_orders_lambda" {
  source  = "terraform-aws-modules/lambda/aws" # Community module for Lambda functions
  version = "~> 8.0"                           # Pin to major version for stability

  # Function configuration
  function_name = "${var.service_name}-${var.stage_name}-seed-orders"
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  memory_size   = 1024
  timeout       = 6

  # Source code configuration
  source_path = [{
    path = "${path.module}/../functions/seed-orders"
    commands = [
      "rm -rf node_modules",
      "npm ci --omit=dev",
      ":zip"
    ]
  }]

  # Environment variables for the Lambda function
  environment_variables = merge(
    local.common_lambda_env_vars,
    {
      orders_table      = module.dynamodb_orders_tables.dynamodb_table_id
      idempotency_table = module.dynamodb_idempotency_table.dynamodb_table_id
    }
  )

  # IAM permissions attached to the Lambda function's execution role
  attach_policy_statements = true
  policy_statements = {
    # Allow write access to DynamoDB orders table
    dynamodb_orders_write = {
      effect = "Allow"
      actions = [
        "dynamodb:PutItem"
      ]
      resources = [module.dynamodb_orders_tables.dynamodb_table_arn]
    }

    # Allow idempotency table operations
    dynamodb_idempotency = {
      effect = "Allow"
      actions = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ]
      resources = [module.dynamodb_idempotency_table.dynamodb_table_arn]
    }
  }

  # Enable function versioning for better deployment management
  publish = true

  # Lambda trigger permissions
  # Allows EventBridge to invoke this Lambda function (rule)
  allowed_triggers = {
    EventBridge = {
      service    = "events"
      source_arn = module.eventbridge.eventbridge_rule_arns["seed_orders"]
    }
  }

  # CloudWatch Logs retention
  cloudwatch_logs_retention_in_days = 7 # Keep logs for 1 week
}
