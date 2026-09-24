import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();

vi.mock("@/api/client.ts", () => ({
  api: {
    post: (...args: unknown[]) => post(...args),
  },
}));

import { importCpus } from "@/api/catalog/import-excel.ts";
import { importSockets } from "@/api/master-data.ts";

describe("excel import", () => {
  beforeEach(() => {
    post.mockReset().mockResolvedValue({ data: [] });
  });

  it("posts the workbook as multipart form data", async () => {
    const file = new File(["sheet"], "parts.xlsx");

    await importCpus(file);
    await importSockets(file);

    const [cpuPath, cpuBody] = post.mock.calls[0];
    const [socketPath, socketBody] = post.mock.calls[1];
    expect(cpuPath).toBe("/catalog/cpu/import");
    expect(socketPath).toBe("/master-data/socket/import");
    expect(cpuBody).toBeInstanceOf(FormData);
    expect(socketBody).toBeInstanceOf(FormData);
    expect((cpuBody as FormData).get("file")).toBe(file);
    expect((socketBody as FormData).get("file")).toBe(file);
  });
});