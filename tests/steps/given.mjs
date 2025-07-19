/**
 * Test setup helpers for creating test prerequisites
 *
 * This module provides functions to set up test preconditions, such as creating authenticated users
 * in Cognito for testing protected endpoints.
 */

// Import AWS SDK Cognito client and commands for user management
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
} from '@aws-sdk/client-cognito-identity-provider';

// Import Chance library for generating random user information
import { Chance } from 'chance';

// Initialize Chance for random data generation
const chance = Chance();

/**
 * Generates a random password that meets Cognito requirements
 * Includes a random string plus fixed characters to ensure it has:
 * - Numbers
 * - Special characters
 * - Upper and lower case letters
 *
 * @returns {string} A valid random password
 */
const random_password = () => `${chance.string({ length: 8 })}B!gM0uth`;

/**
 * Creates a new Cognito user and completes the authentication flow
 *
 * This function:
 * 1. Creates a random user in the Cognito User Pool
 * 2. Sets a temporary password
 * 3. Completes the initial authentication
 * 4. Responds to the password change challenge
 * 5. Returns the user details and authentication tokens
 *
 * @returns {Object} User details including username, name, and ID token
 */
export const an_authenticated_user = async () => {
  // Initialize Cognito client
  const cognito = new CognitoIdentityProviderClient();

  // Get Cognito configuration from environment variables
  const userpoolId = process.env.cognito_user_pool_id;
  const clientId = process.env.cognito_server_client_id;

  // Generate random user information
  const firstName = chance.first({ nationality: 'en' });
  const lastName = chance.last({ nationality: 'en' });
  const suffix = chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyz' });
  const username = `test-${firstName}-${lastName}-${suffix}`;
  // Generate a temporary password that meets Cognito complexity requirements
  // This password is only used for initial account creation and will be changed in Step 3
  const password = random_password();
  const email = `${firstName}-${lastName}@big-mouth.com`;

  // Step 1: Create the user in Cognito
  // This uses the AdminCreateUser API which creates a user with a temporary password.
  // The user is created in FORCE_CHANGE_PASSWORD state and will need to set a new password.
  // We use MessageAction: 'SUPPRESS' to prevent Cognito from sending welcome emails.
  // Note: When using AdminCreateUser, the email is automatically marked as verified, so there's no need for an
  // email verification step in this admin-created user flow.
  const createReq = new AdminCreateUserCommand({
    UserPoolId: userpoolId,
    Username: username,
    MessageAction: 'SUPPRESS', // Don't send emails to the test user
    TemporaryPassword: password,
    UserAttributes: [
      { Name: 'given_name', Value: firstName },
      { Name: 'family_name', Value: lastName },
      { Name: 'email', Value: email },
    ],
  });
  await cognito.send(createReq);

  console.log(`[${username}] - user is created`);

  // Step 2: Initiate authentication with temporary password
  // This step attempts to log in with the temporary password provided during user creation.
  // Cognito will not complete the authentication, but instead will return a challenge.
  const req = new AdminInitiateAuthCommand({
    AuthFlow: 'ADMIN_NO_SRP_AUTH', // Use admin auth without SRP (Secure Remote Password)
    UserPoolId: userpoolId,
    ClientId: clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  });
  const resp = await cognito.send(req);

  console.log(`[${username}] - initialised auth flow`);

  // Step 3: Respond to the new password challenge
  // When a user is created with AdminCreateUser, Cognito issues a 'NEW_PASSWORD_REQUIRED' challenge.
  // This is a security feature that forces users to change their temporary password on first login.
  // In a real application, users would do this through a UI, but here we handle it programmatically.
  const challengeReq = new AdminRespondToAuthChallengeCommand({
    UserPoolId: userpoolId,
    ClientId: clientId,
    ChallengeName: resp.ChallengeName,
    Session: resp.Session,
    ChallengeResponses: {
      USERNAME: username,
      NEW_PASSWORD: random_password(), // Set a new permanent password
    },
  });
  const challengeResp = await cognito.send(challengeReq);

  console.log(`[${username}] - responded to auth challenge`);

  // Return user details and authentication token
  // The idToken can be used to authenticate API requests
  return {
    username,
    firstName,
    lastName,
    idToken: challengeResp.AuthenticationResult.IdToken,
  };
};
