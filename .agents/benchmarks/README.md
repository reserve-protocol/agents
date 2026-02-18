# Agent Discovery Benchmarks

Measures how well LLM agents discover information about Reserve Protocol across three access modes.

## Access Modes

| Mode | Description | Size |
|------|-------------|------|
| `llms_txt` | Concise link index following [llms.txt](https://llmstxt.org/) standard | ~8 KB |
| `llms_full_txt` | Detailed prose reference for LLM consumption | ~50 KB |
| `source_repo` | Full source repository checkout | All files |

Each task specifies a `minimum_access_mode` — the simplest mode containing enough information to answer correctly. Agents tested against a mode below the minimum are expected to recognize the gap (not fabricate answers).

## Task Format

Tasks live in `tasks/` as YAML files. Each contains:

- **prompt** — the verbatim question given to the agent (no hints about where to look)
- **ground_truth** — required facts, bonus facts, and disqualifying errors
- **navigation** — ideal lookup paths per access mode

See the YAML schema in any task file for the full structure.

## Scoring Rubric

Four dimensions, each scored 0.0 to 1.0:

| Dimension | Weight | How Scored |
|-----------|--------|------------|
| **Correctness** | 40% | `(correct_required - 0.5 * wrong_facts) / total_required`, clamped to [0, 1] |
| **Completeness** | 25% | `(found_required + 0.5 * found_bonus) / (total_required + 0.5 * total_bonus)` |
| **Navigation** | 20% | `ideal_steps / actual_steps` (capped at 1.0). Halved if agent reads >3 irrelevant files. Capped at 0.3 if agent greps blindly without consulting an index first. |
| **Citation** | 15% | `facts_with_source / total_facts_found` |

### Composite Score

```
score = 0.40 * correctness + 0.25 * completeness + 0.20 * navigation + 0.15 * citation
```

### Disqualifying Errors

Each factually wrong claim deducts 0.5 from the correctness numerator. Claims listed in `disqualifying_errors` are specific hallucination signals — if present, they indicate the agent fabricated information rather than admitting uncertainty.

### Navigation Scoring Details

- **Ideal steps**: The minimum number of file reads or lookups needed to find all required facts.
- **Actual steps**: Every file read, search query, or web fetch the agent performs.
- **Irrelevant file penalty**: Reading >3 files that contain none of the required facts halves the navigation score.
- **Blind grep penalty**: If the agent jumps straight to `grep`/`rg` without first consulting `llms.txt` or `llms-full.txt` (when available), navigation is capped at 0.3. The index files exist to guide discovery — bypassing them indicates poor tool use.

## Running Benchmarks

No automated runner yet. To evaluate manually:

1. Pick a task from `tasks/`.
2. Provide the agent with the specified access mode (the built `dist/llms.txt`, `dist/llms-full.txt`, or the full repo).
3. Give the agent the `prompt` verbatim.
4. Score the response against `ground_truth` using the rubric above.
5. Record the agent's navigation trace and score against `navigation.ideal_path`.

## Difficulty Distribution

| Difficulty | Count | Tasks |
|------------|-------|-------|
| Easy | 2 | 01, 04 |
| Medium | 5 | 05, 06, 08, 09, 10 |
| Hard | 3 | 02, 03, 07 |

## Access Mode Solvability

| Task | llms.txt | llms-full.txt | Source repo |
|------|----------|---------------|-------------|
| 01 Fee Structure | Links only (no answer text) | Full | Full |
| 02 MEV Auction | Links only | Full | Full |
| 03 Collateral Plugin | Links only | Full | Full |
| 04 Governance Timeline | Links only | Full | Full |
| 05 API Dashboard | Partial (base URL + tooling note) | Full | Full |
| 06 Freeze Behavior | Links only | Full | Full |
| 07 Rebalancing | Links only | Full | Full |
| 08 Cross-Chain | Partial (chain names in header) | Full | Full |
| 09 RSR Staking | Links only | Full | Full |
| 10 Swap API | Partial (link to example endpoint) | Full | Full |

The `llms_txt` mode tests whether agents recognize they need external content vs. fabricating answers. The `source_repo` mode tests navigation efficiency.
