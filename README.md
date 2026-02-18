# Reserve Protocol — Agent Context

Hand-curated [`llms.txt`](https://llmstxt.org/) and `llms-full.txt` for the Reserve Protocol, plus API documentation for agents operating in the Reserve ecosystem.

## What's in here

- **`content/sections/`** — Markdown fragments → `dist/llms.txt` (concise link index)
- **`content/full/`** — Prose sections → `dist/llms-full.txt` (detailed reference)
- **`AGENTS.md`** — Top-level context file for LLM agents consuming this repo
- **`.agents/`** — Contributor guide for editing this repo

## Build

```bash
npm install
npm run build
```

Output:
- `dist/llms.txt` — Compact overview with links to resources
- `dist/llms-full.txt` — Detailed protocol knowledge covering system design, DTF types, governance, collateral plugins, MEV, rebalancing, and API reference

## Content overview

### llms.txt sections

| File | Topic |
|------|-------|
| `00-header.md` | Protocol summary |
| `01-getting-started.md` | Onboarding links |
| `02-rsr.md` | RSR token |
| `03-index-dtfs.md` | Index DTFs |
| `04-yield-dtfs.md` | Yield DTFs |
| `05-developers.md` | Developer resources |
| `05b-api.md` | Reserve API |
| `06-risk.md` | Risk & governance |
| `07-optional.md` | Optional references |

### llms-full.txt sections

| File | Topic |
|------|-------|
| `00-overview.md` | Protocol architecture |
| `01-index-dtfs.md` | Index DTF deep dive |
| `02-yield-dtfs.md` | Yield DTF deep dive |
| `03-system-design.md` | Contract architecture & auctions |
| `04-collateral-plugins.md` | Writing collateral plugins |
| `05-mev.md` | MEV guide |
| `06-governance-and-risk.md` | Governance parameters |
| `07-rebalancing.md` | Rebalancing algorithm |
| `08-api.md` | API reference (discover, swap, health) |

## Benchmarks

10 discovery benchmark tasks measuring how well LLM agents find Reserve Protocol information across access modes (`llms.txt`, `llms-full.txt`, source repo). See [`.agents/benchmarks/README.md`](.agents/benchmarks/README.md) for methodology and scoring.

## Contributing

See [`.agents/AGENTS.md`](.agents/AGENTS.md) for content conventions, build instructions, and style guide.
