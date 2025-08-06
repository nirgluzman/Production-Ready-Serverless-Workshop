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

// AWS Lambda Powertools utilities
// Logger with output structured as JSON
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
// // Idempotency handling - idempotency ensures the same operation can be called multiple times safely without side effects.
// import { makeIdempotent } from '@aws-lambda-powertools/idempotency'; // general-purpose function to wrap any function to make it idempotent.
import { makeHandlerIdempotent } from '@aws-lambda-powertools/idempotency/middleware'; // Middy middleware specifically designed for an AWS Lambda handler.
// DynamoDB persistence layer for storing idempotency keys and preventing duplicate processing
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
// Opinionated wrapper for AWS X-Ray
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';

// Middy is a middleware engine designed for serverless functions, enabling us to execute custom logic
// before and after our main handler code runs.
// https://github.com/middyjs/middy
// https://middy.js.org/docs/intro/how-it-works/
// @middy/core: Middleware to simplify common Lambda tasks
import middy from '@middy/core';

// Initialize clients (created outside handler for connection reuse)
const eventBridge = new EventBridgeClient();
const sns = new SNSClient();

// Initialize X-Ray tracer with service name for distributed tracing
// Creating a Tracer would automatically capture outgoing HTTP requests
const tracer = new Tracer({ serviceName: process.env.service_name });

// Capture EventBridge operations in X-Ray traces for performance monitoring
tracer.captureAWSv3Client(eventBridge);

// Capture SNS operations in X-Ray traces for performance monitoring
tracer.captureAWSv3Client(sns);

// Get configuration from environment variables
const busName = process.env.bus_name; // EventBridge bus name
const topicArn = process.env.restaurant_notification_topic; // SNS topic ARN

// Configure DynamoDB persistence store for idempotency tracking
// This table stores hashes of processed events to prevent duplicate executions when the same EventBridge event is delivered multiple times
const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: process.env.idempotency_table, // DynamoDB table name from environment variables
});

// Initialize structured logger with service name from environment
const logger = new Logger({ serviceName: process.env.service_name });

/**
 * Core handler function for notifying restaurants of new orders
 *
 * This function is wrapped with AWS Lambda Powertools idempotency to prevent duplicate processing.
 * The idempotency tool provides a DynamoDB persistence layer that tracks processed events, ensuring restaurant notifications
 * are sent only once even if the same EventBridge event is delivered multiple times.
 *
 * @param {Object} event - EventBridge event containing order details
 * @returns {string} orderId - Returns order ID for idempotency key generation
 */
export const _handler = async (event) => {
  // Reset sampling calculation to determine if this invocation should log debug messages
  logger.refreshSampleRateCalculation();

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

  // console.log(`notified restaurant [${restaurantName}] of order [${orderId}]`);
  logger.debug('notified restaurant of order', { restaurantName, orderId });

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

  // console.log(`published 'restaurant_notified' event to EventBridge`);
  logger.debug(`published event to EventBridge`, {
    eventType: 'restaurant_notified',
    busName,
  });

  // Return orderId for idempotency key generation
  // The idempotency tool uses this return value to create a unique key for tracking processed events
  return orderId;
};

// // Export the idempotent-wrapped handler as the main Lambda handler
// // makeIdempotent wraps _handler with idempotency logic using the DynamoDB persistence store
// // This ensures the function executes only once per unique event, preventing duplicate notifications
// export const handler = makeIdempotent(_handler, { persistenceStore });

// Export handler with Middy middleware chain
export const handler = middy(_handler)
  // Automatically inject Lambda context (request ID, function name, etc.) into all log messages
  .use(injectLambdaContext(logger))
  // Add ##functions/notify-restaurant.handler segment to the X-Ray trace, and captures cold start, service name, and response of the invocation
  .use(captureLambdaHandler(tracer))
  .use(
    // prevents duplicate processing using DynamoDB persistence
    makeHandlerIdempotent({
      persistenceStore,
    })
  );
