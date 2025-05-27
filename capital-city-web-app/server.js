import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenAI } from 'openai';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express
const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// Get environment variables
const token = process.env.GITHUB_TOKEN;
const endpoint = 'https://models.github.ai/inference/';
const modelName = 'openai/gpt-4o-mini';

// Initialize OpenAI client
const client = new OpenAI({
    baseURL: endpoint,
    apiKey: token,
});

// API endpoint for capital city queries
app.post('/api/capital-city', async (req, res) => {
    try {
        const { country, systemPrompt } = req.body;

        if (!country) {
            return res.status(400).json({ error: 'Country is required' });
        }

        // Call the AI model
        const response = await client.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: systemPrompt || 'You are a helpful assistant.'
                },
                {
                    role: 'user',
                    content: `What is the capital of ${country}?`
                }
            ],
            model: modelName,
            temperature: 0.7,
            max_tokens: 300
        });

        return res.json({ response: response.choices[0].message.content });
    } catch (error) {
        console.error('Error querying OpenAI:', error);
        return res.status(500).json({ 
            error: 'Failed to get response from AI',
            details: error.message
        });
    }
});

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to use the application`);
});