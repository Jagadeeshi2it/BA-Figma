import React, { createContext, useCallback, useContext, useState } from 'react';

// Visibility state for the "Cabinet — Live Physical View" PIP (see CabinetPipView).
// It's a demo aid, so it stays OFF by default and is toggled from the Resource item in the
// sidebar. The toggle lives in the sidebar's component tree while the PIP renders inside the
// change-allocation flow pages, so this shared context bridges the two.

interface PipContextValue {
  pipEnabled: boolean;
  togglePip: () => void;
}

const PipContext = createContext<PipContextValue>({
  pipEnabled: false,
  togglePip: () => {},
});

export function usePip() {
  return useContext(PipContext);
}

export function PipProvider({ children }: { children: React.ReactNode }) {
  const [pipEnabled, setPipEnabled] = useState(false);
  const togglePip = useCallback(() => setPipEnabled(prev => !prev), []);
  return (
    <PipContext.Provider value={{ pipEnabled, togglePip }}>
      {children}
    </PipContext.Provider>
  );
}
