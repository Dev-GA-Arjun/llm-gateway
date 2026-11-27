Build a Nodejs and Express LLM Gateway with is compatible with Google gemini API

Requirements

1. Gateway
   inside /gateway directory, create a nodejs and express application which expose POST /v1/models/{model}:generateContent
   Accepts JSON requests in Google Gemini API format, forwards the request body to an upstream API. Returns the upstream to the client, and reads the upstream URL from the UPSTREAM_URL environment variable. Read the port from the PORT environment variable with default = 3000. Pass the incoming Authorization headers to the upstream request fails. Include a basic health endpoint at GET /health

Use only nodejs where appropriate

2. Mock LLM
   inside mock-llm/ create seperate express server.
   It must follow
   Expose POST /v1/models/{model}:generateContent
   accept json requests waits for exactly 2 seconds before responding then return a fixed google gemini compatible chat completion response.
   use a fixed response message and return valid json with appropriate reponse headers
   run on a configurable port defaulting to 4000.

   the mock should behave consistently so that benchmark results are repeatable

3. configuration
   use env
   gateway - port and UPSTREAM_URL

   mock - port

   also provide a .env.example

4. use only basic dependencies necessary for a basic express implementation. include seperate package.json files for the gateway and mock server.

5. update everything in the readme file
   how to install dependencies
   cmds to start mock server and gateway
   how to config upstream url and how to test the endpoints with curl

constraints

Keep it simple dont create complex architecture
