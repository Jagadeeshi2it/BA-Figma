# Bin Allocation 2.0 — working guide

A pharmacy **bin allocation** demo: an operator manages which cabinet bins hold which drug
products, and moves stock between those bins. Originally a Figma Make export, since reworked by
hand. React 18 + Vite 6 + TypeScript + Tailwind 4.

**It is a demo, not a product.** There is no backend, no persistence and no auth. All inventory
lives in React state seeded from a static file, so **a page reload discards every change**. That
single fact explains a lot of what looks odd below.

```bash
pnpm run dev     # or npm run dev — Vite on :5173
```

---

## 1. Orientation

| Where | What |
|---|---|
| `src/main.tsx` | Entry. Mounts `App` inside `TabletSimulatorProvider` + `PipProvider`. |
| `src/app/App.tsx` (~850 lines) | Composition root. Owns page routing (by boolean flags, not a router), the multi-screen move pipeline, and every panel/modal mount. |
| `src/app/hooks/useInventoryState.ts` (~1850 lines) | **The state layer.** One hook, 73 returned keys, 39 handlers. Everything that mutates inventory goes through here. |
| `src/app/components/` | UI. `MainLayout` provides `topBar` / `bottomBar` / `sidePanel` slots. |
| `src/app/data/` | Seed data. `doorConfigurations.ts` is the pipeline; `realData.ts` (~10k lines) is the imported cabinet contents. |
| `src/app/utils/` | Pure helpers — search, bin geometry, badges, text highlighting. |
| `src/app/services/` | `EmergencyKitService` (the only business rule), `ProductDataService` (id → catalogue lookup), `EKitHistoryService`. |
| `src/styles/index.css` | **The live stylesheet.** Tailwind 4 with `@import 'tailwindcss' source(none)` + `@source`. |

### The data shape

```
doorShelfConfig: { [doorName: string]: Shelf[] }
  Shelf  { name, bins: Bin[] }
  Bin    { id, name, size, available, products: Product[] }
  Product{ id, name, ndc, quantity, unit, source, inventoryType, description }
```

`Door 1–4` = Cabinet 1, `Door 5–8` = Cabinet 2, `Door 9–14` = Virtual (fridges, one pooled bin
each). `product.description` holds the **generic name**, not a description.

### Seed pipeline — order matters

`doorConfigurations.ts` composes, innermost first:

1. `applyInventoryTypes` — spreads products across the four inventory types, keyed on master id.
2. `redistributeProducts` — the import piles almost everything into the Virtual bins; this spreads it.
3. `applyShelfLayouts` — **derives each bin's physical size from how much it holds** (fullest bin gets the largest footprint).
4. `emptySomeProductsForDemo` + `stockOneLocationForDemo` — **demo scaffolding, tagged for deletion.**

Anything that changes quantities must run **after** step 3, or it silently changes the cabinet's
geometry. That is why the demo steps are last.

---

## 2. The two workflows

The header's **Change Allocation** button opens a menu with two jobs. They were one mode until
recently; splitting them is the most significant recent change.

### A. Allocate Product — give a product another bin

`AllocateProductsPanel` (right, 440px) → `handleAssignProductsToBins`.

Search for products (nothing lists until you search), tick them, tap bins on the shelves, confirm.
Each product row shows the bins it already occupies, which is the context for choosing another and
what stops you picking a bin it is already in.

- **A new location opens at `quantity: 0`.** Stock arrives by moving it in — that is the other
  workflow's job. This is intended, and it is why repeatedly allocating during exploration
  accumulates 0-vial rows until you reload.
- A bin already holding the identity is skipped; adding it twice would split one product into two
  rows in one bin and every count in the app would double it.
- Multi-select survives re-searching: the panel holds the **picked product objects**, not their
  keys, so a product picked under one query is not lost when the query changes.
- **No history entry is written.** Known gap — see §7.

### B. Move Quantity — move stock between bins a product already occupies

Two-step bin selection, then a four-screen pipeline:

```
step 1: pick source bins   →  step 2: pick target bins
   ↓  Review Selection
ChangeAllocationModal      — pick products per source bin ("Select")
   ↓  Move Qty
QuantitySelectionPage      — set the amount, product by product
   ↓  Proceed to Target Bin
TargetBinSerialScanPage    — place them, scan serials if the target requires it
   ↓  the actual commit → handleConfirmChangeAllocation
```

Buttons name **what happens next**, deliberately: `Select` / `Remove` on the cards,
`Next Source Bin` → `Save & Continue` → `Proceed to Target Bin` on the quantity page. Nothing says
"Confirm" until it commits.

**All quantities are taken at the source before anything is carried to the target.** The quantity
page walks every product itself and hands the whole move over once. It used to report one product
at a time and the flow walked to the target and back for each — four products meant four round
trips over the same two doors.

### C. Unallocation — not a workflow

