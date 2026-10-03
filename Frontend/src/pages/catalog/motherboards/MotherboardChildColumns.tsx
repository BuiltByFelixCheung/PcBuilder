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
import {
  type MotherboardM2Slot,
  type MotherboardPcieSlot,
  type MotherboardUsbPort,
} from "@/api/catalog/motherboards";

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
      header: "Type",
      cell: (row, update) =>
        enumField(
          "PCIe type",
          row.value.slotType,
          PCIE_SLOT_TYPES,
          (slotType) => update({ value: { ...row.value, slotType } }),
        ),
    },
    {
      header: "Lanes",
      cell: (row, update) =>
        enumField(
          "PCIe lanes",
          row.value.slotLanes,
          PCIE_SLOT_LANES,
          (slotLanes) => update({ value: { ...row.value, slotLanes } }),
        ),
    },
    {
      header: "Generation",
      cell: (row, update) =>
        enumField(
          "PCIe generation",
          row.value.generation,
          PCIE_GENERATIONS,
          (generation) => update({ value: { ...row.value, generation } }),
          (generation) => generation.replace("Gen", "PCIe "),
        ),
    },
    {
      header: "Slots",
      cell: (row, update) => (
        <Input
          aria-label="PCIe slot count"
          className="w-20"
          type="number"
          min={1}
          value={row.value.slotCount}
          onChange={(event) =>
            update({
              value: { ...row.value, slotCount: Number(event.target.value) },
            })
          }
        />
      ),
    },
  ];

export const m2SlotColumns: ChildCollectionColumn<{ value: MotherboardM2Slot }>[] = [
  {
    header: "Key",
    cell: (row, update) =>
      enumField("M.2 key", row.value.key, M2_KEYS, (key) =>
        update({ value: { ...row.value, key } }),
      ),
  },
  {
    header: "Generation",
    cell: (row, update) =>
      enumField(
        "M.2 generation",
        row.value.pcieGeneration,
        PCIE_GENERATIONS,
        (pcieGeneration) => update({ value: { ...row.value, pcieGeneration } }),
        (generation) => generation.replace("Gen", "PCIe "),
      ),
  },
  {
    header: "Slots",
    cell: (row, update) => (
      <Input
        aria-label="M.2 slot count"
        className="w-20"
        type="number"
        min={1}
        value={row.value.slotCount}
        onChange={(event) =>
          update({
            value: { ...row.value, slotCount: Number(event.target.value) },
          })
        }
      />
    ),
  },
  {
    header: "SATA",
    cell: (row, update) =>
      enumField(
        "M.2 SATA",
        row.value.supportsSata ? "yes" : "no",
        ["yes", "no"],
        (value) =>
          update({ value: { ...row.value, supportsSata: value === "yes" } }),
      ),
  },
  {
    header: "Form factors",
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
    header: "Version",
    cell: (row, update) =>
      enumField(
        "USB version",
        row.value.usbVersion,
        USB_VERSIONS,
        (usbVersion) => update({ value: { ...row.value, usbVersion } }),
      ),
  },
  {
    header: "Type",
    cell: (row, update) =>
      enumField("USB type", row.value.usbType, USB_TYPES, (usbType) =>
        update({ value: { ...row.value, usbType } }),
      ),
  },
  {
    header: "Ports",
    cell: (row, update) => (
      <Input
        aria-label="USB port count"
        className="w-20"
        type="number"
        min={1}
        value={row.value.portCount}
        onChange={(event) =>
          update({
            value: { ...row.value, portCount: Number(event.target.value) },
          })
        }
      />
    ),
  },
];
