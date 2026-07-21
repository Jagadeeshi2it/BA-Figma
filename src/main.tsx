
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { TabletSimulatorProvider } from "./app/context/TabletSimulatorContext.tsx";
  import { PipProvider } from "./app/context/PipContext.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <TabletSimulatorProvider>
      <PipProvider>
        <App />
      </PipProvider>
    </TabletSimulatorProvider>
  );
  