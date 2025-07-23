// Import testing utilities from Vitest framework
import { describe, it, expect, beforeAll, vi } from 'vitest';
// Import test helpers for invoking Lambda functions
import * as when from '../steps/when';
// Import Chance library for generating random test data
import { Chance } from 'chance';
// Import AWS SDK clients for mocking
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { SNSClient } from '@aws-sdk/client-sns';

// Initialize Chance for random data generation
const chance = Chance();

// Create mock functions for AWS service calls
const mockEvbSend = vi.fn();  // Mock for EventBridge send method
EventBridgeClient.prototype.send = mockEvbSend;  // Replace real implementation
const mockSnsSend = vi.fn();  // Mock for SNS send method
SNSClient.prototype.send = mockSnsSend;  // Replace real implementation

/**
 * Test suite for the notify-restaurant Lambda function
 * 
 * This test verifies that the function correctly:
 * 1. Publishes a notification message to the SNS topic
 * 2. Publishes a restaurant_notified event to EventBridge
 * 
 * Note: This test only runs in 'handler' mode since the function
 * is triggered by EventBridge events, not HTTP requests.
 */
describe(`When we invoke the notify-restaurant function`, () => {
  // Only run tests in handler mode (not HTTP mode)
  if (process.env.TEST_MODE === 'handler') {
    // Set up test environment before all tests
    beforeAll(async () => {
      // Reset mock call history
      mockEvbSend.mockClear();
      mockSnsSend.mockClear();

      // Configure mocks to return empty success responses
      mockEvbSend.mockReturnValue({});
      mockSnsSend.mockReturnValue({});

      // Create a sample order_placed event with test data
      const event = {
        source: 'big-mouth',                // Event source
        'detail-type': 'order_placed',      // Event type
        detail: {                           // Event payload
          orderId: chance.guid(),           // Random order ID
          userEmail: chance.email(),        // Random email
          restaurantName: 'Fangtasia',      // Restaurant name
        },
      };
      
      // Invoke the notify-restaurant function with the test event
      await when.we_invoke_notify_restaurant(event);
    });

    // Test case verifying SNS notification
    it(`[int] Should publish message to SNS`, async () => {
      // Verify the SNS send method was called exactly once
      expect(mockSnsSend).toHaveBeenCalledTimes(1);
      
      // Extract the SNS publish command from the mock call
      const [publishCmd] = mockSnsSend.mock.calls[0];

      // Verify the SNS message contains the correct data
      expect(publishCmd.input).toEqual({
        Message: expect.stringMatching(`"restaurantName":"Fangtasia"`),  // Message includes restaurant name
        TopicArn: expect.stringMatching(process.env.restaurant_notification_topic),  // Correct SNS topic
      });
    });

    // Test case verifying EventBridge event publication
    it(`[int] Should publish event to EventBridge`, async () => {
      // Verify the EventBridge send method was called exactly once
      expect(mockEvbSend).toHaveBeenCalledTimes(1);
      
      // Extract the EventBridge putEvents command from the mock call
      const [putEventsCmd] = mockEvbSend.mock.calls[0];
      
      // Verify the event has the correct structure and content
      expect(putEventsCmd.input).toEqual({
        Entries: [
          expect.objectContaining({
            Source: 'big-mouth',                                          // Correct source
            DetailType: 'restaurant_notified',                           // Correct event type
            Detail: expect.stringContaining(`"restaurantName":"Fangtasia"`), // Contains restaurant name
            EventBusName: process.env.bus_name,                          // Correct event bus
          }),
        ],
      });
    });
  } else {
    // Placeholder test for HTTP mode (not applicable for this function)
    it('No HTTP test for notify-restaurant (EventBridge-triggered function)', () => {
      // This function is triggered by EventBridge events, not HTTP requests
      // Therefore, we don't have HTTP tests for it
    });
  }
});
