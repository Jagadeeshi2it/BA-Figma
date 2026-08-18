/**
 * Recaptures the two step-④ screenshots in `Developer Handoff/screenshots/move-from-bin/`.
 *
 *     pnpm run dev
 *     node --experimental-websocket scripts/capture-handoff-step4.mjs
 *
 * Drives a SEPARATE headless Chrome over CDP rather than the browser the prototype is being demoed in:
 * all state is in memory, so a reload costs whatever the operator had on screen ([[park-state]] in the
 * session notes). There is no puppeteer in the repo and there does not need to be — Node 20 exposes
 * `WebSocket` under a flag, so this is dependency-free.
 *
 * Two things it must do that a naive script gets wrong:
 *   - **Click by dispatching pointer events**, not `el.click()`. Radix opens on `pointerdown`, and the
 *     workflow menu is a Radix popover.
 *   - **Poll for every wait.** React state updates are async and a fixed delay either flakes or wastes
 *     time; each step waits for the thing it needs to appear.
 *
 * The walk is the one `demo/scenarios/moveFromBin.ts` performs, resolved from the same `data-demo`
 * anchors, so a rename fails here for the same reason it fails there.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ORIGIN = process.env.DEV_ORIGIN ?? 'http://localhost:5173';
const PORT = 9333;
const OUT = 'Developer Handoff/screenshots/move-from-bin';
// The existing screenshots are 3024x1816: this viewport at deviceScaleFactor 2. Kept identical so the
// new ones drop into the docs at the same size rather than reflowing every figure around them.
const WIDTH = 1512;
const HEIGHT = 908;

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = mkdtempSync(join(tmpdir(), 'handoff-capture-'));

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  `--window-size=${WIDTH},${HEIGHT}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  'about:blank'
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

const endpoint = async () => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find(t => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome never exposed a page target');
};

const ws = new WebSocket(await endpoint());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let nextId = 1;
const pending = new Map();
ws.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(new Error(message.error.message)) : resolve(message.result);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

const evaluate = async expression => {
  const { result, exceptionDetails } = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? 'evaluate failed');
  return result.value;
};

/** A real press: Radix listens for pointerdown, so `.click()` alone opens nothing. */
const CLICK = `
  (el) => {
    if (!el) return false;
    const opts = { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true, button: 0 };
    el.dispatchEvent(new PointerEvent('pointerdown', opts));
    el.dispatchEvent(new MouseEvent('mousedown', opts));
    el.dispatchEvent(new PointerEvent('pointerup', opts));
    el.dispatchEvent(new MouseEvent('mouseup', opts));
    el.dispatchEvent(new MouseEvent('click', opts));
    return true;
  }
`;

/** Poll, never a fixed delay — see the header. `resolver` is JS returning an element or null. */
const clickWhenReady = async (label, resolver, settle = 700) => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const clicked = await evaluate(`(${CLICK})((() => ${resolver})())`);
    if (clicked) {
      await sleep(settle);
      return;
    }
    await sleep(200);
  }
  throw new Error(`never found: ${label}`);
};

const waitFor = async (label, resolver) => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await evaluate(`!!((() => ${resolver})())`)) return;
    await sleep(200);
  }
  throw new Error(`never appeared: ${label}`);
};

const shoot = async name => {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(join(OUT, name), Buffer.from(data, 'base64'));
  console.log(`  ✓ ${name}`);
};

// --- The walk ---------------------------------------------------------------------------------------
const q = selector => `document.querySelector('${selector}')`;
// The same resolvers the demo scenario uses: a stocked bin with more than one product (so Review has a
// choice to make) and a free bin on the same door (so no door change is needed mid-move).
const STOCKED_BIN = `Array.from(document.querySelectorAll('[data-bin-id][data-bin-available="false"]')).find(b => Number(b.getAttribute('data-bin-product-count') ?? 0) >= 2)`;
const FREE_BIN = `document.querySelector('[data-bin-id][data-bin-available="true"]')`;
const DOOR_WITH_ROOM = `Array.from(document.querySelectorAll('[data-demo="door"]')).find(d => Number(d.getAttribute('data-door-free-bins') ?? 0) >= 1)`;

try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH, height: HEIGHT, deviceScaleFactor: 2, mobile: false
  });
  await send('Page.navigate', { url: ORIGIN });
  await waitFor('the cabinet', q('[data-demo="workflow-trigger"]'));
  await sleep(1200);

  console.log('walking to step 4');
  await clickWhenReady('Allocate/Move', q('[data-demo="workflow-trigger"]'));
  await clickWhenReady('Move from Bin', q('[data-demo="workflow-move-from-bin"]'), 900);
  await waitFor('the pipeline footer', q('[data-demo="pipeline-primary"]'));
  await clickWhenReady('a door with room', DOOR_WITH_ROOM);
  await clickWhenReady('a stocked bin as Move From', STOCKED_BIN, 900);
  await clickWhenReady('primary → step 2', q('[data-demo="pipeline-primary"]'), 900);
  await clickWhenReady('a free bin as Move To', FREE_BIN, 900);
  await clickWhenReady('primary → Review', q('[data-demo="pipeline-primary"]'), 1200);
  await waitFor('Review', q('[data-demo="review-select-product"]'));
  await clickWhenReady('select the first product', q('[data-demo="review-select-product"]'), 900);
  await clickWhenReady('Start Qty Move', q('[data-demo="pipeline-primary"]'), 1600);

  await waitFor('the take half', q('[data-demo="step4-quantity"]'));
  // Long enough for the door-unlocked toast to expire (4s). It lands top-right, over the header, and a
  // screenshot with a transient in it reads as part of the design in a handoff doc.
  await sleep(5000);
  await shoot('06-step4-take-quantity.png');

  await clickWhenReady('Proceed to Move To', q('[data-demo="pipeline-primary"]'), 1800);
  await waitFor('the place half', q('[data-demo="step4-placement"]'));
  await sleep(5000);
  await shoot('07-step4-place.png');

  console.log('\ndone');
} finally {
  ws.close();
  chrome.kill();
}
