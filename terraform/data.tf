/**
 * AWS Data Sources
 *
 * This file defines data sources that retrieve information from AWS without creating any resources.
 * These are used throughout the Terraform configuration to reference existing AWS resources or account information.
 */

# Retrieves information about the AWS account and IAM principal (user/role) that Terraform is using to perform operations.
# This provides access to:
# - account_id: The AWS account ID
# - user_id: The unique identifier of the AWS principal
# - arn: The Amazon Resource Name (ARN) of the principal
data "aws_caller_identity" "current" {}

# SSM Parameter Store entry containing the KMS key ARN.
data "aws_ssm_parameter" "kms_arn" {
  name = "/${var.service_name}/${local.ssm_stage_name}/kmsArn"
}
