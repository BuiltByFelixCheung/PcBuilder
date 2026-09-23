import { Link, useNavigate, useParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus.tsx";

import { useMemory } from "@/hooks/use-memories.ts";
import { Button } from "@/components/ui/button";
import { builderHref, usePcBuild } from "@/builds";
import { useAuth } from "@/auth/useAuth";

export function RamDetailPage() {
  const { memoryId } = useParams();
  const query = useMemory(memoryId);
  const ram = query.data;
  const currentBuild = usePcBuild();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  if (query.isPending) {
    return <PageStatus>Loading RAM…</PageStatus>;
  }

  if (query.isError || !ram) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/memories">Back to RAM</Link>
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
        <Link to="/catalog/memories">Back to RAM</Link>
      </p>
      <h1>{ram.name}</h1>
      {!isAdmin && (
        <Button
          onClick={() => {
            if (!currentBuild.ramKitId || currentBuild.ramKitId !== ram.id)
              currentBuild.addToBuild("ram", ram.id);
            navigate(builderHref(currentBuild.sourceId));
          }}
        >
          Add to Build
        </Button>
      )}
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
