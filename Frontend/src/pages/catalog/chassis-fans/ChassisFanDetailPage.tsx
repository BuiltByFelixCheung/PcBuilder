import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus.tsx";
import { useChassisFan } from "@/hooks/use-chassis-fans.ts";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";
import { formatFanDiameterMm, formatFanHeaderType } from "@/api/enums";
import { AddToBuildButton } from "@/builds";
import { useAuth } from "@/auth/use-auth";
import { CatalogEditDialog } from "@/components/catalog/CatalogEditDialog";
import { Button } from "@/components/ui/button";
import { chassisFanKeys, updateChassisFan } from "@/api/catalog/chassis-fans";
import { ChassisFanFields } from "@/pages/catalog/chassis-fans/ChassisFanEditColumns";
import { ui } from "@/i18n/translate-enum";

export function ChassisFanDetailPage() {
  const { chassisFanId } = useParams();
  const query = useChassisFan(chassisFanId);
  const fan = query.data;
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const manufacturers = useCatalogManufacturers("chassisfan");

  if (query.isPending) {
    return <PageStatus>{ui.empty("loading", { entity: ui.entity("chassisFan") })}</PageStatus>;
  }

  if (query.isError || !fan) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/chassis-fans">{ui.empty("backTo", { entity: ui.nav("products.chassisFans") })}</Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : ui.empty("chassisFanNotFound")}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/chassis-fans">{ui.empty("backTo", { entity: ui.nav("products.chassisFans") })}</Link>
      </p>
      <div className="catalog-detail-title">
        <h1>{fan.name}</h1>
        {!isAdmin && (
          <AddToBuildButton productType="chassisfan" partId={fan.id} />
        )}
        {isAdmin && (
          <Button type="button" onClick={() => setEditing(true)}>
            {ui.action("edit")}
          </Button>
        )}
      </div>
      {editing ? (
        <CatalogEditDialog
          title={ui.dialog("editChassisFan")}
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
          <dt>{ui.label("manufacturer")}</dt>
          <dd>{fan.manufacturerName}</dd>
        </div>
        <div>
          <dt>{ui.label("diameter")}</dt>
          <dd>{formatFanDiameterMm(fan.diameterMm)}</dd>
        </div>
        <div>
          <dt>{ui.label("fansPerPack")}</dt>
          <dd>{fan.fansCountPerPack}</dd>
        </div>
        <div>
          <dt>{ui.label("thickness")}</dt>
          <dd>{fan.thicknessMm} {ui.unit("mm")}</dd>
        </div>
        <div>
          <dt>{ui.label("header")}</dt>
          <dd>{formatFanHeaderType(fan.headerType)}</dd>
        </div>
        <div>
          <dt>{ui.label("daisyChain")}</dt>
          <dd>
            {fan.supportsDaisyChain
              ? ui.message("yesMax", { count: fan.maxFansPerDaisyChain ?? 0 })
              : ui.label("no")}
          </dd>
        </div>
      </dl>
    </section>
  );
}
