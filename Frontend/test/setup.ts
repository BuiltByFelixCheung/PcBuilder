import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import i18n from "../src/i18n.ts";

await i18n.changeLanguage("en");

class ResizeObserverStub {
  observe() {
    // jsdom has no ResizeObserver; tests only need the interface.
  }
  unobserve() {
    // jsdom has no ResizeObserver; tests only need the interface.
  }
  disconnect() {
    // jsdom has no ResizeObserver; tests only need the interface.
  }
}

globalThis.ResizeObserver = ResizeObserverStub;

if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = () => false;
}
if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = () => {};
}
if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = () => {};
}
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(async () => {
  cleanup();
  sessionStorage.clear();
  localStorage.removeItem("i18nextLng");
  await i18n.changeLanguage("en");
});
