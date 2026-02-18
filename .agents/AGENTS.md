# Contributing to this Repository

Instructions for agents editing the `reserve-protocol/agents` repo.

## Repository Structure

```
content/
  sections/   # Ordered markdown fragments → dist/llms.txt
  full/       # Ordered markdown fragments → dist/llms-full.txt
src/
  build.ts    # Build script (concat + validate)
dist/         # Generated output (gitignored)
```

## Build & Verify

```bash
npm install
npm run build      # Concatenates content/ → dist/
npm run typecheck   # Type-check src/
```

Always run both commands after making changes. The build must succeed before committing.

## Content Conventions

### File Naming

Content files are ordered by numeric prefix: `00-header.md`, `01-getting-started.md`, etc. When adding a new section, choose a prefix that places it in the correct order. Renumber existing files if necessary.

### Sections (`content/sections/`)

- Each file is a self-contained fragment
- Fragments are concatenated with `\n\n` (blank line) between them
- The first file (`00-header.md`) must start with an H1 heading (`# ...`)

### Full (`content/full/`)

- Each file is a longer prose section
- Fragments are concatenated with `\n\n---\n\n` (horizontal rule) between them
- The first file must start with an H1 heading (`# ...`)

## Validation Rules

The build enforces:

1. Output must not be empty
2. Output must start with an H1 heading

If validation fails, fix the content before committing.

## Content Rules

- **Never hardcode DTF data** (names, symbols, basket compositions, prices, market caps). This data changes constantly and will go stale. Instead, document the API endpoints so agents can query live data themselves.

## Style Guide

- Write for LLM consumption: be precise, structured, and factual
- Prefer concrete examples over abstract descriptions
- Use markdown headings, lists, and code blocks for structure
- Keep sections focused — one concept per file where possible
- Link to primary sources (docs, contracts, repos) where relevant
