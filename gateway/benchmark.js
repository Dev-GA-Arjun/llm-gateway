const fs = require('node:fs/promises');
const path = require('node:path');

const resultsPath = path.resolve(__dirname, '../notes/ollama-results.jsonl');
let pendingWrite = Promise.resolve();

function createTimer() {
  const startedAt = process.hrtime.bigint();

  return {
    elapsedMs() {
      return Number(process.hrtime.bigint() - startedAt) / 1e6;
    },
  };
}

function validateDuration(value, name, nullable) {
  if (nullable && value === null) {
    return;
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`${name} must be a non-negative finite number${nullable ? ' or null' : ''}`);
  }
}

function validateTokenCount(value, name) {
  if (value !== null && (!Number.isInteger(value) || value < 0)) {
    throw new TypeError(`${name} must be a non-negative integer or null`);
  }
}

function calculateMetrics({ totalLatencyMs, inferenceLatencyMs, completionTokens }) {
  validateDuration(totalLatencyMs, 'totalLatencyMs', false);
  validateDuration(inferenceLatencyMs, 'inferenceLatencyMs', true);
  validateTokenCount(completionTokens, 'completionTokens');

  if (inferenceLatencyMs !== null && inferenceLatencyMs > totalLatencyMs) {
    throw new RangeError('inferenceLatencyMs cannot exceed totalLatencyMs');
  }

  return {
    gatewayOverheadMs: inferenceLatencyMs === null
      ? null
      : totalLatencyMs - inferenceLatencyMs,
    tokensPerSecond: inferenceLatencyMs > 0 && completionTokens !== null
      ? completionTokens * 1000 / inferenceLatencyMs
      : null,
  };
}

async function recordResult(sample) {
  if (!sample || typeof sample !== 'object') {
    throw new TypeError('sample must be an object');
  }
  if (typeof sample.provider !== 'string' || sample.provider.trim() === '') {
    throw new TypeError('provider must be a non-empty string');
  }
  if (sample.model !== null && typeof sample.model !== 'string') {
    throw new TypeError('model must be a string or null');
  }
  if (sample.status !== null &&
      (!Number.isInteger(sample.status) || sample.status < 100 || sample.status > 599)) {
    throw new TypeError('status must be an HTTP status code or null');
  }
  if (sample.finishReason !== null && typeof sample.finishReason !== 'string') {
    throw new TypeError('finishReason must be a string or null');
  }
  validateTokenCount(sample.promptTokens, 'promptTokens');
  validateTokenCount(sample.completionTokens, 'completionTokens');

  const metrics = calculateMetrics(sample);
  const record = {
    timestamp: new Date().toISOString(),
    provider: sample.provider,
    model: sample.model,
    totalLatencyMs: sample.totalLatencyMs,
    inferenceLatencyMs: sample.inferenceLatencyMs,
    gatewayOverheadMs: metrics.gatewayOverheadMs,
    promptTokens: sample.promptTokens,
    completionTokens: sample.completionTokens,
    tokensPerSecond: metrics.tokensPerSecond,
    finishReason: sample.finishReason,
    status: sample.status,
  };
  const line = `${JSON.stringify(record)}\n`;

  const write = pendingWrite.then(async () => {
    await fs.mkdir(path.dirname(resultsPath), { recursive: true });
    await fs.appendFile(resultsPath, line, 'utf8');
  });
  pendingWrite = write.catch(() => {});
  await write;

  return record;
}

module.exports = { createTimer, calculateMetrics, recordResult };