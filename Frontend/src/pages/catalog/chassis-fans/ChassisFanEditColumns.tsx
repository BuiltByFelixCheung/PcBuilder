import {
  enumSelectBulkColumn,
  idSelectBulkColumn,
  nameBulkColumn,
} from "@/components/BulkEditColumns";
import type { BulkEditColumn } from "@/components/BulkEditDialog";
import {
  enumSelectField,
  idSelectField,
  nameField,
  type CatalogField,
} from "@/components/catalog/CatalogFields";
import type { ChassisFan } from "@/api/catalog/chassis-fans";
import { toInteger } from "@/api/helper";
import { FAN_DIAMETERS_MM, formatFanDiameterMm } from "@/api/enums";
import { formSelectClassName } from "@/components/filters/ListFilters";

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
  ];
}
