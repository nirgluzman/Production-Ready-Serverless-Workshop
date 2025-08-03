# main.tf

# This file contains the Terraform configuration for the core infrastructure resources (such as VPC, load balancers, databases, etc.).

# DynamoDB table for storing restaurant data
# https://registry.terraform.io/modules/terraform-aws-modules/dynamodb-table/aws/latest
module "dynamodb_restaurants_table" {
  source  = "terraform-aws-modules/dynamodb-table/aws"  # module from serverless.tf
  version = "~> 5.0"

  # Table configuration
  name        = "${var.service_name}-${var.stage_name}-restaurants"  # Naming: service-environment-purpose
  hash_key    = "name"                                               # Primary key: restaurant name

  # Table attributes (only keys need to be defined upfront)
  attributes  = [
    {
      name = "name"  # Restaurant name attribute
      type = "S"     # String type
    }
  ]
}

# DynamoDB table for storing orders
module "dynamodb_orders_tables" {
  source  = "terraform-aws-modules/dynamodb-table/aws"  # module from serverless.tf
  version = "~> 5.0"

  # Table configuration
  name        = "${var.service_name}-${var.stage_name}-orders"  # Naming: service-environment-purpose
  hash_key    = "id"

  # Table attributes
  attributes  = [
    {
      name = "id"
      type = "S"
    }
  ]
}

# AWS Cognito User Pool for user authentication and management
resource "aws_cognito_user_pool" "main" {
  name = "${var.service_name}-${var.stage_name}-UserPool"  # Naming: service-environment-UserPool

  # Authentication configuration
  alias_attributes         = ["email"]  # Allow users to sign in with email instead of username
  auto_verified_attributes = ["email"]  # Automatically verify email addresses upon registration (by sending a verification code to the email)

  # Username settings
  username_configuration {
    case_sensitive = true  # Usernames are case-sensitive
  }

  # Password complexity requirements for security
  password_policy {
    minimum_length    = 8     # Minimum 8 characters
    require_lowercase = true  # Must contain lowercase letters
    require_numbers   = true  # Must contain numbers
    require_symbols   = true  # Must contain special characters
    require_uppercase = true  # Must contain uppercase letters
  }

  # User attribute schema - defines required user information
  # First name attribute
  schema {
    name                = "given_name"  # Standard attribute for first name
    attribute_data_type = "String"      # Data type
    required            = true          # Must be provided during registration
    mutable             = true          # Can be changed after registration
  }

  # Last name attribute
  schema {
    name                = "family_name"  # Standard attribute for last name
    attribute_data_type = "String"       # Data type
    required            = true           # Must be provided during registration
    mutable             = true           # Can be changed after registration
  }

  # Email attribute
  schema {
    name                = "email"   # Standard attribute for email
    attribute_data_type = "String"  # Data type
    required            = true      # Must be provided during registration
    mutable             = true      # Can be changed after registration
  }
}

#
# To interact with a Cognito User Pool, we also need to create app clients.
# Each client can be configured with different authentication flows, token expiration, and which attributes it's allowed to read or write.
#

# Cognito User Pool Client for web applications - handles browser-based authentication flows
# Used by the landing page frontend to register new users, and support sign-in and sign-out.
resource "aws_cognito_user_pool_client" "web_client" {
  name         = "web_client"                    # Client identifier
  user_pool_id = aws_cognito_user_pool.main.id   # Link to user pool

  # Security setting to prevent user enumeration attacks
  prevent_user_existence_errors = "ENABLED"  # Don't reveal if user exists or not

  # Authentication flows allowed for this client
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",      # Secure Remote Password (SRP) - secure password auth
    "ALLOW_REFRESH_TOKEN_AUTH"  # Allow token refresh for session management
  ]
}

