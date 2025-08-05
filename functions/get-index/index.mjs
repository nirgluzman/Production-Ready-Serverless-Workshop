// Declared and assigned OUTSIDE the handler function.
// The declaration and assignment code will run ONLY the first time our code executes in a new worker instance.
// This helps improve performance and allows us to load and cache static data only on the first invocation, which helps improve performance on subsequent invocations.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Mustache from 'mustache'; // templating engine to inject dynamic data into HTML
import { AwsClient } from 'aws4fetch'; // signing utility - AWS client for making authenticated requests to AWS services
import { fromNodeProviderChain } from '@aws-sdk/credential-providers'; // AWS SDK utility to get credentials from the default provider chain

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

// Initialize structured logger with service name from environment
const logger = new Logger({ serviceName: process.env.service_name });

// Environment variables
const awsRegion = process.env.AWS_REGION;
const cognitoUserPoolId = process.env.cognito_user_pool_id;
const cognitoClientId = process.env.cognito_client_id;
const restaurantsApiRoot = process.env.restaurants_api; // API Gateway endpoint for /restaurants resource
const ordersApiRoot = process.env.orders_api; // API Gateway endpoint for /orders resource

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Create an AWS client to make authenticated requests to AWS services.
// This client will be used to make requests to the AWS API Gateway to retrieve restaurant data.
// https://dev.to/aws-builders/signing-requests-with-aws-sdk-in-lambda-functions-476
const credentialProvider = fromNodeProviderChain(); // Set up the "chain" of locations the SDK will check for credentials.
const credentials = await credentialProvider(); // Obtain the temporary credentials from the Lambda execution role.
const aws = new AwsClient({
  accessKeyId: credentials.accessKeyId,
  secretAccessKey: credentials.secretAccessKey,
  sessionToken: credentials.sessionToken,
});

// Load the HTML template from the static directory.
// This template will be used to render the final HTML response with dynamic data.
const __filename = fileURLToPath(import.meta.url); // Convert module URL to file path (ES modules don't have __filename)
const __dirname = path.dirname(__filename); // Get directory name (ES modules don't have __dirname)
const template = fs.readFileSync(path.join(__dirname, 'static/index.html'), 'utf-8'); // Read template file relative to this module

// Fetch restaurant data from your API Gateway endpoint.
const getRestaurants = async () => {
  // Log API request details for debugging
  // NOTE: restaurantsApiRoot is captured as a separate url attribute in the log message.
  // Capturing variables as attributes (instead of baking them into the message) makes them easier to search and filter.
  logger.debug('getting restaurants...', { url: restaurantsApiRoot });

  // Make an authenticated HTTP request using AWS credentials to load the list of restaurants from the GET /restaurants endpoint.
  const resp = await aws.fetch(restaurantsApiRoot);

  // Log HTTP response status for debugging
  logger.debug('response status code', { statusCode: resp.status });

  // Throw error if request failed (4xx, 5xx status codes).
  if (!resp.ok) {
    throw new Error('Failed to fetch restaurants: ' + resp.statusText);
  }

  return await resp.json();
};

export const handler = middy(async (event, context) => {
  // Reset sampling calculation to determine if this invocation should log debug messages
  logger.refreshSampleRateCalculation();

  const restaurants = await getRestaurants();

  // console.log(`found ${restaurants.length} restaurants`);
  logger.debug('got restaurants', { count: restaurants.length });

  const dayOfWeek = days[new Date().getDay()];

  const view = {
    awsRegion,
    cognitoUserPoolId,
    cognitoClientId,
    dayOfWeek,
    restaurants,
    searchUrl: `${restaurantsApiRoot}/search`, // URL for searching restaurants
    placeOrderUrl: ordersApiRoot, // URL for placing orders
  };

  const html = Mustache.render(template, view);

  const response = {
    statusCode: 200,
    headers: {
      'content-type': 'text/html; charset=UTF-8', // Tell browser this is HTML with UTF-8 encoding
    },
    body: html, // HTML content served to the browser
  };

  return response;
}).use(injectLambdaContext(logger));
