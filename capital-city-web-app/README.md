# Capital City Web App

A colorful web application that responds to capital city queries with various personalities. The application uses the GitHub Models service to generate responses.

## Features

- Randomly selects a personality on each start (Microsoft Assistant, Wizard, Chef, Pirate, Shakespearean Scholar)
- Colorful UI theme that changes based on the selected personality
- Metro-style interface option with Microsoft branding
- Simple form for submitting country queries
- Responses styled according to the selected personality

## How to Use

1. Make sure you have Node.js installed
2. Set your GitHub token as an environment variable:
   ```
   export GITHUB_TOKEN=your_token_here
   ```
3. Install dependencies:
   ```
   npm install express
   ```
4. Start the server:
   ```
   node server.js
   ```
5. Open your browser and navigate to http://localhost:3000
6. Enter a country name and submit to get a response about its capital

## Technologies Used

- HTML, CSS, JavaScript for the frontend
- Express.js for the server
- OpenAI API for generating responses

## Notes

In the demo version, if the API call fails, the app will fall back to using mock responses for a limited set of countries.