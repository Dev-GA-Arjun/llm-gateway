
function translate(geminiFormat) {
    const message = geminiFormat.contents[0].parts[0].text;
    const outputFormat = [{role: 'user', content: `${message}`}];
    return outputFormat;
}

function translateResponse(ollamaFormat){
    const aiResponse = ollamaFormat.choices[0].message.content;
    const output = {candidates: [{content: { parts: [{text: `${aiResponse}`}], role: 'model'}, finishReason: ollamaFormat.choices[0].finish_reason, index: 0}]}
    return output;
}

module.exports = { translate, translateResponse };
