import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type ChassisDriveBay,
  type ChassisFanMount,
  type ChassisPcieSlot,
  type ChassisRadiator,
} from "@/api/catalog/chassis";
import {
  DRIVE_BAY_FORM_FACTORS,
  FAN_DIAMETERS_MM,
  FAN_MOUNT_LOCATIONS,
  MB_FORM_FACTORS,
  PCIE_SLOT_ORIENTATIONS,
  PSU_FORM_FACTORS,
  RADIATOR_CLASSES,
  RADIATOR_MOUNT_LOCATIONS,
  formatDriveBayFormFactor,
  formatFanDiameterMm,
  formatRadiatorClass,
  type FanDiameterMm,
  type FanMountLocation,
  type RadiatorClass,
  type RadiatorMountLocation,
  type PcieSlotOrientation,
} from "@/api/enums";
import { type ChildCollectionColumn } from "@/components/catalog/ChildCollectionDialog";
import { formSelectClassName } from "@/components/filters/ListFilters";
import {enumText, ui} from "@/i18n/translate-enum";

function formFactorColumns<T extends string>(
  label: () => string,
  values: readonly T[],
  format: (value: T) => string = (value) => value,
): ChildCollectionColumn<{ value: T }>[] {
  return [
    {
      header: () => ui.header("formFactor"),
      cell: (row, update) => (
        <select
          aria-label={label()}
          className={formSelectClassName}
          value={row.value}
          onChange={(event) => update({ value: event.target.value as T })}
        >
          {values.map((value) => (
            <option key={value} value={value}>
              {format(value)}
            </option>
          ))}
        </select>
      ),
    },
  ];
}

export const mbFormFactorColumns = formFactorColumns(
  () => ui.label("motherboardFormFactor"),
  MB_FORM_FACTORS,
  enumText.mbFormFactor,
);
export const psuFormFactorColumns = formFactorColumns(
  () => ui.label("psuFormFactor"),
  PSU_FORM_FACTORS,
  enumText.psuFormFactor,
);

