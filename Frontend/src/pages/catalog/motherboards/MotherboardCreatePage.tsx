import { useState } from "react";
import {
  createMotherboard,
  motherboardKeys,
  type MotherboardListItem,
  type MotherboardM2Slot,
  type MotherboardPcieSlot,
  type MotherboardUsbPort,
} from "@/api/catalog/motherboards";
import {
  unsetCatalogItem,
  unwrapCollectionValues,
  useCatalogCreate,
} from "@/components/catalog/catalog-create";
import {
  CatalogCollectionEditor,
  CatalogCreateForm,
  CatalogScalarFields,
} from "@/components/catalog/CatalogCreateForm";
import { useMotherboardFilterOptions } from "@/hooks/use-motherboard-filter-options";
import { MotherboardFields } from "@/pages/catalog/motherboards/MotherboardEditColumns";
import {
  m2SlotColumns,
  pcieSlotColumns,
  usbPortColumns,
} from "@/pages/catalog/motherboards/MotherboardChildColumns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const emptyMotherboard = unsetCatalogItem<MotherboardListItem>({
  id: "",
  name: "",
  manufacturerId: "",
  manufacturerName: "",
  socketId: "",
  socketName: "",
  chipsetId: "",
  chipsetName: "",
  ramSlots: 0,
  maxMemoryGb: 0,
  maxDimmSizeGb: 0,
  sataPorts: 0,
  fanConnectors: 0,
  epsConnectors: 0,
  widthMm: 0,
  heightMm: 0,
  ddrGeneration: "",
  ramFormFactor: "",
  formFactor: "",
  wifiEnabled: false,
  bluetoothEnabled: false,
});

export function MotherboardCreatePage() {
  const { manufacturers, sockets, chipsets } = useMotherboardFilterOptions();
  const [item, setItem] = useState(emptyMotherboard);
  const [pcieSlots, setPcieSlots] = useState<
    { key: string; value: { value: MotherboardPcieSlot } }[]
  >([]);
  const [m2Slots, setM2Slots] = useState<
    { key: string; value: { value: MotherboardM2Slot } }[]
  >([]);
  const [usbPorts, setUsbPorts] = useState<
    { key: string; value: { value: MotherboardUsbPort } }[]
  >([]);
  const { saving, error, submit } = useCatalogCreate();

  return (
    <CatalogCreateForm
      title="New motherboard"
      backTo="/catalog/motherboards"
      backLabel="Back to motherboards"
      saving={saving}
      error={error}
      onSubmit={() =>
        void submit({
          queryKey: motherboardKeys.all,
          detailPath: (id) => `/catalog/motherboards/${id}`,
          create: () =>
            createMotherboard({
              ...item,
              pcieSlots: unwrapCollectionValues(pcieSlots),
              m2Slots: unwrapCollectionValues(m2Slots),
              usbPorts: unwrapCollectionValues(usbPorts),
            }),
        })
      }
    >
      <div className="catalog-create-columns columns-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <CatalogScalarFields
              fields={MotherboardFields(manufacturers, sockets, chipsets)}
              item={item}
              onChange={setItem}
            />
          </CardContent>
        </Card>
        <div className="catalog-create-column">
          <CatalogCollectionEditor
            title="PCIe slots"
            columns={pcieSlotColumns}
            rows={pcieSlots}
            onChange={setPcieSlots}
            disabled={saving}
            createRow={(): { value: MotherboardPcieSlot } => ({
              value: {
                slotType: "X16",
                slotLanes: "X16",
                generation: "Gen5",
                slotCount: 1,
              },
            })}
          />
          <CatalogCollectionEditor
            title="M.2 slots"
            columns={m2SlotColumns}
            rows={m2Slots}
            onChange={setM2Slots}
            disabled={saving}
            createRow={(): { value: MotherboardM2Slot } => ({
              value: {
                key: "M",
                pcieGeneration: "Gen5",
                slotCount: 1,
                supportsSata: false,
                formFactors: [],
              },
            })}
          />
          <CatalogCollectionEditor
            title="USB ports"
            columns={usbPortColumns}
            rows={usbPorts}
            onChange={setUsbPorts}
            disabled={saving}
            createRow={(): { value: MotherboardUsbPort } => ({
              value: { usbVersion: "Usb20", usbType: "TypeA", portCount: 1 },
            })}
          />
        </div>
      </div>
    </CatalogCreateForm>
  );
}
