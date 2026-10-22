import { Input } from "@/components/ui/input";
import { type ChildCollectionColumn } from "@/components/catalog/ChildCollectionDialog";
import { formSelectClassName } from "@/components/filters/ListFilters";
import {
  M2_FORM_FACTORS,
  M2_KEYS,
  PCIE_GENERATIONS,
  PCIE_SLOT_LANES,
  PCIE_SLOT_TYPES,
  USB_TYPES,
  USB_VERSIONS,
  formatM2FormFactor,
} from "@/api/enums";
import {enumText, ui} from "@/i18n/translate-enum";
import {
  type MotherboardM2Slot,
  type MotherboardPcieSlot,
  type MotherboardUsbPort,
} from "@/api/catalog/motherboards";

function countField(label: string, value: number, onChange: (value: number) => void) {
  return (
    <Input
      aria-label={label}
      className="w-20"
      type="number"
      min={1}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}

function enumField<T extends string>(
  label: string,
  value: T,
  values: readonly T[],
  onChange: (value: T) => void,
  format?: (value: T) => string,
) {
  return (
    <select
      aria-label={label}
      className={formSelectClassName}
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {values.map((item) => (
        <option key={item} value={item}>
          {format ? format(item) : item}
        </option>
      ))}
    </select>
  );
}

export const pcieSlotColumns: ChildCollectionColumn<{ value: MotherboardPcieSlot }>[] =
  [
    {
      header: () => ui.header("type"),
      cell: (row, update) =>
        enumField(
          ui.label("pcieType"),
          row.value.slotType,
          PCIE_SLOT_TYPES,
          (slotType) => update({ value: { ...row.value, slotType } }),
          enumText.pcieSlotType,
        ),
    },
    {
      header: () => ui.header("lanes"),
      cell: (row, update) =>
        enumField(
          ui.label("pcieLanes"),
          row.value.slotLanes,
          PCIE_SLOT_LANES,
          (slotLanes) => update({ value: { ...row.value, slotLanes } }),
          enumText.pcieSlotLane,
        ),
    },
    {
      header: () => ui.header("generation"),
      cell: (row, update) =>
        enumField(
          ui.label("pcieGeneration"),
          row.value.generation,
          PCIE_GENERATIONS,
          (generation) => update({ value: { ...row.value, generation } }),
          enumText.pcieGeneration,
        ),
    },
    {
      header: () => ui.header("slots"),
      cell: (row, update) =>
        countField(ui.label("pcieSlotCount"), row.value.slotCount, (slotCount) =>
          update({ value: { ...row.value, slotCount } }),
        ),
    },
  ];

export const m2SlotColumns: ChildCollectionColumn<{ value: MotherboardM2Slot }>[] = [
  {
    header: () => ui.header("key"),
    cell: (row, update) =>
      enumField(
        ui.label("m2Key"),
        row.value.key,
        M2_KEYS,
        (key) => update({ value: { ...row.value, key } }),
        enumText.m2Key,
      ),
  },
  {
    header: () => ui.header("generation"),
    cell: (row, update) =>
      enumField(
        ui.label("m2Generation"),
        row.value.pcieGeneration,
        PCIE_GENERATIONS,
        (pcieGeneration) => update({ value: { ...row.value, pcieGeneration } }),
        enumText.pcieGeneration,
      ),
  },
  {
    header: () => ui.header("slots"),
    cell: (row, update) =>
      countField(ui.label("m2SlotCount"), row.value.slotCount, (slotCount) =>
        update({ value: { ...row.value, slotCount } }),
      ),
  },
  {
    header: () => ui.header("sata"),
    cell: (row, update) =>
      enumField(
        ui.label("m2Sata"),
        row.value.supportsSata ? "yes" : "no",
        ["yes", "no"],
        (value) =>
          update({ value: { ...row.value, supportsSata: value === "yes" } }),
        (value) => (value === "yes" ? ui.label("yes") : ui.label("no")),
      ),
  },
  {
    header: () => ui.header("formFactors"),
    cell: (row, update) => (
      <div className="flex flex-col gap-1">
        {M2_FORM_FACTORS.map((formFactor) => (
          <label key={formFactor} className="flex items-center gap-2">
            <input
              type="checkbox"
              aria-label={formatM2FormFactor(formFactor)}
              checked={row.value.formFactors.includes(formFactor)}
              onChange={(event) => {
                const formFactors = event.target.checked
                  ? [...row.value.formFactors, formFactor]
                  : row.value.formFactors.filter((item) => item !== formFactor);
                update({ value: { ...row.value, formFactors } });
              }}
            />
            {formatM2FormFactor(formFactor)}
          </label>
        ))}
      </div>
    ),
  },
];

export const usbPortColumns: ChildCollectionColumn<{ value: MotherboardUsbPort }>[] = [
  {
    header: () => ui.header("version"),
    cell: (row, update) =>
      enumField(
        ui.label("usbVersion"),
        row.value.usbVersion,
        USB_VERSIONS,
        (usbVersion) => update({ value: { ...row.value, usbVersion } }),
        enumText.usbVersion,
      ),
  },
  {
    header: () => ui.header("type"),
    cell: (row, update) =>
      enumField(
        ui.label("usbType"),
        row.value.usbType,
        USB_TYPES,
        (usbType) => update({ value: { ...row.value, usbType } }),
        enumText.usbType,
      ),
  },
  {
    header: () => ui.header("ports"),
    cell: (row, update) =>
      countField(ui.label("usbPortCount"), row.value.portCount, (portCount) =>
        update({ value: { ...row.value, portCount } }),
      ),
  },
];
