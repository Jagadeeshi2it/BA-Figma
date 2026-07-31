# UX audit — Bin Allocation 2.0

**Date:** 2026-07-31 · **Method:** Nielsen's 10 usability heuristics, applied to the two workflows
(Allocate Product, Move Quantity), the search-driven bin selection, and the four-screen move
pipeline. See [CLAUDE.md](CLAUDE.md) for how the app is built.

**Verdict:** ⚠️ Several issues to address. The domain modelling (H2) is the app's real strength;
error *prevention* (H5) is its weakest area and the gap is structural, not cosmetic.

**Grounding caveat:** findings marked `[code]` were read from source, not seen rendered. If those
screens look different from how they read, the H1 and H4 items are the ones most likely to shift.

---

## How to use this file

Each finding has a stable ID. Tick it when fixed and leave the line in place — the record of what
was wrong and why is worth more than a clean list. Add new findings at the end of their section
rather than renumbering.

- `[ ]` open · `[x]` fixed · `[~]` partially fixed / decision needed

---

## Priority actions

The three things worth doing first, in order of impact per unit of work.

- [ ] **P1 — Never show a disabled primary without its reason.** Put the requirement in the button
  (`Select a source bin` → flipping to `Target Selection →` when satisfied) and make the empty
  bottom-bar summaries instruct (`Source — Tap bins, or search a product`) instead of reading
  `0 Bins, 0 Products`. Smallest change here, biggest reduction in stuckness, and it reuses the bar
  that already exists. Covers `H6-2` and `H1-2`.
- [ ] **P2 — Add the domain constraints, or state out loud that the demo has none.** Capacity, par
  level, door-type routing and product-fits-bin are the four rules an operator will assume exist.
  The app will currently accept a physically impossible allocation without objection, which in a
  pharmacy demo is a credibility problem rather than a UX gap. Covers `H5-1`.
- [ ] **P3 — Make the pipeline's shape visible and its Back non-destructive.** A step indicator
  (`① Source → ② Target → ③ Quantities → ④ Place`) plus a Back that returns to the product you were
  on rather than restarting the whole batch of quantities. Covers `H1-1` and `H3-2`.

---

## H1 — Visibility of system status

- [ ] **H1-1** The move pipeline is four screens deep and never says so. No step count, no
  breadcrumb. You discover there is another screen by pressing a button and arriving on it.
- [ ] **H1-2** Entering Move Quantity is silent on the canvas: `changeAllocationMode` reaches
  `BinCard` only to *disable* things, so the shelves become less interactive-looking with no cue
  that a tap now means "select". The mode's only visible signal is a bottom bar reading
  `0 Bins, 0 Products` twice.
- [x] **H1-3** After `Select`, the control vanished and the row carried no marker of its own —
  confirmation existed only in the target column. Fixed 2026-07-31: every Select-family control now
  stays put and greys to `Selected` / `All selected`.

**Working well:** the bottom bar's running source/target counts; the `Door unlocked` toast deduped
per physical door for the whole session, so the same door is never announced twice.

---

## H2 — Match between system and the real world

The app's strongest dimension. Little to fix.

- [ ] **H2-1** `NDC`, `SDV`/`MDV`, `CIV` are never explained. Almost certainly fine for pharmacy
  staff — logged so the assumption is deliberate rather than accidental.

**Working well:** locations read as an operator names them (`Door 3 – Bin C, Shelf 1`). The PIP
cabinet view and per-door unlock toasts model the physical act of walking to a door. The quantity
page instructs a physical action — *"Remove the quantity shown from this bin, then tap X"* — rather
than prompting for data entry.

---

## H3 — User control and freedom

- [ ] **H3-1** No undo after commit. `handleConfirmChangeAllocation` mutates and the only recovery
  is a page reload, which discards *everything* including unrelated work.
- [ ] **H3-2** **Back from the target page re-enters the quantity step with the whole batch**, so
  you redo every product's quantity rather than the one you wanted to change. A direct consequence
  of gathering all quantities before the target visit — the right trade, but it needs a
  product-level Back.

**Working well:** `Cancel` on every step; `Remove all` in the review panel; per-item removal in both
panels.

---

## H4 — Consistency and standards

- [ ] **H4-1** Two multi-select idioms coexist. The allocate panel and unallocated tray use a
  tappable row with a custom tick square; the search dropdown uses per-row buttons with a coloured
  product name and no checkbox at all.
