// Path to the application root directory
const APP_ROOT = '../../';

// Import lodash utility library
import _ from 'lodash';

// Signing utility - AWS client for making authenticated requests to AWS services
import { AwsClient } from 'aws4fetch';
// AWS SDK utility to get credentials from the default provider chain
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

// Determine invocation mode: 'handler' for local, 'http' for deployed API
const mode = process.env.TEST_MODE;

/**
 * Invokes a Lambda function handler directly with the provided event
 * @param {Object} event - The Lambda event object
 * @param {string} functionName - The name of the function to invoke
 * @returns {Object} The Lambda function response
 */
const viaHandler = async (event, functionName) => {
  // Dynamically import the Lambda handler based on function name
  const { handler } = await import(`${APP_ROOT}/functions/${functionName}/index.mjs`);

  // Create empty Lambda context object
  const context = {};
  // Invoke the handler with event and context
  const response = await handler(event, context);
  // Extract content type with default to application/json
  const contentType = _.get(response, 'headers.content-type', 'application/json');
  // Parse JSON response body if content type is application/json
  // _.get(response, 'body') to confirm that we only convert the response body if it has a body (which in the case of the
  // "notify-restaurant" function, it doesn't, because the function returns nothing).
  if (_.get(response, 'body') && contentType === 'application/json') {
    response.body = JSON.parse(response.body);
  }
  return response;
};

/**
 * Invokes an API Gateway endpoint via HTTP request
 * @param {string} relPath - The relative path of the API endpoint
 * @param {string} method - The HTTP method (GET, POST, etc.)
 * @param {Object} opts - Request options including body, auth, and iam_auth
 * @returns {Object} The HTTP response with statusCode, headers, and body
 */
const viaHttp = async (relPath, method, opts) => {
  // Construct the full URL using the API Gateway URL from environment variables
  const url = `${process.env.api_gateway_url}/${relPath}`;
  console.info(`invoking via HTTP ${method} ${url}`);

  // Extract request body from options if provided
  const body = _.get(opts, 'body');
  // Initialize empty headers object
  const headers = {};

  // Add Authorization header if auth option is provided
  // Used for authenticating against Cognito-protected endpoints (i.e. search-restaurants)
  const authHeader = _.get(opts, 'auth');
  if (authHeader) {
    headers.Authorization = authHeader;
  }

  let res;
  // Use AWS IAM authentication if iam_auth option is true
  if (_.get(opts, 'iam_auth', false) === true) {
    // Get AWS credentials from the default provider chain
    const credentialProvider = fromNodeProviderChain();
    const credentials = await credentialProvider();
    // Create AWS client with credentials for signing requests
    const aws = new AwsClient({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    });

    // Make authenticated request using AWS signature
    res = await aws.fetch(url, { method, headers, body });
  } else {
    // Make standard unauthenticated HTTP request
    res = await fetch(url, { method, headers, body });
  }

  // Convert response headers from Headers object to plain JavaScript object
  const respHeaders = {};
  for (const [key, value] of res.headers.entries()) {
    respHeaders[key] = value;
  }

  // Parse response body based on content type (JSON or text)
  const respBody = respHeaders['content-type'] === 'application/json' ? await res.json() : await res.text();

  // Return standardized response object that matches Lambda function response format
  return {
    statusCode: res.status,
    body: respBody,
    headers: respHeaders,
  };
};

/**
 * Test helper to invoke the get-index Lambda function
 * @returns {Object} The Lambda function response
 */
export const we_invoke_get_index = async () => {
  // Choose invocation method based on TEST_MODE environment variable
  // This allows the same test to run against local handlers or deployed API
  switch (mode) {
    case 'handler':
      return await viaHandler({}, 'get-index');
    case 'http':
      return await viaHttp('', 'GET');
    default:
      throw new Error(`unsupported mode: ${mode}`);
  }
};

/**
 * Test helper to invoke the get-restaurants Lambda function
 * @returns {Object} The Lambda function response
 */
export const we_invoke_get_restaurants = async () => {
  // Choose invocation method based on TEST_MODE environment variable
  // This allows the same test to run against local handlers or deployed API
  switch (mode) {
    case 'handler':
      return await viaHandler({}, 'get-restaurants');
    case 'http':
      // Use IAM authentication to sign the request with AWS credentials
      // This is required because the /restaurants endpoint is protected by IAM authorization in API Gateway
      return await viaHttp('restaurants', 'GET', { iam_auth: true });
    default:
      throw new Error(`unsupported mode: ${mode}`);
  }
};

/**
 * Test helper to invoke the search-restaurants Lambda function
 * @param {string} theme - The search theme to be included in the request body
 * @param {Object} user - The authenticated Cognito user object (required for HTTP mode) - contains the Cognito idToken needed for authorization
 * @returns {Object} The Lambda function response
 */
export const we_invoke_search_restaurants = async (theme, user) => {
  const body = JSON.stringify({ theme });

  // Choose invocation method based on TEST_MODE environment variable
  // This allows the same test to run against local handlers or deployed API
  switch (mode) {
    case 'handler':
      return await viaHandler({ body }, 'search-restaurants');
    case 'http':
      const auth = user.idToken;
      return await viaHttp('restaurants/search', 'POST', { body, auth });
    default:
      throw new Error(`unsupported mode: ${mode}`);
  }
};

/**
 * Test helper to invoke the place-order Lambda function
 * @param {Object} user - The authenticated Cognito user object (required for HTTP mode)
 * @param {string} restaurantName - The name of the restaurant to place an order with
 * @returns {Object} The Lambda function response
 */
export const we_invoke_place_order = async (user, restaurantName) => {
  // Create request body with restaurant name
  const body = JSON.stringify({ restaurantName });

  // Choose invocation method based on TEST_MODE environment variable
  // This allows the same test to run against local handlers or deployed API
  switch (mode) {
    case 'handler':
      // Direct Lambda invocation for local testing
      return await viaHandler({ body }, 'place-order');
    case 'http':
      // Extract authentication token from user object
      const auth = user.idToken;
      // Make authenticated HTTP request to the API Gateway endpoint
      return await viaHttp('orders', 'POST', { body, auth });
    default:
      throw new Error(`unsupported mode: ${mode}`);
  }
};

/**
 * Test helper to invoke the notify-restaurant Lambda function directly
 * @param {Object} event - The EventBridge event object containing order details
 * @returns {void} - This function doesn't return a value as the Lambda doesn't return a response
 *
 * Note: This function only supports 'handler' mode because the notify-restaurant Lambda
 * is triggered by EventBridge events, not directly via API Gateway. There is no HTTP
 * endpoint to invoke this function.
 */
export const we_invoke_notify_restaurant = async (event) => {
  // Only handler mode is supported for this function
  if (mode === 'handler') {
    // Directly invoke the Lambda handler with the provided event
    await viaHandler(event, 'notify-restaurant');
  } else {
    // HTTP mode is not supported for this function
    throw new Error('HTTP invocation not supported for notify-restaurant function');
  }
};
