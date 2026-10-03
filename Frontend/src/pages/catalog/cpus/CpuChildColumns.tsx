import type { CpuRamCompat, CpuSupportChipset } from "@/api/catalog/cpus";
import { DDR_GENERATIONS, RAM_RANKS } from "@/api/enums";
import type { ChildCollectionColumn } from "@/components/catalog/ChildCollectionDialog";
import {
  idSelectField,
  type CatalogField,
} from "@/components/catalog/CatalogFields";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type NamedRamRow = CpuRamCompat & { id: string; name: string };
type NamedChipsetRow = CpuSupportChipset & { id: string; name: string };

const ddrField = idSelectField<NamedRamRow>(
  "DDR generation",
  "ddrGeneration",
  DDR_GENERATIONS.map((generation) => ({
    id: generation,
    name: generation.replace("Ddr", "DDR"),
  })),
);

const rankField = idSelectField<NamedRamRow>(
  "RAM rank",
  "ramRank",
  RAM_RANKS.map((rank) => ({
    id: rank,
    name: rank === "DualRank" ? "Dual" : "Single",
  })),
);

function chipsetField(
  chipsets: { id: string; name: string }[],
): CatalogField<NamedChipsetRow> {
  return idSelectField<NamedChipsetRow>(
    "Chipset",
    "chipsetId",
    chipsets.map((chipset) => ({
      id: chipset.id,
      name: chipset.name,
    })),
  );
}

function ramSelect(
  field: CatalogField<NamedRamRow>,
  row: CpuRamCompat,
  update: (next: CpuRamCompat) => void,
) {
  return field.control({ ...row, id: "", name: "" }, (next) => {
    update({
      ddrGeneration: next.ddrGeneration,
      ramModuleCount: next.ramModuleCount,
      ramRank: next.ramRank,
      maxSpeedMts: next.maxSpeedMts,
    });
  });
}

function chipsetSelect(
  field: CatalogField<NamedChipsetRow>,
  row: CpuSupportChipset,
  update: (next: CpuSupportChipset) => void,
) {
  return field.control({ ...row, id: "", name: "" }, (next) => {
    update({
      ...row,
      chipsetId: next.chipsetId,
      chipsetName: next.chipsetName,
    });
  });
}

export const ramCompatColumns: ChildCollectionColumn<CpuRamCompat>[] = [
  {
    header: "DDR",
    cell: (row, update) => ramSelect(ddrField, row, update),
  },
  {
    header: "Rank",
    cell: (row, update) => ramSelect(rankField, row, update),
  },
  {
    header: "Modules",
    cell: (row, update) => (
      <Input
        aria-label="RAM module count"
        className="w-20"
        type="number"
        min={1}
        value={row.ramModuleCount}
        onChange={(event) =>
          update({ ...row, ramModuleCount: Number(event.target.value) })
        }
      />
    ),
  },
  {
    header: "Max speed (MT/s)",
    cell: (row, update) => (
      <Input
        aria-label="Max speed"
        className="w-24"
        type="number"
        min={1}
        value={row.maxSpeedMts}
        onChange={(event) =>
          update({ ...row, maxSpeedMts: Number(event.target.value) })
        }
      />
    ),
  },
];

export function supportChipsetColumns(
  chipsets: { id: string; name: string }[],
): ChildCollectionColumn<CpuSupportChipset>[] {
  return [
    {
      header: "Chipset",
      cell: (row, update) => chipsetSelect(chipsetField(chipsets), row, update),
    },
    {
      header: "BIOS update",
      cell: (row, update) => (
        <Field orientation="horizontal">
          <Switch
            id="requiresBiosUpdate"
            aria-label="BIOS update required"
            checked={row.requiresBiosUpdate}
            onCheckedChange={(checked) =>
              update({ ...row, requiresBiosUpdate: checked === true })
            }
          />
          <Label htmlFor="requiresBiosUpdate">
            {row.requiresBiosUpdate ? "Required" : "Not Required"}
          </Label>
        </Field>
      ),
    },
  ];
}
