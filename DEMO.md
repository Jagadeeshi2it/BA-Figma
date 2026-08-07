# Demo Mode — behaviours and actions

**Status: built.** Everything described here is implemented in `src/app/demo/` and verified in the
browser. Where a behaviour was tried and removed, it is recorded as such rather than deleted — those
are the decisions most likely to be re-proposed.

Demo Mode plays a guided walkthrough of a real workflow: a virtual cursor moves to real controls and
clicks them, and the app responds exactly as it would to a person. It is a separate document from
[CLAUDE.md](CLAUDE.md) because it is a feature with its own rules rather than a description of the
app; CLAUDE.md §7 is the one-paragraph orientation and points here.

---

## 1. The one decision everything rests on

**A step finds a DOM node and dispatches a real event. It never calls the app's handlers.**

A demo that drives state is a second implementation of the workflow. It keeps passing while the UI it
claims to demonstrate is broken, and the two drift apart without anyone noticing. Driving real events
means the demo fails loudly when the flow changes — which is the only thing that makes it usable as
documentation.

Everything awkward below follows from that choice, and is worth the cost.

---

## 2. Entering, leaving, and what gets reset

| Action | What happens |
|---|---|
| **`/`** anywhere outside a text field | Opens the Demo Scenarios palette |
| Pick a scenario | Sets `?demo=<id>` and **reloads**, then auto-runs |
| **Restart** | Same as picking it again — reload, run from the top |
| **Exit demo** | Stops the walk, drops the overlay, strips the URL parameters. **No reload.** |

**Entering reloads, and it has to.** Inventory lives in React state seeded from a static file and
nothing persists, so a reload is the only thing that guarantees a scenario's preconditions. This
scenario needs MESNA still unallocated and a bin still empty — both stop being true the moment
anyone runs it once, including the demo itself. The palette says so before you choose: *"Runs the
real workflow, and reloads first — anything you have changed in this session is discarded."*

**Exit deliberately does not reload.** The viewer has just watched something happen and the obvious
next move is to poke at the result. Exiting hands back an app that is immediately interactive and
still shows whatever the demo did.

**`/` is free again because it used to be worse.** It once revealed a hidden Unallocated Products
button in the header — an undocumented shortcut in front of the app's most basic job, removed for
that reason (CLAUDE.md §2 D). A palette is the honest use for the key: a list of things you can run,
not a hidden door to one of them.

The palette guards against its own shortcut: `/` typed inside an `input`, `textarea` or
`contenteditable` is just a character. The app's own search box is why that check is not optional.

---

## 3. The control panel

Top-left, over the app's logo. Chrome belongs where chrome lives, and the logo is the one thing on
the page carrying no state and answering no question mid-demo.

```
at rest (90px)      ● ↺ ✕
hovered (~285px)    ● ↺ ✕ │ ‹ ▷ ›  Tick the product  6/13
```

| Control | Always visible | What it does |
|---|---|---|
| ● status dot | yes | Green pulsing = running · white = paused · green solid = completed · red = stopped. Tooltip carries the scenario name or the failure reason. Tapping it toggles expansion. |
| ↺ **Restart demo** | yes | Reload and run from the top |
| ✕ **Exit demo** | yes | Hand the app back, as it stands |
| ‹ **Previous step** | on hover | Undo the last step — see §5 |
| ▷ **Play** / ▮▮ **Pause** | on hover | Run continuously, or hold |
| › **Next step** | on hover | Run exactly one step, then hold |
| step name + `n/N` | on hover | Which step is being performed, and how far through |

### Rules that are load-bearing

- **The two persistent icons come first**, before the collapsing group, so the panel grows rightward
  and they never move. At the far end, expanding would slide them out from under the pointer that
  triggered it — mis-aiming a click at best, and at worst oscillating, since leaving the panel
  collapses it again. A **260ms grace period** on the way out guards the same thing.
- **Collapsing animates `grid-template-columns: 0fr → 1fr`**, not a max-width. The content decides
  its own width, so a longer step name cannot be clipped by a number somebody picked once.
- **It opens itself when the walk ends, and stays open.** A demo that finishes while the panel is a
  dot and two icons finishes silently — the cursor stops, the app sits there, and nothing says
  whether that was the end or a stall. It expands to **`Demo completed`** with Restart, Previous and
  Exit already in front of the viewer, and `close()` is a no-op from then on: a message that vanishes
  when the pointer drifts off has not been delivered.
