import { describe, expect, it, vi } from "vitest";
import { closeMasterDataEditor } from "@/lib/master-data-edit.ts";
import { uniqueById } from "@/lib/unique-by-id.ts";
import { selectedVisibleIds } from "@/hooks/use-bulk-delete.ts";

describe("closeMasterDataEditor", () => {
  it("drops the edit param and replaces the history entry", () => {
    const searchParams = new URLSearchParams("edit=abc&name=AMD");
    const setSearchParams = vi.fn();

    closeMasterDataEditor(searchParams, setSearchParams);

    const [next, options] = setSearchParams.mock.calls[0];
    expect(next.get("edit")).toBeNull();
    expect(next.get("name")).toBe("AMD");
    expect(options).toEqual({ replace: true });
    expect(searchParams.get("edit")).toBe("abc");
  });
});

describe("uniqueById", () => {
  it("keeps the first item for each id", () => {
    expect(
      uniqueById([
        { id: "amd", name: "AMD" },
        { id: "amd", name: "AMD again" },
        { id: "intel", name: "Intel" },
      ]),
    ).toEqual([
      { id: "amd", name: "AMD" },
      { id: "intel", name: "Intel" },
    ]);
  });
});

describe("selectedVisibleIds", () => {
  it("keeps selected ids that are still on screen", () => {
    expect(
      selectedVisibleIds(
        { am5: true, lga1851: true, hidden: true },
        [{ id: "am5" }, { id: "lga1851" }],
      ),
    ).toEqual(["am5", "lga1851"]);
  });
});
