import { Link, useNavigate, useParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus.tsx";

import { useGraphicsCard } from "@/hooks/use-graphics-cards.ts";
import { builderHref, usePcBuild } from "@/builds";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/useAuth";

export function GraphicsCardDetailPage() {
  const { graphicsCardId } = useParams();
  const query = useGraphicsCard(graphicsCardId);
  const graphicsCard = query.data;
  const currentBuild = usePcBuild();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  if (query.isPending) {
    return <PageStatus>Loading Graphics Card…</PageStatus>;
  }

  if (query.isError || !graphicsCard) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/graphics-cards">Back to Graphics Cards</Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : "Graphics Card not found."}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/graphics-cards">Back to Graphics Cards</Link>
      </p>
      <h1>{graphicsCard.name}</h1>
      {!isAdmin && (
        <Button
          onClick={() => {
            if (
              !currentBuild.graphicsCardId ||
              currentBuild.graphicsCardId !== graphicsCard.id
            )
              currentBuild.addToBuild("graphicscard", graphicsCard.id);
            navigate(builderHref(currentBuild.sourceId));
          }}
        >
          Add to Build
        </Button>
      )}
      <dl className="catalog-details">
        <div>
          <dt>Manufacturer</dt>
          <dd>{graphicsCard.manufacturerName}</dd>
        </div>
        <div>
          <dt>Video Memory</dt>
          <dd>{graphicsCard.videoMemoryGb} GB</dd>
        </div>
        <div>
          <dt>Slot Width</dt>
          <dd>{graphicsCard.pcieSlotsUsed}</dd>
        </div>
        <div>
          <dt>PCIe Generation</dt>
          <dd>{graphicsCard.pcieGeneration}</dd>
        </div>
        <div>
          <dt>Low Profile</dt>
          <dd>{graphicsCard.isLowProfile ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt>Length</dt>
          <dd>{graphicsCard.lengthMm} mm</dd>
        </div>
        <div>
          <dt>Width</dt>
          <dd>{graphicsCard.widthMm} mm</dd>
        </div>
        <div>
          <dt>Height</dt>
          <dd>{graphicsCard.heightMm} mm</dd>
        </div>
        <div>
          <dt>Power Consumption</dt>
          <dd>{graphicsCard.powerConsumptionWatts} W</dd>
        </div>
        <div>
          <dt>Power Connectors</dt>
          <dd>
            {graphicsCard.powerConnectorType} x{" "}
            {graphicsCard.powerConnectorCount}
          </dd>
        </div>
      </dl>
      <h1>{graphicsCard.gpuName}</h1>
      <dl className="catalog-details">
        <div>
          <dt>Manufacturer</dt>
          <dd>{graphicsCard.gpuManufacturerName}</dd>
        </div>
        <div>
          <dt>Series</dt>
          <dd>{graphicsCard.gpuSeriesName}</dd>
        </div>
      </dl>
    </section>
  );
}
