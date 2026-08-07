import { DemoScenario } from '../types';
import { allocateProduct } from './allocateProduct';
import { multiBinAssignment } from './multiBinAssignment';
import { moveFromBin } from './moveFromBin';
import { moveFromProduct } from './moveFromProduct';

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
/**
 * The four are listed in the order the workflow menu lists them, which is also the order a newcomer
 * should watch: get stock into a bin at all, give it a second one, then the two doors into a move.
 */
export const demoScenarios: DemoScenario[] = [
  allocateProduct,
  multiBinAssignment,
  moveFromBin,
  moveFromProduct
];

export const findScenario = (id: string | null | undefined) =>
  (id ? demoScenarios.find(scenario => scenario.id === id) : undefined) ?? null;
