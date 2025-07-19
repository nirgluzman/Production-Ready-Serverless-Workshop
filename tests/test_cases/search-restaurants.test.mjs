// Import testing utilities from Vitest framework
import { describe, it, expect } from 'vitest';

// Import test helpers that simulate Lambda function invocations
import * as when from '../steps/when.mjs';

/**
 * Test objective: Verify that the search-restaurants Lambda function correctly:
 * 1. Processes search requests with a specific theme ('cartoon')
 * 2. Returns a successful HTTP 200 response
 * 3. Returns the correct number of filtered restaurants (4)
 * 4. Ensures each restaurant in the results has the required properties
 *
 * This test validates the search functionality by directly invoking the Lambda
 * handler with a search theme and verifying the filtered results.
 */

// Test suite for the restaurant search endpoint with a specific theme
describe(`When we invoke the POST /restaurants/search endpoint with theme 'cartoon'`, () => {
  // Test case verifying the search results for 'cartoon' theme
  it(`Should return an array of 4 restaurants`, async () => {
    // Call the search endpoint with 'cartoon' theme through test helper
    let res = await when.we_invoke_search_restaurants('cartoon');

    // Verify HTTP response status is successful
    expect(res.statusCode).toEqual(200);
    // Verify exactly 4 restaurants match the 'cartoon' theme
    expect(res.body).toHaveLength(4);

    // Verify each restaurant in search results has the required properties
    for (let restaurant of res.body) {
      expect(restaurant).toHaveProperty('name'); // Each restaurant must have a name
      expect(restaurant).toHaveProperty('image'); // Each restaurant must have an image
    }
  });
});
