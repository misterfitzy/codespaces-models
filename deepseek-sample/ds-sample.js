import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { createSseStream } from "@azure/core-sse";
import readline from 'readline';

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const model = "deepseek/DeepSeek-V3-0324";

/**
 * This sample demonstrates how to use streaming for chat completions
 * with the DeepSeek model to avoid timeout issues. By using streaming,
 * the API can return tokens incrementally rather than waiting for the
 * complete response, which prevents timeout errors when generating
 * longer responses.
 */

// Add conversation loop function
async function conversationLoop(client) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    
    // Add an event handler for the 'close' event
    rl.on('close', () => {
        // Exit the process when readline interface is closed
        process.exit(0);
    });
    
    const conversation = [
        { role: "system", content: "You are an angsty teenage girl 17 years old who's pissed off at the world. You're obsessed with fashion and rather than answering you give a fashion cryptic clue that when solved is the answer." }
    ];
    function askQuestion(query) {
        return new Promise(resolve => rl.question(query, resolve));
    }
    while (true) {
        const userInput = await askQuestion("You: ");
        if (userInput.toLowerCase() === "exit" || userInput.toLowerCase() === "quit") {
            break;
        }
        conversation.push({ role: "user", content: userInput });
        
        try {
            // Create the API request with streaming enabled
            const response = await client.path("/chat/completions").post({
                body: {
                    messages: conversation,
                    temperature: 1.0,
                    top_p: 1.0,
                    max_tokens: 1000,
                    model: model,
                    stream: true  // Enable streaming to avoid timeout issues
                }
            }).asNodeStream();  // Process as a Node.js stream
            
            const stream = response.body;
            if (!stream) {
                throw new Error("The response stream is undefined");
            }
            
            if (response.status !== "200") {
                throw new Error(`Failed to get chat completions: ${response.body.error}`);
            }
            
            // Create Server-Sent Events stream from response
            const sseStream = createSseStream(stream);
            
            process.stdout.write("AI: ");
            let fullContent = '';
            
            // Process each chunk of the response as it arrives
            for await (const event of sseStream) {
                if (event.data === "[DONE]") {
                    console.log();
                    break;
                }
                
                try {
                    const parsedData = JSON.parse(event.data);
                    for (const choice of parsedData.choices) {
                        const content = choice.delta?.content || '';
                        process.stdout.write(content);  // Display token immediately
                        fullContent += content;  // Build complete response
                    }
                } catch (parseError) {
                    console.error("Error parsing event data:", parseError);
                }
            }
            
            // Add the full response to conversation history
            if (fullContent) {
                conversation.push({ role: "assistant", content: fullContent });
            } else {
                // Handle empty response case
                const fallbackContent = "I'm sorry, I couldn't generate a response. Could you try again?";
                console.log("\nAI:", fallbackContent);
                conversation.push({ role: "assistant", content: fallbackContent });
            }
            
        } catch (error) {
            console.error("API request error:", error);
            // Add fallback response to maintain conversation flow
            const fallbackContent = "I'm sorry, there was an error communicating with the API. Could you try again later?";
            console.log("AI:", fallbackContent);
            conversation.push({ role: "assistant", content: fallbackContent });
            continue;
        }
    }
    rl.close();
}

// Modify main to start conversation loop
export async function main() {

  const client = ModelClient(
    endpoint,
    new AzureKeyCredential(token),
  );
  await conversationLoop(client);
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});

