import { Input } from "@/components/ui/input";
import { type ChildCollectionColumn } from "@/components/catalog/ChildCollectionDialog";
import { PSU_CABLE_TYPES, type PsuCableType } from "@/api/enums";
import { type PsuCable } from "@/api/catalog/psus";
import { enumSelectField } from "@/components/catalog/CatalogFields";
import {enumText, ui} from "@/i18n/translate-enum";

type NamedCable = PsuCable & { id: string; name: string };

function cableTypeControl(
  row: PsuCable,
  update: (next: PsuCable) => void,
) {
  const field = enumSelectField<NamedCable, PsuCableType>(
    ui.label("type"),
    "type",
    PSU_CABLE_TYPES,
    { label: enumText.psuCableType },
  );
  return field.control({ ...row, id: "", name: "" }, (next) => {
    update({ ...row, type: next.type });
  });
}

export const cableColumns: ChildCollectionColumn<PsuCable>[] = [
  {
    header: () => ui.header("type"),
    cell: (row, update) => cableTypeControl(row, update),
  },
  {
    header: () => ui.header("cables"),
    cell: (row, update) => (
      <Input
        aria-label={ui.label("cableCount")}
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
    header: () => ui.header("connectors"),
    cell: (row, update) => (
      <Input
        aria-label={ui.label("connectorCount")}
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
