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
import { enumText, ui } from "@/i18n/translate-enum";
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
    return <PageStatus>{ui.empty("loading", { entity: ui.entity("wiredNetworkAdapter") })}</PageStatus>;
  }

  if (query.isError || !adapter) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/wired-network-adapters">
            {ui.empty("backTo", { entity: ui.nav("products.wiredNetworkAdapters") })}
          </Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : ui.empty("wiredAdapterNotFound")}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/wired-network-adapters">
            {ui.empty("backTo", { entity: ui.nav("products.wiredNetworkAdapters") })}
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
            {ui.action("edit")}
          </Button>
        )}
      </div>
      {editing ? (
        <CatalogEditDialog
          title={ui.dialog("editWiredNetworkAdapter")}
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
            <h2>{ui.section("basicInformation")}</h2>
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("manufacturer")}</TableHead>
                <TableCell>{adapter.manufacturerName}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("hostInterface")}</TableHead>
                <TableCell>
                  {enumText.ethernetInterface(adapter.hostInterface)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("maxSpeed")}</TableHead>
                <TableCell>{adapter.maxSpeedMbps} {ui.unit("mbps")}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div>
          <div className="catalog-detail-subtitle">
            <h2>{ui.label("interface")}</h2>
          </div>
          <Table>
            <TableBody>
              {adapter.hostInterface === "Pcie" && (
                <TableRow>
                  <TableHead className="table-stub" scope="row">{ui.label("pcieSlot")}</TableHead>
                  <TableCell>{adapter.pcieSlotType}</TableCell>
                </TableRow>
              )}
              {adapter.hostInterface === "Usb" && (
                <>
                  <TableRow>
                    <TableHead className="table-stub" scope="row">{ui.label("usbVersion")}</TableHead>
                    <TableCell>
                      {adapter.usbVersion
                        ? enumText.usbVersion(adapter.usbVersion)
                        : "—"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="table-stub" scope="row">{ui.label("usbType")}</TableHead>
                    <TableCell>
                      {adapter.usbType ? enumText.usbType(adapter.usbType) : "—"}
                    </TableCell>
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
