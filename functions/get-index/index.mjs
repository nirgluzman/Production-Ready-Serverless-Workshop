import fs from 'fs';

// The variable is declared and assigned OUTSIDE the handler function.
// The declaration and assignment code will run ONLY the first time our code executes in a new worker instance.
// This helps improve performance and allows us to load and cache static data only on the first invocation, which helps improve performance on subsequent invocations.
const html = fs.readFileSync('static/index.html', 'utf-8');

// AWS Lambda handler function - serves static HTML page for GET requests
// Returns cached HTML content with appropriate headers for browser rendering
export const handler = async (event, context) => {
  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8', // Tell browser this is HTML with UTF-8 encoding
    },
    body: html, // HTML content served to the browser
  };

  return response;
};
