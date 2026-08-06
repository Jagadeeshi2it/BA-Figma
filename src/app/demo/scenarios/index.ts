import { DemoScenario } from '../types';
import { allocateUnallocatedProduct } from './allocateUnallocatedProduct';

/**
 * The palette's contents. Adding a walkthrough is adding a file and a line here — nothing in the
 * runner, the cursor or the palette knows what any scenario does.
 *
 * Order is the order they are listed, so put the one a newcomer should watch first at the top.
 */
export const demoScenarios: DemoScenario[] = [allocateUnallocatedProduct];

export const findScenario = (id: string | null | undefined) =>
  (id ? demoScenarios.find(scenario => scenario.id === id) : undefined) ?? null;
