import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { useCpu } from "@/hooks/use-cpus.ts";
import { useCpuFilterOptions } from "@/hooks/use-cpu-filter-options";
import { builderHref, usePcBuild } from "@/builds";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/use-auth";
import { useState } from "react";
import { CatalogEditDialog } from "@/components/catalog/CatalogEditDialog";
import { ChildCollectionDialog } from "@/components/catalog/ChildCollectionDialog";
import {
  cpuKeys,
  updateCpu,
  updateCpuRamCompats,
  updateCpuSupportChipsets,
  cpuListItem,
  type CpuRamCompat,
  type CpuSupportChipset,
} from "@/api/catalog/cpus.ts";
import {
  listChipsets,
  masterDataKeys,
  type ChipsetOption,
} from "@/api/master-data";
import {
  ramCompatColumns,
  supportChipsetColumns,
} from "@/pages/catalog/cpus/CpuChildColumns";
import { CpuFields } from "@/pages/catalog/cpus/CpuEditColumns";

export function CpuDetailPage() {
  const { cpuId } = useParams();
  const query = useCpu(cpuId);
  const cpu = query.data;
  const currentBuild = usePcBuild();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editingRam, setEditingRam] = useState(false);
  const [editingChipsets, setEditingChipsets] = useState(false);
  const { manufacturers, sockets, series } = useCpuFilterOptions();
  const chipsetsQuery = useQuery({
    queryKey: masterDataKeys.chipsets,
    queryFn: listChipsets,
  });
  const chipsets = chipsetsQuery.data ?? [];

  if (query.isPending) {
    return <PageStatus>Loading CPU…</PageStatus>;
  }

  if (query.isError || !cpu) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/cpus">Back to CPUs</Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : "CPU not found."}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/cpus">Back to CPUs</Link>
      </p>
      <div className="catalog-detail-title">
        <h1>{cpu.name}</h1>
        {!isAdmin && (
          <Button
            onClick={() => {
              if (!currentBuild.cpuId || currentBuild.cpuId !== cpu.id)
                currentBuild.addToBuild("cpu", cpu.id);
              navigate(builderHref(currentBuild.sourceId));
            }}
          >
            Add to Build
          </Button>
        )}
        {isAdmin && (
          <Button type="button" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>
      {editing ? (
        <CatalogEditDialog
          title="Edit CPU"
          item={cpuListItem(cpu)}
          fields={CpuFields(manufacturers, series, sockets)}
          onClose={() => setEditing(false)}
          onSave={async (item) => {
            await updateCpu(item);
            await queryClient.invalidateQueries({
              queryKey: cpuKeys.detail(cpu.id),
            });
          }}
        />
      ) : null}
      {editingRam ? (
        <ChildCollectionDialog<CpuRamCompat>
          title="Edit RAM compatibility"
          rows={cpu.ramCompats}
          columns={ramCompatColumns}
          createRow={() => ({
            ddrGeneration: "Ddr5",
            ramModuleCount: 1,
            ramRank: "SingleRank",
            maxSpeedMts: 4800,
          })}
          onClose={() => setEditingRam(false)}
          onSave={async (rows) => {
            await updateCpuRamCompats(cpu.id, rows);
            await queryClient.invalidateQueries({
              queryKey: cpuKeys.detail(cpu.id),
            });
          }}
        />
      ) : null}
      {editingChipsets ? (
        <ChildCollectionDialog<CpuSupportChipset>
          title="Edit supported chipsets"
          rows={cpu.supportChipsets}
          columns={supportChipsetColumns(
            chipsetOptions(chipsets, cpu.supportChipsets, cpu.manufacturerId),
          )}
          createRow={() => {
            const chipset = chipsets.find(
              (option) => option.manufacturerId === cpu.manufacturerId,
            );
            return {
              chipsetId: chipset?.id ?? "",
              chipsetName: chipset?.name ?? "",
              requiresBiosUpdate: false,
            };
          }}
          onClose={() => setEditingChipsets(false)}
          onSave={async (rows) => {
            await updateCpuSupportChipsets(cpu.id, rows);
            await queryClient.invalidateQueries({
              queryKey: cpuKeys.detail(cpu.id),
            });
          }}
        />
      ) : null}
      <div className="catalog-table-pair">
        <div>
          <div className="catalog-detail-subtitle">
            <h2>Basic information</h2>
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Manufacturer
                </TableHead>
                <TableCell>{cpu.manufacturerName}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Series
                </TableHead>
                <TableCell>{cpu.seriesName}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Socket
                </TableHead>
                <TableCell>{cpu.socketName}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Max memory
                </TableHead>
                <TableCell>{cpu.maxMemoryGb} GB</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  TDP
                </TableHead>
                <TableCell>{cpu.thermalDesignPower} W</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Power
                </TableHead>
                <TableCell>{cpu.powerConsumptionWatts} W</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Integrated graphics
                </TableHead>
                <TableCell>{cpu.integratedGraphics ? "Yes" : "No"}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Stock cooler
                </TableHead>
                <TableCell>
                  {cpu.includedStockCooler ? "Included" : "Not included"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div>
          <div className="catalog-detail-subtitle">
            <h2>RAM compatibility</h2>
            {isAdmin && (
              <Button type="button" onClick={() => setEditingRam(true)}>
                Edit RAM
              </Button>
            )}
          </div>
          {cpu.ramCompats.length === 0 ? (
            <p>No RAM compatibility entries.</p>
          ) : (
            <Table>
              <TableBody>
                {cpu.ramCompats.map((compat) => (
                  <TableRow
                    key={`${compat.ddrGeneration}-${compat.ramModuleCount}-${compat.ramRank}`}
                  >
                    <TableHead className="table-stub" scope="row">
                      <span>{compat.ddrGeneration.replace("Ddr", "DDR")}</span>{" "}
                      {compat.ramRank === "DualRank" ? "Dual" : "Single"} X{" "}
                      {compat.ramModuleCount}
                    </TableHead>
                    <TableCell>Max {compat.maxSpeedMts} MT/s</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="catalog-detail-subtitle">
            <h2>Supported chipsets</h2>
            {isAdmin && (
              <Button type="button" onClick={() => setEditingChipsets(true)}>
                Edit chipsets
              </Button>
            )}
          </div>
          <p>
            {cpu.supportChipsets
              .map((chipset) =>
                chipset.requiresBiosUpdate
                  ? `${chipset.chipsetName}*`
                  : chipset.chipsetName,
              )
              .join(", ")}
          </p>
          <br />
          <p>
            <b>Note:</b> * indicates that the chipset requires a BIOS update.
          </p>
        </div>
      </div>
    </section>
  );
}

function chipsetOptions(
  chipsets: ChipsetOption[],
  selected: CpuSupportChipset[],
  manufacturerId: string,
) {
  const options = chipsets.filter(
    (chipset) => chipset.manufacturerId === manufacturerId,
  );
  for (const chipset of selected) {
    if (options.some((option) => option.id === chipset.chipsetId)) continue;
    if (chipsets.some((option) => option.id === chipset.chipsetId)) continue;
    options.push({
      id: chipset.chipsetId,
      name: chipset.chipsetName,
      manufacturerId,
      manufacturerName: "",
      socketId: "",
      socketName: "",
    });
  }
  return options;
}
