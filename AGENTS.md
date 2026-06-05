# Frontier Lang Compiler Agent Notes

The repo-local `.env` in `/Users/james/Documents/json-diff` contains npm publish credentials. Never print or commit token values.

For broad package, compiler, projection, fuzzing, benchmark, or release work, use the repo-local Frontier swarm/Codex queue from `/Users/james/Documents/json-diff` and keep worker outputs isolated under `agent-runs/`.

This package is an orchestration facade. Keep parser/checker/projection logic in their owning packages and compose it here.
