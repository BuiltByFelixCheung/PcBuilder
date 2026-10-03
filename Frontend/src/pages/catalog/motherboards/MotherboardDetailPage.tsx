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
  if (formFactors.length === 0) return "None";
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
    return <PageStatus>Loading motherboard…</PageStatus>;
  }

  if (query.isError || !motherboard) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/motherboards">Back to Motherboards</Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : "Motherboard not found."}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/motherboards">Back to Motherboards</Link>
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
            Add to Build
          </Button>
        )}
        {isAdmin && (
          <Button type="button" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>
      {isEditing ? (
        <CatalogEditDialog
          title="Edit motherboard"
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
          title="Edit PCIe slots"
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
          title="Edit M.2 slots"
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
          title="Edit USB ports"
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
            <h2>Basic Information</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Manufacturer
                </TableHead>
                <TableCell>{motherboard.manufacturerName}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Socket
                </TableHead>
                <TableCell>{motherboard.socketName}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Chipset
                </TableHead>
                <TableCell>{motherboard.chipsetName}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Form factor
                </TableHead>
                <TableCell>{motherboard.formFactor}</TableCell>
              </TableRow>
            </TableHeader>
          </Table>
        </div>
        <div>
          <div className="catalog-detail-subtitle">
            <h2>Dimensions</h2>
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Width
                </TableHead>
                <TableCell>{motherboard.widthMm} mm</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Height
                </TableHead>
                <TableCell>{motherboard.heightMm} mm</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="catalog-table-pair">
        <div>
          <div className="catalog-detail-subtitle">
            <h2>RAM</h2>
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  DDR Generation
                </TableHead>
                <TableCell>
                  {motherboard.ddrGeneration.replace("Ddr", "DDR")}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  RAM form factor
                </TableHead>
                <TableCell>{motherboard.ramFormFactor}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  RAM slots
                </TableHead>
                <TableCell>{motherboard.ramSlots}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Total RAM Supported
                </TableHead>
                <TableCell>{motherboard.maxMemoryGb} GB</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Max RAM per DIMM
                </TableHead>
                <TableCell>{motherboard.maxDimmSizeGb} GB</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div>
          <div className="catalog-detail-subtitle">
            <h2>Connectivities</h2>
            {isAdmin && (
              <div className="flex gap-2">
                <Button type="button" onClick={() => setEditingUsb(true)}>
                  Edit USB
                </Button>
                <Button type="button" onClick={() => setEditingM2(true)}>
                  Edit M.2
                </Button>
                <Button type="button" onClick={() => setEditingPcie(true)}>
                  Edit PCIe
                </Button>
              </div>
            )}
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  SATA ports
                </TableHead>
                <TableCell>{motherboard.sataPorts}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  USB ports
                </TableHead>
                <TableCell>
                  {motherboard.usbPorts.length === 0 ? (
                    <p className="catalog-empty">No USB ports.</p>
                  ) : (
                    <ul>
                      {motherboard.usbPorts.map((port) => (
                        <li key={port.usbVersion}>
                          <span>{port.usbVersion}</span>{" "}
                          <span>{port.usbType}</span> x {port.portCount}
                        </li>
                      ))}
                    </ul>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  M.2 slots
                </TableHead>
                <TableCell>
                  {motherboard.m2Slots.length === 0 ? (
                    <p className="catalog-empty">No M.2 slots.</p>
                  ) : (
                    <ul>
                      {motherboard.m2Slots.map((slot) => (
                        <li key={`${slot.key}-${slot.pcieGeneration}`}>
                          {slot.key} Key{" "}
                          <span>
                            {slot.pcieGeneration.replace("Gen", "PCIe ")}
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
                <TableHead className="table-stub" scope="row">
                  PCIe slots
                </TableHead>
                <TableCell>
                  {motherboard.pcieSlots.length === 0 ? (
                    <p className="catalog-empty">No PCIe slots.</p>
                  ) : (
                    <ul>
                      {motherboard.pcieSlots.map((slot) => (
                        <li
                          key={`${slot.slotType}-${slot.generation}-${slot.slotLanes}`}
                        >
                          <span>{slot.generation.replace("Gen", "PCIe ")}</span>{" "}
                          {slot.slotType} ({slot.slotLanes}) x {slot.slotCount}
                        </li>
                      ))}
                    </ul>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Fan connectors
                </TableHead>
                <TableCell>{motherboard.fanConnectors}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  EPS connectors
                </TableHead>
                <TableCell>{motherboard.epsConnectors}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Wi-Fi
                </TableHead>
                <TableCell>{motherboard.wifiEnabled ? "Yes" : "No"}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Bluetooth
                </TableHead>
                <TableCell>
                  {motherboard.bluetoothEnabled ? "Yes" : "No"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
