# UX audit — Bin Allocation 2.0

**Date:** 2026-07-31 · **Revised:** 2026-08-03 · **Method:** Nielsen's 10 usability heuristics,
applied to the workflows (Allocate Product, Move by Bin, Move by Product), the search-driven bin
selection, and the four-step move pipeline. See [CLAUDE.md](CLAUDE.md) for how the app is built.

**Verdict:** ⚠️ Several issues to address. The domain modelling (H2) is the app's real strength;
error *prevention* (H5) is its weakest area and the gap is structural, not cosmetic.

**Grounding caveat:** findings marked `[code]` were read from source, not seen rendered. If those
screens look different from how they read, the H1 and H4 items are the ones most likely to shift.

**2026-08-03 revision.** `P1` and `P3` were built on `move-quantity-pipeline-spine`, which closed the
whole visibility cluster (`H1-1`, `H1-2`, `H3-2`, `H6-1`, `H6-2`) and turned two others up. `P2` — the
missing domain constraints — is untouched and is now clearly the largest remaining item. The colour
legend that would have closed `H4-2`/`H8-2` was built and then deliberately removed, so both are
reopened as `[~]` with the reasoning recorded rather than lost.

---

## How to use this file

Each finding has a stable ID. Tick it when fixed and leave the line in place — the record of what
was wrong and why is worth more than a clean list. Add new findings at the end of their section
rather than renumbering.

- `[ ]` open · `[x]` fixed · `[~]` partially fixed / decision needed

---

## Priority actions

The three things worth doing first, in order of impact per unit of work.

- [x] **P1 — Never show a disabled primary without its reason.** Done 2026-08-03. The button carries
  the requirement (`Select a source bin` → `Target Selection →` once satisfied, arrow dropped while
  blocked). The empty summaries were **not** made to instruct as proposed: the instruction went into
  the footer's `Step n/4` cell instead, where it belongs to the step rather than to one of two
  summary halves, and the empty summary reads in the mode's own unit (`0 Products` in a Product move,
  `0 Bins` in a Bin move). Filled cells go blue with a chevron. Covers `H6-2` and `H1-2`.
- [ ] **P2 — Add the domain constraints, or state out loud that the demo has none.** Capacity, par
  level, door-type routing and product-fits-bin are the four rules an operator will assume exist.
  The app will currently accept a physically impossible allocation without objection, which in a
  pharmacy demo is a credibility problem rather than a UX gap. Covers `H5-1`. **Now the largest
  remaining item** — the interface no longer hides its own shape, so the missing domain is what an
  operator will hit next.
- [x] **P3 — Make the pipeline's shape visible and its Back non-destructive.** Done 2026-08-03. Steps
  are `① Bin|Product → ② Target → ③ Review → ④ Move`, with ④ deliberately spanning the take and place
  screens (a separate "Place" step misread them as separate errands) and Review promoted from modal
  to page so all four are the same kind of surface. `Back` from placement returns to the product you
  were on via `initialProductKey`. Covers `H1-1` and `H3-2`. See the `SHOW_PIPELINE_STEPS` note under
  `H1-1` — which of the two indicators survives is still open.

---

## H1 — Visibility of system status

- [x] **H1-1** The move pipeline is four screens deep and never says so. No step count, no
  breadcrumb. You discover there is another screen by pressing a button and arriving on it. Fixed
  2026-08-03: every stage's footer opens with `Step n/4`, sourced from `TOTAL_PIPELINE_STEPS` so it
  cannot drift from the pipeline it describes. **Caveat:** a fuller stepper band was built first and
  is now switched off (`SHOW_PIPELINE_STEPS = false`) while the compact footer version is trialled.
  Two indicators exist, one renders. Whichever loses should be deleted, not left switched off.
- [x] **H1-2** Entering Move Quantity is silent on the canvas: `changeAllocationMode` reaches
  `BinCard` only to *disable* things, so the shelves become less interactive-looking with no cue
  that a tap now means "select". The mode's only visible signal is a bottom bar reading
  `0 Bins, 0 Products` twice. Fixed 2026-08-03 by answering it in words rather than on the canvas:
  the footer prints what to do on this step (`instructionFor`), phrased as the physical act and
  differing between the kinds only where they genuinely differ — "Tap a product inside a bin, or find
  one with search" vs "Tap the bins holding the stock you want to move". The Product wording names
  the *row* on purpose: in that kind the bin is inert, so aiming the user at a bin would point them
  at the one control that cannot answer (see `H9-1`).
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
- [x] **H3-2** **Back from the target page re-enters the quantity step with the whole batch**, so
  you redo every product's quantity rather than the one you wanted to change. A direct consequence
  of gathering all quantities before the target visit — the right trade, but it needs a
  product-level Back. Fixed 2026-08-03: `TargetBinSerialScanPage`'s `onBack` carries the product key,
  and the quantity page resumes on it (`initialProductKey`). Its own `Back` steps within the batch
  first and only leaves the stage from the first product.

**Working well:** `Cancel` on every step; `Remove all` in the review panel; per-item removal in both
panels. `Cancel` and `Back` are now blue secondary rather than destructive red across the app —
abandoning an uncommitted selection is a step back, not a deletion, and the red overstated it.

---

## H4 — Consistency and standards

- [ ] **H4-1** Two multi-select idioms coexist. The allocate panel and unallocated tray use a
  tappable row with a custom tick square; the search dropdown uses per-row buttons with a coloured
  product name and no checkbox at all.
