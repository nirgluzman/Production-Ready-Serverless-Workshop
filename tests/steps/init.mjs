/**
 * Test initialization module
 *
 * This module handles environment setup for tests by loading environment variables from a .env file into process.env
 *
 * @note As of Node.js v20.6.0+, the `--env-file` flag is natively supported to load environment variables.
 * This makes 'dotenv' optional for test environments running on Node.js v20.6.0 or newer.
 * Consider leveraging the native flag for simplified setup where applicable.
 */

// Import dotenv config function to load environment variables from .env file
import { config } from 'dotenv';

/**
 * Setup function to initialize the test environment
 * Loads environment variables from .env file into process.env
 */
export default function setup() {
  // Load environment variables from .env file
  config();
}
