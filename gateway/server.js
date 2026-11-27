
require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env')
});

const express = require('express');

const app = express();
const port = Number(process.env.PORT || 3000);

const { generateCompletion } = require('../ollama-local-llm/client');
const { translate, translateResponse } = require('../ollama-local-llm/adapter');
const { createTimer, recordResult } = require('./benchmark');
const { generateResponse } = require('../gemini-cloud-llm/client');

app.use((req, res, next) => {
  const requestTimer = createTimer();

  res.once('finish', () => {
    const sample = res.locals.benchmarkSample;

    if (!sample) return;

    recordResult({
      ...sample,
      totalLatencyMs: requestTimer.elapsedMs(),
      status: res.statusCode,
    }).catch((error) => {
      console.error('Failed to write benchmark result:', error);
    });
  });

  next();
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/v1/interactions', async (req, res) => {
    if (process.env.PROVIDER !== 'gemini') {
        return res.status(400).json({
            error: 'Interactions API is currently configured for Gemini only'
        });
    }

    try {
        const geminiResponse = await generateResponse(req.body);
        return res.json(geminiResponse);
    } catch (error) {
        console.error('Gemini Interactions API error:', error.message);

        return res.status(502).json({
            error: error.message
        });
    }
});

app.post(/^\/v1\/models\/([^/]+):generateContent$/, async (req, res) => {
  const provider = process.env.PROVIDER;

  if (provider === 'gemini') {
    const benchmarkSample = {
      provider,
      model: process.env.GEMINI_MODEL || null,
      inferenceLatencyMs: null,
      promptTokens: null,
      completionTokens: null,
      finishReason: null,
    };

    res.locals.benchmarkSample = benchmarkSample;

    try {
      const inferenceTimer = createTimer();
      let geminiResponse;

      try {
        geminiResponse = await generateResponse(req.body);
      } finally {
        benchmarkSample.inferenceLatencyMs = inferenceTimer.elapsedMs();
      }

      const usage = geminiResponse?.usageMetadata;

      if (usage && Number.isInteger(usage.promptTokenCount)) {
        benchmarkSample.promptTokens = usage.promptTokenCount;
      }

      if (usage && Number.isInteger(usage.candidatesTokenCount)) {
        benchmarkSample.completionTokens = usage.candidatesTokenCount;
      }

      const firstCandidate = geminiResponse?.candidates?.[0];

      if (typeof firstCandidate?.finishReason === 'string') {
        benchmarkSample.finishReason = firstCandidate.finishReason;
      }

      return res.json(geminiResponse);

    } catch (error) {
      console.error('Gemini API request failed:', error);
      return res.status(502).json({ error: 'Gemini API request failed' });
    }
  }

  if (provider === 'ollama') {
    const benchmarkSample = {
      provider,
      model: process.env.OLLAMA_MODEL || null,
      inferenceLatencyMs: null,
      promptTokens: null,
      completionTokens: null,
      finishReason: null,
    };

    res.locals.benchmarkSample = benchmarkSample;

    try {
      const messages = translate(req.body);

      const inferenceTimer = createTimer();
      let ollamaResponse;

      try {
        ollamaResponse = await generateCompletion(messages);
      } finally {
        benchmarkSample.inferenceLatencyMs = inferenceTimer.elapsedMs();
      }

      if (typeof ollamaResponse?.model === 'string') {
        benchmarkSample.model = ollamaResponse.model;
      }

      const usage = ollamaResponse?.usage;

      if (usage && Number.isInteger(usage.prompt_tokens)) {
        benchmarkSample.promptTokens = usage.prompt_tokens;
      }

      if (usage && Number.isInteger(usage.completion_tokens)) {
        benchmarkSample.completionTokens = usage.completion_tokens;
      }

      const firstChoice = ollamaResponse?.choices?.[0];

      if (typeof firstChoice?.finish_reason === 'string') {
        benchmarkSample.finishReason = firstChoice.finish_reason;
      }

      const geminiResponse = translateResponse(ollamaResponse);

      return res.json(geminiResponse);

    } catch (error) {
      console.error('Ollama request failed:', error);
      return res.status(502).json({ error: 'Ollama request failed' });
    }
  }

  return res.status(400).json({
    error: `Unsupported provider: ${provider || 'not configured'}`,
  });
});

app.listen(port, () => {
  console.log(`Gateway listening on port http://localhost:${port}`);
});
