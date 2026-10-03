import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

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

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});
