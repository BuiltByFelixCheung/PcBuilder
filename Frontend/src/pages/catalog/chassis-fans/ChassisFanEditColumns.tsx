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
import type { ChassisFan } from "@/api/catalog/chassis-fans";
import { toInteger } from "@/api/helper";
import {
  FAN_DIAMETERS_MM,
  FAN_HEADER_TYPES,
  formatFanDiameterMm,
  formatFanHeaderType,
} from "@/api/enums";
import { formSelectClassName } from "@/components/filters/ListFilters";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ui } from "@/i18n/translate-enum";

export function ChassisFanEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<ChassisFan>[] {
  return [
    nameBulkColumn(),
    idSelectBulkColumn(ui.label("manufacturer"), "manufacturerId", manufacturers),
    enumSelectBulkColumn(ui.label("diameter"), "diameterMm", FAN_DIAMETERS_MM, {
      label: formatFanDiameterMm,
    }),
    {
      header: ui.header("packSize"),
      cell: (row, update) => (
        <select
          aria-label={ui.message("fieldFor", { field: ui.label("packSize"), name: row.name })}
          className={formSelectClassName}
          value={row.fansCountPerPack}
          onChange={(event) =>
            update({
              ...row,
              fansCountPerPack: toInteger(event.target.value) ?? 0,
            })
          }
        >
          {Array.from({ length: 10 }, (_, index) => index + 1).map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      ),
    },
    optionalNumberColumn(ui.label("thicknessMm"), "thicknessMm"),
    enumSelectBulkColumn(ui.label("header"), "headerType", FAN_HEADER_TYPES, {
      label: formatFanHeaderType,
    }),
    {
      header: ui.header("daisyChain"),
      cell: (row, update) => (
        <Checkbox
          aria-label={ui.message("fieldFor", { field: ui.label("daisyChain"), name: row.name })}
          checked={row.supportsDaisyChain}
          onCheckedChange={(checked) => {
            const supportsDaisyChain = checked === true;
            update({
              ...row,
              supportsDaisyChain,
              maxFansPerDaisyChain: supportsDaisyChain
                ? row.maxFansPerDaisyChain
                : null,
            });
          }}
        />
      ),
    },
    {
      header: ui.header("maxDaisyChain"),
      cell: (row, update) => (
        <Input
          aria-label={ui.message("fieldFor", { field: ui.label("maxDaisyChain"), name: row.name })}
          type="number"
          min={2}
          disabled={!row.supportsDaisyChain}
          value={row.maxFansPerDaisyChain ?? ""}
          onChange={(event) =>
            update({
              ...row,
              maxFansPerDaisyChain: toInteger(event.target.value) ?? null,
            })
          }
        />
      ),
    },
  ];
}

export function ChassisFanFields(
  manufacturers: { id: string; name: string }[],
): CatalogField<ChassisFan>[] {
  return [
    nameField(),
    idSelectField(ui.label("manufacturer"), "manufacturerId", manufacturers),
    enumSelectField(ui.label("diameter"), "diameterMm", FAN_DIAMETERS_MM, {
      label: formatFanDiameterMm,
    }),
    {
      label: ui.label("packSize"),
      control: (item, update) => {
        const sizes = Array.from({ length: 10 }, (_, index) => index + 1);
        const known = sizes.includes(item.fansCountPerPack);
        return (
          <select
            aria-label={ui.message("fieldFor", { field: ui.label("packSize"), name: item.name })}
            className={formSelectClassName}
            value={known ? item.fansCountPerPack : ""}
            onChange={(event) =>
              update({
                ...item,
                fansCountPerPack: toInteger(event.target.value) ?? 0,
              })
            }
          >
            {known ? null : <option value="">{ui.label("selectPackSize")}</option>}
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        );
      },
    },
    optionalNumberField(ui.label("thicknessMm"), "thicknessMm"),
    enumSelectField(ui.label("header"), "headerType", FAN_HEADER_TYPES, {
      label: formatFanHeaderType,
    }),
    {
      label: ui.label("daisyChain"),
      orientation: "horizontal",
      control: (item, update) => (
        <Checkbox
          aria-label={ui.label("daisyChain")}
          checked={item.supportsDaisyChain}
          onCheckedChange={(checked) => {
            const supportsDaisyChain = checked === true;
            update({
              ...item,
              supportsDaisyChain,
              maxFansPerDaisyChain: supportsDaisyChain
                ? item.maxFansPerDaisyChain
                : null,
            });
          }}
        />
      ),
    },
    {
      label: ui.label("maxFansPerDaisyChain"),
      half: true,
      control: (item, update) => (
        <Input
          aria-label={ui.message("fieldFor", { field: ui.label("maxFansPerDaisyChain"), name: item.name })}
          type="number"
          min={2}
          disabled={!item.supportsDaisyChain}
          value={item.maxFansPerDaisyChain ?? ""}
          onChange={(event) =>
            update({
              ...item,
              maxFansPerDaisyChain: toInteger(event.target.value) ?? null,
            })
          }
        />
      ),
    },
  ];
}
