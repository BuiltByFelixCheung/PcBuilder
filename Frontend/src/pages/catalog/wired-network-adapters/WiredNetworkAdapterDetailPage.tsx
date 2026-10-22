import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useWiredNetworkAdapter } from "@/hooks/use-wired-network-adapters.ts";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";
import { AddToBuildButton } from "@/builds";
import { useAuth } from "@/auth/use-auth";
import { CatalogEditDialog } from "@/components/catalog/CatalogEditDialog";
import {
  CatalogDetailFrame,
  SpecRow,
  SpecTable,
  UsbInterfaceRows,
} from "@/components/catalog/CatalogDetail";
import { Button } from "@/components/ui/button";
import { enumText, ui } from "@/i18n/translate-enum";
import {
  updateWiredNetworkAdapter,
  wiredNetworkAdapterKeys,
} from "@/api/catalog/wired-network-adapters";
import { WiredNetworkAdapterFields } from "@/pages/catalog/wired-network-adapters/WiredNetworkAdapterEditColumns";

export function WiredNetworkAdapterDetailPage() {
  const { wiredNetworkAdapterId } = useParams();
  const query = useWiredNetworkAdapter(wiredNetworkAdapterId);
  const adapter = query.data;
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const manufacturers = useCatalogManufacturers("wirednetworkadapter");
  const backLabel = ui.empty("backTo", {
    entity: ui.nav("products.wiredNetworkAdapters"),
  });

  return (
    <CatalogDetailFrame
      query={query}
      loadingEntity="wiredNetworkAdapter"
      backTo="/catalog/wired-network-adapters"
      backLabel={backLabel}
      notFoundMessage={ui.empty("wiredAdapterNotFound")}
      title={adapter?.name}
      actions={
        adapter ? (
          <>
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
          </>
        ) : null
      }
    >
      {adapter ? (
        <>
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
            <SpecTable title={ui.section("basicInformation")}>
              <SpecRow label={ui.label("manufacturer")}>
                {adapter.manufacturerName}
              </SpecRow>
              <SpecRow label={ui.label("hostInterface")}>
                {enumText.ethernetInterface(adapter.hostInterface)}
              </SpecRow>
              <SpecRow label={ui.label("maxSpeed")}>
                {adapter.maxSpeedMbps} {ui.unit("mbps")}
              </SpecRow>
            </SpecTable>
            <SpecTable title={ui.label("interface")}>
              {adapter.hostInterface === "Pcie" && (
                <SpecRow label={ui.label("pcieSlot")}>
                  {adapter.pcieSlotType}
                </SpecRow>
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