# Cognito User Pool Client for server-side applications - handles server-to-server authentication flows
# Programmatically create new users using the admin flow
resource "aws_cognito_user_pool_client" "server_client" {
  name         = "server_client"                 # Client identifier
  user_pool_id = aws_cognito_user_pool.main.id  # Link to user pool

  # Security setting to prevent user enumeration attacks
  prevent_user_existence_errors = "ENABLED"  # Don't reveal if user exists or not

  # Authentication flows allowed for this client
  explicit_auth_flows = [
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",  # Admin-initiated auth with username/password - allows us to call the Cognito admin endpoints to register users and sign-in as them
    "ALLOW_REFRESH_TOKEN_AUTH"         # Allow token refresh for session management
  ]
}

# Amazon EventBridge event bus for order processing events
# EventBridge enables event-driven architectures by routing events between AWS services and applications
# https://registry.terraform.io/modules/terraform-aws-modules/eventbridge/aws/latest
#
# This event bus will be used for:
# - Publishing order placed events when customers order food
# - Enabling other services to subscribe to these events
# - Implementing asynchronous processing of orders
# - Decoupling the order processing from the main application flow
module "eventbridge" {
  source  = "terraform-aws-modules/eventbridge/aws"  # Community module for EventBridge
  version = "~> 4.0"                                 # Pin to major version for stability

  # EventBridge configuration

  # Custom event bus for order-related events; Naming: [service name]-[environment]-order-events
  # We opted to name the EventBridge bus with the service name and stage name as prefix; this is to support
  # ephemeral environments, so we can create a different event bus for each environment.
  bus_name = "${var.service_name}-${var.stage_name}-order-events"

  # Enable event archiving (for storing all events for later retrieval and analysis)
  create_archives = true

  # EventBridge archive configuration
  archives = {
    # Archive name must be unique to our account in the selected Region
    "${var.service_name}-${var.stage_name}-order-events-archive" = {
      description = "Archive for ALL events from the order-events bus"
      retention_days = 0  # Indefinite retention
      event_pattern  = jsonencode({
        "account": ["${data.aws_caller_identity.current.account_id}"],  # Archive events from this account
      })
    }
  }

  # Append '-rule' to all rule names (default)
  append_rule_postfix = true

  # NOTE: Rule name
  # https://stackoverflow.com/questions/72215332/change-eventbridge-cron-rule-name-in-terraform
  # https://github.com/terraform-aws-modules/terraform-aws-eventbridge/issues/20

  # EventBridge rules define event patterns to match specific events
  # These rules act as filters that determine which events trigger which targets
  rules = {
    # Rule to match order_placed events and trigger notify_restaurant_lambda
    notify_restaurant = {
      # JSON pattern that filters events by source and detail-type
      # Only events from 'big-mouth' application with 'order_placed' type will match
      event_pattern = jsonencode({
        source      = ["big-mouth"]     # Match events from our application
        detail-type = ["order_placed"]  # Match only order placed events
      })
    }

    # Rule to match order_placed events and trigger seed_orders_lambda
    # NOTE: This rule has the same event pattern as the notify_restaurant rule. We need to have this setup, so when we replay events,
    # we can target each rule independently (and to invoke each rule's targets without impacting the other rule).
    seed_orders = {
      # JSON pattern that filters events by source and detail-type
      event_pattern = jsonencode({
        source      = ["big-mouth"]
        detail-type = ["order_placed"]
      })
    }
  }

  # EventBridge targets define where matching events should be sent
  # Each target is associated with a specific rule defined above
  targets = {
    # Targets for the notify_restaurant rule
    notify_restaurant = [
      {
        name = "notify-restaurant-lambda"                          # Target identifier
        arn  = module.notify_restaurant_lambda.lambda_function_arn # Lambda function to invoke
      }
    ]

    # Targets for the seed_orders rule
    seed_orders = [
      {
        name = "seed-orders-lambda"                               # Target identifier
        arn  = module.seed_orders_lambda.lambda_function_arn      # Lambda function to invoke
      }
    ]
  }
}

