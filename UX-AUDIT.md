# UX audit — Bin Allocation 2.0

**Date:** 2026-07-31 · **Revised:** 2026-08-04 · **Method:** Nielsen's 10 usability heuristics,
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

**2026-08-04 revision.** Two things this audit had not named came from the operator rather than from the
heuristics, and both are now built: the **Move Summary panel** (`H1-4`) closed a disconnect between
steps ③ and ④ — the pipeline said *where* you were but never *what you were moving* — and **moving a
0-quantity allocation** (`H5-4`) removed a workaround the pharmacy team hit constantly. Worth noting how
they arrived: neither was findable by walking the heuristics, because both are about what the operator
came to do rather than about how the interface behaves. The `SHOW_PIPELINE_STEPS` question under `H1-1`
is settled — the band is deleted — and one new defect is open (`H4-5`).

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
  were on via `initialProductKey`. Covers `H1-1` and `H3-2`. **Settled 2026-08-04:** the footer's
  `Step n/4` won and the stepper band was deleted, so only one indicator exists.

---

## H1 — Visibility of system status

- [x] **H1-1** The move pipeline is four screens deep and never says so. No step count, no
  breadcrumb. You discover there is another screen by pressing a button and arriving on it. Fixed
  2026-08-03: every stage's footer opens with `Step n/4`, sourced from `TOTAL_PIPELINE_STEPS` so it
  cannot drift from the pipeline it describes. A fuller stepper band was built first and parked behind
  `SHOW_PIPELINE_STEPS = false`; **deleted 2026-08-04** now that the footer has clearly won. One
  indicator, no flag. The successor question is `SHOW_STEP4_POSITION_COUNTERS` — see `H1-4`.
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
- [x] **H1-4** **The pipeline said where you were but never what you were moving.** Raised by the
  operator, not by this audit: steps ③ and ④ felt disconnected because the step count answered
  *position* while the question in the operator's head — which products, out of which bins, into which
  bins — had no answer anywhere on screen. A quantity page showing one product at a time gave no way to
  see the batch it belonged to. Fixed 2026-08-04 with the **Move Summary panel**, present on Review and
  both halves of ④. What the iterations taught, all of it visible in the final shape:
  - Nesting target bins under their source beat flat `from → to` rows — flat repeated the source bin and
    its quantity once per destination, so one bin split three ways read as three departures.
  - Each badge belongs to the line whose act it names (`Taken` on the source, `Moved` on the target).
    A single per-stage badge hung on the target lines made a target bin announce "Taken" before anything
    had reached it.
  - Bold marks the bin in hand; a filled chip read as "selected" instead of "you are here".
  - Only the quantity being moved. The History page's `-20 → 180` was tried and dropped — before/after
    is not what the operator needs while holding the stock.
  - The toggle must never be disabled, or closing the panel strands them with no way back.
- [~] **H1-5** Step ④'s `Product n of N` and `Source/Target Bin n of N` counters are hidden behind
  `SHOW_STEP4_POSITION_COUNTERS = false` (2026-08-04), at the operator's request, while the Move Summary
  beside them is judged on its own — the panel arguably says the same thing in more detail. Open because
  it is a parked decision, and the deleted stepper band is the precedent for what happens if it stays
  parked: **if the answer is "off", delete the cells and their side sheets.**

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

- [~] **H4-1** Two multi-select idioms coexist. The allocate panel and unallocated tray use a
  tappable row with a custom tick square; the search dropdown uses per-row buttons with a coloured
  product name and no checkbox at all. **Half-closed 2026-08-06:** the two *panels* were themselves
  drifting apart and are now one design — same header, search box, clear button, empty state and
  withheld `Select All` — which matters more than before, since they are the menu's two adjacent
  allocation entries. The dropdown is still the odd one out, and deliberately: its rows act rather than
  accumulate (`Highlight`, `Move`), so a tick square would promise a selection it does not keep.
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

- [ ] **H4-5** **Review's target column shows one arrival card per source bin instead of one per
  product.** Found 2026-08-04, open. Move a product out of three source bins and the target column
  renders three identical cards, each listing all three "From:" rows. `getTargetProducts` groups
  arrivals by `transfer.productId`, but the same drug in three bins is three ids sharing one identity
  (`name | ndc | inventoryType`) — while the "From:" list *is* matched on the identity, so every card
  shows every bin. This is the app's own identity rule (see `CLAUDE.md` §3) broken on one surface; the
  merge-into-the-existing-row code it replaced had been doing that dedup as a side effect. `[code]`
