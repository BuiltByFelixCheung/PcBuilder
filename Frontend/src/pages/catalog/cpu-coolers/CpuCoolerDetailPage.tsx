import { Link, useNavigate, useParams } from "react-router-dom";
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
import { useCpuCooler } from "@/hooks/use-cpu-coolers.ts";
import { formatRadiatorLength } from "@/api/enums";
import { builderHref, usePcBuild } from "@/builds";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/useAuth";

export function CpuCoolerDetailPage() {
  const { cpuCoolerId } = useParams();
  const query = useCpuCooler(cpuCoolerId);
  const cooler = query.data;
  const currentBuild = usePcBuild();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  if (query.isPending) {
    return <PageStatus>Loading CPU cooler…</PageStatus>;
  }

  if (query.isError || !cooler) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/cpu-coolers">Back to CPU Coolers</Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : "CPU cooler not found."}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/cpu-coolers">Back to CPU Coolers</Link>
      </p>
      <h1>{cooler.name}</h1>
      {!isAdmin && (
        <Button
          onClick={() => {
            if (
              !currentBuild.cpuCoolerId ||
              currentBuild.cpuCoolerId !== cooler.id
            )
              currentBuild.addToBuild("cpucooler", cooler.id);
            navigate(builderHref(currentBuild.sourceId));
          }}
        >
          Add to Build
        </Button>
      )}
      <dl className="catalog-details">
        <div>
          <dt>Manufacturer</dt>
          <dd>{cooler.manufacturerName}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{cooler.type}</dd>
        </div>
        <div>
          <dt>Max TDP</dt>
          <dd>{cooler.maxTdp} W</dd>
        </div>
        <div>
          <dt>Height</dt>
          <dd>
            {cooler.coolerHeightMm != null
              ? `${cooler.coolerHeightMm} mm`
              : "—"}
          </dd>
        </div>
        <div>
          <dt>Max RAM height</dt>
          <dd>
            {cooler.maxRamHeightMm != null
              ? `${cooler.maxRamHeightMm} mm`
              : "—"}
          </dd>
        </div>
        <div>
          <dt>Radiator</dt>
          <dd>
            {cooler.radiatorLength
              ? formatRadiatorLength(cooler.radiatorLength)
              : "—"}
          </dd>
        </div>
      </dl>

      <h2>Sockets</h2>
      {cooler.sockets.length === 0 ? (
        <p className="catalog-empty">No supported sockets.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Socket</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cooler.sockets.map((socket) => (
              <TableRow key={socket.socketId}>
                <TableCell>{socket.socketName || socket.socketId}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
