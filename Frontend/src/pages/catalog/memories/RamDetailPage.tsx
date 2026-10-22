import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus.tsx";
import { useMemory } from "@/hooks/use-memories.ts";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";
import { Button } from "@/components/ui/button";
import { builderHref, usePcBuild } from "@/builds";
import { useAuth } from "@/auth/use-auth";
import { CatalogEditDialog } from "@/components/catalog/CatalogEditDialog";
import { memoryKeys, updateMemory } from "@/api/catalog/memories";
import { enumText, ui } from "@/i18n/translate-enum";
import { MemoryFields } from "@/pages/catalog/memories/MemoryEditColumns";

export function RamDetailPage() {
  const { memoryId } = useParams();
  const query = useMemory(memoryId);
  const ram = query.data;
  const currentBuild = usePcBuild();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const manufacturers = useCatalogManufacturers("ram");

  if (query.isPending) {
    return <PageStatus>{ui.empty("loading", { entity: ui.entity("ram") })}</PageStatus>;
  }

  if (query.isError || !ram) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/memories">{ui.empty("backTo", { entity: ui.nav("products.ram") })}</Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : ui.empty("ramNotFound")}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/memories">{ui.empty("backTo", { entity: ui.nav("products.ram") })}</Link>
      </p>
      <div className="catalog-detail-title">
        <h1>{ram.name}</h1>
        {!isAdmin && (
          <Button
            onClick={() => {
              if (!currentBuild.ramKitId || currentBuild.ramKitId !== ram.id)
                currentBuild.addToBuild("ram", ram.id);
              navigate(builderHref(currentBuild.sourceId));
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
          title={ui.dialog("editRam")}
          item={ram}
          fields={MemoryFields(manufacturers)}
          onClose={() => setEditing(false)}
          onSave={async (item) => {
            await updateMemory(item);
            await queryClient.invalidateQueries({
              queryKey: memoryKeys.detail(ram.id),
            });
          }}
        />
      ) : null}
      <dl className="catalog-details">
        <div>
          <dt>{ui.label("manufacturer")}</dt>
          <dd>{ram.manufacturerName}</dd>
        </div>
        <div>
          <dt>{ui.label("color")}</dt>
          <dd>{ram.color}</dd>
        </div>
        <div>
          <dt>{ui.label("ddrGeneration")}</dt>
          <dd>{enumText.ddrGeneration(ram.ddrGeneration)}</dd>
        </div>
        <div>
          <dt>{ui.label("ramFormFactor")}</dt>
          <dd>{enumText.ramFormFactor(ram.ramFormFactor)}</dd>
        </div>
        <div>
          <dt>{ui.label("ramRank")}</dt>
          <dd>{enumText.ramRank(ram.ramRank)}</dd>
        </div>
        <div>
          <dt>{ui.label("memorySizePerStick")}</dt>
          <dd>{ram.memorySizePerStickGb} {ui.unit("gb")}</dd>
        </div>
        <div>
          <dt>{ui.label("totalMemorySize")}</dt>
          <dd>{ram.totalMemorySizeGb} {ui.unit("gb")}</dd>
        </div>
        <div>
          <dt>{ui.label("modulesCountLong")}</dt>
          <dd>{ram.modulesCount}</dd>
        </div>
        <div>
          <dt>{ui.label("maxMemorySpeed")}</dt>
          <dd>{ram.maxMemorySpeedMts} {ui.unit("mhz")}</dd>
        </div>
        <div>
          <dt>{ui.label("height")}</dt>
          <dd>{ram.heightMm} {ui.unit("mm")}</dd>
        </div>
      </dl>
    </section>
  );
}
