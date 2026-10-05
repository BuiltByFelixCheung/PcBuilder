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
    return <PageStatus>Loading PSU…</PageStatus>;
  }

  if (query.isError || !psu) {
    return (
      <section className="catalog-page">
        <p>
          <Link to="/catalog/psus">Back to PSUs</Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : "PSU not found."}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to="/catalog/psus">Back to PSUs</Link>
      </p>
      <div className="catalog-detail-title">
        <h1>{psu.name}</h1>
        {!isAdmin && <AddToBuildButton productType="psu" partId={psu.id} />}
        {isAdmin && (
          <Button type="button" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>
      {editing ? (
        <CatalogEditDialog
          title="Edit PSU"
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
          title="Edit cables"
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
            <h2>Basic Information</h2>
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Manufacturer
                </TableHead>
                <TableCell>{psu.manufacturerName}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Wattage
                </TableHead>
                <TableCell>{psu.wattage} W</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Modularity
                </TableHead>
                <TableCell>{psu.modularity}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">
                  Form factor
                </TableHead>
                <TableCell>{psu.formFactor}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div>
          <div className="catalog-detail-subtitle">
            <h2>Dimensions</h2>
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="table-stub" scope="row">Length</TableHead>
                <TableCell>{psu.lengthMm} mm</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">Width</TableHead>
                <TableCell>{psu.widthMm} mm</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="table-stub" scope="row">Height</TableHead>
                <TableCell>{psu.heightMm} mm</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div>
          <div className="catalog-detail-subtitle">
            <h2>Cables</h2>
            {isAdmin && (
          <Button type="button" onClick={() => setEditingCables(true)}>
            Edit cables
          </Button>
        )}
          </div>
          <Table>
            <TableBody>
              {psu.cables.map((cable) => (
                <TableRow key={cable.type}>
                  <TableHead className="table-stub" scope="row">{cable.type}</TableHead>
                  <TableCell>{cable.cablesCount} cables, {cable.connectorsCount} connectors</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
