import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus.tsx";
import { useStorageDrive } from "@/hooks/use-storage-drives.ts";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";
import { formatM2FormFactor, formatStorageFormFactor } from "@/api/enums";
import { AddToBuildButton } from "@/builds";
import { useAuth } from "@/auth/use-auth";
import { CatalogEditDialog } from "@/components/catalog/CatalogEditDialog";
import { Button } from "@/components/ui/button";
import {
  storageDriveKeys,
  updateStorageDrive,
} from "@/api/catalog/storage-drives";
import { StorageFields } from "@/pages/catalog/storage-drives/StorageEditColumns";

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
      <dl className="catalog-details">
        <div>
          <dt>Manufacturer</dt>
          <dd>{drive.manufacturerName}</dd>
        </div>
        <div>
          <dt>Media</dt>
          <dd>{drive.media}</dd>
        </div>
        <div>
          <dt>Interface</dt>
          <dd>{drive.interface}</dd>
        </div>
        <div>
          <dt>Form factor</dt>
          <dd>{formatStorageFormFactor(drive.formFactor)}</dd>
        </div>
        <div>
          <dt>Capacity</dt>
          <dd>{drive.capacityGb} GB</dd>
        </div>
        <div>
          <dt>PCIe generation</dt>
          <dd>
            {drive.pcieGeneration
              ? drive.pcieGeneration.replace("Gen", "PCIe ")
              : "—"}
          </dd>
        </div>
        <div>
          <dt>RPM</dt>
          <dd>{drive.rpm ?? "—"}</dd>
        </div>
        <div>
          <dt>M.2</dt>
          <dd>{drive.isM2 ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt>M.2 key</dt>
          <dd>{drive.moduleKey ?? "—"}</dd>
        </div>
        <div>
          <dt>M.2 form factor</dt>
          <dd>
            {drive.m2FormFactor ? formatM2FormFactor(drive.m2FormFactor) : "—"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
