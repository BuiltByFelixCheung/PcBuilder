import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu-trigger-style";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/use-auth";
import {
  getCatalogLinks,
  getMasterDataLinks,
} from "@/components/layout/nav-links";
import { ui } from "@/i18n/translate-enum";

export function Navbar() {
  const { isAdmin } = useAuth();
  const catalogLinks = getCatalogLinks();
  const masterDataLinks = getMasterDataLinks();

  return (
    <nav
      className="relative z-50 flex h-8 items-center border-b border-border bg-background px-8"
      aria-label={ui.nav("catalog")}
    >
      <NavigationMenu viewport={false} aria-label={ui.nav("main")}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>{ui.nav("catalog")}</NavigationMenuTrigger>
            <NavigationMenuContent>
              {catalogLinks.map((link) => (
                <NavigationMenuLink asChild key={link.href}>
                  <Link to={link.href}>{link.name}</Link>
                </NavigationMenuLink>
              ))}
            </NavigationMenuContent>
          </NavigationMenuItem>
          {!isAdmin && (
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle()}
              >
                <Link to="/builds/current">{ui.nav("builder")}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          )}
          {!isAdmin && (
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle()}
              >
                <Link to="/builds">{ui.nav("browseBuilds")}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          )}
          {isAdmin && (
            <NavigationMenuItem>
              <NavigationMenuTrigger>{ui.nav("masterData")}</NavigationMenuTrigger>
              <NavigationMenuContent>
                {masterDataLinks.map((link) => (
                  <NavigationMenuLink asChild key={link.href}>
                    <Link to={link.href}>{link.name}</Link>
                  </NavigationMenuLink>
                ))}
              </NavigationMenuContent>
            </NavigationMenuItem>
          )}
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
}
