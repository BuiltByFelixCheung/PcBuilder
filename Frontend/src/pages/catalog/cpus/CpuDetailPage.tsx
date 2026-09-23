import { Link, useParams, useNavigate } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCpu } from "@/hooks/use-cpus.ts";
import { builderHref, usePcBuild } from "@/builds";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/useAuth";

export function CpuDetailPage() {
  const { cpuId } = useParams();
  const query = useCpu(cpuId);
  const cpu = query.data;
  const currentBuild = usePcBuild();
  const navigate = useNavigate();

  const { isAdmin } = useAuth();

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
      <dl className="catalog-details">
        <div>
          <dt>Manufacturer</dt>
          <dd>{cpu.manufacturerName}</dd>
        </div>
        <div>
          <dt>Series</dt>
          <dd>{cpu.seriesName}</dd>
        </div>
        <div>
          <dt>Socket</dt>
          <dd>{cpu.socketName}</dd>
        </div>
        <div>
          <dt>Max memory</dt>
          <dd>{cpu.maxMemoryGb} GB</dd>
        </div>
        <div>
          <dt>TDP</dt>
          <dd>{cpu.thermalDesignPower} W</dd>
        </div>
        <div>
          <dt>Power</dt>
          <dd>{cpu.powerConsumptionWatts} W</dd>
        </div>
        <div>
          <dt>Integrated graphics</dt>
          <dd>{cpu.integratedGraphics ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt>Stock cooler</dt>
          <dd>{cpu.includedStockCooler ? "Included" : "Not included"}</dd>
        </div>
      </dl>

      <h2>RAM compatibility</h2>
      {cpu.ramCompats.length === 0 ? (
        <p className="catalog-empty">No RAM compatibility entries.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>DDR</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Max speed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cpu.ramCompats.map((compat) => (
              <TableRow
                key={`${compat.ddrGeneration}-${compat.ramModuleCount}-${compat.ramRank}`}
              >
                <TableCell>
                  {compat.ddrGeneration.replace("Ddr", "DDR")}
                </TableCell>
                <TableCell>{compat.ramModuleCount}</TableCell>
                <TableCell>
                  {compat.ramRank === "DualRank" ? "Dual" : "Single"}
                </TableCell>
                <TableCell>{compat.maxSpeedMts} MT/s</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <h2>Supported chipsets</h2>
      {cpu.supportChipsets.length === 0 ? (
        <p className="catalog-empty">No supported chipsets.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chipset</TableHead>
              <TableHead>BIOS update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cpu.supportChipsets.map((chipset) => (
              <TableRow key={chipset.chipsetId}>
                <TableCell>{chipset.chipsetName}</TableCell>
                <TableCell>
                  {chipset.requiresBiosUpdate ? "Required" : "Not required"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
