import { describe, expect, it } from "vitest";
import i18n from "@/i18n";
import { formatCompatibilityFact } from "@/pages/build/compatibility-facts";

describe("formatCompatibilityFact", () => {
  it("names the CPU memory limits that were compared", async () => {
    expect(
      formatCompatibilityFact({
        aspect: "DdrGeneration",
        limit: "Ddr5",
        actual: "Ddr4",
      }),
    ).toBe("Memory is DDR4. Required generation is DDR5.");
    expect(
      formatCompatibilityFact({
        aspect: "ModuleCount",
        limit: "1,2",
        actual: "4",
      }),
    ).toBe("4 modules. The limit is 1, 2.");
    expect(
      formatCompatibilityFact({
        aspect: "RamRank",
        limit: "DualRank",
        actual: "SingleRank",
      }),
    ).toBe("Rank is Single rank. Required rank is Dual rank.");
    expect(
      formatCompatibilityFact({
        aspect: "CpuRamConfig",
        limit: "Ddr5|2|DualRank;Ddr5|1|SingleRank",
        actual: "Ddr5|2|SingleRank",
      }),
    ).toBe(
      "Kit is DDR5 × 2, Single rank. CPU supports DDR5 × 2, Dual rank; DDR5 × 1, Single rank.",
    );
    expect(
      formatCompatibilityFact({
        aspect: "CpuRamConfig",
        limit: null,
        actual: "Ddr5|2|DualRank",
      }),
    ).toBe(
      "Kit is DDR5 × 2, Dual rank. The CPU lists no supported memory configurations.",
    );

    await i18n.changeLanguage("zh-HK");
    expect(
      formatCompatibilityFact({
        aspect: "CpuRamConfig",
        limit: "Ddr5|2|DualRank",
        actual: "Ddr5|2|SingleRank",
      }),
    ).toBe("套裝是 DDR5 × 2、單面。CPU 支援 DDR5 × 2、雙面。");
  });

  it("renders M.2 slot counts and SATA support as labeled comparisons", async () => {
    expect(
      formatCompatibilityFact({
        aspect: "M2Slot",
        limit: "M|M22280,M222110|2|Nvme",
        actual: "M|M22280|Nvme",
      }),
    ).toBe(
      "M.2 demand is M key, M.2 2280, NVMe. Slots: 2 × M key (M.2 2280, M.2 22110), NVMe.",
    );
    expect(
      formatCompatibilityFact({
        aspect: "M2Slot",
        limit: "M|M22280|1|Nvme",
        actual: "BM|M22280|Sata",
      }),
    ).toBe(
      "M.2 demand is B+M key, M.2 2280, SATA. Slots: 1 × M key (M.2 2280), NVMe.",
    );

    await i18n.changeLanguage("zh-HK");
    expect(
      formatCompatibilityFact({
        aspect: "M2Slot",
        limit: "M|M22280|1|Nvme",
        actual: "BM|M22280|Sata",
      }),
    ).toBe(
      "M.2 需求是 B+M 鍵、M.2 2280、SATA。插槽：1 × M 鍵（M.2 2280）、NVMe。",
    );
  });
});
