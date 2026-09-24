import { api } from "../client";
import { excelFormData } from "../excel-file";

function importExcel(path: string, file: File) {
  return api.post(path, excelFormData(file));
}

export function importCpus(file: File) {
  return importExcel("/catalog/cpu/import", file);
}

export function importChassis(file: File) {
  return importExcel("/catalog/chassis/import", file);
}

export function importChassisFans(file: File) {
  return importExcel("/catalog/chassis-fan/import", file);
}

export function importCpuCoolers(file: File) {
  return importExcel("/catalog/cpu-cooler/import", file);
}

export function importGraphicsCards(file: File) {
  return importExcel("/catalog/graphics-card/import", file);
}

export function importMemories(file: File) {
  return importExcel("/catalog/ram/import", file);
}

export function importMotherboards(file: File) {
  return importExcel("/catalog/motherboard/import", file);
}

export function importPsus(file: File) {
  return importExcel("/catalog/psu/import", file);
}

export function importStorageDrives(file: File) {
  return importExcel("/catalog/storage-drive/import", file);
}

export function importWiredNetworkAdapters(file: File) {
  return importExcel("/catalog/wired-network-adapter/import", file);
}

export function importWirelessNetworkAdapters(file: File) {
  return importExcel("/catalog/wireless-network-adapter/import", file);
}