- [ ] **H4-2** Three bin-selection states look alike and mean different things — source (blue
  border), target (green), assignment (purple) — and nothing on screen decodes them. Learnable, but
  only by trial.
- [ ] **H4-3** `BinCard`'s `showUnallocatedProducts` prop actually means "the user is picking bins
  right now" and is fed by two unrelated flows. Invisible to users; the kind of naming that produces
  real inconsistency later. `[code]`

**Working well:** product rows now share one shape — name → italic generic name → grey badges →
`ndc - inventoryType` — across five surfaces.

---

## H5 — Error prevention

**The weakest area, and the gap is domain-level rather than interface-level.**

- [ ] **H5-1** No par levels, no bin capacity, no product-fits-bin check, no door-type enforcement.
  A CLIMATE product can be allocated to a room-temperature door and nothing objects. Bin size is
  *derived from* contents (`shelfLayoutConfig` gives the largest footprint to the fullest bin), so
  "does it fit" has no referent. The Emergency Kit inventory-type rule is the **only** enforced
  constraint in the app.
- [ ] **H5-2** Serial numbers are counted, not validated. `SerialNumberModal.validateSerialNumbers()`
  returns `isSelectionComplete` — no serial value is checked against anything — while `index.html`
  advertises serial validation as the product's whole purpose.
- [ ] **H5-3** No confirmation before commit. There is no "you are about to move 340 vials across 4
  bins" summary between the last screen and the mutation.

**Working well:** the target step blocks re-selecting a source bin; assigning a product to a bin it
already occupies is skipped rather than silently duplicating the row.

---

## H6 — Recognition rather than recall

- [ ] **H6-1** Two ways into the mode with nothing saying which to use — the search box or tapping
  the shelves. The app used to silently focus the search box, which argued for one without saying
  so; that autofocus has been removed, so now neither is signposted.
- [ ] **H6-2** **A disabled primary button with no stated reason.** `Target Selection →` is greyed
  with nothing anywhere saying *select at least one source bin*. The single sharpest flaw in the
  app: the user can see the control they need and is told nothing about why it won't work.

**Working well:** selected bins now list beneath each picked product, so you needn't remember what
you tapped out on the shelves.

---

## H7 — Flexibility and efficiency of use

Strong overall.

- [ ] **H7-1** The `/` keyboard shortcut that reveals the Unallocated Products button is
  undiscoverable and undocumented.

**Working well:** `Move all` per bin; `Select All` per product across its bins; `Select All` in both
panels; multi-select surviving a re-search; a `|`-separated OR query grammar letting one search
carry several products at once.

---

## H8 — Aesthetic and minimalist design

- [ ] **H8-1** The search dropdown is the densest surface in the app — name, badges, NDC, bin
  locations, quantity *and* a per-row action button.
- [ ] **H8-2** Colour is doing a lot of unlabelled work: amber search highlight, blue source, green
  target, purple assignment, red destructive. See `H4-2`.

**Working well:** a real amount has already been stripped — `Current` badges where a highlight
already said it, `Clear` where `Remove all` existed, two labelled NDC rows collapsed to one line,
`Allocate only` removed with the workflow split.

---

## H9 — Help users recognise, diagnose and recover from errors

- [ ] **H9-1** Failures are mostly silent. A bin tap outside a recognised mode does nothing, with no
  feedback. (This was literally a bug once: the allocate workflow had no branch in `handleBinClick`,
  so taps did nothing at all and looked identical to a broken control.)

**Working well:** the E-Kit refusal is the model to copy — it names the rule, the allowed inventory
types, and both ways out.

---

## H10 — Help and documentation

- [ ] **H10-1** No help anywhere. The workflow menu's two descriptions are the only explanatory copy
  in the product — they work well, and are worth extending as a pattern rather than adding a help
  centre.
- [x] **H10-2** The zero-quantity release rule had to be explained in a menu description because the
  UI could not show it — a sign the rule needed a visible home, not better prose. Resolved by
  removing unallocation from that workflow entirely (2026-07-31); it now lives only where it is
  naturally occasioned, as the prompt after a move empties a bin.

---

## Deliberately not findings

Recorded so they are not re-raised as bugs:

- **Allocating creates 0-quantity locations.** Intended — a bin gains the product, stock arrives by
  moving it in. They accumulate during exploration until a reload.
- **A reload discards all changes.** Intended for a demo with no backend.
- **Unallocation cannot be started deliberately.** A design decision, not an omission: having both
  directions on one screen, gated on a quantity rule, was built and then removed for being hard to
  read.
