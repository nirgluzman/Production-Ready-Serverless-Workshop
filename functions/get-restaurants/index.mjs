// AWS SDK v3 imports for DynamoDB operations (already exist in the Lambda execution environment, so we don't need to install them for our function)
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

// AWS Lambda Powertools utilities
// Logger with output structured as JSON
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';

// Middy is a middleware engine designed for serverless functions, enabling us to execute custom logic
// before and after our main handler code runs.
// https://github.com/middyjs/middy
// https://middy.js.org/docs/intro/how-it-works/
// @middy/core: Middleware to simplify common Lambda tasks
import middy from '@middy/core';
// @middy/ssm: Middleware that automatically loads parameters from AWS SSM Parameter Store during cold starts
// and caches them for subsequent invocations, improving performance
import ssm from '@middy/ssm';

// Initialize structured logger with service name from environment
const logger = new Logger({ serviceName: process.env.service_name });

// Initialize DynamoDB clients (created outside handler for connection reuse)
const dynamodbClient = new DynamoDB({}); // Low-level DynamoDB client
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient); // Document client for easier JSON handling

// Environment variables
const { service_name, ssm_stage_name } = process.env;
const tableName = process.env.restaurants_table; // DynamoDB table name

// Fetch restaurants from DynamoDB table
const getRestaurants = async (count) => {
  // console.log(`fetching ${count} restaurants from ${tableName}...`);
  logger.debug('getting restaurants from DynamoDB...', {
    count,
    tableName,
  });

  // Scan operation to retrieve restaurants
  // NOTE: Scan reads the entire table and returns the first X number of items it finds.
  // It's an inefficient and potentially expensive operation if we've a table with millions of items.
  const resp = await dynamodb.send(
    new ScanCommand({
      TableName: tableName, // Target table
      Limit: count, // Maximum number of items to return
    })
  );

  // console.log(`found ${resp.Items.length} restaurants`);
  logger.debug('found restaurants', {
    count: resp.Items.length,
  });

  return resp.Items; // Return array of restaurant objects
};

// AWS Lambda handler function - returns list of restaurants as JSON
export const handler = middy(async (event, context) => {
  // Reset sampling calculation to determine if this invocation should log debug messages
  logger.refreshSampleRateCalculation();

  // function handler logic
  const restaurants = await getRestaurants(context.config.defaultResults); // Fetch restaurants from DynamoDB
  const response = {
    statusCode: 200, // HTTP OK status
    body: JSON.stringify(restaurants), // Convert restaurant array to JSON string
  };

  return response;
})
  .use(
    // configuration of middy SSM middleware, https://middy.js.org/docs/intro/how-it-works/
    ssm({
      // cache the SSM parameter value, so we don't hammer SSM Parameter Store with requests.
      cache: true,
      // cached value to expire after 1 minute. So if we change the configuration in SSM Parameter Store,
      // then the concurrent executions would load the new value when their cache expires, without needing a deployment.
      cacheExpiry: 1 * 60 * 1000,
      // set the SSM parameter value to the Lambda context, so we can access it in our handler
      setToContext: true,
      // fetches individual parameters and stores them in either the invocation context object (setToContext) or the environment variables (default)
      fetchData: {
        config: `/${service_name}/${ssm_stage_name}/get-restaurants/config`,
      },
    })
  )
  .use(injectLambdaContext(logger));
