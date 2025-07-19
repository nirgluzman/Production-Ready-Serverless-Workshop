# Terraform outputs - values that are displayed after deployment.
# These outputs can be referenced by other Terraform configurations or used for testing

output "region" {
  description = "AWS region"
  value       = "${var.aws_region}"
}
output "api_gateway_url" {
  description = "The URL of the API Gateway"
  value       = "${aws_api_gateway_stage.main.invoke_url}"  # API Gateway invoke URL
}

output "restaurants_table" {
  description = "The name of the restaurants table"
  value       = "${module.dynamodb_restaurants_table.dynamodb_table_id}"  # DynamoDB table ID
}

output "restaurants_api" {
  description = "URL to the GET /restaurants endpoint"
  value       = "${aws_api_gateway_stage.main.invoke_url}/restaurants"
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito user pool"
  value       = "${aws_cognito_user_pool.main.id}"
}

output "cognito_client_id" {
  description = "ID of the web Cognito client"
  value       = "${aws_cognito_user_pool_client.web_client.id}"
}

output "cognito_server_client_id" {
  description = "ID of the server Cognito client"
  value       = "${aws_cognito_user_pool_client.server_client.id}"
}
