document.addEventListener('DOMContentLoaded', function() {
    // Define different personalities
    const personalities = [
        {
            name: "Microsoft Assistant",
            systemPrompt: "You are a professional Microsoft digital assistant. When asked about a capital city, provide the correct answer in a clear, concise, and helpful manner with relevant facts about the city.",
            themeClass: "theme-microsoft"
        },
        {
            name: "Wizard",
            systemPrompt: "You are a wise and enigmatic wizard who has lived for centuries. You speak in riddles and mystical language. When asked about a capital city, provide the correct answer but frame it as an arcane revelation.",
            themeClass: "theme-wizard"
        },
        {
            name: "Chef",
            systemPrompt: "You are a passionate master chef. When asked about a capital city, provide the correct answer but relate it to the culinary specialties of that country and describe the city in terms of flavors, aromas, and local cuisine.",
            themeClass: "theme-chef"
        },
        {
            name: "Pirate",
            systemPrompt: "You are a salty old pirate captain who's sailed the seven seas. Use lots of pirate slang and nautical terms. When asked about a capital city, provide the correct answer but describe it as if you've plundered it or docked there on your adventures.",
            themeClass: "theme-pirate"
        },
        {
            name: "Shakespearean Scholar",
            systemPrompt: "You are a Shakespearean scholar who speaks in Early Modern English with a flair for the dramatic. When asked about a capital city, provide the correct answer but phrase it using Shakespearean language, possibly with a relevant quote or sonnet-like structure.",
            themeClass: "theme-shakespearean"
        }
    ];

    // Select a random personality from the available options
    const selectedPersonality = personalities[Math.floor(Math.random() * personalities.length)];
    
    // Update the UI with the selected personality
    const personaDisplay = document.getElementById('persona-display');
    personaDisplay.textContent = `I am speaking as: ${selectedPersonality.name}`;
    
    // Apply the theme class to the body
    document.body.classList.add(selectedPersonality.themeClass);
    
    // Form submission handler
    const queryForm = document.getElementById('query-form');
    const responseDiv = document.getElementById('response');
    const loadingDiv = document.getElementById('loading');
    
    queryForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get the country name from input
        const countryInput = document.getElementById('country').value.trim();
        if (!countryInput) return;
        
        // Show loading spinner
        loadingDiv.style.display = 'block';
        responseDiv.textContent = 'Fetching response...';
        
        try {
            // Call the API with the selected personality
            const response = await queryCapitalCity(countryInput, selectedPersonality.systemPrompt);
            responseDiv.textContent = response;
        } catch (error) {
            responseDiv.textContent = `Error: ${error.message || 'Something went wrong. Please try again.'}`;
        } finally {
            // Hide loading spinner
            loadingDiv.style.display = 'none';
        }
    });
});

/**
 * Query for a capital city with a specific personality
 * @param {string} country - The country to query
 * @param {string} systemPrompt - The personality system prompt
 * @returns {Promise<string>} - The response from the AI
 */
async function queryCapitalCity(country, systemPrompt) {
    // In a real application, this would make an API call to a backend that has your API key
    // For this demo, we'll simulate the API call with a mock response
    
    // Using the fetch API to call a server endpoint
    try {
        const response = await fetch('/api/capital-city', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                country: country,
                systemPrompt: systemPrompt
            })
        });
        
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error querying capital city:', error);
        
        // For demo purposes only - in a real app, don't do this
        // Instead, properly handle the error and inform the user
        return mockCapitalCityResponse(country, systemPrompt);
    }
}

/**
 * Mock function to simulate API responses for demo purposes
 * In a real application, this would be replaced by actual API calls
 */
function mockCapitalCityResponse(country, systemPrompt) {
    // Simple mapping of some countries to capitals
    const capitals = {
        'france': 'Paris',
        'japan': 'Tokyo',
        'brazil': 'Brasília',
        'australia': 'Canberra',
        'egypt': 'Cairo',
        'canada': 'Ottawa',
        'india': 'New Delhi',
        'italy': 'Rome',
        'mexico': 'Mexico City',
        'germany': 'Berlin',
        'united kingdom': 'London',
        'united states': 'Washington, D.C.',
        'china': 'Beijing',
        'russia': 'Moscow',
        'south africa': 'Pretoria (administrative), Cape Town (legislative), Bloemfontein (judicial)'
    };
    
    const normalizedCountry = country.toLowerCase();
    const capital = capitals[normalizedCountry] || 'Unknown';
    
    if (capital === 'Unknown') {
        return `I'm not sure about the capital of ${country}. Please try another country.`;
    }
    
    // Generate responses based on the personality
    if (systemPrompt.includes('Microsoft')) {
        return `The capital of ${country} is ${capital}. 
        
Here are some key facts about ${capital}:
• It serves as the primary governmental center for ${country}
• The city hosts important cultural and historical landmarks
• It's a hub for diplomatic relations and international affairs

Would you like to know more about another capital city?`;
    } else if (systemPrompt.includes('wizard')) {
        return `*waves hands mystically* By the ancient scrolls of geographical knowledge and the stars that guide the realms of Earth, I divine that the sacred capital nexus of ${country} is the mystical city of ${capital}! The ley lines of power converge there, where the rulers of the land cast their governance spells.`;
    } else if (systemPrompt.includes('chef')) {
        return `Ah, ${country}! The culinary heart of this magnificent nation beats in ${capital}. There, the aromas of local specialties waft through bustling markets, and the flavors are as rich as the country's heritage. If you were to taste this city, it would be a perfect blend of tradition and innovation - a true gastronomic masterpiece!`;
    } else if (systemPrompt.includes('pirate')) {
        return `Arr, me hearty! The treasure-laden capital o' ${country} be ${capital}, it be! I've dropped anchor there many a time, swashbucklin' through its streets and tradin' me plunder for grog and supplies. A fine port o' call for any seafarin' soul, with riches aplenty if ye know where to look, yarrr!`;
    } else if (systemPrompt.includes('Shakespearean')) {
        return `Hark! The noble seat of power in fair ${country}, where courtiers and commoners alike doth gather, bears the name ${capital}. 'Tis a place where "uneasy lies the head that wears a crown," yet the beauty of its streets doth rival the stars themselves. Shall I compare it to a summer's day? Perchance more lovely and more temperate!`;
    } else {
        return `The capital of ${country} is ${capital}.`;
    }
}