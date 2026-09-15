import { Link, useParams } from "react-router-dom";
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
import { useChassisById } from "@/hooks/use-chassis.ts";
import type { ChassisFanMount } from "@/api/catalog/chassis";
import {
  formatFanDiameterMm,
  formatRadiatorLength,
  type FanDiameterMm,
} from "@/api/enums";

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "None";
}

function fanMountRows(fanMounts: ChassisFanMount[]) {
  return fanMounts.flatMap((mount) => {
    if (mount.options.length === 0) {
      return [
        {
          key: `${mount.location}-empty`,
          location: mount.location,
          singleDiameterOnly: mount.singleDiameterOnly,
          diameter: undefined as FanDiameterMm | undefined,
          slotCount: undefined as number | undefined,
        },
      ];
    }

    return mount.options.map((option) => ({
      key: `${mount.location}-${option.diameter}-${option.slotCount}`,
      location: mount.location,
      singleDiameterOnly: mount.singleDiameterOnly,
      diameter: option.diameter,
      slotCount: option.slotCount,
    }));
  });
}

export function ChassisDetailPage() {
  const { chassisId } = useParams();
  const query = useChassisById(chassisId);
  const chassis = query.data;

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

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/chassis">Back to Chassis</Link>
      </p>
      <h1>{chassis.name}</h1>
      <dl className="catalog-details">
        <div>
          <dt>Manufacturer</dt>
          <dd>{chassis.manufacturerName}</dd>
        </div>
        <div>
          <dt>Length</dt>
          <dd>{chassis.lengthMm} mm</dd>
        </div>
        <div>
          <dt>Width</dt>
          <dd>{chassis.widthMm} mm</dd>
        </div>
        <div>
          <dt>Height</dt>
          <dd>{chassis.heightMm} mm</dd>
        </div>
        <div>
          <dt>Motherboard max width</dt>
          <dd>{chassis.motherboardMaxWidthMm} mm</dd>
        </div>
        <div>
          <dt>Motherboard max height</dt>
          <dd>{chassis.motherboardMaxHeightMm} mm</dd>
        </div>
        <div>
          <dt>Max CPU cooler height</dt>
          <dd>{chassis.maxCpuCoolerHeightMm} mm</dd>
        </div>
        <div>
          <dt>Max graphics card length</dt>
          <dd>{chassis.maxGraphicsCardLengthMm} mm</dd>
        </div>
        <div>
          <dt>Max PSU length</dt>
          <dd>{chassis.maxPsuLengthMm} mm</dd>
        </div>
        <div>
          <dt>Motherboard form factors</dt>
          <dd>{formatList(chassis.mbFormFactors)}</dd>
        </div>
        <div>
          <dt>PSU form factors</dt>
          <dd>{formatList(chassis.psuFormFactors)}</dd>
        </div>
      </dl>

      <h2>Fan mounts</h2>
      {mounts.length === 0 ? (
        <p className="catalog-empty">No fan mounts.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>Single diameter only</TableHead>
              <TableHead>Diameter</TableHead>
              <TableHead>Slots</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mounts.map((mount) => (
              <TableRow key={mount.key}>
                <TableCell>{mount.location}</TableCell>
                <TableCell>
                  {mount.singleDiameterOnly ? "Yes" : "No"}
                </TableCell>
                <TableCell>
                  {mount.diameter != null
                    ? formatFanDiameterMm(mount.diameter)
                    : "—"}
                </TableCell>
                <TableCell>{mount.slotCount ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <h2>Drive bays</h2>
      {chassis.driveBays.length === 0 ? (
        <p className="catalog-empty">No drive bays.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Form factor</TableHead>
              <TableHead>Slots</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chassis.driveBays.map((bay) => (
              <TableRow key={`${bay.formFactor}-${bay.slotCount}`}>
                <TableCell>{bay.formFactor}</TableCell>
                <TableCell>{bay.slotCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <h2>PCIe slots</h2>
      {chassis.pcieSlots.length === 0 ? (
        <p className="catalog-empty">No PCIe slots.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orientation</TableHead>
              <TableHead>Low profile</TableHead>
              <TableHead>Slots</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chassis.pcieSlots.map((slot) => (
              <TableRow
                key={`${slot.orientation}-${slot.lowProfileSlots}-${slot.slotCount}`}
              >
                <TableCell>{slot.orientation}</TableCell>
                <TableCell>{slot.lowProfileSlots ? "Yes" : "No"}</TableCell>
                <TableCell>{slot.slotCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <h2>Radiators</h2>
      {chassis.radiators.length === 0 ? (
        <p className="catalog-empty">No radiator mounts.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>Length</TableHead>
              <TableHead>Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chassis.radiators.map((radiator) => (
              <TableRow
                key={`${radiator.location}-${radiator.length}-${radiator.radiatorCount}`}
              >
                <TableCell>{radiator.location}</TableCell>
                <TableCell>{formatRadiatorLength(radiator.length)}</TableCell>
                <TableCell>{radiator.radiatorCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
