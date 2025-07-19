// Import testing utilities from Vitest framework
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Import test helpers that simulate Lambda function invocations
import * as when from '../steps/when.mjs';

// Import test setup helpers for creating authenticated users
import * as given from '../steps/given.mjs';
// Import test teardown helpers for cleaning up resources after tests
import * as teardown from '../steps/teardown.mjs';

/**
 * Test objective: Verify that the search-restaurants Lambda function correctly:
 * 1. Processes search requests with a specific theme ('cartoon')
 * 2. Returns a successful HTTP 200 response
 * 3. Returns the correct number of filtered restaurants (4)
 * 4. Ensures each restaurant in the results has the required properties
 *
 * This test validates the search functionality by invoking the Lambda function either directly
 * or through API Gateway (depending on TEST_MODE), using an authenticated Cognito user for authorization.
 */

// Outer describe block for setting up authenticated user context
describe('Given an authenticated user', () => {
  // Store the authenticated user for use in tests and cleanup
  let user;

  // Before all tests: create an authenticated Cognito user
  beforeAll(async () => {
    user = await given.an_authenticated_user();
  });

  // After all tests: clean up by deleting the Cognito user
  afterAll(async () => {
    await teardown.an_authenticated_user(user);
  });

  // Test suite for the restaurant search endpoint with a specific theme
  describe(`When we invoke the POST /restaurants/search endpoint with theme 'cartoon'`, () => {
    // Test case verifying the search results for 'cartoon' theme
    it(`Should return an array of 4 restaurants`, async () => {
      // Call the search endpoint with 'cartoon' theme through test helper
      // Pass the authenticated user for HTTP mode which needs the idToken
      let res = await when.we_invoke_search_restaurants('cartoon', user);

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
});
