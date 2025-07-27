/**
 * Idempotency Test for notify-restaurant Lambda Function
 *
 * This test verifies that the AWS Lambda Powertools idempotency feature works correctly
 * by ensuring that duplicate invocations with the same event don't cause duplicate processing.
 *
 * Test approach:
 * 1. Mock AWS services (SNS and EventBridge) to capture calls
 * 2. Invoke the function twice with identical events
 * 3. Verify that AWS services are called only once (idempotent behavior)
 *
 * Note: This test only runs in 'handler' mode (integration) because idempotency testing requires
 * direct function invocation to control the exact same input parameters.
 */

// Import testing utilities from Vitest framework
import { describe, it, beforeAll, expect, vi } from 'vitest';

// Import test helpers for invoking Lambda functions
import * as when from '../steps/when';

// Import AWS SDK clients for mocking
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { SNSClient } from '@aws-sdk/client-sns';

// Import Chance library for generating consistent test data
import { Chance } from 'chance';

const chance = Chance();

// Create mock functions to track AWS service calls
const mockSnsSend = vi.fn(); // Mock for SNS publish operations
SNSClient.prototype.send = mockSnsSend; // Replace real SNS client
const mockEvbSend = vi.fn(); // Mock for EventBridge put events operations
EventBridgeClient.prototype.send = mockEvbSend; // Replace real EventBridge client

/**
 * Test suite for idempotency behavior
 *
 * Tests that invoking the notify-restaurant function multiple times with the same event
 * results in only one execution of the business logic (SNS and EventBridge calls).
 */
describe('When we invoke the notify-restaurant function twice with the same order ID', () => {
  // Create a consistent test event with the same orderId for both invocations
  // The orderId is used by the idempotency tool to determine if an event has been processed
  const event = {
    source: 'big-mouth', // Event source identifier
    'detail-type': 'order_placed', // Event type
    detail: {
      orderId: chance.guid(), // Same orderId for both invocations (idempotency key)
      restaurantName: 'Fangtasia', // Restaurant name for testing
    },
  };

  // Set up test by invoking the function twice with identical events
  beforeAll(async () => {
    // Clear any previous mock call history
    mockSnsSend.mockClear();
    mockEvbSend.mockClear();

    // Configure mocks to return successful responses
    mockSnsSend.mockReturnValue({});
    mockEvbSend.mockReturnValue({});

    // Invoke the function twice with the SAME event
    // The first call should execute normally
    // The second call should be detected as duplicate and skipped (idempotent behavior)
    await when.we_invoke_notify_restaurant(event);
    await when.we_invoke_notify_restaurant(event);
  });

  // Only run idempotency tests in handler mode
  // E2E tests can't reliably test idempotency due to timing and infrastructure complexities
  // Verify that SNS notification was sent only once despite two function invocations
  it(`[int] Should only publish message to SNS once`, async () => {
    expect(mockSnsSend).toHaveBeenCalledTimes(1);
  });

  // Verify that EventBridge event was published only once despite two function invocations
  it(`[int] Should only publish "restaurant_notified" event to EventBridge once`, async () => {
    expect(mockEvbSend).toHaveBeenCalledTimes(1);
  });

  // Placeholder for non-handler modes
  // Idempotency testing requires direct function invocation with controlled inputs
  it('[e2e] No e2e idempotency tests - requires handler mode for precise control', () => {});
});
