import { api } from "./client";
import { excelFormData } from "./excel-file";
import type { BulkDeleteWrite } from "./types";

export type NamedMasterData = {
  id: string;
  name: string;
};

export type SocketOption = NamedMasterData & {
  manufacturerId: string;
  manufacturerName: string;
};

export type CpuSeriesOption = NamedMasterData & {
  manufacturerId: string;
  manufacturerName: string;
  socketId: string;
  socketName: string;
};

export type GpuSeriesOption = NamedMasterData & {
  manufacturerId: string;
  manufacturerName: string;
};

export type ChipsetOption = NamedMasterData & {
  manufacturerId: string;
  manufacturerName: string;
  socketId: string;
  socketName: string;
};

export type GpuOption = NamedMasterData & {
  manufacturerId: string;
  manufacturerName: string;
  gpuSeriesId: string;
  gpuSeriesName: string;
};

export type ProductType =
  | "chassis"
  | "chassisfan"
  | "chipset"
  | "cpu"
  | "cpucooler"
  | "cpuseries"
  | "gpu"
  | "gpuseries"
  | "graphicscard"
  | "motherboard"
  | "psu"
  | "ram"
  | "socket"
  | "storagedrive"
  | "wirednetworkadapter"
  | "wirelessnetworkadapter";

export const masterDataKeys = {
  manufacturers: ["master-data", "manufacturers"] as const,
  manufacturersByProductType: (productType: ProductType) =>
    ["master-data", "manufacturers", productType] as const,
  sockets: ["master-data", "sockets"] as const,
  cpuSeries: ["master-data", "cpu-series"] as const,
  gpuSeries: ["master-data", "gpu-series"] as const,
  gpus: ["master-data", "gpu"] as const,
  chipsets: ["master-data", "chipsets"] as const,
};

export function listManufacturers() {
  return api
    .get<NamedMasterData[]>("/master-data/manufacturer")
    .then((response) => response.data);
}

export function listManufacturersByProductType(productType: ProductType) {
  return api
    .get<NamedMasterData[]>(`/master-data/manufacturer/${productType}`)
    .then((response) => response.data);
}

export function listSockets() {
  return api
    .get<SocketOption[]>("/master-data/socket")
    .then((response) => response.data);
}

export function listCpuSeries() {
  return api
    .get<CpuSeriesOption[]>("/master-data/cpu-series")
    .then((response) => response.data);
}

export function listGpuSeries() {
  return api
    .get<GpuSeriesOption[]>("/master-data/gpu-series")
    .then((response) => response.data);
}

export function listGpus() {
  return api
    .get<GpuOption[]>("/master-data/gpu")
    .then((response) => response.data);
}

export function listChipsets() {
  return api
    .get<ChipsetOption[]>("/master-data/chipset")
    .then((response) => response.data);
}

export type ChipsetWrite = {
  name: string;
  manufacturerId: string;
  socketId: string;
};

export function createChipset(body: ChipsetWrite) {
  return api
    .post<ChipsetOption>("/master-data/chipset", body)
    .then((response) => response.data);
}

export function updateChipset(id: string, body: ChipsetWrite) {
  return api
    .put<ChipsetOption>("/master-data/chipset", { id, ...body })
    .then((response) => response.data);
}

export type CpuSeriesWrite = {
  name: string;
  manufacturerId: string;
  socketId: string;
};

export function createCpuSeries(body: CpuSeriesWrite) {
  return api
    .post<CpuSeriesOption>("/master-data/cpu-series", body)
    .then((response) => response.data);
}

export function updateCpuSeries(cpuSeriesId: string, body: CpuSeriesWrite) {
  return api
    .put<CpuSeriesOption>("/master-data/cpu-series", { cpuSeriesId, ...body })
    .then((response) => response.data);
}

export type GpuWrite = {
  name: string;
  manufacturerId: string;
  gpuSeriesId: string;
};

export function createGpu(body: GpuWrite) {
  return api
    .post<GpuOption>("/master-data/gpu", body)
    .then((response) => response.data);
}

