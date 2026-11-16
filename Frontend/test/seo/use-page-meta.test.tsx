import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { usePageMeta } from "@/seo/page-meta";
import { isNoIndexPath } from "@/seo/private-paths";

function ProductPage() {
  const { pathname } = useLocation();
  usePageMeta({
    title: "Ryzen 7 7800X3D | PC Builder",
    description: "Ryzen 7 7800X3D by AMD. CPUs.",
    canonicalPath: pathname,
    robots: "index,follow",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Ryzen 7 7800X3D",
    },
  });
  return null;
}

describe("usePageMeta", () => {
  it("sets the title, description, canonical path, robots, and product JSON-LD", async () => {
    render(
      <MemoryRouter initialEntries={["/catalog/cpus/cpu-1?socket=am5"]}>
        <ProductPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(document.title).toBe("Ryzen 7 7800X3D | PC Builder");
    });
    expect(
      document.head.querySelector('meta[name="description"]'),
    ).toHaveAttribute("content", "Ryzen 7 7800X3D by AMD. CPUs.");
    expect(
      document.head.querySelector('link[rel="canonical"]'),
    ).toHaveAttribute("href", `${window.location.origin}/catalog/cpus/cpu-1`);
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "index,follow",
    );
    expect(document.getElementById("page-jsonld")?.textContent).toContain(
      '"@type":"Product"',
    );
    expect(document.getElementById("page-jsonld")?.textContent).toContain(
      "Ryzen 7 7800X3D",
    );
  });
});

describe("isNoIndexPath", () => {
  it("hides account, editor, and master-data URLs and leaves catalog URLs indexable", () => {
    expect(isNoIndexPath("/account")).toBe(true);
    expect(isNoIndexPath("/builds/current")).toBe(true);
    expect(isNoIndexPath("/builds/abc/edit")).toBe(true);
    expect(isNoIndexPath("/catalog/cpus/new")).toBe(true);
    expect(isNoIndexPath("/master-data/sockets")).toBe(true);
    expect(isNoIndexPath("/catalog/cpus")).toBe(false);
    expect(isNoIndexPath("/builds/abc")).toBe(false);
  });
});
