import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  CatalogDetailFrame,
  SpecRow,
  SpecTable,
  UsbInterfaceRows,
} from "@/components/catalog/CatalogDetail";
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
  const backLabel = ui.empty("backTo", {
    entity: ui.nav("products.wirelessNetworkAdapters"),
  });

  return (
    <CatalogDetailFrame
      query={query}
      loadingEntity="wirelessNetworkAdapter"
      backTo="/catalog/wireless-network-adapters"
      backLabel={backLabel}
      notFoundMessage={ui.empty("wirelessAdapterNotFound")}
      title={adapter?.name}
      actions={
        adapter ? (
          <>
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
          </>
        ) : null
      }
    >
      {adapter ? (
        <>
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
            <SpecTable title={ui.section("basicInformation")}>
              <SpecRow label={ui.label("manufacturer")}>
                {adapter.manufacturerName}
              </SpecRow>
              <SpecRow label={ui.label("wifi")}>
                {formatWifiStandard(adapter.wifiStandard)}
              </SpecRow>
              <SpecRow label={ui.label("bluetooth")}>
                {adapter.bluetoothVersion
                  ? formatBluetoothVersion(adapter.bluetoothVersion)
                  : "—"}
              </SpecRow>
              <SpecRow label={ui.label("hostInterface")}>
                {enumText.wifiInterface(adapter.hostInterface)}
              </SpecRow>
              <SpecRow label={ui.label("maxSpeed")}>
                {adapter.maxSpeedMbps} {ui.unit("mbps")}
              </SpecRow>
              {adapter.maxSpeedMbps5G && (
                <SpecRow label={ui.label("maxSpeed5Ghz")}>
                  {adapter.maxSpeedMbps5G} {ui.unit("mbps")}
                </SpecRow>
              )}
              {adapter.maxSpeedMbps6G && (
                <SpecRow label={ui.label("maxSpeed6Ghz")}>
                  {adapter.maxSpeedMbps6G} {ui.unit("mbps")}
                </SpecRow>
              )}
            </SpecTable>
            <SpecTable title={ui.label("interface")}>
              {adapter.hostInterface === "Pcie" && (
                <SpecRow label={ui.label("pcieSlot")}>
                  {adapter.pcieSlotType}
                </SpecRow>
              )}
              {adapter.hostInterface === "M2" && (
                <>
                  <SpecRow label={ui.label("m2Key")}>{adapter.key ?? "—"}</SpecRow>
                  <SpecRow label={ui.label("m2FormFactor")}>
                    {adapter.m2FormFactor
                      ? formatM2FormFactor(adapter.m2FormFactor)
                      : "—"}
                  </SpecRow>
                </>
              )}
              {adapter.hostInterface === "Usb" && (
                <UsbInterfaceRows
                  usbVersion={adapter.usbVersion}
                  usbType={adapter.usbType}
                />
              )}
            </SpecTable>
          </div>
        </>
      ) : null}
    </CatalogDetailFrame>
  );
}
