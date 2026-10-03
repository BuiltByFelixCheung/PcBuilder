import {
  enumSelectBulkColumn,
  idSelectBulkColumn,
  nameBulkColumn,
  optionalNumberColumn,
} from "@/components/BulkEditColumns";
import type { BulkEditColumn } from "@/components/BulkEditDialog";
import {
  enumSelectField,
  idSelectField,
  nameField,
  optionalNumberField,
  type CatalogField,
} from "@/components/catalog/CatalogFields";
import type { MemoryDetail } from "@/api/catalog/memories";
import { toInteger } from "@/api/helper";
import { Input } from "@/components/ui/input";
import {
  DDR4_KIT_SIZE_GB,
  DDR4_MODULE_SIZE_GB,
  DDR4_SPEED_MT_S,
  DDR5_KIT_SIZE_GB,
  DDR5_MODULE_SIZE_GB,
  DDR5_SPEED_MT_S,
  DDR_GENERATIONS,
  MODULES_COUNT,
  RAM_FORM_FACTORS,
  RAM_RANKS,
  type DdrGeneration,
} from "@/api/enums";
import { optionsForDdr } from "@/pages/catalog/memories/memory-ddr-options";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const emptyOption = "__blank__";

function valueInOptions(value: number, options: readonly number[]): number {
  if (options.includes(value) || value === 0) return value;
  return options[0] ?? value;
}

type MemoryNumberField =
  | "memorySizePerStickGb"
  | "totalMemorySizeGb"
  | "maxMemorySpeedMts"
  | "modulesCount";

