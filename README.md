# LLM Gateway

A Node.js and Express gateway for routing Gemini-compatible
`generateContent` requests to either a local Ollama server or Google's Gemini
Interactions API. It also includes a deterministic mock server for local
testing and records benchmark samples for completed requests.

## Requirements

- Node.js 18 or newer (the gateway uses Node's built-in `fetch`)
- npm
- Ollama with an available OpenAI-compatible chat model, or a Gemini API key

## Project layout

- `gateway/` - Express gateway, provider routing, and benchmark logging
- `ollama-local-llm/` - Ollama HTTP client and Gemini/Ollama request adapters
- `gemini-cloud-llm/` - Gemini Interactions API client
- `mock-llm/` - Deterministic mock endpoint for local testing
- `notes/ollama-results.jsonl` - Append-only benchmark results

## Install dependencies

Install the gateway and mock server dependencies:

```powershell
cd mock-llm
npm install
cd ..\gateway
npm install
cd ..
```

## Configure

Copy [`.env.example`](./.env.example) to `.env` and configure the provider.

| Variable | Description |
| --- | --- |
| `PORT` | Gateway port. Defaults to `3000`. |
| `PROVIDER` | Provider to use: `ollama` or `gemini`. |
| `OLLAMA_BASE_URL` | Ollama server base URL, for example `http://localhost:11434`. |
| `OLLAMA_MODEL` | Ollama model name, for example `llama3.2:3b`. |
| `GEMINI_API_KEY` | Google Gemini API key. |
| `GEMINI_MODEL` | Model name used in benchmark metadata. |

The gateway loads `.env` from the repository root.

### Ollama

Set the provider and local model:

```dotenv
PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
PORT=3000
```

Start Ollama separately, then start the gateway:

```powershell
cd gateway
npm start
```

### Gemini

Set the provider and API key:

```dotenv
PROVIDER=gemini
GEMINI_API_KEY=your-google-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
```

Then start the gateway:

```powershell
cd gateway
npm start
```

## Endpoints

- `GET /health` — gateway health check
- `POST /v1/models/{model}:generateContent` — routes a Gemini-format request to the configured provider
- `POST /v1/interactions` — sends an Interactions API request to Gemini

The generate-content endpoint uses Ollama's OpenAI-compatible
`/chat/completions` endpoint when `PROVIDER=ollama`, translating the first text
part between Gemini and Ollama formats. When `PROVIDER=gemini`, it forwards the
request to the Gemini Interactions API.

The Interactions API endpoint requires `PROVIDER=gemini` and a JSON body
containing `model` and `input`. Provider failures are returned as `502` with
an error JSON object; an unsupported or missing provider configuration is
returned as `400`.

## Benchmark logging

The gateway measures total request latency and provider inference latency for
generate-content requests. On each completed request it appends a JSON Lines
record to `notes/ollama-results.jsonl` containing:

- timestamp
- provider and model
- total, inference, and gateway overhead latency
- prompt and completion token counts, when supplied by the provider
- tokens per second, finish reason, and HTTP status

The benchmark file is shared by Ollama and Gemini measurements.

## Test with curl

Check gateway health:

```powershell
curl.exe http://localhost:3000/health
```

Send a Gemini-format generate-content request through Ollama or Gemini:

```powershell
curl.exe --% -X POST http://localhost:3000/v1/models/test-model:generateContent -H "Content-Type: application/json" -d "{\"contents\":[{\"parts\":[{\"text\":\"Say hello\"}]}]}"
```

In PowerShell, `--%` prevents PowerShell from stripping the JSON quotes. Keep
this command on one line.

Send a Gemini Interactions API request:

```powershell
curl.exe --% -X POST http://localhost:3000/v1/interactions -H "Content-Type: application/json" -d "{\"model\":\"gemini-2.5-flash\",\"input\":\"Say hello\"}"
```

## Mock server

The standalone mock server waits two seconds and always returns a
Gemini-compatible response:

```powershell
$env:PORT = "4000"
cd mock-llm
npm start
```

Test it directly:

```powershell
curl.exe --% -X POST http://localhost:4000/v1/models/test-model:generateContent -H "Content-Type: application/json" -d "{\"contents\":[{\"parts\":[{\"text\":\"Say hello\"}]}]}"
```
