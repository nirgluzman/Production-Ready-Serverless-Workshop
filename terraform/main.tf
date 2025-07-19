# main.tf

# This file contains the Terraform configuration for the core infrastructure resources (such as VPC, load balancers, databases, etc.).

# DynamoDB table for storing restaurant data
# https://registry.terraform.io/modules/terraform-aws-modules/dynamodb-table/aws/latest
module "dynamodb_restaurants_table" {
  source  = "terraform-aws-modules/dynamodb-table/aws" # module from serverless.tf
  version = "~> 4.0"

  # Table configuration
  name        = "${var.service_name}-restaurants-${var.stage_name}"  # Naming: service-purpose-environment
  hash_key    = "name"                                               # Primary key: restaurant name

  # Define table attributes (only keys need to be defined upfront)
  attributes  = [
    {
      name = "name"  # Restaurant name attribute
      type = "S"     # String type
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
