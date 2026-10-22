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
import { enumText, ui } from "@/i18n/translate-enum";
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
    return <PageStatus>{ui.empty("loading", { entity: ui.entity("wirelessNetworkAdapter") })}</PageStatus>;
  }

  if (query.isError || !adapter) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/wireless-network-adapters">
            {ui.empty("backTo", { entity: ui.nav("products.wirelessNetworkAdapters") })}
          </Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : ui.empty("wirelessAdapterNotFound")}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/wireless-network-adapters">
            {ui.empty("backTo", { entity: ui.nav("products.wirelessNetworkAdapters") })}
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
            {ui.action("edit")}
          </Button>
        )}
      </div>
      {editing ? (
        <CatalogEditDialog
          title={ui.dialog("editWirelessNetworkAdapter")}
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
            <h2>{ui.section("basicInformation")}</h2>
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("manufacturer")}</TableHead>
                <TableCell>{adapter.manufacturerName}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("wifi")}</TableHead>
                <TableCell>
                  {formatWifiStandard(adapter.wifiStandard)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("bluetooth")}</TableHead>
                <TableCell>
                  {adapter.bluetoothVersion
                    ? formatBluetoothVersion(adapter.bluetoothVersion)
                    : "—"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("hostInterface")}</TableHead>
                <TableCell>
                  {enumText.wifiInterface(adapter.hostInterface)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("maxSpeed")}</TableHead>
                <TableCell>{adapter.maxSpeedMbps} {ui.unit("mbps")}</TableCell>
              </TableRow>
              {adapter.maxSpeedMbps5G && (
                <TableRow>
                  <TableHead className="table-stub" scope="row">{ui.label("maxSpeed5Ghz")}</TableHead>
                  <TableCell>{adapter.maxSpeedMbps5G} {ui.unit("mbps")}</TableCell>
                </TableRow>
              )}
              {adapter.maxSpeedMbps6G && (
                <TableRow>
                  <TableHead className="table-stub" scope="row">{ui.label("maxSpeed6Ghz")}</TableHead>
                  <TableCell>{adapter.maxSpeedMbps6G} {ui.unit("mbps")}</TableCell>
                </TableRow>
              )}
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
              {adapter.hostInterface === "M2" && (
                <>
                  <TableRow>
                    <TableHead className="table-stub" scope="row">{ui.label("m2Key")}</TableHead>
                    <TableCell>{adapter.key ?? "—"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="table-stub" scope="row">{ui.label("m2FormFactor")}</TableHead>
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
