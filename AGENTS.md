# Reserve Protocol — Agent Context

This repository provides hand-curated [llms.txt](https://llmstxt.org/) and llms-full.txt files describing the Reserve Protocol. These files are designed to be consumed by LLM-based agents working within the Reserve Protocol ecosystem.

## What is Reserve Protocol?

Reserve builds Decentralized Token Folios (DTFs) — permissionless, tokenized indexes backed 1:1 by baskets of digital assets. There are two types:

- **Yield DTFs** — yield-bearing baskets with RSR overcollateralization (Ethereum, Base, Arbitrum)
- **Index DTFs** — lightweight diversified portfolios supporting hundreds of tokens (Ethereum, Base)

All DTFs are ERC20-compliant, mintable and redeemable for their underlying assets, and governed on-chain.

## Output Files

After building (`npm run build`), two files are produced in `dist/`:

- **`dist/llms.txt`** — Concise link index following the llms.txt standard
- **`dist/llms-full.txt`** — Detailed prose reference for LLM consumption

## Content Sources

- `content/sections/` — Markdown fragments concatenated into `llms.txt`
- `content/full/` — Prose sections concatenated into `llms-full.txt`

## Using These Files

Point your agent's context or system prompt at the appropriate file:

- Use **llms.txt** when you need a compact overview with links to resources
- Use **llms-full.txt** when you need detailed protocol knowledge for reasoning about Reserve contracts, governance, rebalancing, collateral plugins, or risk

## Benchmarks

The `.agents/benchmarks/` directory contains 10 discovery benchmark tasks that evaluate how well LLM agents find information about Reserve Protocol. Tasks range from easy (fee structure) to hard (Dutch auction mechanics, rebalancing algorithm) and are scored on correctness, completeness, navigation efficiency, and citation quality. See `.agents/benchmarks/README.md` for methodology and scoring.
