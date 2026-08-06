/**
 * The DOM half of Demo Mode: finding a target, and interacting with it the way a person does.
 *
 * Everything here is deliberately low-level and app-agnostic. The reason the demo dispatches real
 * events instead of calling the app's handlers is that a demo which drives state is a second
 * implementation of the workflow — it keeps running happily while the UI it claims to demonstrate
 * is broken, and the two drift apart without anyone noticing. Real events mean the demo fails
 * loudly when the flow changes, which is the only way it stays trustworthy as documentation.
 */
import { DemoRunToken, DemoTarget } from './types';

export const cancelled = (token: DemoRunToken) => token.cancelled;

/**
 * A sleep that gives up the moment the run is cancelled, rather than after its full duration.
 *
 * setTimeout, not requestAnimationFrame. rAF does not fire at all in a backgrounded tab, so a
 * rAF-based sleep does not merely slow down there — it never resolves, and the walk stops dead
 * partway through a step with no error and no way to tell a frozen demo from a broken app. Timers
 * are throttled in the background but they do run.
 */
export function sleep(ms: number, token: DemoRunToken): Promise<void> {
  return new Promise(resolve => {
    if (ms <= 0 || token.cancelled) {
      resolve();
      return;
    }
    const started = Date.now();
    // Woken periodically rather than once at the end, so cancelling during a three-second closing
    // beat takes effect immediately instead of after it.
    const tick = () => {
      if (token.cancelled || Date.now() - started >= ms) {
        resolve();
        return;
      }
      window.setTimeout(tick, Math.min(60, ms));
    };
    window.setTimeout(tick, Math.min(60, ms));
  });
}

export function resolveTarget(target: DemoTarget): HTMLElement | null {
  const el = typeof target === 'string' ? document.querySelector(target) : target();
  return el instanceof HTMLElement ? el : null;
}

/**
 * Poll until the target exists and has a box.
 *
 * Polling rather than a fixed delay because React state updates are async (CLAUDE.md §4) and a
 * fixed delay is a demo that is fine on this machine and flaky on a slower one. The zero-size check
 * matters as much as the existence one: a panel mid-transition is in the DOM before it can be
 * clicked at a sensible coordinate.
 */
export async function waitForTarget(
  target: DemoTarget,
  token: DemoRunToken,
  timeoutMs = 8000
): Promise<HTMLElement | null> {
  const started = performance.now();
  for (;;) {
    if (token.cancelled) return null;
    const el = resolveTarget(target);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return el;
    }
    if (performance.now() - started > timeoutMs) return null;
    await sleep(60, token);
  }
}

export function centreOf(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/**
 * Bring the target into view and wait for the scroll to settle.
 *
 * `scrollIntoView` is fire-and-forget with `behavior: 'smooth'`, so the coordinates are wrong for
 * a few hundred milliseconds afterwards — long enough to click empty space where the element used
 * to be. Rather than guess a duration, watch the rect until it stops moving.
 */
export async function scrollTargetIntoView(el: HTMLElement, token: DemoRunToken) {
  el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  let previousTop = Number.NaN;
  let stillFor = 0;
  while (stillFor < 3) {
    if (token.cancelled) return;
    await sleep(50, token);
    const top = el.getBoundingClientRect().top;
    stillFor = Math.abs(top - previousTop) < 0.5 ? stillFor + 1 : 0;
    previousTop = top;
  }
}

const pointerInit = (x: number, y: number, buttons: number): PointerEventInit => ({
  bubbles: true,
  cancelable: true,
  composed: true,
  view: window,
  clientX: x,
  clientY: y,
  button: 0,
  buttons,
  pointerId: 1,
  pointerType: 'mouse',
  isPrimary: true,
});

/**
 * A full pointer/mouse sequence, not `el.click()`.
 *
 * Radix opens its Popover on `pointerdown`, so a bare `click()` leaves the Allocate/Move menu shut
 * and the whole scenario stalls on a target that never appears. Dispatching the sequence a real
 * mouse produces means anything listening for any part of it behaves as it would for a person.
 *
 * The coordinates are the element's own centre, which also keeps the tablet simulator's touch dot
 * in step: it tracks pointer events on the frame, and these bubble to it like any others.
 */
export function dispatchRealClick(el: HTMLElement, x: number, y: number) {
  el.dispatchEvent(new PointerEvent('pointerover', pointerInit(x, y, 0)));
  el.dispatchEvent(new MouseEvent('mouseover', pointerInit(x, y, 0) as MouseEventInit));
  el.dispatchEvent(new PointerEvent('pointermove', pointerInit(x, y, 0)));
  el.dispatchEvent(new MouseEvent('mousemove', pointerInit(x, y, 0) as MouseEventInit));
  el.dispatchEvent(new PointerEvent('pointerdown', pointerInit(x, y, 1)));
  el.dispatchEvent(new MouseEvent('mousedown', pointerInit(x, y, 1) as MouseEventInit));
  // Focus before the up/click pair, as a real press does — the search box has to be focused for
  // the typing steps that follow, and some controls only reveal themselves on focus.
  if (typeof el.focus === 'function') el.focus({ preventScroll: true });
  el.dispatchEvent(new PointerEvent('pointerup', pointerInit(x, y, 0)));
  el.dispatchEvent(new MouseEvent('mouseup', pointerInit(x, y, 0) as MouseEventInit));
  el.dispatchEvent(new MouseEvent('click', pointerInit(x, y, 0) as MouseEventInit));
}

/**
 * Set a React-controlled input's value so React notices.
 *
 * Assigning `input.value` directly is invisible to React: its onChange rides on a native `input`
 * event, and React's own value tracker suppresses the event when it believes the value is
 * unchanged. Going through the prototype's setter updates the tracker too, which is what makes the
 * dispatched event get through.
 */
export function setInputValue(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = input instanceof HTMLTextAreaElement
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Type character by character, so the results list is seen narrowing rather than jumping. */
export async function typeInto(
  input: HTMLInputElement | HTMLTextAreaElement,
  text: string,
  token: DemoRunToken,
  perCharMs = 55
) {
  setInputValue(input, '');
  for (let i = 0; i < text.length; i++) {
    if (token.cancelled) return;
    setInputValue(input, text.slice(0, i + 1));
    await sleep(perCharMs, token);
  }
}
