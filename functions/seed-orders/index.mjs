/**
 * Seed Orders Lambda Function
 *
 * This function is triggered by "order_placed" events from EventBridge and saves order data to DynamoDB.
 */

// AWS SDK v3 imports for DynamoDB operations
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// AWS Lambda Powertools utilities
// Logger with output structured as JSON
import { Logger } from '@aws-lambda-powertools/logger';
// Idempotency handling - idempotency ensures the same operation can be called multiple times safely without side effects.
import { makeIdempotent, IdempotencyConfig } from '@aws-lambda-powertools/idempotency';
// DynamoDB persistence layer for storing idempotency keys and preventing duplicate processing
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';

// Initialize DynamoDB client (created outside handler for connection reuse)
const dynamodbClient = new DynamoDB();
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);

// Idempotency store to prevent duplicate order processing
const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: process.env.idempotency_table,
});

// Initialize structured logger with service name from environment
const logger = new Logger({ serviceName: process.env.service_name });

// AWS Lambda handler function
const _handler = async (event) => {
  // Extract order details from EventBridge event
  const order = event.detail;

  // console.log('Saving order id:', order.orderId);
  logger.info('Saving order id', order.orderId);

  // Write order information to orders table
  await dynamodb.send(
    new PutCommand({
      TableName: process.env.orders_table,
      Item: {
        id: order.orderId,
        restaurantName: order.restaurantName,
      },
    })
  );
};

// Make handler idempotent using orderId as the key
export const handler = makeIdempotent(_handler, {
  persistenceStore,
  config: new IdempotencyConfig({
    // Idempotency key is the orderId itself (override the default behaviour - hash the whole invocation event)
    eventKeyJmesPath: 'detail.orderId',
  }),
});
