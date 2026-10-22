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
import { ui } from "@/i18n/translate-enum";

export function HomePage() {
  const { isAdmin } = useAuth();

  return (
    <section className="catalog-page">
      <h1>PC Builder</h1>
      <p className="catalog-lead">{ui.message("homeLead")}</p>
      <div className="browse-builds-grid">
        {isAdmin ? null : (
          <>
            <Card className="browse-builds-card">
              <CardHeader>
                <CardTitle>{ui.page("startABuild")}</CardTitle>
                <CardDescription>{ui.message("startBuildDescription")}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild variant="outline" size="sm">
                  <Link to="/builds/current">{ui.action("openBuilder")}</Link>
                </Button>
              </CardFooter>
            </Card>
            <Card className="browse-builds-card">
              <CardHeader>
                <CardTitle>{ui.page("browseBuilds")}</CardTitle>
                <CardDescription>{ui.message("browseBuildsDescription")}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild variant="outline" size="sm">
                  <Link to="/builds">{ui.action("viewPublicBuilds")}</Link>
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
        <Card className="browse-builds-card">
          <CardHeader>
            <CardTitle>{ui.page("partsCatalog")}</CardTitle>
            <CardDescription>{ui.message("partsCatalogDescription")}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" size="sm">
              <Link to="/catalog/chassis">{ui.action("browseChassis")}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
