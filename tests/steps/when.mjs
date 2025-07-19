// Path to the application root directory
const APP_ROOT = '../../';
// Import lodash utility library
import _ from 'lodash';

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
  const contentType = _.get(response, 'headers.Content-Type', 'application/json');
  // Parse JSON response body if content type is application/json
  if (response.body && contentType === 'application/json') {
    response.body = JSON.parse(response.body);
  }
  return response;
};

/**
 * Test helper to invoke the get-index Lambda function
 * @returns {Object} The Lambda function response
 */
export const we_invoke_get_index = () => viaHandler({}, 'get-index');

/**
 * Test helper to invoke the get-restaurants Lambda function
 * @returns {Object} The Lambda function response
 */
export const we_invoke_get_restaurants = () => viaHandler({}, 'get-restaurants');
