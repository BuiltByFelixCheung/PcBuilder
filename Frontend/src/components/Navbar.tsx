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
import { useAuth } from "@/auth/useAuth";

export function Navbar() {
  const { isAdmin } = useAuth();
  const catalogLinks = [
    { name: "Chassis", href: "/catalog/chassis" },
    { name: "Motherboards", href: "/catalog/motherboards" },
    { name: "CPUs", href: "/catalog/cpus" },
    { name: "CPU Coolers", href: "/catalog/cpu-coolers" },
    { name: "RAM", href: "/catalog/memories" },
    { name: "Graphics Cards", href: "/catalog/graphics-cards" },
    { name: "PSUs", href: "/catalog/psus" },
    { name: "Storage", href: "/catalog/storage" },
    { name: "Storage Drives", href: "/catalog/storage-drives" },
    { name: "Chassis Fans", href: "/catalog/chassis-fans" },
    { name: "Wired Network Adapters", href: "/catalog/wired-network-adapters" },
    {
      name: "Wireless Network Adapters",
      href: "/catalog/wireless-network-adapters",
    },
  ];

  const masterDataLinks = [
    { name: "Chipsets", href: "/master-data/chipsets" },
    { name: "CPU Series", href: "/master-data/cpu-series" },
    { name: "GPUs", href: "/master-data/gpus" },
    { name: "GPU Series", href: "/master-data/gpu-series" },
    { name: "Manufacturers", href: "/master-data/manufacturers" },
    { name: "Sockets", href: "/master-data/sockets" },
  ];

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
