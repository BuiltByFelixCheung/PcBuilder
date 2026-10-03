import { Input } from "@/components/ui/input";
import { type ChildCollectionColumn } from "@/components/catalog/ChildCollectionDialog";
import { formSelectClassName } from "@/components/filters/ListFilters";
import { PSU_CABLE_TYPES, type PsuCableType } from "@/api/enums";
import { type PsuCable } from "@/api/catalog/psus";

export const cableColumns: ChildCollectionColumn<PsuCable>[] = [
  {
    header: "Type",
    cell: (row, update) => (
      <select
        aria-label="Cable type"
        className={formSelectClassName}
        value={row.type}
        onChange={(event) =>
          update({ ...row, type: event.target.value as PsuCableType })
        }
      >
        {PSU_CABLE_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    ),
  },
  {
    header: "Cables",
    cell: (row, update) => (
      <Input
        aria-label="Cable count"
        className="w-20"
        type="number"
        min={1}
        value={row.cablesCount}
        onChange={(event) =>
          update({ ...row, cablesCount: Number(event.target.value) })
        }
      />
    ),
  },
  {
    header: "Connectors",
    cell: (row, update) => (
      <Input
        aria-label="Connector count"
        className="w-20"
        type="number"
        min={1}
        value={row.connectorsCount}
        onChange={(event) =>
          update({ ...row, connectorsCount: Number(event.target.value) })
        }
      />
    ),
  },
];
