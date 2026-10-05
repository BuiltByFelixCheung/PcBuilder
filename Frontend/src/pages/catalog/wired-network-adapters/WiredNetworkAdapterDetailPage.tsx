import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus.tsx";
import { useWiredNetworkAdapter } from "@/hooks/use-wired-network-adapters.ts";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";
import { AddToBuildButton } from "@/builds";
import { useAuth } from "@/auth/use-auth";
import { CatalogEditDialog } from "@/components/catalog/CatalogEditDialog";
import { Button } from "@/components/ui/button";
import {
  updateWiredNetworkAdapter,
  wiredNetworkAdapterKeys,
} from "@/api/catalog/wired-network-adapters";
import { WiredNetworkAdapterFields } from "@/pages/catalog/wired-network-adapters/WiredNetworkAdapterEditColumns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";

export function WiredNetworkAdapterDetailPage() {
  const { wiredNetworkAdapterId } = useParams();
  const query = useWiredNetworkAdapter(wiredNetworkAdapterId);
  const adapter = query.data;
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const manufacturers = useCatalogManufacturers("wirednetworkadapter");

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
      <div className="catalog-detail-title">
        <h1>{adapter.name}</h1>
        {!isAdmin && (
          <AddToBuildButton
            productType="wirednetworkadapter"
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
          title="Edit wired network adapter"
          item={adapter}
          fields={WiredNetworkAdapterFields(manufacturers)}
          onClose={() => setEditing(false)}
          onSave={async (item) => {
            await updateWiredNetworkAdapter(item);
            await queryClient.invalidateQueries({
              queryKey: wiredNetworkAdapterKeys.detail(adapter.id),
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
              {adapter.hostInterface === "Usb" && (
                <>
                  <TableRow>
                    <TableHead className="table-stub" scope="row">
                      USB version
                    </TableHead>
                    <TableCell>{adapter.usbVersion ?? "—"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="table-stub" scope="row">
                      USB type
                    </TableHead>
                    <TableCell>{adapter.usbType ?? "—"}</TableCell>
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
