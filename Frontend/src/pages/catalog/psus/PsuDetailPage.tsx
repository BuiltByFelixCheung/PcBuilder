import { Link, useParams } from "react-router-dom";
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
import { usePsu } from "@/hooks/use-psus.ts";
import { AddToBuildButton } from "@/builds";
import { useAuth } from "@/auth/use-auth";

export function PsuDetailPage() {
  const { psuId } = useParams();
  const query = usePsu(psuId);
  const psu = query.data;
  const { isAdmin } = useAuth();

  if (query.isPending) {
    return <PageStatus>Loading PSU…</PageStatus>;
  }

  if (query.isError || !psu) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/psus">Back to PSUs</Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : "PSU not found."}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/psus">Back to PSUs</Link>
      </p>
      <h1>{psu.name}</h1>
      {!isAdmin && <AddToBuildButton productType="psu" partId={psu.id} />}
      <dl className="catalog-details">
        <div>
          <dt>Manufacturer</dt>
          <dd>{psu.manufacturerName}</dd>
        </div>
        <div>
          <dt>Wattage</dt>
          <dd>{psu.wattage} W</dd>
        </div>
        <div>
          <dt>Modularity</dt>
          <dd>{psu.modularity}</dd>
        </div>
        <div>
          <dt>Form factor</dt>
          <dd>{psu.formFactor}</dd>
        </div>
        <div>
          <dt>Length</dt>
          <dd>{psu.lengthMm} mm</dd>
        </div>
        <div>
          <dt>Width</dt>
          <dd>{psu.widthMm} mm</dd>
        </div>
        <div>
          <dt>Height</dt>
          <dd>{psu.heightMm} mm</dd>
        </div>
      </dl>

      <h2>Cables</h2>
      {psu.cables.length === 0 ? (
        <p className="catalog-empty">No cables.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Cables</TableHead>
              <TableHead>Connectors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {psu.cables.map((cable) => (
              <TableRow
                key={`${cable.type}-${cable.cablesCount}-${cable.connectorsCount}`}
              >
                <TableCell>{cable.type}</TableCell>
                <TableCell>{cable.cablesCount}</TableCell>
                <TableCell>{cable.connectorsCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
