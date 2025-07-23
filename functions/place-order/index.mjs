/**
 * Place Order Lambda Function
 *
 * This function handles the POST /orders endpoint to place new food orders.
 * It generates a unique order ID and publishes an event to EventBridge for asynchronous processing by other services.
 *
 * NOTE:
 * For production, it's recommended to persist orders in a DynamoDB table for data integrity, auditing, recoverability, and business intelligence.
 * We're skipping this in the demo to focus on event processing.
 */

// AWS SDK v3 import for EventBridge operations
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
// Chance library for generating random values (used for order IDs)
import { Chance } from 'chance';

// Initialize EventBridge client (created outside handler for connection reuse)
const eventBridge = new EventBridgeClient();

// Initialize Chance library for random ID generation
const chance = Chance();

// Get EventBridge bus name from environment variables
const busName = process.env.bus_name;

/**
 * Lambda handler function for placing orders
 * @param {Object} event - API Gateway event object
 * @returns {Object} HTTP response with status code and order ID
 */
export const handler = async (event) => {
  // Extract restaurant name from the request body
  const restaurantName = JSON.parse(event.body).restaurantName;

  // Generate a unique order ID using chance library
  const orderId = chance.guid();
  console.log(`placing order ID [${orderId}] to [${restaurantName}]`);

  // Create an EventBridge event for the order
  const putEvent = new PutEventsCommand({
    Entries: [
      {
        Source: 'big-mouth', // Event source identifier
        DetailType: 'order_placed', // Event type for filtering
        Detail: JSON.stringify({
          // Event payload as JSON string
          orderId,
          restaurantName,
        }),
        EventBusName: busName, // Target event bus from environment
      },
    ],
  });

  // Publish the event to EventBridge
  await eventBridge.send(putEvent);
  console.log(`published 'order_placed' event into EventBridge`);

  // Return success response with the generated order ID
  const response = {
    statusCode: 200, // HTTP 200 OK
    body: JSON.stringify({ orderId }), // Include order ID in response
  };

  return response;
};
