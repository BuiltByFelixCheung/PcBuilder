import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "./app-providers.tsx";
import "./i18n.ts";
import "./index.css";
import App from "./App.tsx";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element is missing");
}

const tree = (
  <StrictMode>
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>
);

// Prerendered documents already contain the first paint. Other URLs use the empty shell.
if (container.childNodes.length > 0) {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}