- **Every button carries `aria-label` and `title`**, so an icon-only panel is not a row of unnamed
  controls, and hover/focus reveal the same names a screen reader always has.
- **Hover is not the only way in.** Focus opens it for the keyboard and a tap on the dot opens it for
  a finger — this app targets a touch-only tablet, where hover does not exist.
- **`w-max` on the wrapper is load-bearing.** A `fixed` element placed with `left: …` and no `right`
  gets only the remaining width available to it; without `w-max` the flex row silently squeezes
  controls out of existence, which reads as a rendering bug rather than a sizing one (CLAUDE.md §4).

### Rejected

- **Labels on every button, always.** Too wide for a panel that sits over the app for a whole
  walkthrough.
- **Icon-only with no expansion.** Compact, but Previous, Play and Next were then unreachable unless
  you discovered nothing — a control you cannot find is worse than a wide bar.
- **Top-centre.** Put a floating black bar in the middle of the header the viewer was trying to read.

---

## 4. What is drawn over the app

**Only the cursor.** Two things used to accompany it and both were removed. Both will be tempting to
add back, which is why the reasoning is here.

**Captions**, one per step, pinned beside the cursor. A walkthrough that explains every click in a
black box over the screen stops demonstrating the app and starts talking about it — and it covers the
interface it exists to show off.

**A highlight ring** around each target, just before the click. The cursor is already travelling to
the control and pausing on it, so the ring said a second time what the movement had just said, in a
heavier voice.

What is left is a pointer that behaves like a hand, and an app that explains itself through its own
state changes, highlights and transitions. **So the pacing carries the explanation** — see §6.

The press ripple stays: with the ring gone it is the only thing marking the moment of contact.

### The input shield

A transparent `fixed inset-0` layer swallows real clicks while the walk runs. One stray click —
ticking a product the script is about to tick, closing the panel it is about to type into —
desynchronises the whole walk, and the failure looks like a broken app rather than a race.

Synthetic events are dispatched straight onto their target and are not hit-tested, so the shield does
not block the demo's own clicks. The control panel sits above it, so its controls stay live. The
shield is gone once the walk has finished: at that point the app is the point.

### The real pointer

Two cursors at once is the worst of both worlds — the viewer cannot tell which one is theirs — so the
shield carries `cursor: none` while the demo drives. But hiding it unconditionally makes the panel
feel unreachable: you move the mouse, nothing appears, and the walkthrough reads as something you are
locked inside.

So a genuine `pointermove` brings the real pointer straight back, and **`isTrusted` is the whole
trick**: the demo's own synthetic pointer events report `false`, so the demo cannot mistake itself for
the user. It hides again after **2s of real stillness**, and only while the walk is *running* — the
moment it is paused the user is in charge and the pointer stays.

The `cursor` rule lives on the shield rather than on `body` because the shield is exactly the area the
demo owns. Over the control panel the real pointer is always visible, which is what makes "move the
mouse and take over" work mid-step.

### Layering

Portalled to `document.body`, above the tablet simulator's `fixed inset-0 z-[9999]` frame. Radix
overlays must portal *into* that frame to be visible (CLAUDE.md §4); the cursor is the opposite case.
`getBoundingClientRect` already returns post-transform viewport coordinates, so one set of numbers is
right in both modes.

| Layer | z |
|---|---|
| input shield | 10030 |
| virtual cursor | 10045 |
| control panel | 10050 |
| scenario palette | 10060 |

---

## 5. Navigating the walk

The runner's position is `positionRef` — **steps completed**, 0…N. The loop reads it fresh each pass,
which is what lets Previous move it *backwards*. A for-loop over indices could only go forward.

### Play / Pause

Pausing gates **between** steps, never inside one. A pause therefore never leaves half an interaction
done, and resuming can never re-run a click that already landed.

### Next

Releases the gate for exactly one step, via `stepOnceRef`, which the loop clears as it passes. It
pauses first, so it doubles as "pause and advance" while playing.

### Previous — a real step backwards

