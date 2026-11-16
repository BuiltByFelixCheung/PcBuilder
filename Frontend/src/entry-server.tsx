import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import App from "@/App.tsx";
import { AppProviders } from "@/app-providers.tsx";
import "@/i18n.ts";
import { prerenderPaths } from "@/prerender-paths.ts";

export { prerenderPaths };

export function render(url: string) {
  return renderToString(
    <StrictMode>
      <MemoryRouter initialEntries={[url]}>
        <AppProviders>
          <App />
        </AppProviders>
      </MemoryRouter>
    </StrictMode>,
  );
}
