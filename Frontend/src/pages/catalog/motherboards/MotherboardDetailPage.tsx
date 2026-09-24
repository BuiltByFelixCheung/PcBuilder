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
import { formatM2FormFactor } from "@/api/enums";
import { Button } from "@/components/ui/button";
import { builderHref, usePcBuild } from "@/builds";
import { useAuth } from "@/auth/use-auth";

export function MotherboardDetailPage() {
  const { motherboardId } = useParams();
  const query = useMotherboard(motherboardId);
  const motherboard = query.data;
  const currentBuild = usePcBuild();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

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
      <h1>{motherboard.name}</h1>
      {!isAdmin && (
        <Button
          onClick={() => {
            if (
              !currentBuild.motherboardId ||
              currentBuild.motherboardId !== motherboard.id
            )
              currentBuild.addToBuild("motherboard", motherboard.id);
            navigate(builderHref(currentBuild.sourceId));
          }}
        >
          Add to Build
        </Button>
      )}
      <dl className="catalog-details">
        <div>
          <dt>Manufacturer</dt>
          <dd>{motherboard.manufacturerName}</dd>
        </div>
        <div>
          <dt>Socket</dt>
          <dd>{motherboard.socketName}</dd>
        </div>
        <div>
          <dt>Chipset</dt>
          <dd>{motherboard.chipsetName}</dd>
        </div>
        <div>
          <dt>Form factor</dt>
          <dd>{motherboard.formFactor}</dd>
        </div>
        <div>
          <dt>DDR</dt>
          <dd>{motherboard.ddrGeneration.replace("Ddr", "DDR")}</dd>
        </div>
        <div>
          <dt>RAM form factor</dt>
          <dd>{motherboard.ramFormFactor}</dd>
        </div>
        <div>
          <dt>RAM slots</dt>
          <dd>{motherboard.ramSlots}</dd>
        </div>
        <div>
          <dt>Max memory</dt>
          <dd>{motherboard.maxMemoryGb} GB</dd>
        </div>
        <div>
          <dt>Max DIMM size</dt>
          <dd>{motherboard.maxDimmSizeGb} GB</dd>
        </div>
        <div>
          <dt>SATA ports</dt>
          <dd>{motherboard.sataPorts}</dd>
        </div>
        <div>
          <dt>Fan connectors</dt>
          <dd>{motherboard.fanConnectors}</dd>
        </div>
        <div>
          <dt>EPS connectors</dt>
          <dd>{motherboard.epsConnectors}</dd>
        </div>
        <div>
          <dt>Width</dt>
          <dd>{motherboard.widthMm} mm</dd>
        </div>
        <div>
          <dt>Height</dt>
          <dd>{motherboard.heightMm} mm</dd>
        </div>
        <div>
          <dt>Wi-Fi</dt>
          <dd>{motherboard.wifiEnabled ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt>Bluetooth</dt>
          <dd>{motherboard.bluetoothEnabled ? "Yes" : "No"}</dd>
        </div>
      </dl>

      <h2>PCIe slots</h2>
      {motherboard.pcieSlots.length === 0 ? (
        <p className="catalog-empty">No PCIe slots.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Lanes</TableHead>
              <TableHead>Generation</TableHead>
              <TableHead>Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {motherboard.pcieSlots.map((slot) => (
              <TableRow
                key={`${slot.slotType}-${slot.slotLanes}-${slot.generation}-${slot.slotCount}`}
              >
                <TableCell>{slot.slotType}</TableCell>
                <TableCell>{slot.slotLanes}</TableCell>
                <TableCell>{slot.generation.replace("Gen", "PCIe ")}</TableCell>
                <TableCell>{slot.slotCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <h2>M.2 slots</h2>
      {motherboard.m2Slots.length === 0 ? (
        <p className="catalog-empty">No M.2 slots.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>PCIe generation</TableHead>
              <TableHead>SATA</TableHead>
              <TableHead>Form factors</TableHead>
              <TableHead>Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {motherboard.m2Slots.map((slot) => (
              <TableRow
                key={`${slot.key}-${slot.pcieGeneration}-${slot.slotCount}`}
              >
                <TableCell>{slot.key}</TableCell>
                <TableCell>
                  {slot.pcieGeneration.replace("Gen", "PCIe ")}
                </TableCell>
                <TableCell>{slot.supportsSata ? "Yes" : "No"}</TableCell>
                <TableCell>
                  {slot.formFactors.length > 0
                    ? slot.formFactors.map(formatM2FormFactor).join(", ")
                    : "None"}
                </TableCell>
                <TableCell>{slot.slotCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <h2>USB ports</h2>
      {motherboard.usbPorts.length === 0 ? (
        <p className="catalog-empty">No USB ports.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {motherboard.usbPorts.map((port) => (
              <TableRow
                key={`${port.usbVersion}-${port.usbType}-${port.portCount}`}
              >
                <TableCell>{port.usbVersion}</TableCell>
                <TableCell>{port.usbType}</TableCell>
                <TableCell>{port.portCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
