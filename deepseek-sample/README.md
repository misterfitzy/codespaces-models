# AI Foundry Chat Sample

This sample demonstrates how to use the AI Foundry API to create a chat application with streaming capabilities. 

## Prerequisites

- An AI Foundry account with access to the API
- API key for AI Foundry

## Setup

1. Copy the `.env-sample` file in the root directory to `.env`
2. Add your AI Foundry API key to the `.env` file:
   ```
   AI_FOUNDRY_API_KEY="your_api_key_here"
   ```

## Model Configuration

The sample is configured to use the `gpt-35-turbo` model by default. If you need to use a different model that's available in your AI Foundry instance, update the `model` variable in `ds-sample.js`.

## Running the Sample

To run the sample:

```bash
node ds-sample.js
```

This will start an interactive chat session with the configured AI model.

## How It Works

This sample:

1. Creates a client to connect to the AI Foundry API
2. Sets up a console-based interactive chat interface
3. Sends user messages to the AI model
4. Receives streaming responses from the model and displays them in real-time
5. Maintains the conversation context throughout the session

## Notes

- The API path (`/chat/completions`) may need adjustment depending on the exact endpoint structure of your AI Foundry instance.
- Error handling is built in to manage connection issues and provide fallback responses.