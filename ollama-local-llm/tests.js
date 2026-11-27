require('dotenv').config({
    path: require('node:path').resolve(__dirname, '../.env')
});
console.log("1. Starting test");
const { generateCompletion } = require('./client');
const { translate } = require('./adapter');

console.log("Translate function:", translate);

const testcase = async() => {
    const input = {
        contents: [
            {
                parts: [{ text: "Explain an API gateway." }]
            }
        ]
    }
    const requestBody = translate(input);
    console.log("2. Translation complete");
    console.log(requestBody);
    const response = await generateCompletion(requestBody);
    console.log("3. Ollama response received");
    console.log(JSON.stringify(response, null, 2));
}

testcase();