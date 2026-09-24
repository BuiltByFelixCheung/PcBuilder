import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { catalogNameCell } from "@/components/catalog/CatalogNameCell.tsx";

describe("catalogNameCell", () => {
  it("links the part name to its detail path", () => {
    render(
      <MemoryRouter>
        {catalogNameCell("/catalog/cpus/cpu-1", "Ryzen 7 7800X3D")}
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: "Ryzen 7 7800X3D" }),
    ).toHaveAttribute("href", "/catalog/cpus/cpu-1");
  });
});
