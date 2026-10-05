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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";

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
                <TableCell>{adapter.manufacturerName}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Wi-Fi
                </TableHead>
                <TableCell>
                  {formatWifiStandard(adapter.wifiStandard)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Bluetooth
                </TableHead>
                <TableCell>
                  {adapter.bluetoothVersion
                    ? formatBluetoothVersion(adapter.bluetoothVersion)
                    : "—"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Host interface
                </TableHead>
                <TableCell>{adapter.hostInterface}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Max speed
                </TableHead>
                <TableCell>{adapter.maxSpeedMbps} Mbps</TableCell>
              </TableRow>
              {adapter.maxSpeedMbps5G && (
                <TableRow>
                  <TableHead className="table-stub" scope="row">
                    5 GHz max
                  </TableHead>
                  <TableCell>{adapter.maxSpeedMbps5G} Mbps</TableCell>
                </TableRow>
              )}
              {adapter.maxSpeedMbps6G && (
                <TableRow>
                  <TableHead className="table-stub" scope="row">
                    6 GHz max
                  </TableHead>
                  <TableCell>{adapter.maxSpeedMbps6G} Mbps</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div>
          <div className="catalog-detail-subtitle">
            <h2>Interface</h2>
          </div>
          <Table>
            <TableBody>
              {adapter.hostInterface === "Pcie" && (
                <TableRow>
                  <TableHead className="table-stub" scope="row">
                    PCIe slot
                  </TableHead>
                  <TableCell>{adapter.pcieSlotType}</TableCell>
                </TableRow>
              )}
              {adapter.hostInterface === "M2" && (
                <>
                  <TableRow>
                    <TableHead className="table-stub" scope="row">
                      M.2 key
                    </TableHead>
                    <TableCell>{adapter.key ?? "—"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="table-stub" scope="row">
                      M.2 form factor
                    </TableHead>
                    <TableCell>
                      {adapter.m2FormFactor
                        ? formatM2FormFactor(adapter.m2FormFactor)
                        : "—"}
                    </TableCell>
                  </TableRow>
                </>
              )}
              {adapter.hostInterface === "Usb" && (
                <>
                  <TableRow>
                    <TableHead className="table-stub" scope="row">
                      USB version
                    </TableHead>
                    <TableCell>{adapter.usbVersion}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="table-stub" scope="row">
                      USB type
                    </TableHead>
                    <TableCell>{adapter.usbType}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
