const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function generateResponse(requestBody){
    if(!GEMINI_API_KEY){
        throw new Error("Gemini API Configuration not found");
    }

    if (!requestBody?.model || !requestBody?.input) {
        throw new Error("Interactions API requires model and input");
    }
    
    const url = "https://generativelanguage.googleapis.com/v1beta/interactions";
    const response = await fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
    },
    body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
    }
    

    return await response.json();


}

module.exports = { generateResponse} ;