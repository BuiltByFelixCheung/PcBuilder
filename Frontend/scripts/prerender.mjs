import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const templatePath = path.join(dist, "index.html");
const marker = '<div id="root"></div>';
const template = fs.readFileSync(templatePath, "utf8");

if (!template.includes(marker)) {
  throw new Error('dist/index.html is missing <div id="root"></div>');
}

fs.writeFileSync(path.join(dist, "__spa-fallback.html"), template);

const serverEntry = pathToFileURL(path.join(root, ".ssr", "entry-server.js"));
const { render, prerenderPaths } = await import(serverEntry.href);

for (const route of prerenderPaths) {
  const appHtml = render(route);
  if (typeof appHtml !== "string" || !appHtml.includes("app-header")) {
    throw new Error(`Prerender of ${route} did not include the app header`);
  }

  const page = template
    .replace('<html lang="en">', '<html lang="zh-HK">')
    .replace(marker, () => `<div id="root">${appHtml}</div>`);
  const file =
    route === "/"
      ? templatePath
      : path.join(dist, route.slice(1), "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, page);
  console.log(`prerendered ${route}`);
}

const home = fs.readFileSync(templatePath, "utf8");
if (!home.includes("<h1>PC Builder</h1>")) {
  throw new Error("Home HTML is missing its heading");
}
if (!home.includes('<html lang="zh-HK">')) {
  throw new Error('Home HTML is missing lang="zh-HK"');
}

const cpus = fs.readFileSync(
  path.join(dist, "catalog", "cpus", "index.html"),
  "utf8",
);
if (!cpus.includes("處理器")) {
  throw new Error("CPU catalog HTML is missing its heading");
}

const login = fs.readFileSync(path.join(dist, "login", "index.html"), "utf8");
if (!login.includes(">登入<") || !login.includes('<html lang="zh-HK">')) {
  throw new Error("Login HTML is missing its form");
}

const fallback = fs.readFileSync(
  path.join(dist, "__spa-fallback.html"),
  "utf8",
);
if (!fallback.includes(marker) || fallback.includes("<h1>PC Builder</h1>")) {
  throw new Error("SPA fallback must stay an empty shell");
}
