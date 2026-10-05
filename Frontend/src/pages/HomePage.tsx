import { Link } from "react-router-dom";
import { useAuth } from "@/auth/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function HomePage() {
  const { isAdmin } = useAuth();

  return (
    <section className="catalog-page">
      <h1>PC Builder</h1>
      <p className="catalog-lead">
        Pick parts, check compatibility, and save a build. Public builds show up
        on Browse Builds; private ones stay on My builds.
      </p>
      <div className="browse-builds-grid">
        {isAdmin ? null : (
          <>
            <Card className="browse-builds-card">
              <CardHeader>
                <CardTitle>Start a build</CardTitle>
                <CardDescription>
                  Open the builder and add parts one slot at a time.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild variant="outline" size="sm">
                  <Link to="/builds/current">Open builder</Link>
                </Button>
              </CardFooter>
            </Card>
            <Card className="browse-builds-card">
              <CardHeader>
                <CardTitle>Browse builds</CardTitle>
                <CardDescription>
                  See public builds other members have shared.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild variant="outline" size="sm">
                  <Link to="/builds">View public builds</Link>
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
        <Card className="browse-builds-card">
          <CardHeader>
            <CardTitle>Parts catalog</CardTitle>
            <CardDescription>
              Chassis, CPUs, GPUs, and the rest of the inventory.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" size="sm">
              <Link to="/catalog/chassis">Browse chassis</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
