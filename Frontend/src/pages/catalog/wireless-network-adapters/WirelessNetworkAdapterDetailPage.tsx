import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus.tsx";
import { useWirelessNetworkAdapter } from "@/hooks/use-wireless-network-adapters.ts";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";
import { AddToBuildButton } from "@/builds";
import {
  formatBluetoothVersion,
  formatM2FormFactor,
  formatWifiStandard,
} from "@/api/enums";
import { useAuth } from "@/auth/use-auth";
import { CatalogEditDialog } from "@/components/catalog/CatalogEditDialog";
import { Button } from "@/components/ui/button";
import {
  updateWirelessNetworkAdapter,
  wirelessNetworkAdapterKeys,
} from "@/api/catalog/wireless-network-adapters";
import { WirelessNetworkAdapterFields } from "@/pages/catalog/wireless-network-adapters/WirelessNetworkAdapterEditColumns";

export function WirelessNetworkAdapterDetailPage() {
  const { wirelessNetworkAdapterId } = useParams();
  const query = useWirelessNetworkAdapter(wirelessNetworkAdapterId);
  const adapter = query.data;
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const manufacturers = useCatalogManufacturers("wirelessnetworkadapter");

  if (query.isPending) {
    return <PageStatus>Loading wireless network adapter…</PageStatus>;
  }

  if (query.isError || !adapter) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/wireless-network-adapters">
            Back to Wireless Network Adapters
          </Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : "Wireless network adapter not found."}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/wireless-network-adapters">
          Back to Wireless Network Adapters
        </Link>
      </p>
      <div className="catalog-detail-title">
        <h1>{adapter.name}</h1>
        {!isAdmin && (
          <AddToBuildButton
            productType="wirelessnetworkadapter"
            partId={adapter.id}
          />
        )}
        {isAdmin && (
          <Button type="button" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>
      {editing ? (
        <CatalogEditDialog
          title="Edit wireless network adapter"
          item={adapter}
          fields={WirelessNetworkAdapterFields(manufacturers)}
          onClose={() => setEditing(false)}
          onSave={async (item) => {
            await updateWirelessNetworkAdapter(item);
            await queryClient.invalidateQueries({
              queryKey: wirelessNetworkAdapterKeys.detail(adapter.id),
            });
          }}
        />
      ) : null}
      <dl className="catalog-details">
        <div>
          <dt>Manufacturer</dt>
          <dd>{adapter.manufacturerName}</dd>
        </div>
        <div>
          <dt>Wi-Fi</dt>
          <dd>{formatWifiStandard(adapter.wifiStandard)}</dd>
        </div>
        <div>
          <dt>Bluetooth</dt>
          <dd>
            {adapter.bluetoothVersion
              ? formatBluetoothVersion(adapter.bluetoothVersion)
              : "—"}
          </dd>
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
          <dt>5 GHz max</dt>
          <dd>
            {adapter.maxSpeedMbps5G != null
              ? `${adapter.maxSpeedMbps5G} Mbps`
              : "—"}
          </dd>
        </div>
        <div>
          <dt>6 GHz max</dt>
          <dd>
            {adapter.maxSpeedMbps6G != null
              ? `${adapter.maxSpeedMbps6G} Mbps`
              : "—"}
          </dd>
        </div>
        <div>
          <dt>PCIe slot</dt>
          <dd>{adapter.pcieSlotType ?? "—"}</dd>
        </div>
        <div>
          <dt>M.2 key</dt>
          <dd>{adapter.key ?? "—"}</dd>
        </div>
        <div>
          <dt>M.2 form factor</dt>
          <dd>
            {adapter.m2FormFactor
              ? formatM2FormFactor(adapter.m2FormFactor)
              : "—"}
          </dd>
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
