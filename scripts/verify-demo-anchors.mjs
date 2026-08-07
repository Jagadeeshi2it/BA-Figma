/**
 * Verifies that every `data-demo` anchor a demo scenario reaches for actually exists in the app.
 *
 *     node scripts/verify-demo-anchors.mjs
 *
 * Demo Mode drives the real UI by selector, which is the whole point of it — a demo that drove
 * state would keep passing while the UI it demonstrates was broken. The cost of that choice is that
 * a renamed or deleted anchor turns into a walkthrough that stalls in front of a viewer with
 * "Could not find what this step needed". This check moves that failure to the terminal.
 *
 * Static, not a dev-server import like its siblings: the scenarios are data, and the anchors are
 * string literals in JSX, so both are readable without running anything.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SCENARIOS_DIR = 'src/app/demo/scenarios';
const APP_DIR = 'src/app';

const walk = dir =>
  readdirSync(dir).flatMap(entry => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const sourceFiles = walk(APP_DIR).filter(
  // The Figma export dump is 47 unreferenced files; an anchor "found" only in there is not an
  // anchor that renders (CLAUDE.md §4, duplicate-file hazard).
  path => /\.tsx?$/.test(path) && !path.includes('/imports/') && !path.startsWith(SCENARIOS_DIR)
);
const appSource = sourceFiles.map(path => readFileSync(path, 'utf8')).join('\n');

const scenarioFiles = walk(SCENARIOS_DIR).filter(path => /\.ts$/.test(path));

// Every string literal inside a `data-demo={…}` expression. Kept deliberately narrow — it reads the
// braces' own contents, not the file at large — so a matching string somewhere else in the component
// cannot vouch for an anchor that is never rendered.
const conditionalAnchors = new Set(
  Array.from(appSource.matchAll(/data-demo=\{([^}]*)\}/g)).flatMap(match =>
    Array.from(match[1].matchAll(/['"`]([^'"`]+)['"`]/g), quoted => quoted[1])
  )
);

/**
 * Anchors built by interpolation — `data-demo={`unallocated-filter-${option.value}`}`, one per row of a
 * list the component maps over. The suffix is not knowable statically, so what is checked is the fixed
 * PREFIX: an anchor beginning `unallocated-filter-` is vouched for by that element.
 *
 * Weaker than the exact match above, and deliberately the last resort. A scenario asking for
 * `unallocated-filter-purple` would pass here and stall at run time — but the alternative is either
 * spelling five identical SelectItems out longhand, or not checking the family at all. The prefix still
 * catches what actually goes wrong: the element being renamed or deleted.
 */
const anchorPrefixes = Array.from(appSource.matchAll(/data-demo=\{`([^`$]*)\$\{/g), match => match[1]).filter(
  prefix => prefix.length > 0
);

let checked = 0;
const failures = [];

for (const path of scenarioFiles) {
  const source = readFileSync(path, 'utf8');
  for (const match of source.matchAll(/\[data-demo="([^"]+)"\]/g)) {
    const id = match[1];
    // The scenario side interpolates too — `[data-demo="unallocated-filter-${value}"]` inside the helper
    // that builds the step. Its call sites pass literals, and those are checked; the template itself is
    // not an anchor to look for.
    if (id.includes('${')) continue;
    checked += 1;
    // Three spellings, because an anchor is not always a literal attribute:
    //   data-demo="x"          the plain case
    //   demoId="x"             passed to a component that renders the attribute (the workflow menu
    //                          entries, the pipeline footer's buttons) — spelled out only at the call site
    //   data-demo={… 'x' …}    conditional, where the element carries the anchor only in some states
    //                          (SourceProductCard tags Select but not the spent Selected)
    const rendered =
      appSource.includes(`data-demo="${id}"`) ||
      appSource.includes(`demoId="${id}"`) ||
      conditionalAnchors.has(id) ||
      //   data-demo={`x-${…}`}  one anchor per row of a mapped list — matched on its fixed prefix
      anchorPrefixes.some(prefix => id.startsWith(prefix));
    if (!rendered) failures.push(`${path}: no element renders data-demo="${id}"`);
  }
}

// A scenario whose selectors all resolve but which reaches for a data attribute the app stopped
// setting fails the same way, so the two attributes the runner depends on are checked by name.
for (const attribute of [
  'data-bin-id',
  'data-bin-available',
  'data-bin-product-count',
  'data-door-free-bins',
  // Fridges are drawn by a different component from the cabinet doors, so a walk looking for cold
  // storage needs this to tell them apart — it must not fall back to the "Fridge N" label.
  'data-door-kind',
  'data-product-quantity'
]) {
  checked += 1;
  if (!appSource.includes(attribute)) failures.push(`no element renders ${attribute}`);
}

if (failures.length > 0) {
  console.error(`✗ ${failures.length} of ${checked} demo anchors missing:\n`);
  failures.forEach(failure => console.error(`  ${failure}`));
  process.exit(1);
}

console.log(`✓ all ${checked} demo anchors resolve (${scenarioFiles.length} scenario file(s))`);
