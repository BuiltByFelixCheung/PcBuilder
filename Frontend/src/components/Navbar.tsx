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

export function Navbar() {

  const catalogLinks = [
    { name: "Chassis", href: "/catalog/chassis" },
    { name: "Motherboards", href: "/catalog/motherboards" },
    { name: "CPUs", href: "/catalog/cpus" },
    { name: "RAM", href: "/catalog/memories" },
    { name: "Graphics Cards", href: "/catalog/graphics-cards" },
    { name: "Storage", href: "#" },
    { name: "PSUs", href: "#" },
    { name: "CPU Coolers", href: "#" },
    { name: "Chassis Fans", href: "#" },
    { name: "Wired Network Adapters", href: "#" },
    { name: "Wireless Network Adapters", href: "#" }
  ];

  return (
    <nav
      className="relative z-50 flex h-8 items-center border-b border-border bg-background px-8"
      aria-label="Catalog"
    >
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link to="/">Home</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
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
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
}
