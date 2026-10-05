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
    return <PageStatus>Loading storage…</PageStatus>;
  }

  if (query.isError || !drive) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/storage">Back to Storage</Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : "Storage drive not found."}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/storage">Back to Storage</Link>
      </p>
      <div className="catalog-detail-title">
        <h1>{drive.name}</h1>
        {!isAdmin && (
          <AddToBuildButton productType="storagedrive" partId={drive.id} />
        )}
        {isAdmin && (
          <Button type="button" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>
      {editing ? (
        <CatalogEditDialog
          title="Edit storage drive"
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
            <h2>Basic information</h2>
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Manufacturer
                </TableHead>
                <TableCell>{drive.manufacturerName}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Type
                </TableHead>
                <TableCell>{drive.media}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Interface
                </TableHead>
                <TableCell>{drive.interface}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div>
          <div className="catalog-detail-subtitle">
            <h2>Specifications</h2>
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Form factor
                </TableHead>
                <TableCell>
                  {formatStorageFormFactor(drive.formFactor)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Capacity
                </TableHead>
                <TableCell>{drive.capacityGb} GB</TableCell>
              </TableRow>
              {drive.media === "Hdd" && (
                <TableRow>
                  <TableHead className="table-stub" scope="row">
                    RPM
                  </TableHead>
                  <TableCell>{drive.rpm} RPM</TableCell>
                </TableRow>
              )}
              {drive.isM2 && (
                <>
                  <TableRow>
                    <TableHead className="table-stub" scope="row">
                      M.2 key
                    </TableHead>
                    <TableCell>{drive.moduleKey}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="table-stub" scope="row">
                      PCIe generation
                    </TableHead>
                    <TableCell>{drive.pcieGeneration}</TableCell>
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
