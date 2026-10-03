import { useState } from "react";
import {
  cpuCoolerKeys,
  createCpuCooler,
  type CpuCoolerListItem,
} from "@/api/catalog/cpu-coolers";
import {
  unsetCatalogItem,
  useCatalogCreate,
} from "@/components/catalog/catalog-create";
import {
  CatalogCreateForm,
  CatalogScalarFields,
} from "@/components/catalog/CatalogCreateForm";
import {
  useCatalogManufacturers,
  useCatalogSockets,
} from "@/hooks/use-catalog-manufacturers";
import {
  CpuCoolerBasicFields,
  AirCoolerFields,
  RadiatorFields,
  WaterBlockFields,
  FansFields,
} from "@/pages/catalog/cpu-coolers/CpuCoolerEditColumns";
import { Card, CardTitle, CardContent, CardHeader } from "@/components/ui/card";
import { SocketCheckboxGroup } from "@/pages/catalog/cpu-coolers/SocketCheckboxGroup";

const emptyCooler = unsetCatalogItem<CpuCoolerListItem>({
  id: "",
  name: "",
  manufacturerId: "",
  manufacturerName: "",
  type: "",
  coolerLengthMm: null,
  coolerWidthMm: null,
  coolerHeightMm: null,
  maxRamHeightMm: null,
  radiatorClass: null,
  radiatorLengthMm: null,
  radiatorWidthMm: null,
  radiatorHeightMm: null,
  waterBlockLengthMm: null,
  waterBlockWidthMm: null,
  waterBlockHeightMm: null,
  fanThicknessMm: null,
  fanWidthMm: null,
  fanHeightMm: null,
  fanCount: null,
});

export function CpuCoolerCreatePage() {
  const manufacturers = useCatalogManufacturers("cpucooler");
  const sockets = useCatalogSockets();
  const [item, setItem] = useState(emptyCooler);
  const [socketIds, setSocketIds] = useState<string[]>([]);
  const { saving, error, submit } = useCatalogCreate();

  return (
    <CatalogCreateForm
      title="New CPU cooler"
      backTo="/catalog/cpu-coolers"
      backLabel="Back to CPU coolers"
      saving={saving}
      error={error}
      onSubmit={() =>
        void submit({
          queryKey: cpuCoolerKeys.all,
          detailPath: (id) => `/catalog/cpu-coolers/${id}`,
          create: () =>
            createCpuCooler({
              ...item,
              sockets: sockets
                .filter((socket) => socketIds.includes(socket.id))
                .map((socket) => ({
                  socketId: socket.id,
                  socketName: socket.name,
                })),
            }),
        })
      }
    >
      <div className="catalog-create-columns">
        <div className="catalog-create-column">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <CatalogScalarFields
                fields={CpuCoolerBasicFields(manufacturers)}
                item={item}
                onChange={setItem}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Fans</CardTitle>
            </CardHeader>
            <CardContent>
              <CatalogScalarFields
                fields={FansFields()}
                item={item}
                onChange={setItem}
              />
            </CardContent>
          </Card>
        </div>
        <div className="catalog-create-column">
          {item.type === "Air" && (
            <Card>
              <CardHeader>
                <CardTitle>Dimensions</CardTitle>
              </CardHeader>
              <CardContent>
                <CatalogScalarFields
                  fields={AirCoolerFields()}
                  item={item}
                  onChange={setItem}
                />
              </CardContent>
            </Card>
          )}
          {item.type === "Water" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Water block</CardTitle>
                </CardHeader>
                <CardContent>
                  <CatalogScalarFields
                    fields={WaterBlockFields()}
                    item={item}
                    onChange={setItem}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Radiator</CardTitle>
                </CardHeader>
                <CardContent>
                  <CatalogScalarFields
                    fields={RadiatorFields()}
                    item={item}
                    onChange={setItem}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sockets</CardTitle>
          </CardHeader>
          <CardContent>
            <SocketCheckboxGroup
              sockets={sockets}
              selectedIds={socketIds}
              disabled={saving}
              onChange={setSocketIds}
            />
          </CardContent>
        </Card>
      </div>
    </CatalogCreateForm>
  );
}
