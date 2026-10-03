import { Fragment, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { useChassisById } from "@/hooks/use-chassis.ts";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";
import {
  chassisKeys,
  chassisListItem,
  updateChassis,
  updateChassisDriveBays,
  updateChassisFanMounts,
  updateChassisMbFormFactors,
  updateChassisRadiators,
  updateChassisPcieSlots,
  updateChassisPsuFormFactors,
  type ChassisDetail,
  type ChassisDriveBay,
  type ChassisFanMount,
  type ChassisPcieSlot,
  type ChassisRadiator,
} from "@/api/catalog/chassis";
import { CatalogEditDialog } from "@/components/catalog/CatalogEditDialog";
import { ChassisFields } from "@/pages/catalog/chassis/ChassisEditColumns";
import {
  driveBayColumns,
  fanMountColumns,
  mbFormFactorColumns,
  pcieSlotColumns,
  psuFormFactorColumns,
  radiatorColumns,
} from "@/pages/catalog/chassis/ChassisChildColumns";
import {
  FAN_DIAMETERS_MM,
  FAN_MOUNT_LOCATIONS,
  RADIATOR_CLASSES,
  RADIATOR_MOUNT_LOCATIONS,
  formatFanDiameterMm,
  formatRadiatorClass,
  type MbFormFactor,
  type PsuFormFactor,
} from "@/api/enums";
import { Button } from "@/components/ui/button";
import { builderHref, usePcBuild } from "@/builds";
import { useAuth } from "@/auth/use-auth";
import {
  ChildCollectionDialog,
  type ChildCollectionColumn,
} from "@/components/catalog/ChildCollectionDialog";

function fanMountRows(mounts: ChassisFanMount[]) {
  return mounts
    .map((mount) => ({
      location: mount.location,
      singleDiameterOnly: mount.singleDiameterOnly,
      options: [...mount.options].sort(
        (left, right) =>
          FAN_DIAMETERS_MM.indexOf(left.diameter) -
          FAN_DIAMETERS_MM.indexOf(right.diameter),
      ),
    }))
    .sort(
      (left, right) =>
        FAN_MOUNT_LOCATIONS.indexOf(left.location) -
        FAN_MOUNT_LOCATIONS.indexOf(right.location),
    );
}

function formatFanMountOption(option: ChassisFanMount["options"][number]) {
  return `${formatFanDiameterMm(option.diameter)} x ${option.slotCount}`;
}

function radiatorRows(radiators: ChassisRadiator[]) {
  const byLocation = new Map<ChassisRadiator["location"], ChassisRadiator[]>();
  for (const radiator of radiators) {
    const current = byLocation.get(radiator.location) ?? [];
    current.push(radiator);
    byLocation.set(radiator.location, current);
  }

  return RADIATOR_MOUNT_LOCATIONS.flatMap((location) => {
    const options = byLocation.get(location);
    if (!options) return [];
    return [
      {
        location,
        label: [...options]
          .sort(
            (left, right) =>
              RADIATOR_CLASSES.indexOf(left.length) -
              RADIATOR_CLASSES.indexOf(right.length),
          )
          .map(formatRadiator)
          .join(" or "),
      },
    ];
  });
}

function formatRadiator(radiator: ChassisRadiator) {
  return `${formatRadiatorClass(radiator.length)} x ${radiator.radiatorCount}`;
}

type FanMountRow = ReturnType<typeof fanMountRows>[number];
type RadiatorRow = ReturnType<typeof radiatorRows>[number];

function AddToBuildButton({ chassisId }: Readonly<{ chassisId: string }>) {
  const currentBuild = usePcBuild();
  const navigate = useNavigate();

  function handleClick() {
    if (!currentBuild.chassisId || currentBuild.chassisId !== chassisId) {
      currentBuild.addToBuild("chassis", chassisId);
    }
    navigate(builderHref(currentBuild.sourceId));
  }

  return <Button onClick={handleClick}>Add to Build</Button>;
}

function EditChassisDialog({
  chassis,
  manufacturers,
  open,
  onClose,
}: Readonly<{
  chassis: ChassisDetail;
  manufacturers: { id: string; name: string }[];
  open: boolean;
  onClose: () => void;
}>) {
  const queryClient = useQueryClient();
  if (!open) return null;
  return (
    <CatalogEditDialog
      title="Edit Chassis"
      item={chassisListItem(chassis)}
      fields={ChassisFields(manufacturers)}
      onClose={onClose}
      onSave={async (item) => {
        await updateChassis(item);
        await queryClient.invalidateQueries({
          queryKey: chassisKeys.detail(chassis.id),
        });
      }}
    />
  );
}

function ChildEditDialog<T>({
  open,
  title,
  values,
  columns,
  createRow,
  update,
  chassisId,
  onClose,
}: Readonly<{
  open: boolean;
  title: string;
  values: readonly T[];
  columns: readonly ChildCollectionColumn<{ value: T }>[];
  createRow: () => T;
  update: (id: string, values: T[]) => Promise<unknown>;
  chassisId: string;
  onClose: () => void;
}>) {
  const queryClient = useQueryClient();
  if (!open) return null;
  return (
    <ChildCollectionDialog<{ value: T }>
      title={title}
      rows={values.map((value) => ({ value }))}
      columns={columns}
      createRow={() => ({ value: createRow() })}
      onClose={onClose}
      onSave={async (rows) => {
        await update(chassisId, rows.map((row) => row.value));
        await queryClient.invalidateQueries({
          queryKey: chassisKeys.detail(chassisId),
        });
      }}
    />
  );
}

function DetailSection({
  title,
  isAdmin,
  onEdit,
  isEmpty,
  emptyMessage,
  children,
}: Readonly<{
  title: string;
  isAdmin: boolean;
  onEdit: () => void;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}>) {
  return (
    <div>
      <div className="catalog-detail-subtitle">
        <h2>{title}</h2>
        {isAdmin && (
          <Button type="button" onClick={onEdit}>
            Edit
          </Button>
        )}
      </div>
      {isEmpty ? <p className="catalog-empty">{emptyMessage}</p> : children}
    </div>
  );
}

function JoinedValues({ values }: Readonly<{ values: readonly string[] }>) {
  return (
    <p>
      {values.map((value, index) => (
        <Fragment key={value}>
          {index > 0 ? ", " : null}
          <span>{value}</span>
        </Fragment>
      ))}
    </p>
  );
}

function FanMountsTable({ mounts }: Readonly<{ mounts: FanMountRow[] }>) {
  return (
    <Table>
      <TableBody>
        {mounts.map((mount) => (
          <TableRow key={mount.location}>
            <TableHead className="table-stub" scope="row">
              {mount.location}
            </TableHead>
            <TableCell>
              {mount.options
                .map(formatFanMountOption)
                .join(mount.singleDiameterOnly ? ", " : " or ")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RadiatorsTable({
  radiators,
}: Readonly<{ radiators: RadiatorRow[] }>) {
  return (
    <Table>
      <TableBody>
        {radiators.map((radiator) => (
          <TableRow key={radiator.location}>
            <TableHead className="table-stub" scope="row">
              {radiator.location}
            </TableHead>
            <TableCell>{radiator.label}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DriveBaysTable({
  driveBays,
}: Readonly<{ driveBays: ChassisDriveBay[] }>) {
  return (
    <Table>
      <TableBody>
        {driveBays.map((bay) => (
          <TableRow key={`${bay.formFactors.join("-")}-${bay.slotCount}`}>
            <TableHead className="table-stub" scope="row">
              {bay.formFactors.join(", ")}
            </TableHead>
            <TableCell>{bay.slotCount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PcieSlotsTable({
  pcieSlots,
}: Readonly<{ pcieSlots: ChassisPcieSlot[] }>) {
  return (
    <Table>
      <TableBody>
        {pcieSlots.map((slot) => (
          <TableRow
            key={`${slot.orientation}-${slot.lowProfileSlots}-${slot.slotCount}`}
          >
            <TableHead className="table-stub" scope="row">
              {slot.orientation}
            </TableHead>
            <TableCell>
              {slot.lowProfileSlots ? "Low Profile" : "Full Height"} x
              {slot.slotCount}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ChassisDetailPage() {
  const { chassisId } = useParams();
  const query = useChassisById(chassisId);
  const chassis = query.data;
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editingMbFormFactors, setEditingMbFormFactors] = useState(false);
  const [editingPsuFormFactors, setEditingPsuFormFactors] = useState(false);
  const [editingFanMounts, setEditingFanMounts] = useState(false);
  const [editingRadiators, setEditingRadiators] = useState(false);
  const [editingDriveBays, setEditingDriveBays] = useState(false);
  const [editingPcieSlots, setEditingPcieSlots] = useState(false);
  const manufacturers = useCatalogManufacturers("chassis");

  if (query.isPending) {
    return <PageStatus>Loading chassis…</PageStatus>;
  }

  if (query.isError || !chassis) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/chassis">Back to Chassis</Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : "Chassis not found."}
        </PageStatus>
      </section>
    );
  }

  const mounts = fanMountRows(chassis.fanMounts);
  const radiators = radiatorRows(chassis.radiators);

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/chassis">Back to Chassis</Link>
      </p>
      <div className="catalog-detail-title">
        <h1>{chassis.name}</h1>
        {!isAdmin && <AddToBuildButton chassisId={chassis.id} />}
        {isAdmin && (
          <Button type="button" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>
      <EditChassisDialog
        chassis={chassis}
        manufacturers={manufacturers}
        open={editing}
        onClose={() => setEditing(false)}
      />
      <ChildEditDialog<MbFormFactor>
        open={editingMbFormFactors}
        title="Edit motherboard form factors"
        values={chassis.mbFormFactors}
        columns={mbFormFactorColumns}
        createRow={() => "Atx"}
        update={updateChassisMbFormFactors}
        chassisId={chassis.id}
        onClose={() => setEditingMbFormFactors(false)}
      />
      <ChildEditDialog<PsuFormFactor>
        open={editingPsuFormFactors}
        title="Edit PSU form factors"
        values={chassis.psuFormFactors}
        columns={psuFormFactorColumns}
        createRow={() => "Atx"}
        update={updateChassisPsuFormFactors}
        chassisId={chassis.id}
        onClose={() => setEditingPsuFormFactors(false)}
      />
      <ChildEditDialog<ChassisFanMount>
        open={editingFanMounts}
        title="Edit fan mounts"
        values={chassis.fanMounts}
        columns={fanMountColumns}
        createRow={() => ({
          location: "Front",
          singleDiameterOnly: false,
          options: [],
        })}
        update={updateChassisFanMounts}
        chassisId={chassis.id}
        onClose={() => setEditingFanMounts(false)}
      />
      <ChildEditDialog<ChassisRadiator>
        open={editingRadiators}
        title="Edit radiators"
        values={chassis.radiators}
        columns={radiatorColumns}
        createRow={() => ({
          location: "Front",
          length: "Mm120",
          radiatorCount: 1,
        })}
        update={updateChassisRadiators}
        chassisId={chassis.id}
        onClose={() => setEditingRadiators(false)}
      />
      <ChildEditDialog<ChassisDriveBay>
        open={editingDriveBays}
        title="Edit drive bays"
        values={chassis.driveBays}
        columns={driveBayColumns}
        createRow={() => ({ formFactors: ["Inch35"], slotCount: 1 })}
        update={updateChassisDriveBays}
        chassisId={chassis.id}
        onClose={() => setEditingDriveBays(false)}
      />
      <ChildEditDialog<ChassisPcieSlot>
        open={editingPcieSlots}
        title="Edit PCIe slots"
        values={chassis.pcieSlots}
        columns={pcieSlotColumns}
        createRow={() => ({
          orientation: "Horizontal",
          lowProfileSlots: false,
          slotCount: 1,
        })}
        update={updateChassisPcieSlots}
        chassisId={chassis.id}
        onClose={() => setEditingPcieSlots(false)}
      />

      <div className="catalog-table-trio">
        <div>
          <h2>Dimensions</h2>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Length
                </TableHead>
                <TableCell>{chassis.lengthMm} mm</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Width
                </TableHead>
                <TableCell>{chassis.widthMm} mm</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Height
                </TableHead>
                <TableCell>{chassis.heightMm} mm</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div>
          <h2>Motherboard Dimensions</h2>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Width
                </TableHead>
                <TableCell>{chassis.motherboardMaxWidthMm} mm</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Height
                </TableHead>
                <TableCell>{chassis.motherboardMaxHeightMm} mm</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div>
          <h2>Clearances</h2>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  CPU Cooler
                </TableHead>
                <TableCell>{chassis.maxCpuCoolerHeightMm} mm</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Graphics Card
                </TableHead>
                <TableCell>{chassis.maxGraphicsCardLengthMm} mm</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  PSU
                </TableHead>
                <TableCell>{chassis.maxPsuLengthMm} mm</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="catalog-table-pair">
        <DetailSection
          title="Motherboard form factors"
          isAdmin={isAdmin}
          onEdit={() => setEditingMbFormFactors(true)}
          isEmpty={chassis.mbFormFactors.length === 0}
          emptyMessage="No motherboard form factors."
        >
          <JoinedValues values={chassis.mbFormFactors} />
        </DetailSection>
        <DetailSection
          title="PSU form factors"
          isAdmin={isAdmin}
          onEdit={() => setEditingPsuFormFactors(true)}
          isEmpty={chassis.psuFormFactors.length === 0}
          emptyMessage="No PSU form factors."
        >
          <JoinedValues values={chassis.psuFormFactors} />
        </DetailSection>
      </div>
      <div className="catalog-table-pair">
        <DetailSection
          title="Fan mounts"
          isAdmin={isAdmin}
          onEdit={() => setEditingFanMounts(true)}
          isEmpty={mounts.length === 0}
          emptyMessage="No fan mounts."
        >
          <FanMountsTable mounts={mounts} />
        </DetailSection>
        <DetailSection
          title="Radiators"
          isAdmin={isAdmin}
          onEdit={() => setEditingRadiators(true)}
          isEmpty={radiators.length === 0}
          emptyMessage="No radiator mounts."
        >
          <RadiatorsTable radiators={radiators} />
        </DetailSection>
      </div>

      <div className="catalog-table-pair">
        <DetailSection
          title="Drive bays"
          isAdmin={isAdmin}
          onEdit={() => setEditingDriveBays(true)}
          isEmpty={chassis.driveBays.length === 0}
          emptyMessage="No drive bays."
        >
          <DriveBaysTable driveBays={chassis.driveBays} />
        </DetailSection>
        <DetailSection
          title="PCIe slots"
          isAdmin={isAdmin}
          onEdit={() => setEditingPcieSlots(true)}
          isEmpty={chassis.pcieSlots.length === 0}
          emptyMessage="No PCIe slots."
        >
          <PcieSlotsTable pcieSlots={chassis.pcieSlots} />
        </DetailSection>
      </div>
    </section>
  );
}
