import { api } from './client'

export type NamedMasterData = {
  id: string
  name: string
}

export type SocketOption = NamedMasterData & {
  manufacturerId: string
  manufacturerName: string
}

export type CpuSeriesOption = NamedMasterData & {
  manufacturerId: string
  manufacturerName: string
  socketId: string
  socketName: string
}

export type GpuSeriesOption = NamedMasterData & {
  manufacturerId: string
  manufacturerName: string
}

export type ChipsetOption = NamedMasterData & {
  manufacturerId: string
  manufacturerName: string
  socketId: string
  socketName: string
}

export type ProductType =
  | 'chassis'
  | 'chassisfan'
  | 'chipset'
  | 'cpu'
  | 'cpucooler'
  | 'cpuseries'
  | 'gpu'
  | 'gpuseries'
  | 'graphicscard'
  | 'motherboard'
  | 'psu'
  | 'ram'
  | 'socket'
  | 'storagedrive'
  | 'wirednetworkadapter'
  | 'wirelessnetworkadapter'

export const masterDataKeys = {
  manufacturers: ['master-data', 'manufacturers'] as const,
  manufacturersByProductType: (productType: ProductType) =>
    ['master-data', 'manufacturers', productType] as const,
  sockets: ['master-data', 'sockets'] as const,
  cpuSeries: ['master-data', 'cpu-series'] as const,
  gpuSeries: ['master-data', 'gpu-series'] as const,
  gpus: ['master-data', 'gpu'] as const,
  chipsets: ['master-data', 'chipsets'] as const,
}

export function listManufacturers() {
  return api.get<NamedMasterData[]>('/master-data/manufacturer').then((response) => response.data)
}

export function listManufacturersByProductType(productType: ProductType) {
  return api
    .get<NamedMasterData[]>(`/master-data/manufacturer/${productType}`)
    .then((response) => response.data)
}

export function listSockets() {
  return api.get<SocketOption[]>('/master-data/socket').then((response) => response.data)
}

export function listCpuSeries() {
  return api.get<CpuSeriesOption[]>('/master-data/cpu-series').then((response) => response.data)
}

export function listGpuSeries() {
  return api.get<GpuSeriesOption[]>('/master-data/gpu-series').then((response) => response.data)
}

export function listGpus() {
  return api.get<GpuOption[]>('/master-data/gpu').then((response) => response.data)
}

export function listChipsets() {
  return api.get<ChipsetOption[]>('/master-data/chipset').then((response) => response.data)
}