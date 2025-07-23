/**
 * Notify Restaurant Lambda Function
 *
 * This function is triggered by order_placed events from EventBridge.
 * It notifies restaurants about new orders via SNS and publishes a restaurant_notified event back
 * to EventBridge to continue the workflow.
 */

// AWS SDK v3 imports for EventBridge and SNS operations
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// Initialize clients (created outside handler for connection reuse)
const eventBridge = new EventBridgeClient();
const sns = new SNSClient();

// Get configuration from environment variables
const busName = process.env.bus_name; // EventBridge bus name
const topicArn = process.env.restaurant_notification_topic; // SNS topic ARN

/**
 * Lambda handler function for notifying restaurants of new orders
 * @param {Object} event - EventBridge event containing order details
 * @returns {void}
 */
export const handler = async (event) => {
  // Extract order details from the EventBridge event
  const order = event.detail;

  // Step 1: Notify the restaurant via SNS
  // Create SNS publish command with order details
  const publishCmd = new PublishCommand({
    Message: JSON.stringify(order), // Convert order object to JSON string
    TopicArn: topicArn, // Target SNS topic
  });

  // Send notification to SNS topic
  await sns.send(publishCmd);

  // Extract key information for logging
  const { restaurantName, orderId } = order;
  console.log(`notified restaurant [${restaurantName}] of order [${orderId}]`);

  // Step 2: Publish restaurant_notified event to EventBridge
  // This allows other services to react to the notification being sent
  const putEventsCmd = new PutEventsCommand({
    Entries: [
      {
        Source: 'big-mouth', // Application identifier - used for event filtering and routing
        DetailType: 'restaurant_notified', // Event type for filtering
        Detail: JSON.stringify(order), // Event payload with order details
        EventBusName: busName, // Target event bus
      },
    ],
  });

  // Send event to EventBridge
  await eventBridge.send(putEventsCmd);
  console.log(`published 'restaurant_notified' event to EventBridge`);
};