- [x] **H4-6** Every shelf restarted its bin letters at `A`, so one door showed three or four different
  bins all called `Bin A` and the name alone could not say which shelf was meant. Fixed 2026-08-04:
  `bin.name` carries its shelf (`Bin 1A`, `Bin 2B`), unique within a door — the unit that has to be
  unambiguous, since all its shelves are on screen together.

**Working well:** product rows now share one shape — name → italic generic name → grey badges →
`ndc - inventoryType` — across five surfaces. The four move stages now share one footer vocabulary
(`PipelineFooter`) — they had grown three different heights, paddings and button markups for the same
job, so moving between steps looked like moving between products. Corners are 4px on product cards and
bins alike, where three different radii (12px, 14px, 8px) had accumulated for the same kind of surface.

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
- [~] **H5-3** No confirmation before commit. There is no "you are about to move 340 vials across 4
  bins" summary between the last screen and the mutation. **Partially answered 2026-08-04:** the Move
  Summary panel (`H1-4`) is that summary, and it is on screen throughout Review and both halves of ④
  rather than as a final gate. Whether a demo also needs a blocking confirmation is now a judgement
  call rather than a gap — the information is no longer missing, only the interstitial.
- [x] **H5-4** **A product with no stock could not be moved**, so an operator who allocated to the wrong
  bin before any restock had to unallocate from one screen and re-allocate from another. Raised by the
  pharmacy team as a routine annoyance, not caught by this audit. Fixed 2026-08-04: a 0-quantity product
  can be moved, and what moves is the allocation. The quantity page says so in words rather than showing
  an editor whose min and max are both 0 — *"This bin has no quantity to remove — the allocation will
  still move"*. Fixing it surfaced two real defects, both since fixed: history classified the result as a
  new allocation rather than a move (it keyed on `quantity === 0`, which had meant "Allocate only"), and
  `finalizeAndConfirm` silently dropped the only transfer in the batch.

**Working well:** the target step blocks re-selecting a source bin; assigning a product to a bin it
already occupies is skipped rather than silently duplicating the row. `Remove all` in the target column
now reads as an undo (red, matching the per-product `Remove` beside it) rather than sharing the blue of
the column's confirming actions.

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
The Move Summary panel (`H1-4`) removed the largest remaining recall load in the pipeline: which products
came out of which bins, readable at any point rather than reconstructed from memory. Review's target
column separates *what this move is putting in* from *what the bin already held* under their own
headings, so neither has to be inferred from which cards happen to carry a `Remove`.

---

## H7 — Flexibility and efficiency of use

Strong overall.

- [x] **H7-1** The `/` keyboard shortcut that reveals the Unallocated Products button is
  undiscoverable and undocumented. Fixed 2026-08-06 by removing the shortcut and the button rather than
  documenting them: allocating a product that has no bin is the app's most basic job, so it is now the
  **first entry** in the workflow menu (`Allocate Product`), alongside the three that were already there.
  The flow it opens is unchanged. What used to be called `Allocate Product` — giving an *already*
  allocated product another bin — is now `Multi Bin Assignment`, which is the specialised case and reads
  like one.

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
  the domain vocabulary in `H2-1` has nowhere to be explained.
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
- **The quantity taken at a source is not divided between its target bins.** It was, evenly, up front.
  The split is the operator's decision, made by scanning into each bin on the placement screen, so the
  source half deliberately shows no per-target figure — a `0` there would read as a decision already
  taken. (The even split was also breaking the placement screen's own arithmetic.)
- **The same product can appear twice in Review's target column** — once as arriving stock, once as what
  the bin already held. Two rows of one identity is the point: they answer different questions and only
  the arrival is removable. Not to be confused with `H4-5`, which is three cards of the *same* arrival.
- **A fridge card has no bin header.** One pooled bin per fridge door, so `Main Storage (Fridge)` restated
  what the door heading had already said and named a bin nothing needs telling apart from.
