
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { TabletSimulatorProvider } from "./app/context/TabletSimulatorContext.tsx";
  import { PipProvider } from "./app/context/PipContext.tsx";
  import { DemoProvider } from "./app/demo/DemoContext.tsx";
  import DemoLayer from "./app/demo/DemoLayer.tsx";
  import { installFlagConsoleApi } from "./app/featureFlags.ts";
  import "./styles/index.css";

  // Puts `window.flags` in the console. Before the render, so a flag can be flipped from a bookmarklet or
  // an early script and the first paint already honours it.
  installFlagConsoleApi();

  // DemoProvider wraps App but App never consumes it, and <App /> is created here exactly once —
  // so React skips re-rendering the whole app every time the demo advances a step. DemoLayer
  // portals to document.body, which is what puts the cursor above the tablet simulator's frame
  // rather than inside it.
  createRoot(document.getElementById("root")!).render(
    <TabletSimulatorProvider>
      <PipProvider>
        <DemoProvider>
          <App />
          <DemoLayer />
        </DemoProvider>
      </PipProvider>
    </TabletSimulatorProvider>
  );

