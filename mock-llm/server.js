const express = require('express');

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(express.json());

app.post(/^\/v1\/models\/([^/]+):generateContent$/, async (req, res) => {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  res.json({
    candidates: [
      {
        content: {
          parts: [{ text: 'Hello from the mock Gemini model.' }],
          role: 'model',
        },
        finishReason: 'STOP',
        index: 0,
      },
    ],
  });
});

app.listen(port, () => {
  console.log(`Mock LLM listening on port http://localhost:${port}`);
});
