# Reserve Protocol - llms.txt

Hand-curated [`llms.txt`](https://llmstxt.org/) and `llms-full.txt` files for the Reserve Protocol.

## Structure

- `content/sections/` — Markdown fragments concatenated into `dist/llms.txt` (link index)
- `content/full/` — Prose sections concatenated into `dist/llms-full.txt` (detailed reference)
- `src/build.ts` — Build script
- `dist/` — Generated output (gitignored)

## Usage

```bash
npm install
npm run build
```

Output files:
- `dist/llms.txt` — Concise link index following the llms.txt standard
- `dist/llms-full.txt` — Detailed prose reference for LLM consumption