# Amazon SNS topic for notifying restaurants on orders
# SNS (Simple Notification Service) enables pub/sub messaging for microservices and event-driven applications
# https://registry.terraform.io/modules/terraform-aws-modules/sns/aws/latest
#
# This SNS topic will be used for:
# - Notifying restaurant when new order is placed
# - Enabling restaurants to subscribe via email, SMS, or mobile push notifications
module "sns_restaurant_notifications" {
  source  = "terraform-aws-modules/sns/aws"  # Community module for SNS
  version = "~> 6.0"                         # Pin to major version for stability

  # SNS topic name; Naming: [service name]-[environment]-restaurant-notifications
  name = "${var.service_name}-${var.stage_name}-restaurant-notifications"
}

# Amazon SNS topic for user notifications
# This topic is used to send notifications to users, such as order updates or promotional messages
module "sns_user_notifications" {
  source  = "terraform-aws-modules/sns/aws"
  version = "~> 6.0"

  name = "${var.service_name}-${var.stage_name}-user-notifications"
}

# Amazon SQS queue for end-to-end (E2E) testing
# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sqs_queue
#
# This queue is used for:
# - Capturing events during end-to-end tests
# - Providing a temporary message store for test validation
# - Only created for development/test environments (when stage_name starts with "dev")
resource "aws_sqs_queue" "e2e_test" {
  # Conditionally create this queue only for e2e test environments
  count = local.is_e2e_test ? 1 : 0

  # Queue configuration
  name = "${var.service_name}-${var.stage_name}-e2e-test-queue"  # Naming: service-environment-purpose

  # Message retention - very short time for testing purposes
  # Messages are automatically deleted after 60 seconds to keep the queue clean
  message_retention_seconds = 60

  # Visibility timeout - time a message is hidden from other consumers after being received
  # Set to a very short 1 second to optimize for concurrent test execution:
  # - Messages picked up by one test are temporarily hidden from others
  # - Short timeout ensures messages become available again quickly
  # - If a test instance crashes or fails to process a message quickly, that message becomes available almost immediately
  #   for another test instance to pick up, preventing test blockages.
  # - Ensures that all messages put into the queue for testing purposes are quickly processed or re-processed,
  #   maximizing the chances of each test seeing relevant messages within the test window.
  visibility_timeout_seconds = 1
}

# SNS topic subscription for the E2E test SQS queue
# Subscribes the e2e test SQS queue to the restaurant notifications SNS topic
# This allows e2e tests to capture and verify SNS messages sent during order processing
resource "aws_sns_topic_subscription" "e2e_test" {
  # Conditionally create this queue only for e2e test environments
  count = local.is_e2e_test ? 1 : 0

  topic_arn = module.sns_restaurant_notifications.topic_arn  # ARN of the SNS topic to subscribe to
  protocol  = "sqs"                                          # Use SQS as the delivery protocol
  endpoint  = aws_sqs_queue.e2e_test[0].arn                  # Target SQS queue for messages
  raw_message_delivery = false                               # Essential for E2E tests to verify message origin via SNS envelope metadata
}

# Queue policy for SNS amd EventBridge
# Grants the SNS topic and EventBridge permission to publish messages to the E2E test SQS queue
# Even with a subscription, explicit queue permissions are required for message delivery
resource "aws_sqs_queue_policy" "e2e_test" {
  # Conditionally create this queue only for e2e test environments
  count = local.is_e2e_test ? 1 : 0

  queue_url = aws_sqs_queue.e2e_test[0].url
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowSNSPublish"
        Effect    = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action    = "sqs:SendMessage"
        Resource  = aws_sqs_queue.e2e_test[0].arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = module.sns_restaurant_notifications.topic_arn
          }
        }
      },
      {
        Sid       = "AllowEventBridgePublish"
        Effect    = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action    = "sqs:SendMessage"
        Resource  = aws_sqs_queue.e2e_test[0].arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_cloudwatch_event_rule.e2e_test[0].arn
          }
        }
      }
    ]
  })
}

