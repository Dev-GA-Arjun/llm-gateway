# Experiment Logs

1. Initial v1 Gateway

- Gateway started successfully at port 3000
- MockLLM reponsed by successfully from port 4000
- Response time 2000ms or 2 seconds

Status v1: **success**

2. Baseline Performance

## **Hypothesis**

- I expect the gateway to handle multiple requests but i believe it struggles when the no of request increase the gateway may fails few requests

-I do not know the exact concurrency limit or the cause of potential failures. I will use load testing to identify these experimentally.

## **Test**

- Gateway: localhost:3000
- Mock LLM: localhost:4000
- Mock delay: 2000ms
- Benchmark tool: Autocannon
- Request: Gemini generateContent
