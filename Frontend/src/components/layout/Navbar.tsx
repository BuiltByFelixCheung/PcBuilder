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
import { catalogLinks, masterDataLinks } from "@/components/layout/nav-links";

export function Navbar() {
  const { isAdmin } = useAuth();

  return (
    <nav
      className="relative z-50 flex h-8 items-center border-b border-border bg-background px-8"
      aria-label="Catalog"
    >
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Catalog</NavigationMenuTrigger>
            <NavigationMenuContent>
              {catalogLinks.map((link) => (
                <NavigationMenuLink asChild key={link.name}>
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
                <Link to="/builds/current">Builder</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          )}
          {!isAdmin && (
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle()}
              >
                <Link to="/builds">Browse Builds</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          )}
          {isAdmin && (
            <NavigationMenuItem>
              <NavigationMenuTrigger>Master Data</NavigationMenuTrigger>
              <NavigationMenuContent>
                {masterDataLinks.map((link) => (
                  <NavigationMenuLink asChild key={link.name}>
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