There is no way to *start* an unallocation. `handleUnallocateProduct` is only reachable from
`UnallocateConfirmModal`, which only opens from the `zeroQuantityProducts` effect **after a move
empties a bin**. This is deliberate: an allocate/unallocate panel was built and then removed
because having both directions on one screen, gated on a quantity rule, was hard to read.

### D. Unallocated Products tray — a separate, older flow

`UnallocatedProductsPanel` assigns products that have **no** bin at all. Reached by pressing `/`
then the button. Shares the `selectedBinsForAssignment` channel with workflow A.

---

## 3. Concepts you must hold to change anything safely

### Product identity is `name | ndc | inventoryType` — never `product.id`

The same drug in three bins is three rows with three different ids. Anything user-facing — search
grouping, counters, badges, dedup — keys on the identity triple. `binProducts.ts` derives
`getVialType` / `hasClimateBadge` / `hasCivBadge` from a hash of it, so a product looks the same
everywhere it appears. Keying a badge on `product.id` would give one drug different badges per bin.

### Three separate query channels

| Channel | Meaning |
|---|---|
| `searchQuery` | what is typed in the box |
| `selectedSearchQuery` | what is highlighted on the shelves |
| `changeAllocationSourceQuery` | which products a source selection is scoped to |

They are independent on purpose and most historical bugs came from conflating them. Query grammar:
`|`-separated OR-groups, each an `,`-separated AND-set. `appendQueryGroup` / `removeQueryGroup` /
`pruneQueryToBins` maintain them.

### Scoped vs hand-picked source bins

A bin added by searching a product is **scoped** to that product; a bin tapped on the shelf was
chosen for **everything in it**. Both stay in the selection and the modal decides per bin
(`isBinScopedByQuery`). A mixed selection stays mixed. Getting this wrong makes hand-picked bins
silently vanish from the only screen that can commit them.

### Transfers

`ProductTransfer { productId, fromBinId, toBinId, quantity, actionType?, serialNumbers? }`

Staged at `quantity: 0` with `actionType: 'move'`; the real amount is set on the quantity page.
`actionType: 'allocate'` **can no longer be produced** — that was "Allocate only", now workflow A.
App still has an unreachable allocate-only routing branch (§7).

### Bin taps mean different things

`handleBinClick` branches on mode: change-allocation step 1 (source) / step 2 (target),
`showAllocateProducts` (assignment), `showUnallocatedProducts` (assignment), else view. **A new
mode that wants bin taps must add a branch here and its flag to the `useCallback` deps** — a
missing dep silently captures a stale `false`.

While either assignment flow is open, product rows inside bin cards are not tappable: a tap has to
mean the bin. That is what `BinCard`'s `showUnallocatedProducts` prop does — despite its name, it
means "the user is picking bins right now", and both flows feed it.

---

## 4. Edge cases and traps

**These cost real time to rediscover.**

### HMR: delete usages before declarations

Removing a `const` while JSX still references it latches the error boundary and the screen stays
broken until a full reload, even after you fix it. Always remove references first, declaration
last. The same applies in reverse: **adding a `useState` cannot hot-reload** (hook order changes) —
expect a hook-order warning and reload.

### `HTTP 200` from the dev server does not mean the code is correct

Vite transforms with esbuild, which **strips types without checking them**. A module with an
undefined variable, a wrong prop type, or a duplicated component body serves 200 happily. There is
no `tsc` in the project. Verify with greps for dangling references and a browser reload — and be
aware a syntactically valid but semantically broken file will look fine.

### Reading the DOM straight after a click measures the previous render

React state updates are async. `el.click(); el.className` returns the **old** class. Any browser
verification needs a settle (~250–400ms) between acting and reading, or it will report failure for
a change that worked.

### `CardContent` pads its bottom more than its sides

`ui/card.tsx` sets `[&:last-child]:pb-6`, which outranks a plain `p-4` on specificity. Cards using
`p-4` were 16px on three sides and 24px at the bottom until overridden with `!pb-4`.

### Tailwind 4 specifics

- `src/styles/index.css` is live. **`src/app/index.css` is a precompiled Tailwind 4.1.3 dump and is dead** — editing it does nothing.
- Arbitrary values (`w-[440px]`, `bg-[#095192]`) generate on demand via `@source`.
- Leading-`!` important (`!pb-0`) **does** work in v4.1 here (verified in the generated CSS), despite v4 preferring trailing `!`.
- `border-1` is valid and means 1px. `ring-1` + `border-1` together read as 2px.

### Flex children stretch by default

A figure/quantity box in a row without `items-start` grows to the row's full height. Two panels had
tall stretched quantity chips from exactly this.

### State that looks persistent but is not

`doorShelfConfig` is `useState(initializeDoorConfigs(seed))`. Every allocation, move and
unallocation is in-memory only. If inventory looks wrong, **reload before investigating** — you may
be looking at your own earlier clicks. `window.allocateOnlyTransfers` is a genuine global used to
carry transfers across the pipeline.

