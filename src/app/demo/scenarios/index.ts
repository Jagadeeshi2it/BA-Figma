import { DemoScenario } from '../types';
import { allocateUnallocatedProduct } from './allocateUnallocatedProduct';
import { allocateMultipleToOneBin } from './allocateMultipleToOneBin';

/**
 * The palette's contents. Adding a walkthrough is adding a file and a line here — nothing in the
 * runner, the cursor or the palette knows what any scenario does.
 *
 * Order is the order they are listed, so put the one a newcomer should watch first at the top.
 */
// Single product first: it is the shorter walk and the one that establishes the tray, which the batch
// scenario then assumes you have seen.
export const demoScenarios: DemoScenario[] = [allocateUnallocatedProduct, allocateMultipleToOneBin];

export const findScenario = (id: string | null | undefined) =>
  (id ? demoScenarios.find(scenario => scenario.id === id) : undefined) ?? null;
