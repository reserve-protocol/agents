## Reserve API

- [Discover DTFs](https://api.reserve.org/discover/dtf?chainId=1): List all DTFs on a given chain with basket composition, pricing, market cap, performance history, and brand metadata
- [Swap / Zap](https://api.reserve.org/api/zapper/1/swap?chainId=1&tokenIn=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&tokenOut=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&amountIn=1000000000&signer=0x0000000000000000000000000000000000000001&trade=false&slippage=100): Get a swap quote and transaction calldata for trading between any tokens, including minting/redeeming DTFs
- [Health Check](https://api.reserve.org/health): API status and deployment info

Base URL: `https://api.reserve.org`

> **Tooling note:** The API returns JSON. If your toolchain processes web responses through an HTML-to-markdown converter or AI summarizer (e.g. LLM web-fetch tools), you will lose numeric precision and may get truncated results. Prefer `curl` + `jq` or a native HTTP client for reliable structured data extraction.
