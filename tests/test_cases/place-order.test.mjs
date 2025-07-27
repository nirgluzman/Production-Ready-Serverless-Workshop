// Import testing utilities from Vitest framework
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
// Import test helpers for invoking Lambda functions
import * as when from '../steps/when.mjs';
// Import test setup helpers for creating authenticated users
import * as given from '../steps/given.mjs';
// Import test teardown helpers for cleaning up resources
import * as teardown from '../steps/teardown.mjs';
// Import SQS message listener for e2e testing (monitors EventBridge messages in test queue)
import { startListening } from '../messages.mjs';

/**
 * Test suite for the place-order Lambda function
 *
 * This test verifies the following:
 * 1. Returns a successful HTTP 200 response
 * 2. Publishes an order_placed event to EventBridge with the correct data
 *    Test → place-order Lambda → EventBridge → test SQS → Test Listener
 */

// Outer describe block for setting up authenticated user context
describe('Given an authenticated user', () => {
  // Store the authenticated user for use in tests and cleanup
  let user;

  // SQS message listener in e2e mode
  let listener;

  // Set up test environment before all tests
  beforeAll(async () => {
    // Create an authenticated Cognito user
    user = await given.an_authenticated_user();
    // Start listening for real messages in the SQS queue
    listener = startListening();
  });

  // After all tests
  afterAll(async () => {
    // Clean up by deleting the Cognito user
    await teardown.an_authenticated_user(user);
    // Stop the SQS message listener
    listener.stop();
  });

  // Test suite for the order placement endpoint
  describe(`When we invoke the POST /orders endpoint`, () => {
    // Store the response for assertions in multiple test cases
    let resp;

    // Before all tests
    beforeAll(async () => {
      // Invoke place-order endpoint with restaurant name 'Fangtasia'
      resp = await when.we_invoke_place_order(user, 'Fangtasia');
    });

    // Test case verifying successful HTTP response
    // Test tags in the name ([int][e2e]) indicate this test can run in both integration and e2e test modes (test filtering)
    it(`[int][e2e] Should return 200`, async () => {
      expect(resp.statusCode).toEqual(200);
    });

    // Test case verifying event publication to EventBridge
    // Test tag in the name ([e2e]) indicate this test can run only in e2e test mode
    it(`[e2e] Should publish a message to EventBridge bus`, async () => {
      const { orderId } = resp.body;

      // Expected message content
      const expectedMsg = JSON.stringify({
        source: 'big-mouth',
        'detail-type': 'order_placed',
        detail: {
          orderId,
          restaurantName: 'Fangtasia',
        },
      });

      // Wait for a message that matches our criteria
      await listener.waitForMessage(
        (x) =>
          x.sourceType === 'eventbridge' && // Message came from EventBridge
          x.source === process.env.eventbridge_bus_name && // From correct event bus name
          x.message === expectedMsg // Contains expected content
      );
    }, 10000);
  });
});
