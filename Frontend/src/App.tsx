import { Navigate, Route, Routes } from "react-router-dom";
import { ChangePasswordPage } from "./pages/auth/ChangePasswordPage.tsx";
import { RequireAuth } from "./auth/RequireAuth.tsx";
import { RequireGuest } from "./auth/RequireGuest.tsx";
import { AppLayout } from "./components/AppLayout.tsx";
import { AccountPage } from "./pages/auth/AccountPage.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { LoginPage } from "./pages/auth/LoginPage.tsx";
import { RegisterPage } from "./pages/auth/RegisterPage.tsx";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage.tsx";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage.tsx";
import { CpuDetailPage } from "./pages/catalog/CpuDetailPage.tsx";
import { CpuListPage } from "./pages/catalog/CpuListPage.tsx";
import { GraphicsCardListPage } from "./pages/catalog/GraphicsCardListPage.tsx";
import { GraphicsCardDetailPage } from "./pages/catalog/GraphicsCardDetailPage.tsx";
import { RamListPage } from "./pages/catalog/RamListPage.tsx";
import { RamDetailPage } from "./pages/catalog/RamDetailPage.tsx";

import "./AppShell.css";
import { ChassisDetailPage } from "./pages/catalog/ChassisDetailPage.tsx";
import { ChassisListPage } from "./pages/catalog/ChassisListPage.tsx";
import { MotherboardDetailPage } from "./pages/catalog/MotherboardDetailPage.tsx";
import { MotherboardListPage } from "./pages/catalog/MotherboardListPage.tsx";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route element={<RequireGuest />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
        </Route>
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="catalog/chassis" element={<ChassisListPage />} />
        <Route path="catalog/chassis/:chassisId" element={<ChassisDetailPage />} />
        <Route path="catalog/motherboards" element={<MotherboardListPage />} />
        <Route
          path="catalog/motherboards/:motherboardId"
          element={<MotherboardDetailPage />}
        />
        <Route path="catalog/cpus" element={<CpuListPage />} />
        <Route path="catalog/cpus/:cpuId" element={<CpuDetailPage />} />
        <Route path="catalog/graphics-cards" element={<GraphicsCardListPage />} />
        <Route path="catalog/graphics-cards/:graphicsCardId" element={<GraphicsCardDetailPage />} />
        <Route path="catalog/memories" element={<RamListPage />} />
        <Route path="catalog/memories/:memoryId" element={<RamDetailPage />} /> 
        <Route element={<RequireAuth />}>
          <Route path="account" element={<AccountPage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
