import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import DesignSystemApp from './DesignSystemApp';

function AppSwitcher() {
  const [currentApp, setCurrentApp] = useState<'main' | 'design-system'>('main');

  if (currentApp === 'design-system') {
    return <DesignSystemApp />;
  }

  return <App />;
}

// For production use, you would just import and use either App or DesignSystemApp directly
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<AppSwitcher />);
}

export default AppSwitcher;