// DynamoDB seeding script - populates the restaurants table with dummy data
// This script is used to initialize the database with sample restaurant data for testing
// Usage: node seed-restaurants.mjs (requires restaurants_table environment variable)

// AWS SDK v3 imports for DynamoDB operations
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB clients
const dynamodbClient = new DynamoDB({
  region: process.env.region, // AWS region for DynamoDB operations
});
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient); // Document client for easier JSON handling

// Sample restaurant data - fictional restaurants from various TV shows and movies
// Each restaurant has: name (primary key), image URL, and theme tags
const restaurants = [
  {
    name: 'Fangtasia', // Primary key for DynamoDB
    image: 'https://d2qt42rcwzspd6.cloudfront.net/manning/fangtasia.png',
    themes: ['true blood'], // Tags for categorization
  },
  {
    name: "Shoney's",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/shoney's.png",
    themes: ['cartoon', 'rick and morty'],
  },
  {
    name: "Freddy's BBQ Joint",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/freddy's+bbq+joint.png",
    themes: ['netflix', 'house of cards'],
  },
  {
    name: 'Pizza Planet',
    image: 'https://d2qt42rcwzspd6.cloudfront.net/manning/pizza+planet.png',
    themes: ['netflix', 'toy story'],
  },
  {
    name: 'Leaky Cauldron',
    image: 'https://d2qt42rcwzspd6.cloudfront.net/manning/leaky+cauldron.png',
    themes: ['movie', 'harry potter'],
  },
  {
    name: "Lil' Bits",
    image: 'https://d2qt42rcwzspd6.cloudfront.net/manning/lil+bits.png',
    themes: ['cartoon', 'rick and morty'],
  },
  {
    name: 'Fancy Eats',
    image: 'https://d2qt42rcwzspd6.cloudfront.net/manning/fancy+eats.png',
    themes: ['cartoon', 'rick and morty'],
  },
  {
    name: 'Don Cuco',
    image: 'https://d2qt42rcwzspd6.cloudfront.net/manning/don%20cuco.png',
    themes: ['cartoon', 'rick and morty'],
  },
];

// Transform restaurant data into DynamoDB batch write format
// Each item becomes a PutRequest for batch operation
const putReqs = restaurants.map((x) => ({
  PutRequest: {
    Item: x, // Restaurant object to insert
  },
}));

// Create batch write command to insert all restaurants at once
// BatchWrite can handle up to 25 items per request
const cmd = new BatchWriteCommand({
  RequestItems: {
    [process.env.restaurants_table]: putReqs, // Target table from environment variable
  },
});

// Execute the batch write operation
dynamodb
  .send(cmd)
  .then(() => console.log('all done')) // Success message
  .catch((err) => console.error(err)); // Error handling
