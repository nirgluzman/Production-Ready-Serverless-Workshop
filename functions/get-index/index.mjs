// Declared and assigned OUTSIDE the handler function.
// The declaration and assignment code will run ONLY the first time our code executes in a new worker instance.
// This helps improve performance and allows us to load and cache static data only on the first invocation, which helps improve performance on subsequent invocations.
import fs from 'fs';
import Mustache from 'mustache'; // templating engine to inject dynamic data into HTML
import { AwsClient } from 'aws4fetch'; // signing utility - AWS client for making authenticated requests to AWS services
import { fromNodeProviderChain } from '@aws-sdk/credential-providers'; // AWS SDK utility to get credentials from the default provider chain

// Environment variables
const restaurantsApiRoot = process.env.restaurants_api; // API Gateway endpoint for /restaurants resource
const cognitoUserPoolId = process.env.cognito_user_pool_id;
const cognitoClientId = process.env.cognito_client_id;
const awsRegion = process.env.AWS_REGION;

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
const template = fs.readFileSync('static/index.html', 'utf-8');

// Fetch restaurant data from your API Gateway endpoint.
const getRestaurants = async () => {
  const resp = await aws.fetch(restaurantsApiRoot); // Make an authenticated HTTP request using AWS credentials to load the list of restaurants from the GET /restaurants endpoint.

  // Throw error if request failed (4xx, 5xx status codes).
  if (!resp.ok) {
    throw new Error('Failed to fetch restaurants: ' + resp.statusText);
  }

  return await resp.json();
};

export const handler = async (event, context) => {
  const restaurants = await getRestaurants();
  console.log(`found ${restaurants.length} restaurants`);

  const dayOfWeek = days[new Date().getDay()];

  const view = {
    awsRegion,
    cognitoUserPoolId,
    cognitoClientId,
    dayOfWeek,
    restaurants,
    searchUrl: `${restaurantsApiRoot}/search`,
  };

  const html = Mustache.render(template, view);

  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8', // Tell browser this is HTML with UTF-8 encoding
    },
    body: html, // HTML content served to the browser
  };

  return response;
};
