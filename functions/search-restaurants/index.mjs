// AWS SDK v3 imports for DynamoDB operations
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

// Middy is a middleware engine designed for serverless functions, enabling us to execute custom logic
// before and after our main handler code runs.
// https://github.com/middyjs/middy
// https://middy.js.org/docs/intro/how-it-works/
// @middy/core: Middleware to simplify common Lambda tasks
import middy from '@middy/core';
// @middy/ssm: Middleware that automatically loads parameters from AWS SSM Parameter Store during cold starts
// and caches them for subsequent invocations, improving performance
import ssm from '@middy/ssm';

// Initialize DynamoDB clients (created outside handler for connection reuse)
const dynamodbClient = new DynamoDB({});
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);

// Environment variables configuration
const { service_name, stage_name } = process.env;
const tableName = process.env.restaurants_table; // DynamoDB table name from environment

// Search restaurants by theme using DynamoDB scan with filter
const findRestaurantsByTheme = async (theme, count) => {
  console.log(`finding (up to ${count}) restaurants with the theme ${theme}...`);

  // Scan operation with filter expression to find restaurants by theme
  const resp = await dynamodb.send(
    new ScanCommand({
      TableName: tableName,
      Limit: count, // Maximum items to return
      FilterExpression: 'contains(themes, :theme)', // Filter: check if themes array contains the search theme
      ExpressionAttributeValues: { ':theme': theme }, // Parameter substitution for filter
    })
  );
  console.log(`found ${resp.Items.length} restaurants`);
  return resp.Items; // Return array of matching restaurant objects
};

// AWS Lambda handler function - searches restaurants by theme
export const handler = middy(async (event, context) => {
  const req = JSON.parse(event.body); // Parse JSON request body
  const theme = req.theme; // Extract theme parameter from request

  const restaurants = await findRestaurantsByTheme(theme, context.config.defaultResults); // Search restaurants
  const response = {
    statusCode: 200, // HTTP OK status
    body: JSON.stringify(restaurants), // Convert results to JSON string
  };

  return response;
}).use(
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
      config: `/${service_name}/${stage_name}/search-restaurants/config`,
    },
  })
);
