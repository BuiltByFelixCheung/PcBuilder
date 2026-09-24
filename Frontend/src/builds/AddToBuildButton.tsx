import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { allowsBuildQuantity, builderHref } from "./types";
import { usePcBuild } from "./use-pc-build";
import type { CatalogProductType } from "./types";

export function AddToBuildButton({
  productType,
  partId,
}: Readonly<{ productType: CatalogProductType; partId: string }>) {
  const build = usePcBuild();
  const navigate = useNavigate();
  const showQty = allowsBuildQuantity(productType);
  const [qty, setQty] = useState(1);

  return (
    <div className="add-to-build">
      {showQty ? (
        <>
          <Label htmlFor={`build-qty-${partId}`}>QTY</Label>
          <Input
            id={`build-qty-${partId}`}
            className="add-to-build-qty-input"
            type="number"
            min={1}
            step={1}
            value={qty}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10);
              setQty(Number.isFinite(next) && next > 0 ? next : 1);
            }}
          />
        </>
      ) : null}
      <Button
        type="button"
        onClick={() => {
          build.addToBuild(productType, partId, showQty ? qty : undefined);
          navigate(builderHref(build.sourceId));
        }}
      >
        Add to Build
      </Button>
    </div>
  );
}
