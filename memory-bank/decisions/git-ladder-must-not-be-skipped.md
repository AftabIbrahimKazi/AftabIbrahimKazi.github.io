Merges must always go `dev → test → beta → main` in sequence — never merge a PR straight from `dev` to `main`.

**What:** Confirm the PR target branch *before* merging, not after.
**Why:** Phase 22 (2026-07-12) merged straight to `main` via PR, skipping `test`/`beta` (violates git-standards.md RULE G-02). Caught after the fact; `test`/`beta` had to be fast-forwarded to resync the ladder. No functional harm that time, but the gate exists to catch things before they reach production.
**How to apply:** Every PR/merge, check target branch first.
