import { Link, useParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus.tsx";

import { useMemory } from "@/hooks/use-memories.ts";

export function RamDetailPage() {
  const { ramId } = useParams();
  const query = useMemory(ramId);
  const ram = query.data;

  if (query.isPending) {
    return <PageStatus>Loading RAM…</PageStatus>;
  }

  if (query.isError || !ram) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/rams">Back to RAMs</Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : "RAM not found."}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/rams">Back to RAMs</Link>
      </p>
      <h1>{ram.name}</h1>
      <dl className="catalog-details">
        <div>
          <dt>Manufacturer</dt>
          <dd>{ram.manufacturerName}</dd>
        </div>
        <div>
          <dt>Color</dt>
          <dd>{ram.color}</dd>
        </div>
        <div>
          <dt>DDR Generation</dt>
          <dd>{ram.ddrGeneration}</dd>
        </div>
        <div>
          <dt>RAM Form Factor</dt>
          <dd>{ram.ramFormFactor}</dd>
        </div>
        <div>
          <dt>RAM Rank</dt>
          <dd>{ram.ramRank}</dd>
        </div>
        <div>
          <dt>Memory Size Per Stick</dt>
          <dd>{ram.memorySizePerStickGb} GB</dd>
        </div>
        <div>
          <dt>Total Memory Size</dt>
          <dd>{ram.totalMemorySizeGb} GB</dd>
        </div>
        <div>
          <dt>Modules Count</dt>
          <dd>{ram.modulesCount}</dd>
        </div>
        <div>
          <dt>Max Memory Speed</dt>
          <dd>{ram.maxMemorySpeedMts} MHz</dd>
        </div>
        <div>
          <dt>Height</dt>
          <dd>{ram.heightMm} mm</dd>
        </div>
      </dl>
    </section>
  );
}
