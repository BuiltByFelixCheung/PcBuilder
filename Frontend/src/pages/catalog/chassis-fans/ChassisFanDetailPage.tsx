import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus.tsx";
import { useChassisFan } from "@/hooks/use-chassis-fans.ts";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";
import { formatFanDiameterMm } from "@/api/enums";
import { AddToBuildButton } from "@/builds";
import { useAuth } from "@/auth/use-auth";
import { CatalogEditDialog } from "@/components/catalog/CatalogEditDialog";
import { Button } from "@/components/ui/button";
import { chassisFanKeys, updateChassisFan } from "@/api/catalog/chassis-fans";
import { ChassisFanFields } from "@/pages/catalog/chassis-fans/ChassisFanEditColumns";

export function ChassisFanDetailPage() {
  const { chassisFanId } = useParams();
  const query = useChassisFan(chassisFanId);
  const fan = query.data;
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const manufacturers = useCatalogManufacturers("chassisfan");

  if (query.isPending) {
    return <PageStatus>Loading chassis fan…</PageStatus>;
  }

  if (query.isError || !fan) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/chassis-fans">Back to Chassis Fans</Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : "Chassis fan not found."}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/chassis-fans">Back to Chassis Fans</Link>
      </p>
      <div className="catalog-detail-title">
        <h1>{fan.name}</h1>
        {!isAdmin && (
          <AddToBuildButton productType="chassisfan" partId={fan.id} />
        )}
        {isAdmin && (
          <Button type="button" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>
      {editing ? (
        <CatalogEditDialog
          title="Edit chassis fan"
          item={fan}
          fields={ChassisFanFields(manufacturers)}
          onClose={() => setEditing(false)}
          onSave={async (item) => {
            await updateChassisFan(item);
            await queryClient.invalidateQueries({
              queryKey: chassisFanKeys.detail(fan.id),
            });
          }}
        />
      ) : null}
      <dl className="catalog-details">
        <div>
          <dt>Manufacturer</dt>
          <dd>{fan.manufacturerName}</dd>
        </div>
        <div>
          <dt>Diameter</dt>
          <dd>{formatFanDiameterMm(fan.diameterMm)}</dd>
        </div>
        <div>
          <dt>Fans per pack</dt>
          <dd>{fan.fansCountPerPack}</dd>
        </div>
      </dl>
    </section>
  );
}
