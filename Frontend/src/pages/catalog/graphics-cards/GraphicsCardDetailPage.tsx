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
    return <PageStatus>Loading Graphics Card…</PageStatus>;
  }

  if (query.isError || !graphicsCard) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/graphics-cards">Back to Graphics Cards</Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : "Graphics Card not found."}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/graphics-cards">Back to Graphics Cards</Link>
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
            Add to Build
          </Button>
        )}
        {isAdmin && (
          <Button type="button" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>
      {editing ? (
        <CatalogEditDialog
          title="Edit graphics card"
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
              <h2>Basic information</h2>
            </div>
            <Table>
              <TableBody>
                <TableRow>
                  <TableHead className="table-stub" scope="row">
                    Manufacturer
                  </TableHead>
                  <TableCell>{graphicsCard.manufacturerName}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead className="table-stub" scope="row">
                    Video memory
                  </TableHead>
                  <TableCell>{graphicsCard.videoMemoryGb} GB</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead className="table-stub" scope="row">
                    Slot width
                  </TableHead>
                  <TableCell>{graphicsCard.pcieSlotsUsed}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead className="table-stub" scope="row">
                    PCIe generation
                  </TableHead>
                  <TableCell>{graphicsCard.pcieGeneration}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead className="table-stub" scope="row">
                    Low profile
                  </TableHead>
                  <TableCell>
                    {graphicsCard.isLowProfile ? "Yes" : "No"}
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
                  <TableHead className="table-stub" scope="row">
                    Manufacturer
                  </TableHead>
                  <TableCell>{graphicsCard.gpuManufacturerName}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead className="table-stub" scope="row">
                    Series
                  </TableHead>
                  <TableCell>{graphicsCard.gpuSeriesName}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        <div>
          <div className="catalog-detail-subtitle">
            <h2>Dimensions and power</h2>
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Length
                </TableHead>
                <TableCell>{graphicsCard.lengthMm} mm</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Width
                </TableHead>
                <TableCell>{graphicsCard.widthMm} mm</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Height
                </TableHead>
                <TableCell>{graphicsCard.heightMm} mm</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Power consumption
                </TableHead>
                <TableCell>{graphicsCard.powerConsumptionWatts} W</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Power connectors
                </TableHead>
                <TableCell>
                  {graphicsCard.powerConnectorType} x{" "}
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
