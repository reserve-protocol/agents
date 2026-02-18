## Reserve API

- [Discover DTFs](https://api.reserve.org/discover/dtf?chainId=1): List all DTFs on a given chain with basket composition, pricing, market cap, performance history, and brand metadata
- [Health Check](https://api.reserve.org/health): API status and deployment info

Base URL: `https://api.reserve.org`

> **Tooling note:** The API returns JSON. If your toolchain processes web responses through an HTML-to-markdown converter or AI summarizer (e.g. LLM web-fetch tools), you will lose numeric precision and may get truncated results. Prefer `curl` + `jq` or a native HTTP client for reliable structured data extraction.
