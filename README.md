# LLM Gateway

A simple Node.js and Express gateway that forwards Gemini-compatible
`generateContent` requests to an upstream server. A deterministic mock LLM is
included for local testing.

## Requirements

- Node.js 18 or newer (the gateway uses Node's built-in `fetch`)
- npm

## Install dependencies

Install each app's dependencies separately:

```powershell
cd mock-llm
npm install
cd ..\gateway
npm install
cd ..
```

## Configure and start

The gateway reads `PORT` (default `3000`) and `UPSTREAM_URL`. The upstream URL
is a base URL; the gateway appends the incoming Gemini API path to it. Copy
[`.env.example`](./.env.example) as a reference and set these variables in the
shell where you start the gateway:

```powershell
$env:PORT = "3000"
$env:UPSTREAM_URL = "http://localhost:4000"
cd gateway
npm start
```

Start the mock server in a separate terminal. It reads `PORT` and defaults to
`4000`:

```powershell
$env:PORT = "4000"
cd mock-llm
npm start
```

## Endpoints

- `GET /health` — gateway health check
- `POST /v1/models/{model}:generateContent` — gateway and mock generate-content endpoint

The mock waits exactly two seconds before returning the same Gemini-compatible
response on every request.

## Test with curl

Check gateway health:

```powershell
curl.exe http://localhost:3000/health
```

Send a Gemini-format request through the gateway. The `Authorization` header,
when supplied, is forwarded to the upstream:

```powershell
curl.exe --% -X POST http://localhost:3000/v1/models/gemini-1.5-flash:generateContent -H "Content-Type: application/json" -H "Authorization: Bearer example-token" -d "{\"contents\":[{\"parts\":[{\"text\":\"Say hello\"}]}]}"
```

In PowerShell, `--%` prevents PowerShell from stripping the JSON quotes. Keep
this command on one line.

The same request can be sent directly to the mock at
`http://localhost:4000/v1/models/gemini-1.5-flash:generateContent`.
