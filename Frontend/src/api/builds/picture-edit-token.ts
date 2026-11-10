export const BUILD_PICTURE_EDIT_TOKEN_STORAGE_KEY =
  "pcbuilder.build-picture-tokens";

export const BUILD_PICTURE_EDIT_TOKEN_HEADER = "X-PcBuild-Picture-Token";

type TokenMap = Record<string, string>;

export function rememberBuildPictureEditToken(
  buildId: string,
  token: string | null | undefined,
): void {
  if (!token) {
    return;
  }
  const tokens = readTokens();
  tokens[buildId] = token;
  writeTokens(tokens);
}

export function buildPictureEditToken(buildId: string): string | undefined {
  const token = readTokens()[buildId];
  return token || undefined;
}

export function hasBuildPictureEditToken(
  buildId: string | undefined,
): boolean {
  return Boolean(buildId && buildPictureEditToken(buildId));
}

export function forgetBuildPictureEditTokens(): void {
  try {
    localStorage.removeItem(BUILD_PICTURE_EDIT_TOKEN_STORAGE_KEY);
  } catch {
    /* localStorage can throw in private mode */
  }
}

function readTokens(): TokenMap {
  try {
    const raw = localStorage.getItem(BUILD_PICTURE_EDIT_TOKEN_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] =>
          typeof entry[1] === "string" && entry[1].length > 0,
      ),
    );
  } catch {
    return {};
  }
}

function writeTokens(tokens: TokenMap): void {
  try {
    localStorage.setItem(
      BUILD_PICTURE_EDIT_TOKEN_STORAGE_KEY,
      JSON.stringify(tokens),
    );
  } catch {
    /* localStorage can throw in private mode */
  }
}