function memoryNumberSelect(
  label: string,
  field: MemoryNumberField,
  options: readonly number[],
  unit: string,
  item: MemoryDetail,
  update: (next: MemoryDetail) => void,
  emptyLabel?: string,
) {
  const current = item[field];
  const known = options.includes(current);
  const _blankLabel = emptyLabel ?? "Please Select...";
  return (
    <Select
      value={known ? String(current) : emptyOption}
      onValueChange={(value) =>
        update({
          ...item,
          [field]: value === emptyOption ? 0 : (toInteger(value) ?? 0),
        })
      }
    >
      <SelectTrigger
        aria-label={`${label} for ${item.name}`}
        className="w-full"
      >
        <SelectValue placeholder={emptyLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {known ? null : (
            <SelectItem value={emptyOption}>{_blankLabel}</SelectItem>
          )}
          {options.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {unit === "" ? option : `${option} ${unit}`}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function memoryGbSelect(
  label: string,
  field: "memorySizePerStickGb" | "totalMemorySizeGb",
  ddr4: readonly number[],
  ddr5: readonly number[],
  item: MemoryDetail,
  update: (next: MemoryDetail) => void,
) {
  return memoryNumberSelect(
    label,
    field,
    optionsForDdr(item.ddrGeneration, ddr4, ddr5),
    "GB",
    item,
    update,
  );
}

function memorySpeedSelect(
  item: MemoryDetail,
  update: (next: MemoryDetail) => void,
) {
  return memoryNumberSelect(
    "Speed",
    "maxMemorySpeedMts",
    optionsForDdr(item.ddrGeneration, DDR4_SPEED_MT_S, DDR5_SPEED_MT_S),
    "MT/s",
    item,
    update,
  );
}

function modulesCountSelect(
  item: MemoryDetail,
  update: (next: MemoryDetail) => void,
) {
  return memoryNumberSelect(
    "Modules Count",
    "modulesCount",
    MODULES_COUNT,
    "",
    item,
    update,
  );
}

function ddrGenerationSelect(
  row: MemoryDetail,
  update: (row: MemoryDetail) => void,
  newRecord: boolean = false,
) {
  const known = (DDR_GENERATIONS as readonly string[]).includes(
    row.ddrGeneration,
  );
  const showBlank = newRecord || !known;
  return (
    <Select
      value={known ? row.ddrGeneration : emptyOption}
      onValueChange={(value) => {
        if (value === emptyOption) {
          update({ ...row, ddrGeneration: "" as DdrGeneration });
          return;
        }
        const ddrGeneration = value as DdrGeneration;
        const moduleSizes = optionsForDdr(
          ddrGeneration,
          DDR4_MODULE_SIZE_GB,
          DDR5_MODULE_SIZE_GB,
        );
        const kitSizes = optionsForDdr(
          ddrGeneration,
          DDR4_KIT_SIZE_GB,
          DDR5_KIT_SIZE_GB,
        );
        const speeds = optionsForDdr(
          ddrGeneration,
          DDR4_SPEED_MT_S,
          DDR5_SPEED_MT_S,
        );
        update({
          ...row,
          ddrGeneration,
          memorySizePerStickGb: valueInOptions(
            row.memorySizePerStickGb,
            moduleSizes,
          ),
          totalMemorySizeGb: valueInOptions(row.totalMemorySizeGb, kitSizes),
          maxMemorySpeedMts: valueInOptions(row.maxMemorySpeedMts, speeds),
        });
      }}
    >
      <SelectTrigger
        aria-label={
          row.name ? `DDR Generation for ${row.name}` : "DDR Generation"
        }
        className="w-full"
      >
        <SelectValue placeholder="DDR Generation" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>DDR Generation</SelectLabel>
          {showBlank ? (
            <SelectItem value={emptyOption}>Please Select...</SelectItem>
          ) : null}
          {DDR_GENERATIONS.map((generation) => (
            <SelectItem key={generation} value={generation}>
              {generation}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function MemoryEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<MemoryDetail>[] {
  return [
    nameBulkColumn(),
    idSelectBulkColumn("Manufacturer", "manufacturerId", manufacturers),
    {
      header: "Color",
      cell: (row, update) => (
        <Input
          aria-label={`Color for ${row.name}`}
          value={row.color}
          onChange={(event) => update({ ...row, color: event.target.value })}
        />
      ),
    },
    {
      header: "DDR Generation",
      cell: (row, update) => ddrGenerationSelect(row, update),
    },
    enumSelectBulkColumn("RAM Form Factor", "ramFormFactor", RAM_FORM_FACTORS),
    enumSelectBulkColumn("RAM Rank", "ramRank", RAM_RANKS),
    {
      header: "Module Size",
      cell: (row, update) =>
        memoryGbSelect(
          "Module Size",
          "memorySizePerStickGb",
          DDR4_MODULE_SIZE_GB,
          DDR5_MODULE_SIZE_GB,
          row,
          update,
        ),
    },
    {
      header: "Kit Size",
      cell: (row, update) =>
        memoryGbSelect(
          "Kit Size",
          "totalMemorySizeGb",
          DDR4_KIT_SIZE_GB,
          DDR5_KIT_SIZE_GB,
          row,
          update,
        ),
    },
    {
      header: "Speed",
      cell: (row, update) => memorySpeedSelect(row, update),
    },
    {
      header: "Modules Count",
      cell: (row, update) => modulesCountSelect(row, update),
    },
    optionalNumberColumn("Height (mm)", "heightMm"),
  ];
}

export function MemoryFields(
  manufacturers: { id: string; name: string }[],
  newRecord: boolean = false,
): CatalogField<MemoryDetail>[] {
  return [
    nameField(),
    idSelectField(
      "Manufacturer",
      "manufacturerId",
      manufacturers,
      "Please Select...",
    ),
    {
      label: "Color",
      control: (item, update) => (
        <Input
          aria-label={`Color for ${item.name}`}
          value={item.color}
          onChange={(event) => update({ ...item, color: event.target.value })}
        />
      ),
    },
    {
      label: "DDR Generation",
      control: (item, update) => ddrGenerationSelect(item, update, newRecord),
    },
    enumSelectField(
      "RAM Form Factor",
      "ramFormFactor",
      RAM_FORM_FACTORS,
      newRecord ? { empty: "null", emptyLabel: "Please Select..." } : undefined,
    ),
    enumSelectField(
      "RAM Rank",
      "ramRank",
      RAM_RANKS,
      newRecord ? { empty: "null", emptyLabel: "Please Select..." } : undefined,
    ),
    {
      label: "Module Size",
      control: (item, update) =>
        memoryGbSelect(
          "Module Size",
          "memorySizePerStickGb",
          DDR4_MODULE_SIZE_GB,
          DDR5_MODULE_SIZE_GB,
          item,
          update,
        ),
    },
    {
      label: "Kit Size",
      control: (item, update) =>
        memoryGbSelect(
          "Kit Size",
          "totalMemorySizeGb",
          DDR4_KIT_SIZE_GB,
          DDR5_KIT_SIZE_GB,
          item,
          update,
        ),
    },
    {
      label: "Speed",
      control: (item, update) => memorySpeedSelect(item, update),
    },
    {
      label: "Modules Count",
      control: (item, update) => modulesCountSelect(item, update),
    },
    optionalNumberField("Height (mm)", "heightMm"),
  ];
}