export const pcieSlotColumns: ChildCollectionColumn<{ value: ChassisPcieSlot }>[] = [
  {
    header: () => ui.header("orientation"),
    cell: (row, update) => (
      <select
        aria-label={ui.label("pcieOrientation")}
        className={formSelectClassName}
        value={row.value.orientation}
        onChange={(event) =>
          update({
            value: {
              ...row.value,
              orientation: event.target.value as PcieSlotOrientation,
            },
          })
        }
      >
        {PCIE_SLOT_ORIENTATIONS.map((orientation) => (
          <option key={orientation} value={orientation}>
            {enumText.pcieSlotOrientation(orientation)}
          </option>
        ))}
      </select>
    ),
  },
  {
    header: () => ui.header("profile"),
    cell: (row, update) => (
      <select
        aria-label={ui.label("pcieLowProfile")}
        className={formSelectClassName}
        value={row.value.lowProfileSlots ? "yes" : "no"}
        onChange={(event) =>
          update({
            value: {
              ...row.value,
              lowProfileSlots: event.target.value === "yes",
            },
          })
        }
      >
        <option value="no">{ui.label("fullHeight")}</option>
        <option value="yes">{ui.label("lowProfile")}</option>
      </select>
    ),
  },
  {
    header: () => ui.header("slots"),
    cell: (row, update) => (
      <Input
        aria-label={ui.label("pcieSlotCount")}
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

export const fanMountColumns: ChildCollectionColumn<{ value: ChassisFanMount }>[] = [
  {
    header: () => ui.header("location"),
    cell: (row, update) => (
      <select
        aria-label={ui.label("fanMountLocation")}
        className={formSelectClassName}
        value={row.value.location}
        onChange={(event) =>
          update({
            value: {
              ...row.value,
              location: event.target.value as FanMountLocation,
            },
          })
        }
      >
        {FAN_MOUNT_LOCATIONS.map((location) => (
          <option key={location} value={location}>
            {enumText.fanMount(location)}
          </option>
        ))}
      </select>
    ),
  },
  {
    header: () => ui.header("singleDiameter"),
    cell: (row, update) => (
      <select
        aria-label={ui.label("singleDiameterOnly")}
        className={formSelectClassName}
        value={row.value.singleDiameterOnly ? "yes" : "no"}
        onChange={(event) =>
          update({
            value: {
              ...row.value,
              singleDiameterOnly: event.target.value === "yes",
            },
          })
        }
      >
        <option value="no">{ui.label("no")}</option>
        <option value="yes">{ui.label("yes")}</option>
      </select>
    ),
  },
  {
    header: () => ui.header("options"),
    cell: (row, update) => (
      <div className="flex flex-col gap-2">
        {row.value.options.map((option, index) => (
          <div key={`${option.diameter}-${index}`} className="flex gap-2">
            <select
              aria-label={ui.message("fanDiameterIndex", { index: index + 1 })}
              className={formSelectClassName}
              value={option.diameter}
              onChange={(event) => {
                const options = row.value.options.map((current, optionIndex) =>
                  optionIndex === index
                    ? {
                        ...current,
                        diameter: event.target.value as FanDiameterMm,
                      }
                    : current,
                );
                update({ value: { ...row.value, options } });
              }}
            >
              {FAN_DIAMETERS_MM.map((diameter) => (
                <option key={diameter} value={diameter}>
                  {formatFanDiameterMm(diameter)}
                </option>
              ))}
            </select>
            <Input
              aria-label={ui.message("fanSlotCountIndex", { index: index + 1 })}
              type="number"
              min={1}
              value={option.slotCount}
              onChange={(event) => {
                const options = row.value.options.map((current, optionIndex) =>
                  optionIndex === index
                    ? { ...current, slotCount: Number(event.target.value) }
                    : current,
                );
                update({ value: { ...row.value, options } });
              }}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            update({
              value: {
                ...row.value,
                options: [
                  ...row.value.options,
                  { diameter: "Mm120", slotCount: 1 },
                ],
              },
            })
          }
        >
          {ui.action("addOption")}
        </Button>
      </div>
    ),
  },
];

export const radiatorColumns: ChildCollectionColumn<{ value: ChassisRadiator }>[] = [
  {
    header: () => ui.header("location"),
    cell: (row, update) => (
      <select
        aria-label={ui.label("radiatorLocation")}
        className={formSelectClassName}
        value={row.value.location}
        onChange={(event) =>
          update({
            value: {
              ...row.value,
              location: event.target.value as RadiatorMountLocation,
            },
          })
        }
      >
        {RADIATOR_MOUNT_LOCATIONS.map((location) => (
          <option key={location} value={location}>
            {enumText.radiatorMount(location)}
          </option>
        ))}
      </select>
    ),
  },
  {
    header: () => ui.header("length"),
    cell: (row, update) => (
      <select
        aria-label={ui.label("radiatorLength")}
        className={formSelectClassName}
        value={row.value.length}
        onChange={(event) =>
          update({
            value: {
              ...row.value,
              length: event.target.value as RadiatorClass,
            },
          })
        }
      >
        {RADIATOR_CLASSES.map((length) => (
          <option key={length} value={length}>
            {formatRadiatorClass(length)}
          </option>
        ))}
      </select>
    ),
  },
  {
    header: () => ui.header("count"),
    cell: (row, update) => (
      <Input
        aria-label={ui.label("radiatorCount")}
        type="number"
        min={1}
        value={row.value.radiatorCount}
        onChange={(event) =>
          update({
            value: { ...row.value, radiatorCount: Number(event.target.value) },
          })
        }
      />
    ),
  },
];

export const driveBayColumns: ChildCollectionColumn<{ value: ChassisDriveBay }>[] = [
  {
    header: () => ui.header("formFactor"),
    cell: (row, update) => (
      <div className="flex gap-3">
        {DRIVE_BAY_FORM_FACTORS.map((formFactor) => (
          <label key={formFactor} className="flex items-center gap-1">
            <input
              type="checkbox"
              className="size-4"
              checked={row.value.formFactors.includes(formFactor)}
              onChange={(event) => {
                const formFactors = event.target.checked
                  ? [...row.value.formFactors, formFactor]
                  : row.value.formFactors.filter((item) => item !== formFactor);
                update({ value: { ...row.value, formFactors } });
              }}
            />
            {formatDriveBayFormFactor(formFactor)}
          </label>
        ))}
      </div>
    ),
  },
  {
    header: () => ui.header("slots"),
    cell: (row, update) => (
      <Input
        aria-label={ui.label("driveBaySlotCount")}
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
