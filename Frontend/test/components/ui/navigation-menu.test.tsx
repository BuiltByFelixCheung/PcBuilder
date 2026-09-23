import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  NavigationMenu,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

describe("navigation menu primitives", () => {
  it("renders the default viewport and indicator", () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            <NavigationMenuIndicator />
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
  });
});
