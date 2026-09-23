import { Link, useParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus.tsx";
import { useWiredNetworkAdapter } from "@/hooks/use-wired-network-adapters.ts";
import { AddToBuildButton } from "@/builds";
import { useAuth } from "@/auth/useAuth";

export function WiredNetworkAdapterDetailPage() {
  const { wiredNetworkAdapterId } = useParams();
  const query = useWiredNetworkAdapter(wiredNetworkAdapterId);
  const adapter = query.data;
  const { isAdmin } = useAuth();
  
  if (query.isPending) {
    return <PageStatus>Loading wired network adapter…</PageStatus>;
  }

  if (query.isError || !adapter) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/wired-network-adapters">
            Back to Wired Network Adapters
          </Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : "Wired network adapter not found."}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/wired-network-adapters">
          Back to Wired Network Adapters
        </Link>
      </p>
      <h1>{adapter.name}</h1>
      {!isAdmin && <AddToBuildButton productType="wirednetworkadapter" partId={adapter.id} />}
      <dl className="catalog-details">
        <div>
          <dt>Manufacturer</dt>
          <dd>{adapter.manufacturerName}</dd>
        </div>
        <div>
          <dt>Host interface</dt>
          <dd>{adapter.hostInterface}</dd>
        </div>
        <div>
          <dt>Max speed</dt>
          <dd>{adapter.maxSpeedMbps} Mbps</dd>
        </div>
        <div>
          <dt>PCIe slot</dt>
          <dd>{adapter.pcieSlotType ?? "—"}</dd>
        </div>
        <div>
          <dt>USB version</dt>
          <dd>{adapter.usbVersion ?? "—"}</dd>
        </div>
        <div>
          <dt>USB type</dt>
          <dd>{adapter.usbType ?? "—"}</dd>
        </div>
      </dl>
    </section>
  );
}