- [~] **H4-2** Three bin-selection states look alike and mean different things — source (blue
  border), target (green), assignment (purple) — and nothing on screen decodes them. Learnable, but
  only by trial. **Reopened 2026-08-03.** A colour legend was added beside the stepper and then
  deliberately removed: a permanent key for three states is chrome that never stops being shown to
  people who learned the colours on their second use, and it sat closer to the step labels than to the
  bins it described. The finding stands; a legend is not the answer. Better candidates: name the state
  on the bin itself when selected, or let the footer's step cell say which colour this step is
  applying.
- [ ] **H4-3** `BinCard`'s `showUnallocatedProducts` prop actually means "the user is picking bins
  right now" and is fed by two unrelated flows. Invisible to users; the kind of naming that produces
  real inconsistency later. Now feeding three flows, and a Product move needs the *opposite* of it, so
  the name is further from the job than when this was written. `[code]`
- [ ] **H4-4** A product row means three different things by context — navigate (view), select
  (Product move step ①), nothing (Bin move, target step, assignment flows) — with nothing on the row
  saying which. This is the correct behaviour in each case, but it is carried entirely by hover state.
  Discovered while fixing the `+N more` panel, which had the view-mode meaning during a move. `[code]`

**Working well:** product rows now share one shape — name → italic generic name → grey badges →
`ndc - inventoryType` — across five surfaces. The four move stages now share one footer vocabulary
(`PipelineFooter`) — they had grown three different heights, paddings and button markups for the same
job, so moving between steps looked like moving between products.

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

- [x] **H6-1** Two ways into the mode with nothing saying which to use — the search box or tapping
  the shelves. The app used to silently focus the search box, which argued for one without saying
  so; that autofocus has been removed, so now neither is signposted. Fixed 2026-08-03 by making the
  choice explicit *before* the mode opens: `Move by Bin` ("Tap whole bins on the shelves") and
  `Move by Product` ("Search the products to move") name the route in the menu, and each kind then
  supports only its own — bins are inert in a Product move. Product mode focuses the search box once
  on entry, deliberately **not** when returning from the target step, where the selection already
  exists and stealing focus would fight the operator.
- [x] **H6-2** **A disabled primary button with no stated reason.** `Target Selection →` is greyed
  with nothing anywhere saying *select at least one source bin*. The single sharpest flaw in the
  app: the user can see the control they need and is told nothing about why it won't work. Fixed
  2026-08-03 — the label *is* the requirement while blocked. The same rule was applied to Review's
  `Select all`, which now explains a refusal instead of greying silently ("The list is narrowed to a
  search — clear it to take everything in this bin").
- [ ] **H6-3** The `+N more` panel stays open across step changes, so it can be left open into a step
  where its rows do nothing. Inert rows are correct for a Bin move and for the target step — the scope
  is the bin — but the panel gives no sign it has gone read-only. Either close it on a step change or
  say what it is for while a move is running. `[code]`

**Working well:** selected bins now list beneath each picked product, so you needn't remember what
you tapped out on the shelves. Step ① is labelled for the unit the operator chose (`Bin` / `Product`)
rather than a generic "Source", so the menu choice is echoed back on the screen that carries it out.

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
- [~] **H8-2** Colour is doing a lot of unlabelled work: amber search highlight, blue source, green
  target, purple assignment, red destructive. See `H4-2` — a legend was tried and removed. One rung
  down 2026-08-03: destructive red no longer appears on `Cancel`/`Back`, so red now means only "this
  destroys something", and the footer's blue-when-filled summary values give blue a second, consistent
  job (*this side has something in it*) rather than a fifth unrelated one.

**Working well:** a real amount has already been stripped — `Current` badges where a highlight
already said it, `Clear` where `Remove all` existed, two labelled NDC rows collapsed to one line,
`Allocate only` removed with the workflow split.

---

## H9 — Help users recognise, diagnose and recover from errors

- [ ] **H9-1** Failures are mostly silent. A bin tap outside a recognised mode does nothing, with no
  feedback. (This was literally a bug once: the allocate workflow had no branch in `handleBinClick`,
  so taps did nothing at all and looked identical to a broken control.) **A Product move now makes a
  bin tap deliberately silent**, which is the same non-response as the bug: the card drops its
  pointer and hover so it does not *look* tappable, and the step instruction aims the operator at
  product rows instead, but tapping a bin still says nothing. Mitigated, not fixed.

**Working well:** the E-Kit refusal is the model to copy — it names the rule, the allowed inventory
types, and both ways out.

---

## H10 — Help and documentation

- [~] **H10-1** No help anywhere. The workflow menu's two descriptions are the only explanatory copy
  in the product — they work well, and are worth extending as a pattern rather than adding a help
  centre. **Extended 2026-08-03** exactly that way rather than by adding help: three one-line menu
  descriptions, plus a per-step instruction in the footer written as the physical act — the device the
  quantity page already used ("Remove the quantity shown from this bin, then tap…") and which this
  audit singled out as working. Still `[~]`: the domain vocabulary in `H2-1` and the `/` shortcut in
  `H7-1` have nowhere to be explained.
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
- **Step ④ covers two screens, so the count "sticks" at 4/4.** Taking a quantity at the source and
  placing it in the target are two halves of one move. A fifth step, or a "Place" step, said they were
  separate errands. Each screen's own header says which half you are on.
- **The operator must pick Bin or Product before the move opens.** Not a redundant question: intent is
  not recoverable from a selection. Review used to infer the perspective from how many bins the
  selection spanned, which handed the bin-centric screen to someone who had come to move a product.
- **The `Bins Available(n)` checkbox is not a fourth workflow.** It is a view filter, moved out of the
  action row and next to the `Allocation` title for that reason.
