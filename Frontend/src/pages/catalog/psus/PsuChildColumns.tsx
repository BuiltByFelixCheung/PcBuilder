import { Input } from "@/components/ui/input";
import { type ChildCollectionColumn } from "@/components/catalog/ChildCollectionDialog";
import { PSU_CABLE_TYPES, type PsuCableType } from "@/api/enums";
import { type PsuCable } from "@/api/catalog/psus";
import { enumSelectField } from "@/components/catalog/CatalogFields";

type NamedCable = PsuCable & { id: string; name: string };

const cableTypeField = enumSelectField<NamedCable, PsuCableType>(
  "Type",
  "type",
  PSU_CABLE_TYPES,
);

export const cableColumns: ChildCollectionColumn<PsuCable>[] = [
  {
    header: "Type",
    cell: (row, update) => 
      cableTypeField.control({ ...row, id: "", name: "" }, (next) => {
        update({ ...row, type: next.type });
      }),
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