**Each step declares how to undo itself** (`DemoStep.reverse`), and the reverse is performed like any
other step — cursor, click, settle — so going back looks like the operator changing their mind rather
than the screen jumping. Position moves back by one and the walk stays paused, so Next re-runs the
step just undone.

This works because almost everything a demo does is a toggle: ticking un-ticks, tapping a bin un-taps,
a typed query clears.

| `reverse` | Meaning |
|---|---|
| `[]` | This step changed nothing that needs putting back |
| `[steps]` | Run these, in order, to undo it |
| *absent* | Cannot be undone through the UI — falls back to the rebuild below |

`note` and `await` steps change nothing and reverse for free without declaring anything.

**Some steps need two acts to undo one.** Choosing *Allocate Product* both closes the menu and opens
the tray, so its reverse closes the tray and reopens the menu. That is why `reverse` is a list.

**The fallback.** A step with no reverse reloads to `?demo=<id>&step=<n>` and replays the earlier
steps with no cursor animation and no settles. It is correct but visibly a rebuild, so **every step
that can declare a reverse should**. In the current scenario exactly one step cannot: allocating.
Nothing in the tray un-allocates — that path exists only behind the zero-inventory banner after a move
(CLAUDE.md §2 C).

**The loop does not exit when the walk finishes.** It parks in the gate with `status: 'finished'`, so
Previous still works from the final state instead of dead-ending the viewer with only Restart.

**Off-by-one, stated once because it has already been got wrong:** the panel shows `position + 1` (the
step being performed, or about to be), while the replay parameter counts steps to *replay*. So the
fallback passes `position`, not `position - 1`. Passing the latter steps back two at a time, which
reads as a broken button rather than an off-by-one.

### A hidden tab pauses

Going into the background pauses the walk; returning resumes it. A demo that plays on while nobody is
watching means the viewer comes back to a finished screen and no idea what happened. `autoPausedRef`
keeps this from overriding a deliberate pause — coming back to a tab you paused on purpose leaves it
paused.

---

## 6. Pace

All durations live in `demo/pace.ts`, because pace is a single judgement about the whole experience
rather than a set of unrelated numbers.

| Setting | Value | |
|---|---|---|
| `cursorMinMs` / `cursorMaxMs` | 550 / 1500 | Travel time, scaled by distance |
| `cursorPerPx` | 1.15 | ms per pixel between those bounds |
| `approachMs` | 280 | After arriving, before pressing |
| `pressMs` | 180 | How long the press reads as held |
| `typeCharMs` | 85 | Per character |
| `afterClickMs` | 1100 | Settle after a click |
| `afterAwaitMs` | 900 | Settle after a wait |
| `afterNoteMs` | 1600 | A beat with no interaction |

Individual steps override the settle with `settleMs` where the viewer needs longer — the bin tap and
the allocation are the two biggest in the current scenario.

**The bias is deliberately slow**, and this is the note most likely to be argued with. A demo that
keeps up with someone who already knows the app is useless to the person it is for: they are reading
an interface they have never seen, and every click changes something they then have to find. Too slow
costs boredom; too fast teaches nothing.

**The approach pause is most of what makes the cursor read as a hand** rather than a script. A hand
lands on a control and then presses; it does not do both at once.

Easing is `easeInOutCubic`. A linear cursor reads as a machine.

---

## 7. Anchors

Targets are `data-demo` attributes. Never text, never structure.

| Anchor | Where |
|---|---|
| `workflow-trigger` | The `Allocate/Move` button |
| `workflow-allocate-product` | Menu entry — the unallocated tray |
| `workflow-multi-bin-assignment` | Menu entry |
| `workflow-move-from-bin` | Menu entry |
| `workflow-move-from-product` | Menu entry |
| `unallocated-search` | The tray's search box |
| `unallocated-product` | A tray product row (first match) |
| `unallocated-select-all` | The tray's Select All checkbox row |
| `unallocated-badge-filter` | The tray's badge filter trigger |
| `allocate-search` | Multi Bin Assignment's search box |
| `allocate-product` | A Multi Bin result row — and a `Selected products` row, since it is one row |
| `allocate-select-all` | Multi Bin Assignment's Select All |
| `allocate-badge-filter` | Multi Bin Assignment's badge filter trigger |
| `allocate-review-selection` | Multi Bin's footer counter — the way back to the selection |
| `allocate-confirm` | Multi Bin Assignment's Allocate button |
| `allocate-cancel` | Multi Bin Assignment's Cancel button |
| `badge-filter-option-<value>` | One filter option — `all`, `climate`, `civ`, `sdv`, `mdv` |
| `unallocated-allocate` | The tray's Allocate button |
| `unallocated-cancel` | The tray's Cancel button |
| `history-trigger` | The header's History button |
| `history-back` | The History page's back arrow |
| `pipeline-primary` | The move footer's primary — **on every one of the four stages** |
| `pipeline-back` | The move footer's Back |
| `pipeline-cancel` | The move footer's Cancel |
| `review-select-product` | A Review card's `Select`, on the rows not yet taken |
| `step4-quantity` | The take half of step ④ |
| `step4-placement` | The place half of step ④ |

