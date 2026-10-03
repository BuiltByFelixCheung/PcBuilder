import { useState } from "react";
import {
  createPsu,
  psuKeys,
  type PsuCable,
  type PsuListItem,
} from "@/api/catalog/psus";
import {
  collectionValues,
  unsetCatalogItem,
  useCatalogCreate,
} from "@/components/catalog/catalog-create";
import {
  CatalogCollectionEditor,
  CatalogCreateForm,
  CatalogScalarFields,
} from "@/components/catalog/CatalogCreateForm";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers";
import { PsuFields } from "@/pages/catalog/psus/PsuEditColumns";
import { cableColumns } from "@/pages/catalog/psus/PsuChildColumns";

const emptyPsu = unsetCatalogItem<PsuListItem>({
  id: "",
  name: "",
  manufacturerId: "",
  manufacturerName: "",
  wattage: 0,
  modularity: "",
  formFactor: "",
  lengthMm: 0,
  widthMm: 0,
  heightMm: 0,
});

export function PsuCreatePage() {
  const manufacturers = useCatalogManufacturers("psu");
  const [item, setItem] = useState(emptyPsu);
  const [cables, setCables] = useState<{ key: string; value: PsuCable }[]>([]);
  const { saving, error, submit } = useCatalogCreate();

  return (
    <CatalogCreateForm
      title="New PSU"
      backTo="/catalog/psus"
      backLabel="Back to PSUs"
      saving={saving}
      error={error}
      onSubmit={() =>
        void submit({
          queryKey: psuKeys.all,
          detailPath: (id) => `/catalog/psus/${id}`,
          create: () => createPsu({ ...item, cables: collectionValues(cables) }),
        })
      }
    >
      <CatalogScalarFields
        fields={PsuFields(manufacturers)}
        item={item}
        onChange={setItem}
      />
      <CatalogCollectionEditor
        title="Cables"
        columns={cableColumns}
        rows={cables}
        onChange={setCables}
        disabled={saving}
        createRow={(): PsuCable => ({
          type: "Motherboard24Pin",
          cablesCount: 1,
          connectorsCount: 1,
        })}
      />
    </CatalogCreateForm>
  );
}
