// AWS SDK v3 imports for DynamoDB operations (already exist in the Lambda execution environment, so we don't need to install them for our function)
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB clients (created outside handler for connection reuse)
const dynamodbClient = new DynamoDB(); // Low-level DynamoDB client
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient); // Document client for easier JSON handling

// Environment variables configuration
const defaultResults = parseInt(process.env.default_results); // Number of restaurants to return [optional]
const tableName = process.env.restaurants_table; // DynamoDB table name

// Fetch restaurants from DynamoDB table
const getRestaurants = async (count) => {
  console.log(`fetching ${count} restaurants from ${tableName}...`);

  // Scan operation to retrieve restaurants
  // NOTE: Scan reads the entire table and returns the first X number of items it finds.
  // It's an inefficient and potentially expensive operation if we've a table with millions of items.
  const resp = await dynamodb.send(
    new ScanCommand({
      TableName: tableName, // Target table
      Limit: count, // Maximum number of items to return
    })
  );
  console.log(`found ${resp.Items.length} restaurants`);
  return resp.Items; // Return array of restaurant objects
};

// AWS Lambda handler function - returns list of restaurants as JSON
export const handler = async (event, context) => {
  const restaurants = await getRestaurants(defaultResults); // Fetch restaurants from DynamoDB
  const response = {
    statusCode: 200, // HTTP OK status
    body: JSON.stringify(restaurants), // Convert restaurant array to JSON string
  };

  return response;
};