Plus the data attributes a scenario resolves against rather than naming a specific element:
`data-bin-id`, `data-bin-available`, `data-bin-product-count` and `data-product-quantity` on `BinCard`,
and `data-door-free-bins` / `data-door-kind` on each door button.

**One anchor for four primaries.** `pipeline-primary` is on every stage's forward button rather than
one per stage, because the footer's whole design is that the operator looks at one place for what
happens next — a walkthrough reaching for the same place is demonstrating that rather than working
around it. It is also the only handle that survives the labels: `Move To`, `Select bins to move`,
`Build Move List`, `Start Qty Move` and `Proceed to Move To` are all this one control.

**`review-select-product` is conditional**, present on `Select` and absent on the spent `Selected`. So
"the first match" is always a product still available to pick, and a walk can select several by
repeating one step rather than counting rows.

**`data-bin-product-count` answers a question `available` cannot.** `available="false"` says a bin is
not empty; the Move from Bin walk needs a source holding *more than one* product, because choosing
which of them leave is the thing that makes it a Bin move.

**Why not match on text.** This app renames its labels constantly — CLAUDE.md §2 is largely a record
of it, and the workflow menu alone is on its third naming. A broken selector presents to a viewer as
a broken app.

**Why `data-bin-available`.** A scenario needs "a bin with room" without naming one: bin ids belong to
the seed, and the seed is expected to be replaced by real cabinet data. The attribute comes from the
same `bin.available` that draws the green stroke, so the demo taps a bin the viewer can see is free.
Selecting a bin does not change it, so the same card resolves on the way back — which is what lets the
reverse step simply tap it again.

**`data-door-kind` tells a fridge from a cabinet door.** Cold storage is Door 9-14 and renders as
`Fridge N`, but a walk must not match on that label. `data-door-free-bins` cannot stand in either: a
fridge's single pooled bin is stocked in this seed, so it reports no room — and a bin holding something
is not a bin that is full, since the app models no capacity at all (CLAUDE.md §5). Fridges are drawn by
`VirtualCabinetComponent` rather than `CabinetComponent`, and carried no door anchor at all until the
Climate round needed one; they answer `data-demo="door"` now, so a walk looking for "a door" does not
have to know two components draw them.

**`node scripts/verify-demo-anchors.mjs`** asserts every anchor a scenario reaches for still renders.
A rename fails in the terminal instead of in front of a viewer.

**The filter options are anchored per option, not per panel.** `ProductListControls` is one component
rendered by both allocation panels, so the option rows cannot carry a panel-specific name — and they do
not need one: the values are the same everywhere and only one of these panels can be open at a time, so
a walk asking for "the Climate option" cannot reach the wrong one. The two *panel-specific* anchors (the
Select All row and the filter trigger) are passed in as props, spelled out as literals at each call site
so they stay greppable.

Two spellings it had to learn, both from anchors that are not plain literals. A **conditional** anchor
(`data-demo={taken ? undefined : 'review-select-product'}`) is found by reading the braces' own string
literals — as is any `…demoId="x"` prop at a call site, which covers `FooterButton`'s `demoId` and
`ProductListControls`' `selectAllDemoId` / `filterDemoId`. An **interpolated** one (`` data-demo={`unallocated-filter-${option.value}`} ``, one per row of
a mapped list) is matched on its fixed prefix — weaker than an exact match and deliberately the last
resort, but it still catches what actually goes wrong, which is the element being renamed or deleted.

---

## 8. The step vocabulary