# EventBridge rule for E2E testing - captures all events from the application
# This rule matches ALL events from the 'big-mouth' application
# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_event_rule
resource "aws_cloudwatch_event_rule" "e2e_test" {
  # Conditionally create this queue only for e2e test environments
  count = local.is_e2e_test ? 1 : 0

  # Name or ARN of the event bus to associate with this rule
  event_bus_name = module.eventbridge.eventbridge_bus_name

  # Ensure the EventBridge module is created first
  depends_on = [module.eventbridge]

  # Rule configuration
  name = "${var.service_name}-${var.stage_name}-e2e-test"  # Naming: service-environment-purpose

  # Event pattern - match ALL events from our application
  # Unlike the notify_restaurant rule which only matches 'order_placed',
  event_pattern = jsonencode({
    source = ["big-mouth"]  # Match all events from our application
  })
}

# EventBridge target for E2E testing - defines where matched events should be sent
# This target routes all events matching the e2e_test rule to the test SQS queue
# Includes event transformation to add metadata for easier test verification
# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_event_target
resource "aws_cloudwatch_event_target" "e2e_test" {
  # Conditionally create this queue only for e2e test environments
  count = local.is_e2e_test ? 1 : 0

  # Target configuration
  rule           = aws_cloudwatch_event_rule.e2e_test[0].name  # Link to the e2e test rule
  event_bus_name = module.eventbridge.eventbridge_bus_name     # Event bus containing the rule
  target_id      = "E2ETestQueue"                              # Unique identifier for this target
  arn            = aws_sqs_queue.e2e_test[0].arn               # Destination SQS queue ARN

  # Event transformation - restructure the event payload to include eventBusName
  # This transforms the original EventBridge event into a more convenient format for test verification by extracting key fields and adding metadata
  input_transformer {
    # Extract specific fields from the original event
    input_paths = {
      source: "$.source",           # Event source (e.g., 'big-mouth')
      detailType: "$.detail-type",  # Event type (e.g., 'order_placed')
      detail: "$.detail"            # Event payload
    }

    # Template for the transformed message sent to SQS
    # Wraps the extracted fields in a structured format with additional metadata
    input_template = <<EOF
{
  "event": {
    "source": <source>,
    "detail-type": <detailType>,
    "detail": <detail>
  },
  "eventBusName": "${var.service_name}-${var.stage_name}-order-events"
}
EOF
  }
}

# DynamoDB table to keep track of the idempotency tokens

# Lambda Powertools ensures idempotency by hashing the invocation event.
# It marks an event IN_PROGRESS during processing, then COMPLETED with the result. If the same event arrives again before expiration,
# Powertools returns the stored result, avoiding re-execution.
module "dynamodb_idempotency_table" {
  source  = "terraform-aws-modules/dynamodb-table/aws"
  version = "~> 5.0"

  # Table configuration
  name        = "${var.service_name}-idempotency-${var.stage_name}"  # Naming: service-purpose-environment
  hash_key    = "id"                                                 # Primary key: id

  # Table attributes (only keys need to be defined upfront)
  attributes  = [
    {
      name = "id"  # Hash of the invocation event as an idempotency key
      type = "S"   # String type
    }
  ]
}

# SNS topic for alarms
module "sns_alarm_topic" {
  source  = "terraform-aws-modules/sns/aws"
  version = "~> 6.0"

  name = "${var.service_name}-${var.stage_name}-alarms"
}

# Email subscription for the alarm topic
resource "aws_sns_topic_subscription" "alarm_email" {
  topic_arn = module.sns_alarm_topic.topic_arn
  protocol  = "email-json"       # Use email protocol to receive JSON messages
  endpoint  = "<EMAIL ADDRESS>"  # Email to receive the alerts
}
