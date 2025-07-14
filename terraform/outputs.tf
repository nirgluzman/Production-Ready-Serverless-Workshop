# Terraform outputs - values that are displayed after deployment.
# These outputs can be referenced by other Terraform configurations or used for testing

output "api_gateway_url" {
  description = "The URL of the API Gateway"                    # Human-readable description
  value       = "${aws_api_gateway_stage.main.invoke_url}"     # API Gateway invoke URL for testing
}