```ts
interface DemoStep {
  kind: 'click' | 'type' | 'await' | 'note';
  label: string;              // names the step; read in the panel, never drawn over the app
  target?: DemoTarget;        // CSS selector, or a function returning an Element
  text?: string | (() => string); // 'type' only; a function is resolved when the step runs
  settleMs?: number;          // overrides the PACE default
  reverse?: DemoStep[];       // see §5
}
```

| Kind | Does |
|---|---|
| `click` | Move to the target and click it, for real |
| `type` | Move, focus, and type `text` a character at a time |
| `await` | Wait for the target to appear without touching it |
| `note` | A pause. No cursor movement, no interaction |

**A target may be a function**, re-evaluated at the moment the step runs. That is the escape hatch for
anything only the scenario can identify — see `nthFreeBin` in `allocateProduct.ts`. It is what keeps
the runner from having to learn about bins.

**So may `text`**, for the same reason: a scenario that resolves "a bin with room" from the DOM has to
be able to type *that* bin's name, and a hard-coded one would rot with the seed exactly as a
hard-coded bin id would. See `firstFreeBinName` in `allocateProduct.ts`.

**Labels name the step; they never narrate it.** They are read in the control panel and in the failure
message, and nowhere else.

---

## 9. The DOM layer, and four things that cost a debugging round

`demo/dom.ts`. All four of these look like details and are not.

- **`el.click()` is not enough.** Radix opens its Popover on `pointerdown`, so a bare click leaves the
  `Allocate/Move` menu shut and the whole scenario stalls waiting for a menu entry that never appears.
  `dispatchRealClick` sends the full `pointerover → mouseover → pointermove → mousemove → pointerdown
  → mousedown → focus → pointerup → mouseup → click` sequence.
- **React ignores `input.value = x`.** Its `onChange` rides a native `input` event, and React's value
  tracker suppresses the event when it believes nothing changed. `setInputValue` goes through the
  prototype's setter so the tracker updates too.
- **Every wait is a poll, never a fixed delay.** State updates are async (CLAUDE.md §4), and a delay
  tuned on one machine is a flaky demo on a slower one. `waitForTarget` polls for the node *and* a
  non-zero box — a panel mid-transition is in the DOM before it can be clicked at a sensible
  coordinate. `scrollTargetIntoView` watches the rect until it stops moving rather than guessing how
  long a smooth scroll takes.
- **`sleep` uses `setTimeout`, not `requestAnimationFrame`.** rAF does not fire at all in a
  backgrounded tab, so a rAF-based sleep never resolves there and the walk stops dead mid-step with no
  error — indistinguishable from a broken app. The cursor *animation* still uses rAF, with a watchdog
  that jumps it to its destination if no frame arrives.

Two more, in the runner:

- **The target is re-resolved after the scroll.** A React re-render during the settle can replace the
  node, and clicking a detached element is a click that silently does nothing.
- **The cursor is written imperatively** through `cursorRef.current.style.transform`, never React
  state — it moves at frame rate. Nothing else re-renders either: `<App />` is created once in
  `main.tsx` and never consumes the demo context, so React skips it when a step advances.

---

## 10. Scenario: Allocate Product

One walk, four rounds, in order of increasing shape:

| Round | Pattern | Products | Bins |
|---|---|---|---|
| 1 | one → one | `MESNA` | first free |
| 2 | many → one | **whatever the `Climate` filter finds** | a fridge's pooled bin |
| 3 | one → many | `VYLOY` | first two free |
| 4 | many → many | top two off the unfiltered list | first two free |

Then: close the tray, open History, end on four entries under Today.

**The panel never closes between rounds, and that is the point.** Split into four scenarios, each would
open the tray, do one thing and shut it — which is not how a cabinet gets set up. Run as one walk it
also shows what four separate demos cannot: the tray shortening and the free bins running out as the
work proceeds.

**The seam between rounds is free.** `handleConfirmAssignment` leaves the panel open and resets exactly
what should reset: allocated products leave the tray, the ticks and bin picks clear, and the filled bin
flips to `available: false`. So a round starts clean without a step to clean it, and `nthFreeBin` simply
finds what is left.

**Products are matched by name, never by tray id.** Ids are `unalloc-1`, `unalloc-2`… assigned by index
over whatever is still unallocated, so they renumber after every round of this very scenario — a step
naming one would be wrong by round two. Six of the eight reserved products are used; two are left so the
tray still has something in it at the end rather than bottoming out into its empty state.

