// Declared and assigned OUTSIDE the handler function.
// The declaration and assignment code will run ONLY the first time our code executes in a new worker instance.
// This helps improve performance and allows us to load and cache static data only on the first invocation, which helps improve performance on subsequent invocations.
import fs from 'fs';
import Mustache from 'mustache'; // templating engine to inject dynamic data into HTML

const restaurantsApiRoot = process.env.restaurants_api;
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

let html;

function loadHtml() {
  if (!html) {
    console.log('loading index.html...');
    html = fs.readFileSync('static/index.html', 'utf-8');
    console.log('loaded');
  }

  return html;
}

const getRestaurants = async () => {
  const resp = await fetch(restaurantsApiRoot); // load the list of restaurants from the GET /restaurants endpoint
  return await resp.json();
};

export const handler = async (event, context) => {
  const template = loadHtml();
  const restaurants = await getRestaurants();
  const dayOfWeek = days[new Date().getDay()];
  const html = Mustache.render(template, { dayOfWeek, restaurants });
  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8', // Tell browser this is HTML with UTF-8 encoding
    },
    body: html, // HTML content served to the browser
  };

  return response;
};
