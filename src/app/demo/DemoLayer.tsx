import React from 'react';
import { createPortal } from 'react-dom';
import { useDemo } from './DemoContext';
import DemoCursor from './DemoCursor';
import DemoControlPanel from './DemoControlPanel';
import DemoPalette from './DemoPalette';

/**
 * Everything Demo Mode draws, portalled to `document.body`.
 *
 * The portal is what keeps it above the tablet simulator, whose frame is a `fixed inset-0
 * z-[9999]` element — rendered as a child of App it would land inside that frame and be scaled
 * along with the app, which is right for a Radix popover and wrong for a cursor.
 */
export default function DemoLayer() {
  const { status } = useDemo();
  if (typeof document === 'undefined') return null;

  const walking = status === 'running' || status === 'paused';

  return createPortal(
    <>
      {/* The input shield. A single stray click from the viewer — ticking a product the script is
          about to tick, closing the panel it is about to type into — desynchronises the whole walk,
          and the failure looks like a broken app rather than a race. Synthetic events are
          dispatched straight onto their target and are not hit-tested, so the shield does not block
          the demo's own clicks; the control panel sits above it, so its controls stay live.

          Not shown once the walk is finished: at that point the app is the point. */}
      {walking && (
        <div
          className="fixed inset-0 z-[10030]"
          style={{ cursor: 'none' }}
          onClickCapture={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
          aria-hidden="true"
        />
      )}
      <DemoCursor />
      <DemoControlPanel />
      <DemoPalette />
    </>,
    document.body
  );
}