**Round 2 is the badge filter, and it carries the round's whole point.** Narrow the tray to `Climate`,
`Select All`, open a fridge, tap its bin, Allocate. That is the many-products-one-location case done the
way the job is actually done: climate-sensitive stock belongs in cold storage, so every product the
filter finds has the *same* destination — which is exactly when `Select All` is the right control and
exactly why the filter sits opposite it.

It replaces a round that searched two names in turn and then cleared the box so both picks were on screen
at once. That version existed to show the tray's invisible-selection gap (CLAUDE.md §8), which is a caveat
rather than a workflow; the caveat is still visible in round 4, where a filtered pick meets an unfiltered
one.

Three things about it are load-bearing and easy to break by editing the rounds:

- **The tray must hold at least two CLIMATE products, and round 1 must not take one.** `Select All` over
  a single row is not a bulk allocation. Both halves have bitten: round 1 was `SOLU-CORTEF`, which was
  Climate at the time (hence `MESNA`), and later the Climate rate dropping to ~1 in 6 cost `SOLU-CORTEF`
  the badge and left the tray with one. The reserve list is maintained by hand against this constraint
  now — see `UNALLOCATED_RESERVE_IDS`. `FLUOROURACIL` and `OPDIVO` are the two today, and
  `verify-unallocated-filter.mjs` asserts the count.
- **Round 2 clears the search box before setting the filter.** The two narrowings compose as AND, and
  round 1 leaves its product's name in the box, so the filter would land on top of a query for one
  specific drug and find nothing. Clearing first is also the honest order: the point of the round is that
  no typing is needed.
- **Round 3 resets the filter to `All products`.** The filter survives an allocation — it is only reset
  when the tray is opened or closed — so nothing else can be found until it is put back. Not housekeeping
  smuggled into the walk: it is the one moment the persistence is visible, and a viewer who has just
  watched the filter empty the tray should see that the tray is not empty.

**Round 2 used to find its bin by name** — typing it into the main search and pressing Highlight Bin, so
the destination lit up a beat before the cursor arrived. Removed, and not because the idea was wrong:
the dropdown did not reliably open for a synthetic click on the search box, so the step stalled the walk
in front of the viewer. See §12; the runner-level cause is fixed now and the beat could come back.

**Round 4 assigns the cross product**, not a pairing: every ticked product goes into every tapped bin,
which is why two ticks and two taps produce four rows. It also picks its two products straight off the
unfiltered list rather than searching for each — an operator setting up a cabinet works down what still
needs a home rather than recalling names to type, and it is what makes the remaining tray visible as a
list at all.

**The walk is door-aware, because it has to be.** It needs six free bins and no single door has them:
the seed spreads fifteen across the cabinet, one behind Door 1 and two behind each of Doors 2–8. Only
the OPEN door's bins are in the DOM, so a scenario cannot count another door's free bins by looking —
which is what `data-door-free-bins` on each door button is for. `openDoorWithRoom(n)` runs before every
round and re-resolves, so the walk moves along the shelves as doors fill up. Assuming nine free bins
behind Door 1 is exactly how this scenario used to die mid-run.

**Closing the tray and opening History are two steps in that order because they have to be.** History
hides while any workflow is open.

**It ends at the ledger on purpose.** An allocation that shows only as a 0-vial row in a bin reads as
nothing having happened; four entries under Today are the proof that four transactions were recorded.

That ending is also what forced the History page's badges to be fixed. They were hardcoded — every row
printed `CLIMATE` and `CIV` regardless — so a walk whose second round filters two Climate products out of
eight ended on a page marking all of them Climate, which reads as the filter being broken rather than the
ledger. All three badges derive from `binProducts` now (CLAUDE.md §2 D).

**`data/seedHistory.ts` seeds nothing into today.** It used to carry a multi-product unallocation
stamped today at 08:40, which rendered as the only rows in Today's list — so a walkthrough's own
transactions landed among strangers and the viewer had to hunt for the ones they had just watched being
created. Every record type the History page can render is still covered by the older entries.

---

## 10a2. Scenario: Multi Bin Assignment

