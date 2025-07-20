/**
 * AWS Systems Manager (SSM) Parameter Store Configuration
 *
 * This file defines SSM parameters that store configuration values and endpoints for the application.
 * These parameters can be accessed at runtime by Lambda functions using the AWS SDK or the Middy SSM middleware.
 */

# String parameter that contains the root URL of our API Gateway
# Other services that want to use your service can find out the service URL by referencing this SSM parameter.
# The parameter follows the hierarchical naming convention: /service/stage/component/parameter
resource "aws_ssm_parameter" "service_url" {
  name  = "/${var.service_name}/${var.stage_name}/myservice/url"
  type  = "String"
  value = aws_api_gateway_stage.main.invoke_url
}
