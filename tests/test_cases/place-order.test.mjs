// Import testing utilities from Vitest framework
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
// Import test helpers for invoking Lambda functions
import * as when from '../steps/when.mjs';
// Import test setup helpers for creating authenticated users
import * as given from '../steps/given.mjs';
// Import test teardown helpers for cleaning up resources
import * as teardown from '../steps/teardown.mjs';
// Import AWS SDK EventBridge client for mocking
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';

// Create a mock function for the EventBridge send method
// MOCKING NOTE: Validating EventBridge events directly requires real-time subscription infrastructure, which we'll cover later
const mockSend = vi.fn();
// Replace the real EventBridge send method with our mock
// This allows us to verify that events are published without actually sending them
EventBridgeClient.prototype.send = mockSend;

/**
 * Test suite for the place-order Lambda function
 *
 * This test verifies that the function correctly:
 * 1. Returns a successful HTTP 200 response
 * 2. Publishes an order_placed event to EventBridge with the correct data
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

  // Test suite for the order placement endpoint
  describe(`When we invoke the POST /orders endpoint`, () => {
    // Store the response for assertions in multiple test cases
    let resp;

    // Before all tests: reset mock and invoke the place-order function
    beforeAll(async () => {
      // Clear previous mock calls
      mockSend.mockClear();
      // Configure mock to return empty success response
      mockSend.mockReturnValue({});

      // Call the place-order endpoint with restaurant name 'Fangtasia'
      resp = await when.we_invoke_place_order(user, 'Fangtasia');
    });

    // Test case verifying successful HTTP response
    // Test tags in the name ([int][e2e]) indicate this test can run in both integration and e2e test modes (test filtering)
    it(`[int][e2e] Should return 200`, async () => {
      expect(resp.statusCode).toEqual(200);
    });

    // Test case verifying event publication to EventBridge
    // Test tag in the name ([int]) indicates this test should run only in integration test mode
    // Until we've a way to listen in on the events being published to the EventBridge bus, we use the e2e test to only make sure the "POST /orders" endpoint completes successfully
    it(`[int] Should publish a message to EventBridge bus`, async () => {
      // Verify the mock was called exactly once
      expect(mockSend).toHaveBeenCalledTimes(1);

      // Extract the PutEvents command from the mock call
      const [putEventsCmd] = mockSend.mock.calls[0];

      // Verify the event has the correct structure and content
      expect(putEventsCmd.input).toEqual({
        Entries: [
          expect.objectContaining({
            Source: 'big-mouth', // Event source identifier
            DetailType: 'order_placed', // Event type
            Detail: expect.stringContaining(`"restaurantName":"Fangtasia"`), // Event payload contains restaurant name
            EventBusName: process.env.bus_name, // Correct event bus
          }),
        ],
      });
    });
  });
});
