import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  cpuKeys,
  createCpu,
  type CpuListItem,
  type CpuRamCompat,
  type CpuSupportChipset,
} from "@/api/catalog/cpus";
import { listChipsets, masterDataKeys } from "@/api/master-data";
import {
  collectionValues,
  useCatalogCreate,
} from "@/components/catalog/catalog-create";
import {
  CatalogCollectionEditor,
  CatalogCreateForm,
  CatalogScalarFields,
} from "@/components/catalog/CatalogCreateForm";
import { useCpuFilterOptions } from "@/hooks/use-cpu-filter-options";
import { CpuFields } from "@/pages/catalog/cpus/CpuEditColumns";
import {
  ramCompatColumns,
  supportChipsetColumns,
} from "@/pages/catalog/cpus/CpuChildColumns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const emptyCpu: CpuListItem = {
  id: "",
  name: "",
  manufacturerId: "",
  manufacturerName: "",
  seriesId: "",
  seriesName: "",
  socketId: "",
  socketName: "",
  maxMemoryGb: 0,
  integratedGraphics: false,
  includedStockCooler: false,
  thermalDesignPower: 0,
  powerConsumptionWatts: 0,
};

export function CpuCreatePage() {
  const { manufacturers, sockets, series } = useCpuFilterOptions();
  const chipsets = useQuery({
    queryKey: masterDataKeys.chipsets,
    queryFn: listChipsets,
  });
  const chipsetOptions = chipsets.data ?? [];
  const [item, setItem] = useState(emptyCpu);
  const [ramCompats, setRamCompats] = useState<
    { key: string; value: CpuRamCompat }[]
  >([]);
  const [supportChipsets, setSupportChipsets] = useState<
    { key: string; value: CpuSupportChipset }[]
  >([]);
  const manufacturerChipsets = chipsetOptions.filter(
    (chipset) => chipset.manufacturerId === item.manufacturerId,
  );
  const { saving, error, submit } = useCatalogCreate();

  return (
    <CatalogCreateForm
      title="New CPU"
      backTo="/catalog/cpus"
      backLabel="Back to CPUs"
      saving={saving}
      error={error}
      onSubmit={() =>
        void submit({
          queryKey: cpuKeys.all,
          detailPath: (id) => `/catalog/cpus/${id}`,
          create: () =>
            createCpu({
              ...item,
              ramCompats: collectionValues(ramCompats),
              supportChipsets: collectionValues(supportChipsets),
            }),
        })
      }
    >
      <div className="grid grid-cols-1 items-start gap-8 *:min-w-0 min-[1025px]:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <CatalogScalarFields
              fields={CpuFields(manufacturers, series, sockets)}
              item={item}
              onChange={(next) => {
                setItem(next);
                if (next.manufacturerId === item.manufacturerId) return;
                setSupportChipsets((rows) =>
                  rows.map((row) =>
                    chipsetOptions.some(
                      (chipset) =>
                        chipset.id === row.value.chipsetId &&
                        chipset.manufacturerId === next.manufacturerId,
                    )
                      ? row
                      : {
                          ...row,
                          value: {
                            ...row.value,
                            chipsetId: "",
                            chipsetName: "",
                          },
                        },
                  ),
                );
              }}
            />
          </CardContent>
        </Card>
        <CatalogCollectionEditor
          title="RAM compatibility"
          columns={ramCompatColumns}
          rows={ramCompats}
          onChange={setRamCompats}
          disabled={saving}
          createRow={(): CpuRamCompat => ({
            ddrGeneration: "Ddr5",
            ramModuleCount: 1,
            ramRank: "SingleRank",
            maxSpeedMts: 4800,
          })}
        />
        <CatalogCollectionEditor
          title="Supported chipsets"
          columns={supportChipsetColumns(manufacturerChipsets)}
          rows={supportChipsets}
          onChange={setSupportChipsets}
          disabled={saving}
          createRow={(): CpuSupportChipset => ({
            chipsetId: manufacturerChipsets[0]?.id ?? "",
            chipsetName: manufacturerChipsets[0]?.name ?? "",
            requiresBiosUpdate: false,
          })}
        />
      </div>
    </CatalogCreateForm>
  );
}
