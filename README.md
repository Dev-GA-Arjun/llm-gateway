# Multi-Provider LLM Gateway

A Node.js and Express-based LLM gateway experiment that explores routing requests across local and cloud inference providers through a common interface.

The project includes:

- **Ollama:** Local LLM inference through an OpenAI-compatible chat completion endpoint.
- **Gemini:** Integration with Google's Gemini Interactions API.
- **Mock LLM:** A deterministic Gemini-compatible mock server for controlled testing.
- **Benchmark logging:** JSONL-based request latency and token usage recording.

## Architecture

```text
                  Client
                    |
                    v
             Express Gateway
                    |
          +---------+---------+
          |                   |
          v                   v
       Ollama               Gemini
    Local inference      Cloud API
          |
          v
    Response adapter

     Independent Mock Server
     (controlled responses)

     Benchmark Logger
             |
             v
      notes/results.jsonl
```

The gateway currently supports Ollama and Gemini provider routing. The mock server runs independently and is not currently connected to the gateway's routing logic.

## Project Structure

```text
llm-gateway/
├── gateway/
│   ├── server.js
│   ├── benchmark.js
│   └── package.json
├── ollama-local-llm/
│   ├── client.js
│   ├── adapter.js
│   └── tests.js
├── gemini-cloud-llm/
│   └── client.js
├── mock-llm/
│   ├── server.js
│   └── package.json
├── notes/
│   ├── log.md
│   └── results.jsonl
├── prompts/
├── vis-docs/
├── .env.example
└── README.md
```

## Requirements

- Node.js 18 or newer
- npm
- Ollama with an available model for local inference
- Google Gemini API key for cloud integration

## Installation

Install gateway dependencies:

```powershell
cd gateway
npm install
cd ..
```

Install mock server dependencies:

```powershell
cd mock-llm
npm install
cd ..
```

## Configuration

Copy `.env.example` to `.env` in the repository root.

Configure the required environment variables:

| Variable          | Description                               |
| ----------------- | ----------------------------------------- |
| `PORT`            | Gateway port. Default: `3000`             |
| `PROVIDER`        | `ollama` or `gemini`                      |
| `OLLAMA_BASE_URL` | Ollama OpenAI-compatible API base URL     |
| `OLLAMA_MODEL`    | Local Ollama model name                   |
| `GEMINI_API_KEY`  | Google Gemini API key                     |
| `GEMINI_MODEL`    | Gemini model metadata used by the gateway |

### Ollama

Example configuration:

```dotenv
PORT=3000
PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=llama3.2:3b
```

Start Ollama separately, then start the gateway:

```powershell
cd gateway
npm start
```

### Gemini

Example configuration:

```dotenv
PORT=3000
PROVIDER=gemini
GEMINI_API_KEY=your-google-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```

Start the gateway:

```powershell
cd gateway
npm start
```

## API Endpoints

| Method | Endpoint                             | Description                                                                  |
| ------ | ------------------------------------ | ---------------------------------------------------------------------------- |
| GET    | `/health`                            | Gateway health check                                                         |
| POST   | `/v1/models/{model}:generateContent` | Gemini-compatible request routed to Ollama or the configured Gemini provider |
| POST   | `/v1/interactions`                   | Gemini Interactions API request                                              |

### Generate Content

The `generateContent` endpoint accepts a Gemini-format request.

When `PROVIDER=ollama`, the gateway:

1. Extracts the first text part from the request.
2. Converts it into an OpenAI-compatible chat message.
3. Sends it to Ollama.
4. Converts the response back into a Gemini-compatible response.

Example request:

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "Explain what an API gateway is."
        }
      ]
    }
  ]
}
```

### Gemini Interactions API

The `/v1/interactions` endpoint forwards requests to Google's Interactions API.

It requires `PROVIDER=gemini` and a request body containing `model` and `input`.

Example:

```json
{
  "model": "gemini-2.5-flash",
  "input": "Explain what an API gateway is."
}
```

## Mock LLM Server

The mock server provides a deterministic Gemini-compatible response after a fixed two-second delay.

Start it independently:

```powershell
$env:PORT = "4000"
cd mock-llm
npm start
```

Test it:

```powershell
curl.exe --% -X POST http://localhost:4000/v1/models/test-model:generateContent -H "Content-Type: application/json" -d "{\"contents\":[{\"parts\":[{\"text\":\"Say hello\"}]}]}"
```

The mock server is intended for controlled testing. It does not perform actual model inference.

## Benchmarking

The gateway records benchmark samples in:

`notes/results.jsonl`

Each JSONL record contains:

- Timestamp
- Provider and model
- Total request latency
- Provider inference latency
- Gateway overhead
- Prompt and completion token counts, when available
- Tokens per second
- Finish reason
- HTTP status

The benchmark uses Node.js high-resolution timing through `process.hrtime.bigint()`.

### Ollama Benchmark

<text>Model: `llama3.2:3b`</text>

The primary benchmark consists of 10 measured requests using similar technical prompts and consistent generation settings.

One warm-up request and one separate broad-prompt test were excluded from the primary statistics.

| Metric                   |           Result |
| ------------------------ | ---------------: |
| Measured requests        |               10 |
| Average total latency    |    7.064 seconds |
| Median total latency     |    6.941 seconds |
| Minimum total latency    |    6.167 seconds |
| Maximum total latency    |    8.053 seconds |
| Average throughput       | 13.23 tokens/sec |
| Average gateway overhead |          1.67 ms |
| Successful requests      |            10/10 |

These results represent this specific setup and workload, not a general performance claim about Ollama or the model.

### Gemini Integration Status

The Gemini Interactions API client and gateway route have been implemented.

However, test requests returned HTTP 502 because the upstream Gemini requests did not complete successfully. Successful inference and cloud performance measurements have not yet been verified.

A three-provider performance comparison is therefore not available.

## Current Limitations

- The Ollama adapter currently extracts only the first text part from the first content item.
- The mock server is independent and is not integrated into gateway provider routing.
- Gemini Interactions API integration still requires successful inference verification.
- The `generateContent` Gemini branch and the Interactions API client currently use different request formats and should not be treated as interchangeable.
- Benchmark records are append-only and include failed requests as well as successful requests.

## Future Improvements

- Integrate the mock server into gateway routing.
- Improve request and response adapters.
- Verify successful Gemini inference.
- Add repeatable load testing.
- Compare local and cloud inference under controlled workloads.
- Add benchmark visualization and automated reporting.

## License

MIT License
