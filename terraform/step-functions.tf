# Step Functions state machine for order processing workflow
# https://registry.terraform.io/modules/terraform-aws-modules/step-functions/aws/latest
#

module "order_flow_state_machine" {
  source  = "terraform-aws-modules/step-functions/aws"
  version = "~> 5.0"

  # The name of the Step Functions state machine
  name = "${var.service_name}-${var.stage_name}-order-flow"

  # Load ASL definition with dynamic resource ARNs (JSONata syntax)
  # https://docs.aws.amazon.com/step-functions/latest/dg/transforming-data.html
  # templatefile in Terraform reads the file at the given path and renders its content as a template
  # using a supplied set of template variables.
  definition = templatefile("${path.module}/state_machines/order-flow.asl.json", {
    ORDERS_TABLE_NAME    = module.dynamodb_orders_tables.dynamodb_table_id
    EVENT_BUS_NAME       = module.eventbridge.eventbridge_bus_name
    RESTAURANT_TOPIC_ARN = module.sns_restaurant_notifications.topic_arn
    USER_TOPIC_ARN       = module.sns_user_notifications.topic_arn
  })

  # AWS service integrations to allow in IAM role policy
  service_integrations = {
    # DynamoDB permissions for order status updates
    dynamodb = {
      dynamodb = [module.dynamodb_orders_tables.dynamodb_table_arn]
    }

    # EventBridge permissions for publishing order events
    eventbridge = {
      eventbridge = [module.eventbridge.eventbridge_bus_arn]
    }

    # SNS permissions for restaurant and user notifications
    sns = {
      sns = [
        module.sns_restaurant_notifications.topic_arn,
        module.sns_user_notifications.topic_arn
      ]
    }
  }
}
