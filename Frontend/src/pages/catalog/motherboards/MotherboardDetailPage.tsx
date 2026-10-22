import { Link, useNavigate, useParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMotherboard } from "@/hooks/use-motherboards.ts";
import { formatM2FormFactor, type M2FormFactor } from "@/api/enums";
import { enumText, ui } from "@/i18n/translate-enum";
import { Button } from "@/components/ui/button";
import { builderHref, usePcBuild } from "@/builds";
import { useAuth } from "@/auth/use-auth";
import { useState } from "react";
import { CatalogEditDialog } from "@/components/catalog/CatalogEditDialog";
import { ChildCollectionDialog } from "@/components/catalog/ChildCollectionDialog";
import {
  motherboardKeys,
  motherboardListItem,
  updateMotherboard,
  updateMotherboardM2Slots,
  updateMotherboardPcieSlots,
  updateMotherboardUsbPorts,
  type MotherboardM2Slot,
  type MotherboardPcieSlot,
  type MotherboardUsbPort,
} from "@/api/catalog/motherboards";
import { useQueryClient } from "@tanstack/react-query";
import { useMotherboardFilterOptions } from "@/hooks/use-motherboard-filter-options";
import { MotherboardFields } from "@/pages/catalog/motherboards/MotherboardEditColumns";
import {
  m2SlotColumns,
  pcieSlotColumns,
  usbPortColumns,
} from "@/pages/catalog/motherboards/MotherboardChildColumns";

function getFormattedM2FormFactor(formFactors: M2FormFactor[]) {
  if (formFactors.length === 0) return ui.label("none");
  const result: string[] = [];
  for (const formFactor of formFactors) {
    result.push(formatM2FormFactor(formFactor));
  }
  return result.join(", ");
}

