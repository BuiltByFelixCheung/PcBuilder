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

export function ChassisFanEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<ChassisFan>[] {
  return [
    nameBulkColumn(),
    idSelectBulkColumn("Manufacturer", "manufacturerId", manufacturers),
    enumSelectBulkColumn("Diameter", "diameterMm", FAN_DIAMETERS_MM, {
      label: formatFanDiameterMm,
    }),
    {
      header: "Pack size",
      cell: (row, update) => (
        <select
          aria-label={`Pack size for ${row.name}`}
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
    optionalNumberColumn("Thickness (mm)", "thicknessMm"),
    enumSelectBulkColumn("Header", "headerType", FAN_HEADER_TYPES, {
      label: formatFanHeaderType,
    }),
    {
      header: "Daisy chain",
      cell: (row, update) => (
        <Checkbox
          aria-label={`Daisy chain for ${row.name}`}
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
      header: "Max daisy chain",
      cell: (row, update) => (
        <Input
          aria-label={`Max daisy chain for ${row.name}`}
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
    idSelectField("Manufacturer", "manufacturerId", manufacturers),
    enumSelectField("Diameter", "diameterMm", FAN_DIAMETERS_MM, {
      label: formatFanDiameterMm,
    }),
    {
      label: "Pack size",
      control: (item, update) => {
        const sizes = Array.from({ length: 10 }, (_, index) => index + 1);
        const known = sizes.includes(item.fansCountPerPack);
        return (
          <select
            aria-label={`Pack size for ${item.name}`}
            className={formSelectClassName}
            value={known ? item.fansCountPerPack : ""}
            onChange={(event) =>
              update({
                ...item,
                fansCountPerPack: toInteger(event.target.value) ?? 0,
              })
            }
          >
            {known ? null : <option value="">Select pack size</option>}
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        );
      },
    },
    optionalNumberField("Thickness (mm)", "thicknessMm"),
    enumSelectField("Header", "headerType", FAN_HEADER_TYPES, {
      label: formatFanHeaderType,
    }),
    {
      label: "Daisy chain",
      orientation: "horizontal",
      control: (item, update) => (
        <Checkbox
          aria-label="Daisy chain"
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
      label: "Max fans per daisy chain",
      half: true,
      control: (item, update) => (
        <Input
          aria-label={`Max fans per daisy chain for ${item.name}`}
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
