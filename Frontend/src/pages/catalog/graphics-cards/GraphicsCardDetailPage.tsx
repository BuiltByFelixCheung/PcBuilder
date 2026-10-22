import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus.tsx";
import { useGraphicsCard } from "@/hooks/use-graphics-cards.ts";
import { useGraphicsCardFilterOptions } from "@/hooks/use-graphics-card-filter-options";
import { builderHref, usePcBuild } from "@/builds";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/use-auth";
import { CatalogEditDialog } from "@/components/catalog/CatalogEditDialog";
import {
  graphicsCardKeys,
  graphicsCardListItem,
  updateGraphicsCard,
} from "@/api/catalog/graphics-cards";
import { enumText, ui } from "@/i18n/translate-enum";
import { GraphicsCardFields } from "@/pages/catalog/graphics-cards/GraphicsCardEditColumns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";

export function GraphicsCardDetailPage() {
  const { graphicsCardId } = useParams();
  const query = useGraphicsCard(graphicsCardId);
  const graphicsCard = query.data;
  const currentBuild = usePcBuild();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const { manufacturers, gpus } = useGraphicsCardFilterOptions();

  if (query.isPending) {
    return <PageStatus>{ui.empty("loading", { entity: ui.entity("graphicsCard") })}</PageStatus>;
  }

  if (query.isError || !graphicsCard) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/graphics-cards">{ui.empty("backTo", { entity: ui.nav("products.graphicsCards") })}</Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : ui.empty("graphicsCardNotFound")}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/graphics-cards">{ui.empty("backTo", { entity: ui.nav("products.graphicsCards") })}</Link>
      </p>
      <div className="catalog-detail-title">
        <h1>{graphicsCard.name}</h1>
        {!isAdmin && (
          <Button
            onClick={() => {
              if (
                !currentBuild.graphicsCardId ||
                currentBuild.graphicsCardId !== graphicsCard.id
              )
                currentBuild.addToBuild("graphicscard", graphicsCard.id);
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
          title={ui.dialog("editGraphicsCard")}
          item={graphicsCardListItem(graphicsCard)}
          fields={GraphicsCardFields(manufacturers, gpus)}
          onClose={() => setEditing(false)}
          onSave={async (item) => {
            await updateGraphicsCard(item);
            await queryClient.invalidateQueries({
              queryKey: graphicsCardKeys.detail(graphicsCard.id),
            });
          }}
        />
      ) : null}
      <div className="catalog-table-pair">
        <div className="catalog-detail-stack">
          <div>
            <div className="catalog-detail-subtitle">
              <h2>{ui.section("basicInformation")}</h2>
            </div>
            <Table>
              <TableBody>
                <TableRow>
                  <TableHead className="table-stub" scope="row">{ui.label("manufacturer")}</TableHead>
                  <TableCell>{graphicsCard.manufacturerName}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead className="table-stub" scope="row">{ui.label("videoMemory")}</TableHead>
                  <TableCell>{graphicsCard.videoMemoryGb} {ui.unit("gb")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead className="table-stub" scope="row">{ui.label("slotWidth")}</TableHead>
                  <TableCell>{graphicsCard.pcieSlotsUsed}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead className="table-stub" scope="row">{ui.label("pcieGeneration")}</TableHead>
                  <TableCell>
                    {enumText.pcieGeneration(graphicsCard.pcieGeneration)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableHead className="table-stub" scope="row">{ui.label("lowProfile")}</TableHead>
                  <TableCell>
                    {graphicsCard.isLowProfile ? ui.label("yes") : ui.label("no")}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div>
            <div className="catalog-detail-subtitle">
              <h2>{graphicsCard.gpuName}</h2>
            </div>
            <Table>
              <TableBody>
                <TableRow>
                  <TableHead className="table-stub" scope="row">{ui.label("manufacturer")}</TableHead>
                  <TableCell>{graphicsCard.gpuManufacturerName}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead className="table-stub" scope="row">{ui.label("series")}</TableHead>
                  <TableCell>{graphicsCard.gpuSeriesName}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        <div>
          <div className="catalog-detail-subtitle">
            <h2>{ui.section("dimensionsAndPower")}</h2>
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("length")}</TableHead>
                <TableCell>{graphicsCard.lengthMm} {ui.unit("mm")}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("width")}</TableHead>
                <TableCell>{graphicsCard.widthMm} {ui.unit("mm")}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("height")}</TableHead>
                <TableCell>{graphicsCard.heightMm} {ui.unit("mm")}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("powerConsumption")}</TableHead>
                <TableCell>{graphicsCard.powerConsumptionWatts} {ui.unit("watts")}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("powerConnectors")}</TableHead>
                <TableCell>
                  {enumText.psuCableType(graphicsCard.powerConnectorType)} x{" "}
                  {graphicsCard.powerConnectorCount}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