export function MotherboardDetailPage() {
  const queryClient = useQueryClient();
  const { motherboardId } = useParams();
  const query = useMotherboard(motherboardId);
  const motherboard = query.data;
  const currentBuild = usePcBuild();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editingPcie, setEditingPcie] = useState(false);
  const [editingM2, setEditingM2] = useState(false);
  const [editingUsb, setEditingUsb] = useState(false);
  const { manufacturers, sockets, chipsets } = useMotherboardFilterOptions();

  if (query.isPending) {
    return <PageStatus>{ui.empty("loading", { entity: ui.entity("motherboard") })}</PageStatus>;
  }

  if (query.isError || !motherboard) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/motherboards">{ui.empty("backTo", { entity: ui.nav("products.motherboards") })}</Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : ui.empty("motherboardNotFound")}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/motherboards">{ui.empty("backTo", { entity: ui.nav("products.motherboards") })}</Link>
      </p>
      <div className="catalog-detail-title">
        <h1>{motherboard.name}</h1>
        {!isAdmin && (
          <Button
            onClick={() => {
              if (
                !currentBuild.motherboardId ||
                currentBuild.motherboardId !== motherboard.id
              )
                currentBuild.addToBuild("motherboard", motherboard.id);
              void navigate(builderHref(currentBuild.sourceId));
            }}
          >
            {ui.action("addToBuild")}
          </Button>
        )}
        {isAdmin && (
          <Button type="button" onClick={() => setIsEditing(true)}>
            {ui.action("edit")}
          </Button>
        )}
      </div>
      {isEditing ? (
        <CatalogEditDialog
          title={ui.dialog("editMotherboard")}
          item={motherboardListItem(motherboard)}
          fields={MotherboardFields(manufacturers, sockets, chipsets)}
          onClose={() => setIsEditing(false)}
          onSave={async (item) => {
            await updateMotherboard(item);
            await queryClient.invalidateQueries({
              queryKey: motherboardKeys.detail(motherboard.id),
            });
          }}
        />
      ) : null}
      {editingPcie ? (
        <ChildCollectionDialog<{ value: MotherboardPcieSlot }>
          title={ui.dialog("editPcieSlots")}
          rows={motherboard.pcieSlots.map((value) => ({ value }))}
          columns={pcieSlotColumns}
          createRow={() => ({
            value: {
              slotType: "X16",
              slotLanes: "X16",
              generation: "Gen5",
              slotCount: 1,
            },
          })}
          onClose={() => setEditingPcie(false)}
          onSave={async (rows) => {
            await updateMotherboardPcieSlots(
              motherboard.id,
              rows.map((row) => row.value),
            );
            await queryClient.invalidateQueries({
              queryKey: motherboardKeys.detail(motherboard.id),
            });
          }}
        />
      ) : null}
      {editingM2 ? (
        <ChildCollectionDialog<{ value: MotherboardM2Slot }>
          title={ui.dialog("editM2Slots")}
          rows={motherboard.m2Slots.map((value) => ({ value }))}
          columns={m2SlotColumns}
          createRow={() => ({
            value: {
              key: "M",
              pcieGeneration: "Gen5",
              slotCount: 1,
              supportsSata: false,
              formFactors: [],
            },
          })}
          onClose={() => setEditingM2(false)}
          onSave={async (rows) => {
            await updateMotherboardM2Slots(
              motherboard.id,
              rows.map((row) => row.value),
            );
            await queryClient.invalidateQueries({
              queryKey: motherboardKeys.detail(motherboard.id),
            });
          }}
        />
      ) : null}
      {editingUsb ? (
        <ChildCollectionDialog<{ value: MotherboardUsbPort }>
          title={ui.dialog("editUsbPorts")}
          rows={motherboard.usbPorts.map((value) => ({ value }))}
          columns={usbPortColumns}
          createRow={() => ({
            value: { usbVersion: "Usb20", usbType: "TypeA", portCount: 1 },
          })}
          onClose={() => setEditingUsb(false)}
          onSave={async (rows) => {
            await updateMotherboardUsbPorts(
              motherboard.id,
              rows.map((row) => row.value),
            );
            await queryClient.invalidateQueries({
              queryKey: motherboardKeys.detail(motherboard.id),
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
            <TableHeader>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("manufacturer")}</TableHead>
                <TableCell>{motherboard.manufacturerName}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("socket")}</TableHead>
                <TableCell>{motherboard.socketName}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("chipset")}</TableHead>
                <TableCell>{motherboard.chipsetName}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("formFactor")}</TableHead>
                <TableCell>
                  {enumText.mbFormFactor(motherboard.formFactor)}
                </TableCell>
              </TableRow>
            </TableHeader>
          </Table>
        </div>
        <div>
          <div className="catalog-detail-subtitle">
            <h2>{ui.section("dimensions")}</h2>
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("width")}</TableHead>
                <TableCell>{motherboard.widthMm} {ui.unit("mm")}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("height")}</TableHead>
                <TableCell>{motherboard.heightMm} {ui.unit("mm")}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="catalog-table-pair">
        <div>
          <div className="catalog-detail-subtitle">
            <h2>{ui.section("ram")}</h2>
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("ddrGeneration")}</TableHead>
                <TableCell>
                  {enumText.ddrGeneration(motherboard.ddrGeneration)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("ramFormFactor")}</TableHead>
                <TableCell>
                  {enumText.ramFormFactor(motherboard.ramFormFactor)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("ramSlots")}</TableHead>
                <TableCell>{motherboard.ramSlots}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("totalRamSupported")}</TableHead>
                <TableCell>{motherboard.maxMemoryGb} {ui.unit("gb")}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("maxRamPerDimm")}</TableHead>
                <TableCell>{motherboard.maxDimmSizeGb} {ui.unit("gb")}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div>
          <div className="catalog-detail-subtitle">
            <h2>{ui.section("connectivities")}</h2>
            {isAdmin && (
              <div className="flex gap-2">
                <Button type="button" onClick={() => setEditingUsb(true)}>
                  {ui.action("editUsb")}
                </Button>
                <Button type="button" onClick={() => setEditingM2(true)}>
                  {ui.action("editM2")}
                </Button>
                <Button type="button" onClick={() => setEditingPcie(true)}>
                  {ui.action("editPcie")}
                </Button>
              </div>
            )}
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("sataPorts")}</TableHead>
                <TableCell>{motherboard.sataPorts}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.section("usbPorts")}</TableHead>
                <TableCell>
                  {motherboard.usbPorts.length === 0 ? (
                    <p className="catalog-empty">{ui.empty("noUsbPorts")}</p>
                  ) : (
                    <ul>
                      {motherboard.usbPorts.map((port) => (
                        <li key={port.usbVersion}>
                          <span>{enumText.usbVersion(port.usbVersion)}</span>{" "}
                          <span>{enumText.usbType(port.usbType)}</span> x{" "}
                          {port.portCount}
                        </li>
                      ))}
                    </ul>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.section("m2Slots")}</TableHead>
                <TableCell>
                  {motherboard.m2Slots.length === 0 ? (
                    <p className="catalog-empty">{ui.empty("noM2Slots")}</p>
                  ) : (
                    <ul>
                      {motherboard.m2Slots.map((slot) => (
                        <li key={`${slot.key}-${slot.pcieGeneration}`}>
                          {enumText.m2Key(slot.key)} {ui.label("key")}{" "}
                          <span>
                            {enumText.pcieGeneration(slot.pcieGeneration)}
                          </span>{" "}
                          (
                          <span>
                            {getFormattedM2FormFactor(slot.formFactors)}
                          </span>
                          ) x {slot.slotCount}
                        </li>
                      ))}
                    </ul>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.section("pcieSlots")}</TableHead>
                <TableCell>
                  {motherboard.pcieSlots.length === 0 ? (
                    <p className="catalog-empty">{ui.empty("noPcieSlots")}</p>
                  ) : (
                    <ul>
                      {motherboard.pcieSlots.map((slot) => (
                        <li
                          key={`${slot.slotType}-${slot.generation}-${slot.slotLanes}`}
                        >
                          <span>{enumText.pcieGeneration(slot.generation)}</span>{" "}
                          {enumText.pcieSlotType(slot.slotType)} ({enumText.pcieSlotLane(slot.slotLanes)}) x {slot.slotCount}
                        </li>
                      ))}
                    </ul>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("pwmDcFanHeaders")}</TableHead>
                <TableCell>{motherboard.pwmFanHeaders} / {motherboard.dcFanHeaders}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("epsConnectors")}</TableHead>
                <TableCell>{motherboard.epsConnectors}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("wifi")}</TableHead>
                <TableCell>{motherboard.wifiEnabled ? ui.label("yes") : ui.label("no")}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("bluetooth")}</TableHead>
                <TableCell>
                  {motherboard.bluetoothEnabled ? ui.label("yes") : ui.label("no")}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
