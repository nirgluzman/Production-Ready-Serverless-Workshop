// Import testing utilities from Vitest framework
import { describe, it, expect } from 'vitest';

// Import cheerio for HTML parsing and DOM manipulation
import { load } from 'cheerio';

// Import test helpers that simulate Lambda function invocations
import * as when from '../steps/when.mjs';

/**
 * Test objective: Verify that the get-index Lambda function correctly:
 * 1. Returns a properly formatted HTML page with HTTP 200 status
 * 2. Includes the expected Content-Type header for HTML
 * 3. Contains exactly 8 restaurant elements in the restaurants list
 *
 * This test directly invokes the Lambda handler without going through API Gateway
 * to validate the core functionality of the index page generation.
 */

// Test suite for the main index page endpoint
describe(`When we invoke the GET / endpoint`, () => {
  // Test case verifying the index page returns correctly with restaurant data
  // Test tags in the name ([int][e2e]) indicate this test can run in both integration and e2e test modes, https://vitest.dev/guide/cli.html#testnamepattern
  // - [int] tag means the test will run when executing 'npm run test:integration'
  // - [e2e] tag means the test will run when executing 'npm run test:e2e'
  // - Tests without the appropriate tag will be skipped based on the test command
  it(`[int][e2e] Should return the index page with 8 restaurants`, async () => {
    // Call the index endpoint through test helper
    const res = await when.we_invoke_get_index();

    // Verify HTTP response status and Content-Type header
    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toEqual('text/html; charset=UTF-8');
    expect(res.body).toBeDefined();

    // Parse the HTML response with cheerio
    const $ = load(res.body);
    // Find all restaurant elements in the restaurants list
    const restaurants = $('.restaurant', '#restaurantsUl');
    // Verify exactly 8 restaurants are displayed
    expect(restaurants.length).toEqual(8);
  });
});
