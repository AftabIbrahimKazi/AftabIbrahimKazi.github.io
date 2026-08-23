Shared shader-node code is promoted to `shader-nodes/CoreShaderNodes.ts` only once a second consumer proves it generic.

**What:** Helper nodes are born planet-local. They move to the shared `CoreShaderNodes.ts` file only when a second real consumer (a different planet, or a different domain like warp/landing) needs the same logic — never speculatively.
**Why:** Prevents `CoreShaderNodes.ts` from accumulating planet-specific logic under the guise of "might be reused." Earth's shader work was the first real precedent that proved the pattern generic.
**Rejected alternative:** A single universal `app-entry.ts` (DOM-sniffing + dynamic imports) to unify the three domain entry points was considered and rejected — worth revisiting only at 10+ page types. `CoreShaderNodes.ts` must never gain planet-specific logic; `WarpShaderNodes.ts` stays domain-local (single consumer).
