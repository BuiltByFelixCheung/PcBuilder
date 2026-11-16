import { useEffect } from "react";

const JSON_LD_ID = "page-jsonld";

export type PageRobots = "index,follow" | "noindex,nofollow";

export type PageMeta = {
  title: string;
  description: string;
  canonicalPath: string;
  robots: PageRobots;
  jsonLd?: unknown;
};

export function absoluteUrl(path: string): string {
  return `${window.location.origin}${path}`;
}

export function applyPageMeta(meta: PageMeta) {
  document.title = meta.title;
  upsertNameMeta("description", meta.description);
  upsertNameMeta("robots", meta.robots);
  upsertCanonical(absoluteUrl(meta.canonicalPath));
  if (meta.jsonLd == null) {
    document.getElementById(JSON_LD_ID)?.remove();
    return;
  }

  let script = document.getElementById(JSON_LD_ID);
  if (!script) {
    script = document.createElement("script");
    script.id = JSON_LD_ID;
    script.setAttribute("type", "application/ld+json");
    document.head.append(script);
  }
  script.textContent = JSON.stringify(meta.jsonLd);
}

export function usePageMeta(meta: PageMeta) {
  const jsonLdKey = JSON.stringify(meta.jsonLd ?? null);

  useEffect(() => {
    applyPageMeta({
      title: meta.title,
      description: meta.description,
      canonicalPath: meta.canonicalPath,
      robots: meta.robots,
      jsonLd: jsonLdKey === "null" ? undefined : JSON.parse(jsonLdKey),
    });
  }, [
    meta.title,
    meta.description,
    meta.robots,
    meta.canonicalPath,
    jsonLdKey,
  ]);
}

function upsertNameMeta(name: string, content: string) {
  let element = document.head.querySelector(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.append(element);
  }
  element.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.append(element);
  }
  element.setAttribute("href", href);
}