Workflow A — giving a product that is **already stocked** another bin. Two rounds, 30 steps, ending at
the ledger:

| Round | What the walk does |
|---|---|
| 1. one product → two bins | open a door with 2 free bins, search `COSELA`, tick it, tap both bins, Allocate |
| 2. two products → one bin | search `MITOMYCIN`, tick; search `POLIVY`, tick; tap the footer counter to see both; tap one free bin; Allocate |

**Two rounds, not the tray's four.** Copying `Allocate Product`'s grid would add a "many products into
many bins" round that is the two above happening at once — a round with no new fact in it, on a walk
whose brief was to stay short.

**The panel stays open between them**, as in the tray's walk and for the same reason:
`handleAssignProductsToBins` leaves it up and clears exactly what should clear, so each round starts
clean without a step to clean it, and the filled bins flip to `available: false` so the resolvers find
the next free ones on their own.

**Round 1's product is one that already lives in two bins.** COSELA's row lists both, so "and now a
third and a fourth" is visible on the row itself rather than only in the ledger. That list is also the
point of this panel over the tray — it is the context for choosing another bin, and it is what tells
you not to pick one the drug is already in.

**Round 2 exists to show two things at once**: that a second search does not lose the first pick (the
panel holds the picked product *objects*, not their keys), and that the footer's counter is how you
then *see* both — it clears the query, and a clear box is what puts the `Selected products` list on
screen. Its reverse types the second term back rather than tapping the counter again, because the
counter is not a toggle in this panel (it is in the tray, which has no other way back).

**Products are searched for, never picked off a list.** This panel lists nothing until something is
typed, so the tray's `pickFromList` has no equivalent here — and that is the workflow, not a
limitation: you arrive knowing which drug needs another bin.

**Allocate has no reverse**, the same as the tray's: nothing in this panel unallocates, and the app's
only unallocation is the zero-inventory banner after a move. Previous rebuilds from the start.

**The ledger is the closing beat and also a check.** Both rounds file as `New Bin Allocation`, the same
as the tray's. This panel wrote nothing to History at all until 2026-08-07 — the one workflow whose
entire output is an allocation was the one missing from the allocation record — so a walk that ends
here fails loudly if that regresses.

---

## 10b. Scenario: Move from Bin

Workflow B with `moveMode = 'bin'`, all four steps, ending at the ledger:

| Step | What the walk does |
|---|---|
| ① Bin | open a door with a free bin, tap a **stocked** bin as Move From |
| ② Target | tap a **free** bin as Move To |
| ③ Review | `Select` one of that bin's products — the rest stay |
| ④ Move | accept the full quantity at the source, then place it at the target |

Then: the emptied bin raises the zero-inventory banner, and History records the move.

**The source bin must hold more than one product.** Picking a bin does not commit its contents —
Review still asks which of them are leaving — and with a single-product bin that question answers
itself, so the walk would be a Move from Product wearing a different name. `stockedBinWithChoice`
resolves on `data-bin-product-count >= 2`, not on `available="false"`, which only says "not empty".

**It moves the full quantity, and nothing types a number.** The quantity page opens at the source bin's
whole amount (`transfer.quantity || productInfo.quantity`, and transfers are staged at 0), so accepting
it is the happy path. That is not only the shortest route: a partial move switches serial scanning on,
and how many serials there are to scan is then whatever the seed happens to hold — which a scenario
cannot know without reading quantities out of the DOM and generating steps from them. **A partial move
with scanning deserves its own walkthrough**; it is not this one.

**Emptying the bin is the closing beat, not an accident.** A full move leaves the source at 0, so the
cabinet comes back with the zero-inventory banner raised. The walk does not dismiss it: the banner is
the app asking whether the product should keep its now-empty bin, a question with no deadline, and
watching it wait is the point (CLAUDE.md §2 C).

**Step ④ has no reverse, and cannot.** There is no Back on either half — Cancel is the only exit and it
discards the move rather than stepping through it. Previous falls back to the rebuild.

**The target cannot collide with the source.** Step ② refuses a bin already serving as a source, and
the walk's target resolver asks for a *free* bin, which by definition never is one.

---

## 10c. Scenario: Move from Product

The same pipeline entered through the other door. From step ② onward the two walks are near-identical,
**because the workflows are** — one pipeline with two ways in, not two pipelines. Everything worth
watching is step ①, and all of it follows from the operator having declared the unit up front:

