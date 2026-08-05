# Step ④ guidance rules — moving stock at the cabinet

**Status: part specification, part built.**

- **§4–§5, the route planner** — built (`src/app/utils/moveRoute.ts`), verified against every scenario in
  §9 by `node scripts/verify-move-route.mjs`.
- **§1's one-door rule** — built (`useCabinetAccess` + `utils/cabinetAccess.ts`), verified by
  `node scripts/verify-cabinet-access.mjs`. Bin illumination is **not** modelled at all.
- **Step ④ walks the route** — built: both screens order themselves by it
  (`node scripts/verify-step4-walk.mjs`). They are still the original two screens, so a route needing
  true interleaving falls back to two phases and reports the cost (§9's last case).
- **§6, the panel's itinerary** — written but **not wired**: `MoveSummaryPanel` accepts a route, and
  nothing passes it one yet. Step ④'s summary is still product-major.
- **§8's cancellation** — built: cancelling is offered only before the first quantity leaves a source bin.
- **§7's re-planning** — not built.

This is the rule set for how step ④ of the move pipeline should guide an operator through the physical
cabinet. It is deliberately a separate document from [CLAUDE.md](CLAUDE.md): the rules here are
expected to change as the pharmacy team's thinking develops, and they should be editable without
touching the working guide. CLAUDE.md describes **what the code does**; this describes **what the
guidance should do**.

Steps ①–③ are selection — they happen at a screen and the cabinet is not involved. Step ④ is the only
stage where the operator is standing at the station with their hands in a cabinet, so it is the only
stage these rules apply to.

---

## 1. The physical constraints

These come from the hardware and are not negotiable by the UI.

| Constraint | Scope |
|---|---|
| **One door open at a time.** While Door 1 is open, no other door on any cabinet can be opened — Door 8 included. The open door must be locked before the next is unlocked. | **Global**, across every cabinet at the station. Not per cabinet. |
| **One bin illuminated at a time.** The lit bin is how the operator is told where to reach. Two lit bins would be two instructions at once. | Per station. |
| **Stock can be staged.** The operator collects into their hands or onto the workstation counter, and completes placement afterwards. Stock does not have to go straight from a source bin into a target bin. | — |

**Refrigerators are not subject to any of this.** Doors 9–14 (`isFridgeDoor` in `doorUtils.ts`) are
virtual/pooled storage with no lock and no bin lighting — and one pooled bin each, so "illuminate one
bin" has nothing to disambiguate anyway. A fridge visit costs the operator nothing that the sequencer
needs to conserve, and it never blocks a cabinet door.

Door → cabinet mapping, from `data/cabinets.ts` and `doorUtils.ts`:

| Doors | Storage | Constrained? |
|---|---|---|
| `Door 1–4` | Cabinet 1 | Yes |
| `Door 5–8` | Cabinet 2 | Yes |
| `Door 9–14` | Virtual (fridges), one pooled bin each | **No** |
| `Door 17–19` | Emergency kit (floor doors) | Assumed yes — unconfirmed, see §11 |

---

## 2. The unit of work is a stop, not a product

Step ④ today is two phases: take every quantity at every source (`QuantitySelectionPage`), then place
all of it (`TargetBinSerialScanPage`). That shape exists for a good reason — it replaced a per-product
round trip that crossed the same two doors once per product — but it is a fixed pattern, and a fixed
pattern cannot respond to where the bins actually are.

Under these rules the pipeline plans a **route**. Its unit is a **stop**:

```
Stop = { door, bin, actions: [ take(product, qty) | place(product, qty) ] }
```

A stop is one bin, lit once, worked until done. Everything the operator does at that bin — one product
or six, taking or placing — belongs to that single stop. The operator's screen is the stop; the route
decides which stop comes next.

Two consequences worth stating, because they undo assumptions currently in the code:

- **"Take" and "place" are no longer phases.** A stop can place before a later stop takes. `Taken` and
  `Moved` become per-stop facts, not per-phase ones — which invalidates the Move Summary's current
  rule that a source's `Taken` badge may persist onto the placement half because "every quantity is
  taken before any is carried" (CLAUDE.md §3).
- **A door visit contains its stops.** Since only one door opens at a time, every stop behind one door
  must be **contiguous** in the route. The route is therefore a sequence of door visits, each
  containing a sequence of bin stops.

---

## 3. The objective: cognitive load first

Door operations are not the goal. They were an example. The goal is that the operator always knows what
to do next and never does redundant work. Where those pull apart, the earlier rule wins.

**R1 — Never require two doors at once.** Hard constraint. A route that does is invalid, not expensive.

**R2 — Visit each door once.** A door opened twice means the operator returns to a cabinet they had
finished with, which is the single most confusing thing this sequence can do. See §5 for when this is
impossible.

**R3 — Minimize total interactions**, counting both door visits and bin stops. Two takes from the same
bin are one stop, never two. A product appearing in three bins behind one door is three stops in one
door visit, not three door visits.

**R4 — Keep a product whole where it's free.** Don't scatter one product's takes across a door visit if
they can be adjacent at no extra cost. The operator is thinking in products even though the route is
thinking in bins.

**R5 — Be predictable.** Among routes of equal cost, choose the one the operator could have guessed:
ascending door number, then ascending bin label. The same selection must always produce the same route —
a sequence that varies run to run for the same input cannot be learned.

**R6 — Fridges are free, so they don't interrupt.** Since a fridge visit neither costs a door
transition nor blocks one, fridge stops are never allowed to break a cabinet door visit. Group them:
fridge takes at the start of the route, fridge placements at the end. Never between two stops behind
the same cabinet door.

---

## 4. The sequencing rules

Given the transfers from step ③:

1. **Build the stop set.** Group every take and place by `(door, bin)`. One stop per bin, however many
   actions it carries.
2. **Derive the precedence constraints.** For a target bin `T`, every source bin feeding `T` must be
   worked before `T`'s placement. This is the only ordering the physics imposes — the counter means
   nothing else does.
3. **Order the door visits** to satisfy those constraints while obeying R2 and R5:
   - A door holding only sources can go early; a door holding only targets must come after the doors
     feeding it.
   - **A door holding both** should be placed so its sources are worked and its targets filled in the
     same visit — which is what makes scenario 2 in §9 work.
4. **Order the stops within a door visit** by R3/R4/R5: takes for that visit, then places, ascending bin
   label within each.
   - A bin that both gives and receives is normally **one stop** — emptied then filled while it is lit,
     saving an illumination.
   - **Unless the stock arriving there comes out of another bin behind this same door.** That take
     happens later in the visit, so merging would have the operator fill a bin from stock they have not
     collected yet. In that case the bin gets two stops: its take with the other takes, its place after
     all of them. Precedence is otherwise only modelled *between* doors (step 2), and this is the one
     place it has to be checked within one.
5. **Attach the fridge stops** per R6.

### The key move (scenario 2 generalized)

> If a target bin sits behind a door that also holds source bins, work that door **last among the
> sources**, so the operator takes from it and immediately places into it without a door change.

This is the whole reason the sequence must not be fixed. Stated as a rule rather than as a scenario, it
extends to any number of doors: **every door that holds both sources and targets should be visited after
the doors that only hold sources feeding it.**

---

## 5. When a door must be visited twice

R2 is not always satisfiable, and the failure is worth naming precisely because it decides the fallback.

Suppose Door 1 holds source `a` and target `T₁`; Door 2 holds source `b` and target `T₂`. `T₁` is fed
from `b`, and `T₂` is fed from `a`. Then Door 2 must precede Door 1 (to fill `T₁`) *and* Door 1 must
precede Door 2 (to fill `T₂`). The precedence graph has a **cycle**, and no single-visit-per-door route
exists.

When a cycle exists, break it by splitting the route into two passes: **all takes across every door,
then all places across every door.** This is exactly the batched behaviour step ④ has today — so the
current design is not wrong, it is the **worst case**, and these rules simply stop it being the default.

Split the minimum number of doors needed to break the cycle, not all of them: a door not involved in a
cycle still gets a single visit.

**Which door gets split: the highest-numbered one in the cycle.** Not because it is the best choice —
finding a genuinely minimum split is NP-hard — but because R5 requires the answer to be the same every
time, and the real cabinets have at most eight doors, so the difference between a good split and an
optimal one is at most one door visit.

---

## 6. What each stop must tell the operator

A stop is one screen. It must answer, without the operator inferring anything:

- **Which door is open**, stated as the only one that is. Not "Door 3 unlocked" as a status, but "Door 3
  is open — Door 1 is locked" where a transition just happened.
- **Which bin is lit**, named the way the rest of the app names bins (`Bin 2A - Door 3`).
- **The action, with its quantity and product** — take 5 of X, or place 5 of X.
- **What remains at this stop**, when the stop has several actions. One lit bin means they happen in
  order, so the screen must say which is current and how many follow.
- **Where the stock currently is.** Once staging exists, "on the counter" is a real state between a take
  and its place, and the Move Summary should be able to say so. Stock that is neither in a bin nor
  placed is otherwise unaccounted for on screen.
- **The next stop, named but not yet actionable.** The operator should be able to anticipate the route
  without being invited to open a second door. A door transition is a step they perform — lock this one,
  then the next unlocks — not bookkeeping the app does silently.

### Explicit locking

The lock is part of the guidance, not an implementation detail. Moving from a stop behind Door 1 to a
stop behind Door 3 is three instructions, in order: finish here → **lock Door 1** → Door 3 unlocks.
Skipping the middle one leaves the operator holding stock in front of a door that won't open, with no
statement of why.

### The Move Summary is the guidance surface

The panel is not a receipt. Its job in step ④ is to answer, continuously, **where the operator is and
where they go next** — so it carries the route, and the route is its primary structure.

**Door visits are the top level, bin stops beneath them, in route order.** Door *visits*, not doors: in
the §5 cycle case one door legitimately appears twice, and merging those into one group would tell the
operator they can do both while it is open, which is the one thing the constraint forbids.

```
Move plan
2 doors · 4 stops · stop 3 of 4
─────────────────────────────────
⊘ Door 2 — locked, done
     Bin 4C   ALIMTA      take 25  ✓
─────────────────────────────────
⊙ Door 3 — open now
     Bin 2A   ALIMTA      take 10  ✓
  ▸  Bin 2B   ALIMTA      take  5
     Bin 1C   ALIMTA     place 40
─────────────────────────────────
▭ On the counter
     ALIMTA               35 vials
─────────────────────────────────
Products
     ALIMTA        35 of 40 taken · 0 placed
     CARBOPLATIN   not moved (skipped)
```

- **The boundary between door groups is the lock**, given its own line rather than implied by
  whitespace. A door group ending is an instruction the operator performs (§6).
- **Exactly one bin is marked lit**, using the bold that already means "you are here" elsewhere in the
  panel. This is the one rule that transfers unchanged from the product-major version.
- **Progress counts stops, not products** — `stop 3 of 4`. The footer cell that opens the panel says the
  same.
- **Completed door visits collapse to one line** (`Door 2 — done · 1 stop`). At 320px a five-door route
  does not fit expanded, and the current visit is the only one being worked.
- **Fridge stops carry no door header and no lock boundary.** Rendering them like a cabinet door would
  imply a lock step that does not exist.
- **Staging has its own section.** Stock that is taken but not yet placed is in neither a bin nor a
  target; without this line it is unaccounted for on screen, and it is also the panel's proof that
  interleaving is safe — the operator can see what they are carrying.

**The product view never disappears.** The route answers "where am I"; it cannot answer "where is all my
ALIMTA going", and that question does not stop being asked because the operator is mid-move. So the
panel carries **both, always** — a `Products` section beneath the route, not behind a toggle. It is one
compact progress row per product (`n of N taken · m placed`), not a repeat of the route's detail: the
route already names products on every stop line, so the product section's job is only the per-product
totals the route cannot sum for you.

Ordering follows the same logic as the route: products in the order their first stop occurs, so the
section reads in step with the walk rather than alphabetically.

---

## 7. Re-planning

The route is a plan over the actions that remain, so anything that changes those actions re-plans it.

**A skip re-plans.** Skipping a product removes its actions from every stop; stops left with no actions
are dropped; the remaining actions are re-sequenced by §4. A skip can therefore change which door comes
next, and can turn a two-visit route into one.

**A skip is only offered before the product's stock is in hand.** Once a take is complete the stock is on
the counter, and "skip" would mean *put it back* — a different act, with its own stop (return to the
source bin, place it, which needs the source door reopened). Rules:

| State of the product | Offered |
|---|---|
| No take completed | **Skip** — removed from the plan, route re-plans |
| Some stock taken, nothing placed | **Return to source** — not a skip; adds a placement stop back at the source bin |
| Any stock already placed | Neither. The move has partly happened; it can only be completed or undone as a new move |

**The re-plan must be visible.** A route that silently rearranges under the operator's hands is worse
than a suboptimal one — they are memorising a sequence in order to work it. On re-plan, the panel states
what changed ("Door 1 no longer needed", "next stop is now Bin 2A - Door 3") rather than just redrawing.

**Completed stops never re-order.** Re-planning applies only to the unworked remainder. A door already
locked stays where it is in the panel's history, even if the new plan would not have visited it.

---

## 8. Cancelling

Cancelling is three different acts depending on where the stock is, and only the first is a discard.

| Regime | State | Behaviour |
|---|---|---|
| **A — nothing collected** | No source bin worked yet. The quantity on screen is a proposal; the stock has not moved. | Confirm, then discard. **Built.** |
| **B — any quantity taken** | The first quantity has left a source bin. | **No cancel.** Built. |
| **C — placing started** | Any stock has gone into a target bin. | **No cancel.** Built — same rule as B, since B already covers it. |

**A is a discard and nothing more.** The dialog names what is lost (the selection) and states what is not
(the cabinet). Confirming resets the whole flow to the default view — mode, step, source and target bins,
both search channels, and the open door — the same end state a completed move leaves behind. Anything
short of that drops the operator back into step ② holding the selection they just abandoned.

**B and C are the same rule: once stock has moved, the move must be finished.**

The threshold is the **first quantity leaving a source bin** — not the first placement. Everything past
that point would rest entirely on the operator putting stock back in the right bins, and nothing in the app
can check that they did. The pharmacy team's judgement: that is not something to depend on, so cancelling
is refused rather than trusted.

The control keeps its own name and explains on tap (a toast) rather than renaming itself to a sentence
about why it is unavailable. It is shown, not removed — a control that vanishes reads as one that failed.

This replaced a **return checklist**: the dialog listed what to put back, per bin, grouped by door and
ordered for the shortest walk, and confirming was the operator's acknowledgement that they had. It was
built, worked, and was removed — recorded here rather than left behind a condition nothing can satisfy.
What follows is why it looked reasonable, and remains the design to revisit if returns ever become
verifiable (a scan-on-return would do it).

**A return is not an undo, it is a return move.** Nothing the app does can put vials back; the operator has to.
So the honest model is not "cancel" at all but a **second route, source and target swapped** — from the
counter back to the bins the stock came from, under the same one-door constraint as any other route. The
planner already computes this: it is `planMoveRoute` over the reversed transfers.

That reframing dissolves the distinction between "all from one door" and "moved away from that door".
They are the same act with different route lengths — which is what makes a simple phase 1 possible.

### The checklist design (built, then removed)

**One rule:** cancelling available until the first placement. Not gated on doors, not on how many bins
were worked. Two states, not three.

**One list:** the dialog *is* the return checklist — what to put back, per bin, grouped by door and
ordered so the walk back costs the fewest openings. It is on screen exactly while the operator is walking
back, and confirming is the acknowledgement that they did it. No second screen, no stop-by-stop flow, no
new state machine.

Ordering needs no route planning: a return has nothing to take, so there are no precedence constraints and
every door order costs the same number of visits. With cost tied, R5 decides outright — ascending door
number, then bin reading order (`compareRouteBins`).

**One history entry** — `action: 'move-cancelled'`, listing the bins the stock went back to and what went
into each, so the trail did not claim nothing happened when a door had been opened and vials handled.

**And the reason it went:** the app cannot verify the stock went back. The checklist took the operator's
word and the history entry made that word auditable — but auditable after the fact is not the same as
prevented, and an unverifiable return that the record calls complete is worse than a move the operator was
made to finish. That is the judgement call, and it is the pharmacy team's to make.

### Still open

- **If returns become verifiable** — a scan-on-return — B stops resting on credibility and the checklist
  above becomes buildable again as designed.
- **The operator now cannot leave step ④ once stock has moved.** Accepted deliberately, but it means an
  interruption mid-move has no in-app resolution: they either finish or abandon the screen, and abandoning
  records nothing. Worth revisiting if it happens in practice.

**C is closed, and for a stronger reason than "inventory has changed".** Nothing is committed until the
end of the flow, so state is not the obstacle. The obstacle is that **the move is no longer identifiable
in the bin**: a target bin that already stocked the product now holds one merged quantity, and the app
cannot tell the arriving vials from the ones that were there. There is nothing to take back out.

That leaves the operator with no exit but completing the move, which is a real operational question:
if abandoning mid-placement has to be possible, it cannot be a cancel — it needs a path that records a
discrepancy rather than pretending the move can be unwound.

---

## 9. Worked scenarios

Throughout: `S` = source bin, `T` = target bin.

### Scenario 1a — one source, one target, same door

```
Door 3 open
  Bin 2A lit   take 10 of ALIMTA
  Bin 3D lit   place 10 of ALIMTA
Door 3 locked
```
One door visit, two stops, no lock/unlock between them. The door never closes mid-move.

### Scenario 1b — one source, one target, different doors

```
Door 3 open       Bin 2A lit   take 10 of ALIMTA
Door 3 locked
Door 1 open       Bin 1C lit   place 10 of ALIMTA
Door 1 locked
```
Two door visits, one transition. This is the minimum; there is no route that avoids it.

### Scenario 2 — three sources across two doors, target behind one of them

Sources: `Bin 4C` (Door 2), `Bin 2A` and `Bin 2B` (Door 3). Target: `Bin 1C` (Door 3).

```
Door 2 open       Bin 4C lit   take 25
Door 2 locked
Door 3 open       Bin 2A lit   take 10
                  Bin 2B lit   take 5
                  Bin 1C lit   place 40        <- no door change; stock came off the counter
Door 3 locked
```
Two door visits, one transition, four stops. Door 3 is worked **last among the sources** precisely
because it also holds the target. A fixed source-then-target pattern would have produced Door 3 → Door 2
→ Door 3, or all-takes-then-all-places: three door visits and two transitions for the same work.

### Scenario 3 — a fridge is involved

Sources: `Bin 2A` (Door 3), fridge `Door 11`. Target: `Bin 1C` (Door 3).

```
Door 11 (fridge)  take 12                      <- no lock, no lit bin; free, so it goes first
Door 3 open       Bin 2A lit   take 10
                  Bin 1C lit   place 22
Door 3 locked
```
One constrained door visit. The fridge stop is pulled to the front rather than sitting between the two
Door 3 stops, which would have read as an interruption without being one (R6).

### Scenario 4 — the cycle (fallback)

Door 1 holds `S₁` and `T₁`; Door 2 holds `S₂` and `T₂`. `S₁ → T₂` and `S₂ → T₁`.

Door 2 is the higher number, so it is the one split:

```
Door 2 open   Bin 2A lit   take from S₂
Door 2 locked
Door 1 open   Bin 1A lit   take from S₁
              Bin 1B lit   place into T₁        <- S₂'s stock, collected a moment ago
Door 1 locked
Door 2 open   Bin 2B lit   place into T₂        <- second visit, unavoidable
Door 2 locked
```
Three door visits. R2 is broken once rather than twice: Door 1's take and place share its single visit,
and only Door 2 is split.

---

## 10. What the code does not model yet

Every item here is a prerequisite, not a nice-to-have.

- **`unlockedDoors` is the wrong shape.** It is an accumulating `Set` of doors *already announced by a
  toast*, so no door is ever conceptually closed and two can be "unlocked" at once. The one-door rule
  needs a single `openDoor` value with explicit lock/unlock transitions.
- **Bin illumination does not exist.** There is no lit-bin state anywhere in the app.
- **There is no route.** `groupedTransfers` (quantity page) and `productGroups` (placement page) are
  product-major orderings of transfers. Neither is a sequence of stops, and neither knows about doors
  beyond labelling them.
- **There is no staging state.** Nothing represents "taken but not yet placed", which §6 needs (the counter line).
- **Storage type doesn't reach the pipeline.** `isFridgeDoor` exists but step ④ never asks; both halves
  treat every door identically.
- **No capacity or door-type constraints exist at all** (CLAUDE.md §5). The router can therefore
  propose a placement the cabinet would physically refuse — a CLIMATE product into a room-temperature
  door, or a bin with no room. Sequencing cannot fix this; it just shouldn't pretend to have checked.

---

## 11. Open questions

- **Emergency-kit floor doors (17–19)** — same lock and lighting constraints as cabinet doors? Assumed
  yes above.
- **Is there a limit on what can be staged?** The rules assume the counter is unbounded. If an operator
  can only carry so much, long routes need a place-what-you-have break, and R2 gets harder.
- **Several targets behind several doors** — the rules order them by precedence and door number, which
  is predictable but not proven optimal. Worth revisiting if real routes get long.
- **Is a re-plan ever refused?** §7 re-plans on every skip. If a route re-plans repeatedly the operator
  may lose the sequence they were holding in their head, and a "finish the plan you have" option might
  read better than a third rearrangement.

---

## Revisions

- **2026-08-05** — §8 narrowed on the pharmacy team's call: cancelling is allowed **only before the first
  quantity is taken**. Past that it would depend on the operator returning stock to the right bin with
  nothing able to verify it, which is not safe to rely on. The return checklist below was built and then
  removed; it is kept as a record because it is the right design once a return can be verified.
- **2026-08-05** — §8 phase 1 built: one rule (cancel until the first placement), one checklist (the
  dialog, grouped by door), one history entry. Building it found the placed-stock signal was wrong —
  `scannedItems` is auto-populated when scanning is not required, so Cancel was disabling itself the moment
  the placement screen opened, before the operator had done anything.
- **2026-08-05** — Cancellation (§8). Three regimes, of which A and C are built. The team is certain
  about C: once placing has begun, Cancel is off. B is open, and writing it up produced the reframing
  above — cancelling with stock in hand is a return MOVE, not an undo, which makes "same door" versus
  "moved away" one act with two route lengths rather than two problems.
- **2026-08-05** — Panel spec (§6) and re-planning (§7) added. Two decisions from the pharmacy team: the
  **product view never disappears** in step ④ — the panel carries the route and a per-product progress
  section together, not behind a toggle, because the panel's purpose is continuous visual guidance; and
  the route **re-plans on every skip**. Re-planning brought out a distinction the skip did not have
  before: once stock is in hand, "skip" would mean putting it back, which is a different act needing its
  own stop.
- **2026-08-05** — First version. Written from the pharmacy team's statement of the constraints: the
  one-door rule is global across cabinets (not per cabinet); the objective is cognitive load, of which
  door operations are one term and bin interactions another; stock may be staged on the workstation
  counter; refrigerators have neither constraint and must be treated by storage type.
