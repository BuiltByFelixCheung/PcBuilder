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
import { CpuDetailPage } from "./pages/catalog/cpus/CpuDetailPage.tsx";
import { CpuListPage } from "./pages/catalog/cpus/CpuListPage.tsx";
import { GraphicsCardListPage } from "./pages/catalog/graphics-cards/GraphicsCardListPage.tsx";
import { GraphicsCardDetailPage } from "./pages/catalog/graphics-cards/GraphicsCardDetailPage.tsx";
import { RamListPage } from "./pages/catalog/memories/RamListPage.tsx";
import { RamDetailPage } from "./pages/catalog/memories/RamDetailPage.tsx";
import { StorageDetailPage } from "./pages/catalog/storage-drives/StorageDetailPage.tsx";
import { StorageListPage } from "./pages/catalog/storage-drives/StorageListPage.tsx";
import { PsuDetailPage } from "./pages/catalog/psus/PsuDetailPage.tsx";
import { PsuListPage } from "./pages/catalog/psus/PsuListPage.tsx";
import { CpuCoolerDetailPage } from "./pages/catalog/cpu-coolers/CpuCoolerDetailPage.tsx";
import { CpuCoolerListPage } from "./pages/catalog/cpu-coolers/CpuCoolerListPage.tsx";
import { ChassisFanDetailPage } from "./pages/catalog/chassis-fans/ChassisFanDetailPage.tsx";
import { ChassisFanListPage } from "./pages/catalog/chassis-fans/ChassisFanListPage.tsx";
import { WiredNetworkAdapterDetailPage } from "./pages/catalog/wired-network-adapters/WiredNetworkAdapterDetailPage.tsx";
import { WiredNetworkAdapterListPage } from "./pages/catalog/wired-network-adapters/WiredNetworkAdapterListPage.tsx";
import { WirelessNetworkAdapterDetailPage } from "./pages/catalog/wireless-network-adapters/WirelessNetworkAdapterDetailPage.tsx";
import { WirelessNetworkAdapterListPage } from "./pages/catalog/wireless-network-adapters/WirelessNetworkAdapterListPage.tsx";

import "./AppShell.css";
import { ChassisDetailPage } from "./pages/catalog/chassis/ChassisDetailPage.tsx";
import { ChassisListPage } from "./pages/catalog/chassis/ChassisListPage.tsx";
import { MotherboardDetailPage } from "./pages/catalog/motherboards/MotherboardDetailPage.tsx";
import { MotherboardListPage } from "./pages/catalog/motherboards/MotherboardListPage.tsx";
import { BuilderPage } from "./pages/build/BuilderPage.tsx";
import { RequireBuilder } from "./auth/RequireBuilder.tsx";
import { ChipsetListPage } from "./pages/master-data/chipsets/ChipsetListPage.tsx";
import { RequireAdmin } from "./auth/RequireAdmin.tsx";
import { CpuSeriesListPage } from "./pages/master-data/cpu-series/CpuSeriesListPage.tsx";
import { GpuSeriesListPage } from "./pages/master-data/gpu-series/GpuSeriesListPage.tsx";
import { GpuListPage } from "./pages/master-data/gpus/GpuListPage.tsx";
import { ManufacturerListPage } from "./pages/master-data/manufacturers/ManufacturerListPage.tsx";

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
        <Route
          path="catalog/chassis/:chassisId"
          element={<ChassisDetailPage />}
        />
        <Route path="catalog/motherboards" element={<MotherboardListPage />} />
        <Route
          path="catalog/motherboards/:motherboardId"
          element={<MotherboardDetailPage />}
        />
        <Route path="catalog/cpus" element={<CpuListPage />} />
        <Route path="catalog/cpus/:cpuId" element={<CpuDetailPage />} />
        <Route
          path="catalog/graphics-cards"
          element={<GraphicsCardListPage />}
        />
        <Route
          path="catalog/graphics-cards/:graphicsCardId"
          element={<GraphicsCardDetailPage />}
        />
        <Route path="catalog/memories" element={<RamListPage />} />
        <Route path="catalog/memories/:memoryId" element={<RamDetailPage />} />
        <Route path="catalog/storage" element={<StorageListPage />} />
        <Route
          path="catalog/storage/:storageId"
          element={<StorageDetailPage />}
        />
        <Route path="catalog/psus" element={<PsuListPage />} />
        <Route path="catalog/psus/:psuId" element={<PsuDetailPage />} />
        <Route path="catalog/cpu-coolers" element={<CpuCoolerListPage />} />
        <Route
          path="catalog/cpu-coolers/:cpuCoolerId"
          element={<CpuCoolerDetailPage />}
        />
        <Route path="catalog/chassis-fans" element={<ChassisFanListPage />} />
        <Route
          path="catalog/chassis-fans/:chassisFanId"
          element={<ChassisFanDetailPage />}
        />
        <Route
          path="catalog/wired-network-adapters"
          element={<WiredNetworkAdapterListPage />}
        />
        <Route
          path="catalog/wired-network-adapters/:wiredNetworkAdapterId"
          element={<WiredNetworkAdapterDetailPage />}
        />
        <Route
          path="catalog/wireless-network-adapters"
          element={<WirelessNetworkAdapterListPage />}
        />
        <Route
          path="catalog/wireless-network-adapters/:wirelessNetworkAdapterId"
          element={<WirelessNetworkAdapterDetailPage />}
        />
        <Route element={<RequireBuilder />}>
          <Route path="builds/current" element={<BuilderPage />} />
          <Route path="builds/:buildId/edit" element={<BuilderPage />} />
        </Route>
        <Route path="builds/:buildId" element={<BuilderPage />} />
        <Route element={<RequireAuth />}>
          <Route path="account" element={<AccountPage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route element={<RequireAdmin />}>
          <Route path="master-data/chipsets" element={<ChipsetListPage />} />
          <Route
            path="master-data/cpu-series"
            element={<CpuSeriesListPage />}
          />
          <Route
            path="master-data/gpu-series"
            element={<GpuSeriesListPage />}
          />
          <Route path="master-data/gpus" element={<GpuListPage />} />
          <Route path="master-data/manufacturers" element={<ManufacturerListPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
