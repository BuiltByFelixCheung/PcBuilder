import { Link, useParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus.tsx";
import { useChassisFan } from "@/hooks/use-chassis-fans.ts";
import { formatFanDiameterMm } from "@/api/enums";
import { AddToBuildButton } from "@/builds";
import { useAuth } from "@/auth/use-auth";

export function ChassisFanDetailPage() {
  const { chassisFanId } = useParams();
  const query = useChassisFan(chassisFanId);
  const fan = query.data;
  const { isAdmin } = useAuth();

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
      <h1>{fan.name}</h1>
      {!isAdmin && (
        <AddToBuildButton productType="chassisfan" partId={fan.id} />
      )}
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
