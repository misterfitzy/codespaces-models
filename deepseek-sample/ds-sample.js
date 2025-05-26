import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import readline from 'readline';

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const model = "deepseek/DeepSeek-V3-0324";


// Add conversation loop function
async function conversationLoop(client) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
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
            const response = await client.path("/chat/completions").post({
                body: {
                    messages: conversation,
                    temperature: 1.0,
                    top_p: 1.0,
                    max_tokens: 1000,
                    model: model
                }
            });
            
            if (isUnexpected(response)) {
                console.error("Error:", response.body.error);
                continue;
            }
            
            try {
                // Check if response has the expected structure
                if (!response.body || !response.body.choices || 
                    response.body.choices.length === 0 || 
                    !response.body.choices[0].message || 
                    !response.body.choices[0].message.content) {
                    console.error("Unexpected response structure:", JSON.stringify(response.body));
                    continue;
                }
                
                const content = response.body.choices[0].message.content;
                console.log("AI:", content);
                conversation.push({ role: "assistant", content });
            } catch (error) {
                console.error("Error processing response:", error);
                continue;
            }
        } catch (error) {
            console.error("API request error:", error);
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

