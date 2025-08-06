// AWS SDK v3 imports for DynamoDB operations
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

// AWS Lambda Powertools utilities
// Logger with output structured as JSON
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
// Opinionated wrapper for AWS X-Ray
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';

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
const dynamodbClient = new DynamoDB({});
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);

// Initialize X-Ray tracer with service name for distributed tracing
// Creating a Tracer would automatically capture outgoing HTTP requests
const tracer = new Tracer({ serviceName: process.env.service_name });

// Capture DynamoDB operations in X-Ray traces for performance monitoring (e.g. DynamoDB Scan API call)
tracer.captureAWSv3Client(dynamodb);

// Environment variables configuration
const { service_name, ssm_stage_name } = process.env;
const tableName = process.env.restaurants_table; // DynamoDB table name from environment

// Search restaurants by theme using DynamoDB scan with filter
const findRestaurantsByTheme = async (theme, count) => {
  // console.log(`finding (up to ${count}) restaurants with the theme ${theme}...`);
  logger.debug('finding restaurants...', {
    count,
    theme,
  });

  // Scan operation with filter expression to find restaurants by theme
  const resp = await dynamodb.send(
    new ScanCommand({
      TableName: tableName,
      Limit: count, // Maximum items to return
      FilterExpression: 'contains(themes, :theme)', // Filter: check if themes array contains the search theme
      ExpressionAttributeValues: { ':theme': theme }, // Parameter substitution for filter
    })
  );

  //console.log(`found ${resp.Items.length} restaurants`);
  logger.debug('found restaurants', {
    count: resp.Items.length,
  });

  return resp.Items; // Return array of matching restaurant objects
};

// AWS Lambda handler function - searches restaurants by theme
export const handler = middy(async (event, context) => {
  // Reset sampling calculation to determine if this invocation should log debug messages
  logger.refreshSampleRateCalculation();

  const req = JSON.parse(event.body); // Parse JSON request body
  const theme = req.theme; // Extract theme parameter from request

  // Log the configuration loaded from SSM Parameter Store
  // console.info('Config from SSM:', context.config);
  logger.debug('Config from SSM', {
    config: context.config,
  });

  // Only try to access secretString if it exists
  // This prevents errors when the parameter doesn't exist in SSM
  if (context.secretString) {
    console.info(`Secret string loaded successfully: ${context.secretString}`);
  }

  const restaurants = await findRestaurantsByTheme(theme, context.config.defaultResults); // Search restaurants
  const response = {
    statusCode: 200, // HTTP OK status
    body: JSON.stringify(restaurants), // Convert results to JSON string
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
      // set the SSM parameter value to the Lambda context (not as an environment variable), so we can access it in our handler - RECOMMENDED APPROACH!
      setToContext: true,
      // assign parameters to the context object of the function handler rather than to process.env (defaults to false)
      fetchData: {
        // fetches individual parameters and stores them in either the invocation context object (setToContext) or the environment variables (default)
        config: `/${service_name}/${ssm_stage_name}/search-restaurants/config`,
        secretString: `/${service_name}/${ssm_stage_name}/search-restaurants/secretString`,
      },
      // Set to false to continue if parameter doesn't exist (defaults to false)
      throwOnFailedCall: false,
    })
  )
  // Automatically inject Lambda context (request ID, function name, etc.) into all log messages
  .use(injectLambdaContext(logger))
  // Add ##functions/search-restaurants.handler segment to the X-Ray trace, and captures cold start, service name, and response of the invocation
  .use(captureLambdaHandler(tracer));
