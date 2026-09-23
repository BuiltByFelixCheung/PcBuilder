const AUTH_PATHS = new Set(["/login", "/register"]);

export function getPostLoginPath(state: unknown): string {
  if (
    state !== null &&
    typeof state === "object" &&
    "from" in state &&
    state.from !== null &&
    typeof state.from === "object" &&
    "pathname" in state.from &&
    typeof state.from.pathname === "string"
  ) {
    const pathname = state.from.pathname;
    if (
      pathname.startsWith("/") &&
      !pathname.startsWith("//") &&
      !AUTH_PATHS.has(pathname)
    ) {
      return pathname;
    }
  }

  return "/account";
}
