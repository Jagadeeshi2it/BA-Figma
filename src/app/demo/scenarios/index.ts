import { DemoScenario } from '../types';
import { allocateProduct } from './allocateProduct';

/**
 * The palette's contents. Adding a walkthrough is adding a file and a line here — nothing in the
 * runner, the cursor or the palette knows what any scenario does.
 *
 * Order is the order they are listed, so put the one a newcomer should watch first at the top.
 *
 * There was briefly one scenario per allocation pattern. They were merged: split up, each opened the
 * tray, did one thing and shut it, which is not how a cabinet gets set up — and four separate walks
 * cannot show the tray shortening and the free bins running out as the work proceeds.
 */
export const demoScenarios: DemoScenario[] = [allocateProduct];

export const findScenario = (id: string | null | undefined) =>
  (id ? demoScenarios.find(scenario => scenario.id === id) : undefined) ?? null;
