import { Outlet } from "react-router-dom";
import { AppHeader } from "./AppHeader.tsx";
import { Navbar } from "./Navbar.tsx";

export function AppLayout() {
  return (
    <>
      <AppHeader />
      <Navbar />
      <Outlet />
    </>
  );
}
