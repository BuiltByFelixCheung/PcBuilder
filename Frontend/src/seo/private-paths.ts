import { matchPath } from "react-router-dom";

const privatePatterns = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/account",
  "/change-password",
  "/builds/me",
  "/builds/current",
  "/builds/:buildId/edit",
  "/catalog/:section/new",
  "/master-data/*",
];

export function isNoIndexPath(pathname: string): boolean {
  return privatePatterns.some(
    (pattern) => matchPath({ path: pattern, end: true }, pathname) !== null,
  );
}
