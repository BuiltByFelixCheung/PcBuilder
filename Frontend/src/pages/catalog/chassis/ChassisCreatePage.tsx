import { useState } from "react";
import {
  chassisKeys,
  createChassis,
  type ChassisDriveBay,
  type ChassisFanMount,
  type ChassisListItem,
  type ChassisPcieSlot,
  type ChassisRadiator,
} from "@/api/catalog/chassis";
import type { MbFormFactor, PsuFormFactor } from "@/api/enums";
import {
  unwrapCollectionValues,
  useCatalogCreate,
} from "@/components/catalog/catalog-create";
import {
  CatalogCollectionEditor,
  CatalogCreateForm,
  CatalogScalarFields,
} from "@/components/catalog/CatalogCreateForm";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers";
import { ChassisFields } from "@/pages/catalog/chassis/ChassisEditColumns";
import {
  driveBayColumns,
  fanMountColumns,
  mbFormFactorColumns,
  pcieSlotColumns,
  psuFormFactorColumns,
  radiatorColumns,
} from "@/pages/catalog/chassis/ChassisChildColumns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const emptyChassis: ChassisListItem = {
  id: "",
  name: "",
  manufacturerId: "",
  manufacturerName: "",
  lengthMm: 0,
  widthMm: 0,
  heightMm: 0,
  motherboardMaxWidthMm: 0,
  motherboardMaxHeightMm: 0,
  maxCpuCoolerHeightMm: 0,
  maxGraphicsCardLengthMm: 0,
  maxPsuLengthMm: 0,
};

export function ChassisCreatePage() {
  const manufacturers = useCatalogManufacturers("chassis");
  const [item, setItem] = useState(emptyChassis);
  const [mbFormFactors, setMbFormFactors] = useState<
    { key: string; value: { value: MbFormFactor } }[]
  >([]);
  const [psuFormFactors, setPsuFormFactors] = useState<
    { key: string; value: { value: PsuFormFactor } }[]
  >([]);
  const [pcieSlots, setPcieSlots] = useState<
    { key: string; value: { value: ChassisPcieSlot } }[]
  >([]);
  const [fanMounts, setFanMounts] = useState<
    { key: string; value: { value: ChassisFanMount } }[]
  >([]);
  const [radiators, setRadiators] = useState<
    { key: string; value: { value: ChassisRadiator } }[]
  >([]);
  const [driveBays, setDriveBays] = useState<
    { key: string; value: { value: ChassisDriveBay } }[]
  >([]);
  const { saving, error, submit } = useCatalogCreate();

  return (
    <CatalogCreateForm
      title="New chassis"
      backTo="/catalog/chassis"
      backLabel="Back to chassis"
      saving={saving}
      error={error}
      onSubmit={() =>
        void submit({
          queryKey: chassisKeys.all,
          detailPath: (id) => `/catalog/chassis/${id}`,
          create: () =>
            createChassis({
              ...item,
              mbFormFactors: unwrapCollectionValues(mbFormFactors),
              psuFormFactors: unwrapCollectionValues(psuFormFactors),
              pcieSlots: unwrapCollectionValues(pcieSlots),
              fanMounts: unwrapCollectionValues(fanMounts),
              radiators: unwrapCollectionValues(radiators),
              driveBays: unwrapCollectionValues(driveBays),
            }),
        })
      }
    >
      <div className="catalog-create-columns">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <CatalogScalarFields
              fields={ChassisFields(manufacturers)}
              item={item}
              onChange={setItem}
            />
          </CardContent>
        </Card>
        <div className="catalog-create-column">
          <CatalogCollectionEditor
            title="Motherboard form factors"
            columns={mbFormFactorColumns}
            rows={mbFormFactors}
            onChange={setMbFormFactors}
            disabled={saving}
            createRow={(): { value: MbFormFactor } => ({ value: "Atx" })}
          />
          <CatalogCollectionEditor
            title="PCIe slots"
            columns={pcieSlotColumns}
            rows={pcieSlots}
            onChange={setPcieSlots}
            disabled={saving}
            createRow={(): { value: ChassisPcieSlot } => ({
              value: {
                orientation: "Horizontal",
                lowProfileSlots: false,
                slotCount: 1,
              },
            })}
          />
          <CatalogCollectionEditor
            title="Radiators"
            columns={radiatorColumns}
            rows={radiators}
            onChange={setRadiators}
            disabled={saving}
            createRow={(): { value: ChassisRadiator } => ({
              value: { location: "Front", length: "Mm120", radiatorCount: 1 },
            })}
          />
        </div>
        <div className="catalog-create-column">
          <CatalogCollectionEditor
            title="PSU form factors"
            columns={psuFormFactorColumns}
            rows={psuFormFactors}
            onChange={setPsuFormFactors}
            disabled={saving}
            createRow={(): { value: PsuFormFactor } => ({ value: "Atx" })}
          />
          <CatalogCollectionEditor
            title="Fan mounts"
            columns={fanMountColumns}
            rows={fanMounts}
            onChange={setFanMounts}
            disabled={saving}
            createRow={(): { value: ChassisFanMount } => ({
              value: {
                location: "Front",
                singleDiameterOnly: false,
                options: [],
              },
            })}
          />
          <CatalogCollectionEditor
            title="Drive bays"
            columns={driveBayColumns}
            rows={driveBays}
            onChange={setDriveBays}
            disabled={saving}
            createRow={(): { value: ChassisDriveBay } => ({
              value: { formFactors: ["Inch35"], slotCount: 1 },
            })}
          />
        </div>
      </div>
    </CatalogCreateForm>
  );
}
