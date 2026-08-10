# Developer Handoff — Bin Allocation 2.0

Feature-by-feature developer notes for the Bin Allocation prototype, written for implementation
against a real backend. Each document covers one feature: what the operator sees, what the control is
expected to do, how the prototype implements it today, and what an implementer must decide or replace.

## Reading and regenerating

**Read the HTML** — open [index.html](index.html) and browse from the sidebar. Every note carries a
**Copy** button that puts that section's markdown on the clipboard, ready to paste into a ticket or a
PR; the page header has one for the whole document.

**Edit the markdown.** The `.md` files are the source and the `.html` is generated from them:

```bash
node scripts/build-handoff-html.mjs
```

A hand-edited HTML copy would be stale the moment a note changed, and worse than no copy because it
still looks authoritative. Same reasoning — and the same converter — as `scripts/build-docs-html.mjs`,
which renders CLAUDE.md, DEMO.md and UX-AUDIT.md.

## Screenshots

**Two per feature, both page-level**, captured from the running prototype (`pnpm run dev`) at 1440×900,
2× device pixel ratio, in `screenshots/<feature>/`:

| | Shows |
|---|---|
| `01-default-state.png` | The page as it stands before the feature is used. |
| `02-interaction-state.png` | The same page after the operator acts on it — same door, same scroll position, so the only difference visible is the feature's own. |

They exist for **visual context only**. Every behaviour, edge case, colour value and interaction rule
belongs in the notes, not in a screenshot — a doc that documents through images needs a new image
every time a rule changes, and the images fall out of date silently. Component-level crops, hover
states and intermediate steps are deliberately not included.

## Features

| # | Feature | Document | Status |
|---|---|---|---|
| 01 | Bins Available (availability filter + count) | [01-Bins-Available.md](01-Bins-Available.md) | Complete |

Further flows (Allocate Product, Multi Bin Assignment, Move from Bin, Move from Product, History) to be
added one at a time, in the same format.

## How each document is structured

1. **Default state / Interaction state** — the two screenshots, with a line of context each.
2. **What the feature is** — one paragraph an implementer can hold in their head.
3. **Behaviour** — everything observable: states, colours, precedence, what it deliberately does not
   do. This is the contract; it is what must survive a rewrite.
4. **Implementation in the prototype** — how the current React code does it, by file and symbol.
   Reference material, not a specification.
5. **Data and persistence** — what the prototype fakes and what the real build has to supply.
6. **Notes and open questions** — decisions taken, traps, and what is still undecided, ending with the
   test assertions worth writing.

Files are referenced by name and symbol rather than line number: line numbers drift within a day, the
names do not.
