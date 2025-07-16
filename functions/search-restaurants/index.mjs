// AWS SDK v3 imports for DynamoDB operations
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB clients (created outside handler for connection reuse)
const dynamodbClient = new DynamoDB();
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);

// Environment variables configuration
const defaultResults = parseInt(process.env.default_results); // Maximum number of restaurants to return
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
export const handler = async (event, context) => {
  const req = JSON.parse(event.body); // Parse JSON request body
  const theme = req.theme; // Extract theme parameter from request
  const restaurants = await findRestaurantsByTheme(theme, defaultResults); // Search restaurants
  const response = {
    statusCode: 200, // HTTP OK status
    body: JSON.stringify(restaurants), // Convert results to JSON string
  };

  return response;
};
