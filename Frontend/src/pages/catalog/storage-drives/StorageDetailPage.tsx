import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus.tsx";
import { useStorageDrive } from "@/hooks/use-storage-drives.ts";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";

import { AddToBuildButton } from "@/builds";
import { useAuth } from "@/auth/use-auth";
import { CatalogEditDialog } from "@/components/catalog/CatalogEditDialog";
import { Button } from "@/components/ui/button";
import {
  storageDriveKeys,
  updateStorageDrive,
} from "@/api/catalog/storage-drives";
import { StorageFields } from "@/pages/catalog/storage-drives/StorageEditColumns";
import { formatStorageFormFactor } from "@/api/enums";
import { enumText, ui } from "@/i18n/translate-enum";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";

export function StorageDetailPage() {
  const { storageId } = useParams();
  const query = useStorageDrive(storageId);
  const drive = query.data;
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const manufacturers = useCatalogManufacturers("storagedrive");

  if (query.isPending) {
    return <PageStatus>{ui.empty("loading", { entity: ui.entity("storage") })}</PageStatus>;
  }

  if (query.isError || !drive) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/storage">{ui.empty("backTo", { entity: ui.nav("products.storage") })}</Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : ui.empty("storageNotFound")}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/storage">{ui.empty("backTo", { entity: ui.nav("products.storage") })}</Link>
      </p>
      <div className="catalog-detail-title">
        <h1>{drive.name}</h1>
        {!isAdmin && (
          <AddToBuildButton productType="storagedrive" partId={drive.id} />
        )}
        {isAdmin && (
          <Button type="button" onClick={() => setEditing(true)}>
            {ui.action("edit")}
          </Button>
        )}
      </div>
      {editing ? (
        <CatalogEditDialog
          title={ui.dialog("editStorageDrive")}
          item={drive}
          fields={StorageFields(manufacturers)}
          onClose={() => setEditing(false)}
          onSave={async (item) => {
            await updateStorageDrive(item);
            await queryClient.invalidateQueries({
              queryKey: storageDriveKeys.detail(drive.id),
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
                <TableCell>{drive.manufacturerName}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("type")}</TableHead>
                <TableCell>{enumText.storageMedia(drive.media)}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("interface")}</TableHead>
                <TableCell>
                  {enumText.storageInterface(drive.interface)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div>
          <div className="catalog-detail-subtitle">
            <h2>{ui.section("specifications")}</h2>
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("formFactor")}</TableHead>
                <TableCell>
                  {formatStorageFormFactor(drive.formFactor)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("capacity")}</TableHead>
                <TableCell>{drive.capacityGb} {ui.unit("gb")}</TableCell>
              </TableRow>
              {drive.media === "Hdd" && (
                <TableRow>
                  <TableHead className="table-stub" scope="row">{ui.label("rpm")}</TableHead>
                  <TableCell>{drive.rpm} {ui.unit("rpm")}</TableCell>
                </TableRow>
              )}
              {drive.isM2 && (
                <>
                  <TableRow>
                    <TableHead className="table-stub" scope="row">{ui.label("m2Key")}</TableHead>
                    <TableCell>{drive.moduleKey}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="table-stub" scope="row">{ui.label("pcieGeneration")}</TableHead>
                    <TableCell>
                      {drive.pcieGeneration
                        ? enumText.pcieGeneration(drive.pcieGeneration)
                        : "—"}
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
