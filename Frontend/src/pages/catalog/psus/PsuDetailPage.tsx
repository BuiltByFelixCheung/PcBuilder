import { useState } from "react";
import { Link, useParams } from "react-router-dom";
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
import { usePsu } from "@/hooks/use-psus.ts";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";
import { AddToBuildButton } from "@/builds";
import { useAuth } from "@/auth/use-auth";
import { Button } from "@/components/ui/button";
import { CatalogEditDialog } from "@/components/catalog/CatalogEditDialog";
import { ChildCollectionDialog } from "@/components/catalog/ChildCollectionDialog";
import { enumText, ui } from "@/i18n/translate-enum";
import {
  psuKeys,
  psuListItem,
  updatePsu,
  updatePsuCables,
  type PsuCable,
} from "@/api/catalog/psus";
import { PsuFields } from "@/pages/catalog/psus/PsuEditColumns";
import { cableColumns } from "@/pages/catalog/psus/PsuChildColumns";

export function PsuDetailPage() {
  const { psuId } = useParams();
  const query = usePsu(psuId);
  const psu = query.data;
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editingCables, setEditingCables] = useState(false);
  const manufacturers = useCatalogManufacturers("psu");

  if (query.isPending) {
    return <PageStatus>{ui.empty("loading", { entity: ui.entity("psu") })}</PageStatus>;
  }

  if (query.isError || !psu) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/psus">{ui.empty("backTo", { entity: ui.nav("products.psus") })}</Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : ui.empty("psuNotFound")}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/psus">{ui.empty("backTo", { entity: ui.nav("products.psus") })}</Link>
      </p>
      <div className="catalog-detail-title">
        <h1>{psu.name}</h1>
        {!isAdmin && <AddToBuildButton productType="psu" partId={psu.id} />}
        {isAdmin && (
          <Button type="button" onClick={() => setEditing(true)}>
            {ui.action("edit")}
          </Button>
        )}
      </div>
      {editing ? (
        <CatalogEditDialog
          title={ui.dialog("editPsu")}
          item={psuListItem(psu)}
          fields={PsuFields(manufacturers)}
          onClose={() => setEditing(false)}
          onSave={async (item) => {
            await updatePsu(item);
            await queryClient.invalidateQueries({
              queryKey: psuKeys.detail(psu.id),
            });
          }}
        />
      ) : null}
      {editingCables ? (
        <ChildCollectionDialog<PsuCable>
          title={ui.dialog("editCables")}
          rows={psu.cables}
          columns={cableColumns}
          createRow={() => ({
            type: "Motherboard24Pin",
            cablesCount: 1,
            connectorsCount: 1,
          })}
          onClose={() => setEditingCables(false)}
          onSave={async (rows) => {
            await updatePsuCables(psu.id, rows);
            await queryClient.invalidateQueries({
              queryKey: psuKeys.detail(psu.id),
            });
          }}
        />
      ) : null}
      <div className="catalog-table-trio">
        <div>
          <div className="catalog-detail-subtitle">
            <h2>{ui.section("basicInformation")}</h2>
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("manufacturer")}</TableHead>
                <TableCell>{psu.manufacturerName}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("wattage")}</TableHead>
                <TableCell>{psu.wattage} {ui.unit("watts")}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("modularity")}</TableHead>
                <TableCell>{enumText.psuModularity(psu.modularity)}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("formFactor")}</TableHead>
                <TableCell>{enumText.psuFormFactor(psu.formFactor)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div>
          <div className="catalog-detail-subtitle">
            <h2>{ui.section("dimensions")}</h2>
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("length")}</TableHead>
                <TableCell>{psu.lengthMm} {ui.unit("mm")}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("width")}</TableHead>
                <TableCell>{psu.widthMm} {ui.unit("mm")}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">{ui.label("height")}</TableHead>
                <TableCell>{psu.heightMm} {ui.unit("mm")}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div>
          <div className="catalog-detail-subtitle">
            <h2>{ui.section("cables")}</h2>
            {isAdmin && (
          <Button type="button" onClick={() => setEditingCables(true)}>
            {ui.action("editCables")}
          </Button>
        )}
          </div>
          <Table>
            <TableBody>
              {psu.cables.map((cable) => (
                <TableRow key={cable.type}>
                  <TableHead className="table-stub" scope="row">
                    {enumText.psuCableType(cable.type)}
                  </TableHead>
                  <TableCell>
                    {ui.message("cableCounts", {
                      cables: cable.cablesCount,
                      connectors: cable.connectorsCount,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
