/**
 * Vitest Configuration File
 *
 * This file configures Vitest for running tests in the serverless project.
 * It specifies test file patterns, exclusions, and the Node.js test environment.
 *
 * @see https://vitest.dev/config/
 */

import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  test: {
    // // Setup script that runs once before all tests (loads environment variables), https://vitest.dev/config/#globalsetup
    // globalSetup: ['./tests/steps/init.mjs'],

    // Load environmental variables from .env, https://vitest.dev/guide/features.html#environment-variables
    env: loadEnv(mode, process.cwd(), ''),

    // Pattern for test files to include
    include: ['**/*.test.mjs'],

    // Directories to exclude from testing
    exclude: ['**/node_modules/**', '**/dist/**'],

    // Use Node.js as the test environment
    environment: 'node',
  },
}));
