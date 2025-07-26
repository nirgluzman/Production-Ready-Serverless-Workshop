/**
 * Test Flow Overview
 *
 * Integration Test Mode (TEST_MODE=handler):
 * Test → notify-restaurant Lambda → Mock SNS + Mock EventBridge
 * 1. Setup: Mock AWS SDK clients (EventBridge & SNS).
 * 2. Invoke: Call notify-restaurant Lambda handler directly.
 * 3. Verify: Check mock function calls to ensure correct AWS service interactions.
 *
 * End-to-End Test Mode (TEST_MODE=http):
 * Test → EventBridge → notify-restaurant Lambda → SNS/EventBridge → SQS → Test Listener
 * 1. Setup: Start SQS message listener.
 * 2. Invoke: Publish event to real EventBridge → triggers real Lambda → publishes to real SNS+EventBridge.
 * 3. Verify: Wait for actual message to arrive in SQS queue.
 */

// Import testing utilities from Vitest framework
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
// Import test helpers for invoking Lambda functions
import * as when from '../steps/when';
// Import SQS message listener for e2e testing (monitors SNS+EventBridge messages in test queue)
import { startListening } from '../messages.mjs';
// Import Chance library for generating random test data
import { Chance } from 'chance';
// Import AWS SDK clients for mocking
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { SNSClient } from '@aws-sdk/client-sns';

// Initialize Chance for random data generation
const chance = Chance();

// Create mock functions for AWS service calls (used in handler mode)
const mockEvbSend = vi.fn(); // Mock for EventBridge send method - creates an empty spy function
const mockSnsSend = vi.fn(); // Mock for SNS send method - creates an empty spy function

/**
 * Test suite for the notify-restaurant Lambda function
 *
 * This test verifies that the function correctly:
 * 1. Publishes a notification message to the SNS topic
 * 2. Publishes a restaurant_notified event to EventBridge
 * 3. Handles the event correctly (no errors)
 *
 * Integration tests (handler mode): uses mocks for AWS service calls.
 * E2E tests (http mode): starts a listener for SQS messages and verifies that the correct SNS and EventBridge messages are published.
 */
describe(`When we invoke the notify-restaurant function`, () => {
  // Sample EventBridge event for testing
  const event = {
    source: 'big-mouth', // Event source identifier
    'detail-type': 'order_placed', // Event type
    detail: {
      // Event payload
      orderId: chance.guid(), // Random order ID
      restaurantName: 'Fangtasia', // Restaurant name for testing
    },
  };

  // SQS message listener in e2e mode
  let listener;

  // Set up test environment before all tests
  beforeAll(async () => {
    if (process.env.TEST_MODE === 'handler') {
      // Integration tests
      EventBridgeClient.prototype.send = mockEvbSend; // Replace real EventBridge.send()
      SNSClient.prototype.send = mockSnsSend; // Replace real SNS.send()

      // Configure mocks to return empty object success responses
      mockEvbSend.mockReturnValue({});
      mockSnsSend.mockReturnValue({});
    } else {
      // E2E tests: start listening for real messages in the SQS queue
      listener = startListening();
    }

    // Invoke the notify-restaurant function with the test event
    await when.we_invoke_notify_restaurant(event);
  });

  // Clean up after all tests
  afterAll(async () => {
    if (process.env.TEST_MODE === 'handler') {
      // Integration tests: Clear mock call history
      mockEvbSend.mockClear();
      mockSnsSend.mockClear();
    } else {
      // E2E tests: Stop the SQS message listener
      await listener.stop();
    }
  });

  // -------------------------------
  // Integration tests
  // Test → notify-restaurant Lambda → Mock SNS + Mock EventBridge
  // -------------------------------
  //
  // Verify SNS message publication using mocks
  it(`[int] Should publish message to SNS`, async () => {
    // Verify the SNS send method was called exactly once
    expect(mockSnsSend).toHaveBeenCalledTimes(1);

    // Extract the SNS publish command from the mock call
    const [publishCmd] = mockSnsSend.mock.calls[0];

    // Verify the SNS message contains the correct data
    expect(publishCmd.input).toEqual({
      Message: expect.stringMatching(`"restaurantName":"Fangtasia"`), // Message includes restaurant name
      TopicArn: expect.stringMatching(process.env.restaurant_notification_topic), // Correct SNS topic
    });
  });

  // Verify EventBridge event publication using mocks
  it(`[int] Should publish event to EventBridge`, async () => {
    // Verify the EventBridge send method was called exactly once
    expect(mockEvbSend).toHaveBeenCalledTimes(1);

    // Extract the EventBridge putEvents command from the mock call
    const [putEventsCmd] = mockEvbSend.mock.calls[0];

    // Verify the event has the correct structure and content
    expect(putEventsCmd.input).toEqual({
      Entries: [
        expect.objectContaining({
          Source: 'big-mouth', // Correct source
          DetailType: 'restaurant_notified', // Correct event type
          Detail: expect.stringContaining(`"restaurantName":"Fangtasia"`), // Contains restaurant name
          EventBusName: process.env.bus_name, // Correct event bus
        }),
      ],
    });
  });

  // -------------------------------
  // E2E test: Verify actual SNS+EventBridge message delivery to SQS queue
  // Due to the end-to-end message flow – from test to EventBridge, then to the notify-restaurant function (sending to SNS+EventBridge), forwarded to SQS,
  // and finally long-polled by the test – we've increased the Vitest timeout to 10s to accommodate the inherent latency.
  // -------------------------------
  //
  // Verify SNS message publication
  // Test → EventBridge → notify-restaurant Lambda → SNS → SQS → Test Listener
  it(`[e2e] Should publish message to SNS`, async () => {
    // Expected message content
    const expectedMsg = JSON.stringify(event.detail);

    // Wait for a message that matches our criteria
    await listener.waitForMessage(
      (x) =>
        x.sourceType === 'sns' && // Message came from SNS
        x.source === process.env.restaurant_notification_topic && // From correct SNS topic ARN
        x.message === expectedMsg // Contains expected content
    );
  }, 10000); // 10 second timeout for message delivery

  // Verify EventBridge event publication
  // Test → EventBridge → notify-restaurant Lambda → EventBridge → SQS → Test Listener
  it(`[e2e] Should publish "restaurant_notified" event to EventBridge`, async () => {
    // Expected message content
    const expectedMsg = JSON.stringify({
      ...event,
      'detail-type': 'restaurant_notified',
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