export function updateGpu(gpuId: string, body: GpuWrite) {
  return api
    .put<GpuOption>("/master-data/gpu", { gpuId, ...body })
    .then((response) => response.data);
}

export type GpuSeriesWrite = {
  name: string;
  manufacturerId: string;
};

export function createGpuSeries(body: GpuSeriesWrite) {
  return api
    .post<GpuSeriesOption>("/master-data/gpu-series", body)
    .then((response) => response.data);
}

export function updateGpuSeries(gpuSeriesId: string, body: GpuSeriesWrite) {
  return api
    .put<GpuSeriesOption>("/master-data/gpu-series", { gpuSeriesId, ...body })
    .then((response) => response.data);
}

export type ManufacturerWrite = {
  name: string;
};

export function createManufacturer(body: ManufacturerWrite) {
  return api
    .post<NamedMasterData>("/master-data/manufacturer", body)
    .then((response) => response.data);
}

export function updateManufacturer(
  manufacturerId: string,
  body: ManufacturerWrite,
) {
  return api
    .put<NamedMasterData>("/master-data/manufacturer", {
      manufacturerId,
      ...body,
    })
    .then((response) => response.data);
}

export type SocketWrite = {
  name: string;
  manufacturerId: string;
};

export function createSocket(body: SocketWrite) {
  return api
    .post<SocketOption>("/master-data/socket", body)
    .then((response) => response.data);
}

export function updateSocket(socketId: string, body: SocketWrite) {
  return api
    .put<SocketOption>("/master-data/socket", { socketId, ...body })
    .then((response) => response.data);
}

export function deleteSocket(socketId: string) {
  return api.delete(`/master-data/socket/${socketId}`);
}

export function deleteManufacturer(manufacturerId: string) {
  return api.delete(`/master-data/manufacturer/${manufacturerId}`);
}

export function deleteCpuSeries(cpuSeriesId: string) {
  return api.delete(`/master-data/cpu-series/${cpuSeriesId}`);
}

export function deleteGpuSeries(gpuSeriesId: string) {
  return api.delete(`/master-data/gpu-series/${gpuSeriesId}`);
}

export function deleteGpu(gpuId: string) {
  return api.delete(`/master-data/gpu/${gpuId}`);
}

export function deleteChipset(chipsetId: string) {
  return api.delete(`/master-data/chipset/${chipsetId}`);
}

export function deleteSockets(body: BulkDeleteWrite) {
  return api.delete(`/master-data/socket/bulk`, { data: body });
}

export function updateSockets(sockets: SocketOption[]) {
  return api
    .put<SocketOption[]>("/master-data/socket/bulk", { sockets })
    .then((response) => response.data);
}

export function deleteManufacturers(body: BulkDeleteWrite) {
  return api.delete(`/master-data/manufacturer/bulk`, { data: body });
}

export function deleteMultipleCpuSeries(body: BulkDeleteWrite) {
  return api.delete(`/master-data/cpu-series/bulk`, { data: body });
}

export function deleteMultipleGpuSeries(body: BulkDeleteWrite) {
  return api.delete(`/master-data/gpu-series/bulk`, { data: body });
}

export function deleteGpus(body: BulkDeleteWrite) {
  return api.delete(`/master-data/gpu/bulk`, { data: body });
}

export function deleteChipsets(body: BulkDeleteWrite) {
  return api.delete(`/master-data/chipset/bulk`, { data: body });
}
function importMasterData(path: string, file: File) {
  return api.post(path, excelFormData(file));
}

export function importManufacturers(file: File) {
  return importMasterData("/master-data/manufacturer/import", file);
}

export function importSockets(file: File) {
  return importMasterData("/master-data/socket/import", file);
}

export function importCpuSeries(file: File) {
  return importMasterData("/master-data/cpu-series/import", file);
}

export function importGpuSeries(file: File) {
  return importMasterData("/master-data/gpu-series/import", file);
}

export function importGpus(file: File) {
  return importMasterData("/master-data/gpu/import", file);
}

export function importChipsets(file: File) {
  return importMasterData("/master-data/chipset/import", file);
}