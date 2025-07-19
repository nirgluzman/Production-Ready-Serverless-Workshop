// Import testing utilities from Vitest framework
import { describe, it, expect } from 'vitest';

// Import test helpers that simulate Lambda function invocations
import * as when from '../steps/when.mjs';

/**
 * Test objective: Verify that the get-restaurants Lambda function correctly:
 * 1. Returns a successful HTTP 200 response
 * 2. Returns exactly 8 restaurant objects in an array
 * 3. Each restaurant has the required properties (name and image)
 *
 * This test directly invokes the Lambda handler to validate the core
 * functionality of retrieving restaurant data from the database.
 */

// Test suite for the restaurants listing endpoint
describe(`When we invoke the GET /restaurants endpoint`, () => {
  // Test case verifying the restaurants data structure and count
  it(`Should return an array of 8 restaurants`, async () => {
    // Call the restaurants endpoint through test helper
    const res = await when.we_invoke_get_restaurants();

    // Verify HTTP response status is successful
    expect(res.statusCode).toEqual(200);
    // Verify exactly 8 restaurants are returned
    expect(res.body).toHaveLength(8);

    // Verify each restaurant has the required properties
    for (let restaurant of res.body) {
      expect(restaurant).toHaveProperty('name'); // Each restaurant must have a name
      expect(restaurant).toHaveProperty('image'); // Each restaurant must have an image
    }
  });
});
