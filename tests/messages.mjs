/**
 * SQS Message Listener for E2E Testing
 *
 * This module provides functionality to listen for messages in the e2e test SQS queue and wait for
 * specific messages based on predicates.
 * It's used to verify that events are properly published to SNS and delivered to the test queue.
 *
 * We're using RxJS ReplaySubject as a message buffer.
 * It captures all SQS messages and replays them to new subscribers, allowing tests to check against buffered messages for specific arrivals.
 */

// AWS SDK v3 imports for SQS operations
import { SQSClient, ReceiveMessageCommand } from '@aws-sdk/client-sqs';
// RxJS imports for reactive programming and message streaming
import { ReplaySubject, firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';

/**
 * Starts listening for messages in the e2e test SQS queue
 * @returns {Object} Object with stop() and waitForMessage() methods
 */
export const startListening = () => {
  // ReplaySubject to store and replay the last 100 messages for late subscribers
  const messages = new ReplaySubject(100);
  // Set to track message IDs and prevent duplicate processing
  const messageIds = new Set();
  // Flag to control the polling loop
  let stopIt = false;

  // Initialize SQS client
  const sqs = new SQSClient();
  // Get the e2e test queue URL from environment variables
  const queueUrl = process.env.e2e_test_queue_url;

  // Main polling loop to continuously receive messages from SQS
  const loop = async () => {
    while (!stopIt) {
      // Create command to receive messages from the queue
      const receiveCmd = new ReceiveMessageCommand({
        QueueUrl: queueUrl, // Target queue URL
        MaxNumberOfMessages: 10, // Receive up to 10 messages at once
        // Shorter long polling frequency so we don't have to wait as long when we ask it to stop
        WaitTimeSeconds: 5, // Wait up to 5 seconds for messages
      });
      // Send the receive command to SQS
      const resp = await sqs.send(receiveCmd);

      // Process received messages if any
      if (resp.Messages) {
        resp.Messages.forEach((msg) => {
          // Skip duplicate messages (SQS can deliver the same message multiple times)
          if (messageIds.has(msg.MessageId)) {
            // Seen this message already, ignore
            return;
          }

          // Track this message ID to prevent duplicate processing
          messageIds.add(msg.MessageId);

          // Parse the SQS message body (which contains the SNS message)
          const body = JSON.parse(msg.Body);
          // Check if this is an SNS message (has TopicArn)
          if (body.TopicArn) {
            // Emit the processed message to the ReplaySubject
            messages.next({
              sourceType: 'sns', // Indicates this came from SNS
              source: body.TopicArn, // The SNS topic ARN
              message: body.Message, // The actual message content
            });
          }
        });
      }
    }
  };

  // Start the polling loop (returns a Promise that resolves when loop stops)
  const loopStopped = loop();

  // Function to stop the message polling
  const stop = async () => {
    console.log('stop polling SQS...');
    // Set flag to stop the polling loop
    stopIt = true;

    // Wait for the loop to actually stop
    await loopStopped;
    console.log('long polling stopped');
  };

  // Function to wait for a specific message based on a predicate
  const waitForMessage = (predicate) => {
    // Filter messages using the provided predicate function
    const data = messages.pipe(filter((x) => predicate(x)));
    // Return a Promise that resolves with the first matching message
    return firstValueFrom(data);
  };

  // Return the public API
  return {
    stop, // Function to stop listening
    waitForMessage, // Function to wait for specific messages
  };
};
