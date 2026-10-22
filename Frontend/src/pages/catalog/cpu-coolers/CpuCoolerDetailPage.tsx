import { useState } from "react";
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
import { useCpuCooler } from "@/hooks/use-cpu-coolers.ts";
import { enumText, ui } from "@/i18n/translate-enum";
import {
  useCatalogManufacturers,
  useCatalogSockets,
} from "@/hooks/use-catalog-manufacturers.ts";
import { formatRadiatorClass } from "@/api/enums";
import { builderHref, usePcBuild } from "@/builds";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/use-auth";
import { CatalogEditDialog } from "@/components/catalog/CatalogEditDialog";
import {
  cpuCoolerKeys,
  cpuCoolerListItem,
  updateCpuCooler,
  updateCpuCoolerSockets,
  type CpuCoolerDetail,
} from "@/api/catalog/cpu-coolers";
import { CpuCoolerFields } from "@/pages/catalog/cpu-coolers/CpuCoolerEditColumns";
import type { SocketOption } from "@/api/master-data";
import { EditSocketsDialog } from "@/pages/catalog/cpu-coolers/SocketCheckboxGroup";
import { socketsByManufacturer } from "@/pages/catalog/cpu-coolers/socketGroups";

function BasicInfoTable({ cooler }: Readonly<{ cooler: CpuCoolerDetail }>) {
  return (
    <div>
      <div className="catalog-detail-title">
        <h2>{ui.section("basicInformation")}</h2>
      </div>
      <Table>
        <TableBody>
          <TableRow>
            <TableHead className="table-stub" scope="row">{ui.label("manufacturer")}</TableHead>
            <TableCell>{cooler.manufacturerName}</TableCell>
          </TableRow>
          <TableRow>
            <TableHead className="table-stub" scope="row">{ui.label("type")}</TableHead>
            <TableCell>{enumText.cpuCoolerType(cooler.type)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function AirCoolerTable({ cooler }: Readonly<{ cooler: CpuCoolerDetail }>) {
  return (
    <div>
      <div className="catalog-detail-title">
        <h2>{ui.section("dimensions")}</h2>
      </div>
      <Table>
        <TableBody>
          <TableRow>
            <TableHead className="table-stub" scope="row">{ui.label("lengthMm")}</TableHead>
            <TableCell>{cooler.coolerLengthMm}</TableCell>
          </TableRow>
          <TableRow>
            <TableHead className="table-stub" scope="row">{ui.label("widthMm")}</TableHead>
            <TableCell>{cooler.coolerWidthMm}</TableCell>
          </TableRow>
          <TableRow>
            <TableHead className="table-stub" scope="row">{ui.label("heightMm")}</TableHead>
            <TableCell>{cooler.coolerHeightMm}</TableCell>
          </TableRow>
          <TableRow>
            <TableHead className="table-stub" scope="row">{ui.label("maxRamHeightMm")}</TableHead>
            <TableCell>{cooler.maxRamHeightMm}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function WaterBlockTable({ cooler }: Readonly<{ cooler: CpuCoolerDetail }>) {
  return (
    <div>
      <div className="catalog-detail-title">
        <h2>{ui.section("waterBlockDimensions")}</h2>
      </div>
      <Table>
        <TableBody>
          <TableRow>
            <TableHead className="table-stub" scope="row">{ui.label("lengthMm")}</TableHead>
            <TableCell>{cooler.waterBlockLengthMm}</TableCell>
          </TableRow>
          <TableRow>
            <TableHead className="table-stub" scope="row">{ui.label("widthMm")}</TableHead>
            <TableCell>{cooler.waterBlockWidthMm}</TableCell>
          </TableRow>
          <TableRow>
            <TableHead className="table-stub" scope="row">{ui.label("heightMm")}</TableHead>
            <TableCell>{cooler.waterBlockHeightMm}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function RadiatorTable({ cooler }: Readonly<{ cooler: CpuCoolerDetail }>) {
  return (
    <div>
      <div className="catalog-detail-title">
        <h2>{ui.section("radiatorDimensions")}</h2>
      </div>
      <Table>
        <TableBody>
          <TableRow>
            <TableHead className="table-stub" scope="row">{ui.label("lengthMm")}</TableHead>
            <TableCell>{cooler.radiatorLengthMm}</TableCell>
          </TableRow>
          <TableRow>
            <TableHead className="table-stub" scope="row">{ui.label("widthMm")}</TableHead>
            <TableCell>{cooler.radiatorWidthMm}</TableCell>
          </TableRow>
          <TableRow>
            <TableHead className="table-stub" scope="row">{ui.label("heightMm")}</TableHead>
            <TableCell>{cooler.radiatorHeightMm}</TableCell>
          </TableRow>
          <TableRow>
            <TableHead className="table-stub" scope="row">{ui.label("radiatorClass")}</TableHead>
            <TableCell>
              {cooler.radiatorClass
                ? formatRadiatorClass(cooler.radiatorClass)
                : "—"}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function FansTable({ cooler }: Readonly<{ cooler: CpuCoolerDetail }>) {
  return (
    <div>
      <div className="catalog-detail-title">
        <h2>{ui.section("fans")}</h2>
      </div>
      <Table>
        <TableBody>
          <TableRow>
            <TableHead className="table-stub" scope="row">{ui.label("fanThicknessMm")}</TableHead>
            <TableCell>{cooler.fanThicknessMm ?? "—"}</TableCell>
          </TableRow>
          <TableRow>
            <TableHead className="table-stub" scope="row">{ui.label("fanWidthMm")}</TableHead>
            <TableCell>{cooler.fanWidthMm}</TableCell>
          </TableRow>
          <TableRow>
            <TableHead className="table-stub" scope="row">{ui.label("fanHeightMm")}</TableHead>
            <TableCell>{cooler.fanHeightMm}</TableCell>
          </TableRow>
          <TableRow>
            <TableHead className="table-stub" scope="row">{ui.label("fanCount")}</TableHead>
            <TableCell>{cooler.fanCount}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function SocketTable({
  cooler,
  catalogSockets,
  onEdit,
}: Readonly<{
  cooler: CpuCoolerDetail;
  catalogSockets: readonly SocketOption[];
  onEdit?: () => void;
}>) {
  const groups = socketsByManufacturer(
    cooler.sockets.map((socket) => {
      const catalog = catalogSockets.find((item) => item.id === socket.socketId);
      return {
        id: socket.socketId,
        name: socket.socketName || socket.socketId,
        manufacturerName: catalog?.manufacturerName,
      };
    }),
  );

  return (
    <div>
      <div className="catalog-detail-title">
        <h2>{ui.section("sockets")}</h2>
        {onEdit ? (
          <Button type="button" onClick={onEdit}>{ui.action("editSockets")}</Button>
        ) : null}
      </div>
      {groups.length === 0 ? (
        <p className="catalog-empty">{ui.empty("noSupportedSockets")}</p>
      ) : (
        <Table>
          <TableBody>
            {groups.map(([manufacturer, choices]) => (
              <TableRow key={manufacturer || "unknown"}>
                <TableHead className="table-stub" scope="row">
                  {manufacturer || "—"}
                </TableHead>
                <TableCell>
                  {choices.map((socket) => socket.name).join(", ")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export function CpuCoolerDetailPage() {
  const { cpuCoolerId } = useParams();
  const query = useCpuCooler(cpuCoolerId);
  const cooler = query.data;
  const currentBuild = usePcBuild();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editingSockets, setEditingSockets] = useState(false);
  const manufacturers = useCatalogManufacturers("cpucooler");
  const sockets = useCatalogSockets();

  if (query.isPending) {
    return <PageStatus>{ui.empty("loading", { entity: ui.entity("cpuCooler") })}</PageStatus>;
  }

  if (query.isError || !cooler) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/cpu-coolers">{ui.empty("backTo", { entity: ui.nav("products.cpuCoolers") })}</Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : ui.empty("cpuCoolerNotFound")}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/cpu-coolers">{ui.empty("backTo", { entity: ui.nav("products.cpuCoolers") })}</Link>
      </p>
      <div className="catalog-detail-title">
        <h1>{cooler.name}</h1>
        {!isAdmin && (
          <Button
            onClick={() => {
              if (
                !currentBuild.cpuCoolerId ||
                currentBuild.cpuCoolerId !== cooler.id
              )
                currentBuild.addToBuild("cpucooler", cooler.id);
              void navigate(builderHref(currentBuild.sourceId));
            }}
          >
            {ui.action("addToBuild")}
          </Button>
        )}
        {isAdmin && (
          <Button type="button" onClick={() => setEditing(true)}>
            {ui.action("edit")}
          </Button>
        )}
      </div>
      {editing ? (
        <CatalogEditDialog
          title={ui.dialog("editCpuCooler")}
          item={cpuCoolerListItem(cooler)}
          fields={CpuCoolerFields(manufacturers)}
          onClose={() => setEditing(false)}
          onSave={async (item) => {
            await updateCpuCooler(item);
            await queryClient.invalidateQueries({
              queryKey: cpuCoolerKeys.detail(cooler.id),
            });
          }}
        />
      ) : null}
      {editingSockets ? (
        <EditSocketsDialog
          sockets={sockets}
          selected={cooler.sockets}
          onClose={() => setEditingSockets(false)}
          onSave={async (rows) => {
            await updateCpuCoolerSockets(cooler.id, rows);
            await queryClient.invalidateQueries({
              queryKey: cpuCoolerKeys.detail(cooler.id),
            });
          }}
        />
      ) : null}
      <div className="catalog-table-pair">
        <BasicInfoTable cooler={cooler} />
        <FansTable cooler={cooler} />
        {cooler.type === "Air" ? <AirCoolerTable cooler={cooler} /> : null}
        {cooler.type === "Water" ? (
          <>
            <WaterBlockTable cooler={cooler} />
            <RadiatorTable cooler={cooler} />
          </>
        ) : null}
        <SocketTable
          cooler={cooler}
          catalogSockets={sockets}
          onEdit={isAdmin ? () => setEditingSockets(true) : undefined}
        />
      </div>
    </section>
  );
}
