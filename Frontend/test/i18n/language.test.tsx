import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { useTranslation } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { enumText, ui } from "@/i18n/translate-enum";

vi.mock("@/auth/use-auth.ts", () => ({
  useAuth: () => ({
    isReady: true,
    isAuthenticated: false,
    user: null,
    isAdmin: false,
    isMember: false,
    logout: vi.fn(),
  }),
}));

function SocketMismatch() {
  const { i18n } = useTranslation();
  return (
    <p lang={i18n.language}>{enumText.compatibilityReason("SocketMismatch")}</p>
  );
}

describe("language", () => {
  it("translates catalog values into the selected language", async () => {
    const user = userEvent.setup();
    render(
      <>
        <LanguageToggle />
        <SocketMismatch />
      </>,
    );

    expect(screen.getByText("Socket mismatch")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "繁體中文" }));

    expect(await screen.findByText("插座不符")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "繁體中文" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(enumText.compatibilityStatus("CompatibleActionRequired")).toBe(
      "兼容，但需要額外處理",
    );
    expect(enumText.ddrGeneration("Ddr5")).toBe("DDR5");
    expect(enumText.compatibilitySlot("GraphicsCard")).toBe("顯示卡");
    expect(enumText.fanHeaderType("FourPinPwm")).toBe("4 針 PWM");
    expect(ui.header("manufacturer")).toBe("製造商");
    expect(ui.label("formFactor")).toBe("尺寸規格");
    expect(ui.nav("catalog")).toBe("零件目錄");
  });

  it("updates route pages that do not subscribe to i18n themselves", async () => {
    const user = userEvent.setup();
    function RankLabel() {
      return <p>{enumText.ramRank("SingleRank")}</p>;
    }

    render(
      <MemoryRouter initialEntries={["/rank"]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/rank" element={<RankLabel />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Single rank")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "繁體中文" }));

    expect(await screen.findByText("單面")).toBeInTheDocument();
  });
});