| | Move from Bin | Move from Product |
|---|---|---|
| Bin card tap | selects the bin | **inert** — refused with an explanation |
| Product row tap | inert (bubbles to the card) | **selects that product** |
| Source badge | `Move From` | `1 Selected` |
| Footer's from-end | `Move From` | just `Move` (`sourceEndLabel`) |
| Review | headed by the bin, lists its products | headed by the product, lists its bins |

**One product, from one bin — and the flagship behaviour is deliberately not here.** Picking a product
out of the search dropdown takes it *in every bin it lives in*, which is what "wherever this drug is"
means and is the best reason this workflow exists. It is not in this walk for a mechanical reason: how
many bins a product occupies is seed data, and a multi-bin pick makes **two** step counts depend on it
— Review pages source bin by source bin, each needing its own `Select`, and step ④ then takes from each
in turn. A scenario is a static list of steps and can count neither. See §10d.

**Review needs both cards anchored.** The bin-centric view renders `SourceProductCard`; the
product-centric one renders `ProductCentricCard`. They look alike on purpose — same column, same
secondary button — so both carry `review-select-product`, and a walk asks for "the Select in Review"
without knowing which kind of move is running. Anchoring only the first is exactly how this walk
stalled on its first run, on a screen that looked correct.

**`data-product-quantity` sits beside the row anchor.** A product at 0 is movable by design (what moves
is the allocation, CLAUDE.md §2 E) but it is not the happy path, and the seed holds several such rows —
Bin 1B's ALIMTA is one.

---

## 10d. Not built: the multi-bin pick

Both move walks stop short of the same thing, and for the same reason. `Move from Product` cannot show
the search dropdown's "take it wherever it lives", and `Move from Bin` cannot show a partial move with
serial scanning. In each case the number of steps is a function of the data:

| Walk | What it cannot show | Because |
|---|---|---|
| Move from Product | picking a product across all its bins | Review pages per source bin; step ④ takes per source bin |
| Move from Bin | a partial move | the placement screen needs one scan per unit still to place |

**The fix is one addition to the step vocabulary, not a cleverer scenario**: a way to say *"press this
until the condition clears"* — `repeatWhile?: () => boolean` on a click step, run in `runStep` behind a
hard iteration cap. The conditions are already expressible and read well:
`() => !!document.querySelector('[data-demo="step4-quantity"]')` is "keep taking until the take phase
ends". Faking it with a fixed number of repeats would produce a walk that works on today's seed and
stops halfway on tomorrow's — which is the failure this whole file is written to avoid.

---

## 11. Adding a scenario

A file in `demo/scenarios/` and a line in its `index.ts`. Nothing in the runner, the cursor or the
palette should need to change; if it does, the step vocabulary is missing something and *that* is what
to add.

Checklist:

1. Pin products and bins by **identity or property**, never by index or position.
2. Give every state-changing step a `reverse`, or accept the visible rebuild on Previous.
3. Add `data-demo` anchors for anything not already anchored, and re-run
   `node scripts/verify-demo-anchors.mjs`.
4. Set `settleMs` above the default wherever the viewer needs to find something.
5. Check the scenario cannot trip the E-Kit rule, which is the only thing in the app that can refuse
   an action outright.

---

## 12. Known limits

- **Previous cannot undo an allocation** (§5). It is the one irreversible step in the current
  scenario and it falls back to the rebuild. If an unallocate path ever reaches the tray, that step
  is the one to give a `reverse` to.
- **Entering always reloads**, so starting a demo discards whatever the viewer was doing. Stated in
  the palette, but it is still a cost.
- **Only one scenario exists.** The palette, the registry and the step vocabulary are all built for
  more; nothing has been proven against a second one, and the first thing a second scenario is likely
  to need is a step kind that does not exist yet.
- **The runner has no headless test.** `verify-demo-anchors.mjs` checks that anchors resolve, which
  catches the most likely breakage, but the walk itself is verified by watching it. The project has
  no test infrastructure at all (CLAUDE.md §6).
- **Nothing scales the pace at runtime.** `PACE` is a module constant; a speed control would be a
  small change and is the obvious next affordance if anyone finds the pace wrong rather than merely
  slow.
