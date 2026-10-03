import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { AppHeader } from "./AppHeader.tsx";
import { MobileHeader } from "./MobileHeader.tsx";
import { Navbar } from "./Navbar.tsx";

export function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <MobileHeader />
      ) : (
        <>
          <AppHeader />
          <Navbar />
        </>
      )}
      <Outlet />
    </>
  );
}
