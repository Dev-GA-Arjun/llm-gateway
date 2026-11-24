const express = require('express');

const app = express();
const port = Number(process.env.PORT || 3000);
require('dotenv').config({ path: '../.env' });

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post(/^\/v1\/models\/([^/]+):generateContent$/, async (req, res) => {
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
