# CLAUDE.md — Exo Space Planetarium

This file is auto-loaded by Claude Code at the start of every session. It defines the project context, active standards, and behavioural contract for all AI work on this project.

---

## Session Start Protocol

At the start of every session Claude must:

1. Read `coding-standards/index.md` — loads the full standards map
2. Confirm active standards below are loaded
3. Begin every response with `[CX]` — signals context is active
4. Declare loaded standards on the first response of the session

If `[CX]` is ever missing from a response the session has lost context. Stop immediately, discard the response, and start a new session.

---

## Active Standards

| Standard | Active |
|---|---|
| CSS standard | `coding-standards/css-standards.md` |
| HTML standard | `coding-standards/html-standards.md` |
| Script standard | `coding-standards/js-and-ts-standards.md` (combined) |
| Git standard | `coding-standards/git-standards.md` |
| Versioning standard | `coding-standards/versioning-standards.md` |
| SEO standard | `coding-standards/seo-standards.md` |
| Performance standard | `coding-standards/performance-standards.md` |
| Accessibility standard | `coding-standards/accessibility-standards.md` |
| QA standard | `coding-standards/qa-standards.md` |
| AI standard | `coding-standards/ai-standards.md` |
| Framework — Astro | `coding-standards/frameworks/astro.md` |

---

## Project-Specific Context

| Property | Value |
|---|---|
| Project name | Exo Space Planetarium |
| Framework | Astro 6.4.8 |
| CSS framework | None (strata-css utility layer only) |
| Script standard | JS + TS combined |
| CSS token prefix | `--ex-` |
| Selector signature | `ex-` |
| Token file | `public/css/variables.css` |
| Global stylesheet | `public/css/main.css` |
| Planet overlay files | `public/css/{planet}-overlay.css` |
| Entry scripts | `src/scripts/landing-entry.ts`, `src/scripts/sol-entry.ts`, `src/scripts/warp-entry.ts` |

---

## How to Load Standards Per File

Before editing any file identify its role using the table in `coding-standards/index.md` then load:

1. The relevant discipline global standard (`css-standards.md`, `html-standards.md`, etc.)
2. The relevant file-role partial (`css-standards/component-files.md`, etc.)
3. The relevant framework file if applicable (`frameworks/astro.md`, etc.)

Never edit a file without loading its standard chain first.

---

## AI Behavioural Contract

- Every response starts with `[CX]`
- First response of every session declares which standards are loaded
- No restating the task before acting
- No trailing summaries after completing work
- No filler phrases
- No invented rules — gaps in standards are flagged to the developer
- Full rules in `coding-standards/ai-standards.md`

---

## Project State

For current project state, completed work, known issues, and next steps read `handover.md` in the project root.
