const OLLAMA_MODEL = process.env.OLLAMA_MODEL;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL;

async function generateCompletion(messages){
    if(!OLLAMA_BASE_URL || !OLLAMA_MODEL){
        throw new Error("Ollama not configured");
    }
    
    
    const url = `${OLLAMA_BASE_URL.replace(/\/+$/, '')}/chat/completions`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            messages,
            stream: false,
            max_tokens: 128
        }),
        signal: AbortSignal.timeout(120000)
        
    })

    if(!response.ok){
        const errorBody = await response.text();
        throw new Error(`Ollama error (${response.status}): ${errorBody}`);
    }

    return response.json();

}

module.exports = { generateCompletion } ;