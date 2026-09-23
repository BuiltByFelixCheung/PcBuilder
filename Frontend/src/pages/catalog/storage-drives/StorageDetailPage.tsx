import { Link, useParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus.tsx";
import { useStorageDrive } from "@/hooks/use-storage-drives.ts";
import { formatM2FormFactor, formatStorageFormFactor } from "@/api/enums";
import { AddToBuildButton } from "@/builds";
import { useAuth } from "@/auth/useAuth";

export function StorageDetailPage() {
  const { storageId } = useParams();
  const query = useStorageDrive(storageId);
  const drive = query.data;
  const { isAdmin } = useAuth();

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
      <h1>{drive.name}</h1>
      {!isAdmin && (
        <AddToBuildButton productType="storagedrive" partId={drive.id} />
      )}
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