### Duplicate-file hazard

`src/app/imports/` holds 47 raw Figma exports of which **8 are referenced**. There are also
`useInventoryStateComplete.ts`, `useInventoryState_COMPLETE_FIX.ts`, `useInventoryState_PATCH.js`,
`HistoryModal.tsx`, `HistoryModal_Fixed.tsx`, `DesignSystem.tsx` — **all unimported**. When
searching for a symbol, check you are in the live file. `BinInventoryPanel` is imported and
rendered but `setShowBinInventory(true)` is never called, so it is unreachable.

---

## 5. What the domain does *not* model

Do not assume these exist; four of them look like they should.

| Concept | Reality |
|---|---|
| **Par levels / min thresholds** | Zero occurrences anywhere in `src/app`. |
| **Bin capacity / "bin is full"** | The only `capacity` is `placementCapacityForShelf`, a *seed-time layout* concern. No runtime fullness state, so no capacity conflict can be detected or reported. |
| **Product fits bin** | Inverted: `shelfLayoutConfig.ts` gives the **largest footprint to the fullest bin**. Size is derived from contents, not a constraint on them. Products have no footprint. |
| **Door-type routing** | `isFridgeDoor` only selects a layout. Nothing stops a CLIMATE product being allocated to a room-temperature door. |
| **The one real rule** | `EmergencyKitService`: E-Kit bins accept only `Purchased` inventory. Enforced on the bin tap in the unallocated tray, and at confirm in `handleAssignProductsToBins` (the only point holding both products and bins). |

**Serial numbers are counted, not validated.** `index.html` advertises "requiring serial number
validation for all transfers", and `SerialNumberModal.validateSerialNumbers()` exists — but it
returns `isSelectionComplete`, i.e. "have enough serials been picked". No serial value is ever
checked against anything.

---

## 6. How to work on this

### Verification

The project has **no tests and no test infrastructure** (and `react`/`react-dom` are not even
declared in `package.json`; they resolve from `node_modules` by luck). Verification has been:

1. Fetch the module from the dev server for a parse check — necessary, not sufficient (see §4).
2. `grep` for dangling references after any removal.
3. **Replay the logic in Node** over real or faithful synthetic data. This has been the most
   reliable method by far: transcribe the function, run it over the cases, compare old vs new.
4. Browser checks in batches, not per change — with a settle before reading.

The highest-value assertion, if tests are ever added, is a **conservation invariant**: for every
product identity, quantity across all bins plus unallocated is unchanged by any allocate or move,
and the count of distinct products matches the count with ≥1 location. Most state bugs here have
been violations of it.

### Conventions

- **Branch before starting work**; `main` must stay demo-able. Merges to `main` have been
  fast-forward.
- `.claude/launch.json` and `vite.config.ts` carry local harness tweaks and are **intentionally left
  uncommitted**. Do not stage them.
- Comments explain **why**, especially where a simpler-looking approach was tried and failed. The
  codebase leans heavily on this; match it.
- Buttons are named for what they do next, never "Confirm" unless they commit.
- Shared visual vocabulary: product rows are name → italic generic name → grey badges →
  `ndc - inventoryType`; primary `#095192`, secondary white/`#095192` border, destructive `#C6362C`,
  selected tint `#F1F6FA`, assignment border `#8F48D2`.

---

## 7. Known gaps

**See also [UX-AUDIT.md](UX-AUDIT.md)** — a heuristic audit with numbered, tickable findings. The
structural ones are worth reading before designing anything new here: there is no step indicator on
a four-screen pipeline, a disabled primary button that never says why, and no domain constraints at
all beyond the E-Kit rule.


- **Workflow A writes no history entry.** `handleConfirmAssignment` does, but its shape invents
  opening quantities that do not apply to an existing product gaining a location.
- **Unreachable code in `App.handleChangeAllocationConfirm`**: the allocate-only routing branch and
  the `window.allocateOnlyTransfers` handoff. Nothing can produce an allocate-only transfer now.
  Left alone because unpicking it touches the quantity/serial handoff.
- **Demo scaffolding** in `doorConfigurations.ts` (`emptySomeProductsForDemo`,
  `stockOneLocationForDemo`) exists to make features demonstrable and should go when real data
  arrives. Note the features it was built for — a 0-inventory filter and a per-location release
  control — have since been removed, so its remaining purpose is thin.
- **`BinCard`'s `showUnallocatedProducts` prop is misnamed** for what it does (see §3).
- **Recent Move Quantity card changes have not been visually verified** — the source and target card
  layouts, and the `Select` / `Remove` / `Move` / `Select All` labels, are compile- and
  reference-verified only.
- **Validation of operator intentions is outstanding.** A list of 18 real-world operator goals was
  triaged: 12 are assertable headlessly against the existing handlers, 2 need a headless render, and
  4 have no domain model at all (§5). Nothing has been built.
