/**
 * Test teardown helpers for cleaning up test resources
 *
 * This module provides functions to clean up resources created during tests, such as deleting test users
 * from Cognito after tests complete.
 */

// Import AWS SDK Cognito client and commands for user management
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';

/**
 * Deletes a Cognito user that was created for testing
 *
 * @param {Object} user - The user object returned from given.an_authenticated_user()
 * @returns {Promise<void>}
 */
export const an_authenticated_user = async (user) => {
  // Initialize Cognito client
  const cognito = new CognitoIdentityProviderClient();

  // Create command to delete the user from Cognito User Pool
  let req = new AdminDeleteUserCommand({
    UserPoolId: process.env.cognito_user_pool_id,
    Username: user.username,
  });

  // Execute the delete command
  await cognito.send(req);

  console.log(`[${user.username}] - user deleted`);
};
