const express = require('express');

const app = express();
const port = Number(process.env.PORT || 3000);
require('dotenv').config({ path: '../.env' });

const { generateCompletion } = require('../ollama-local-llm/client');
const { translate, translateResponse } = require('../ollama-local-llm/adapter');
const { createTimer, recordResult } = require('./benchmark');

app.use((req, res, next) => {
  const requestTimer = createTimer();
  res.once('finish', () => {
    const sample = res.locals.ollamaBenchmarkSample;
    if (!sample) {
      return;
    }

    recordResult({
      ...sample,
      totalLatencyMs: requestTimer.elapsedMs(),
      status: res.statusCode,
    }).catch((error) => {
      console.error('Failed to write Ollama benchmark result:', error);
    });
  });
  next();
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post(/^\/v1\/models\/([^/]+):generateContent$/, async (req, res) => {
  const provider = process.env.PROVIDER;

  if (provider === 'ollama') {
    const benchmarkSample = {
      provider,
      model: process.env.OLLAMA_MODEL || null,
      inferenceLatencyMs: null,
      promptTokens: null,
      completionTokens: null,
      finishReason: null,
    };
    res.locals.ollamaBenchmarkSample = benchmarkSample;

    try {
      const messages = translate(req.body);
      const inferenceTimer = createTimer();
      let ollamaResponse;
      try {
        ollamaResponse = await generateCompletion(messages);
      } finally {
        benchmarkSample.inferenceLatencyMs = inferenceTimer.elapsedMs();
      }

      if (ollamaResponse && typeof ollamaResponse.model === 'string') {
        benchmarkSample.model = ollamaResponse.model;
      }
      const usage = ollamaResponse && ollamaResponse.usage;
      if (usage && Number.isInteger(usage.prompt_tokens) && usage.prompt_tokens >= 0) {
        benchmarkSample.promptTokens = usage.prompt_tokens;
      }
      if (usage && Number.isInteger(usage.completion_tokens) && usage.completion_tokens >= 0) {
        benchmarkSample.completionTokens = usage.completion_tokens;
      }
      const firstChoice = ollamaResponse && Array.isArray(ollamaResponse.choices)
        ? ollamaResponse.choices[0]
        : null;
      if (firstChoice && typeof firstChoice.finish_reason === 'string') {
        benchmarkSample.finishReason = firstChoice.finish_reason;
      }

      const geminiResponse = translateResponse(ollamaResponse);

      return res.json(geminiResponse);
    } catch (error) {
      console.error('Ollama request failed:', error);
      return res.status(502).json({ error: 'Ollama request failed' });
    }
  }
  const upstreamBaseUrl = process.env.UPSTREAM_URL;
  if (!upstreamBaseUrl) {
    return res.status(500).json({ error: 'UPSTREAM_URL is not configured' });
  }

  const headers = {
    'content-type': req.get('content-type') || 'application/json',
  };
  if (req.get('authorization')) {
    headers.authorization = req.get('authorization');
  }

  try {
    const upstreamUrl = `${upstreamBaseUrl.replace(/\/+$/, '')}${req.originalUrl}`;
    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
    });

    res.status(upstreamResponse.status);
    const contentType = upstreamResponse.headers.get('content-type');
    if (contentType) {
      res.set('content-type', contentType);
    }
    res.send(Buffer.from(await upstreamResponse.arrayBuffer()));
  } catch (error) {
    console.error('Upstream request failed:', error);
    res.status(502).json({ error: 'Upstream request failed' });
  }
});

app.listen(port, () => {
  console.log(`Gateway listening on port http://localhost:${port}`);
});
