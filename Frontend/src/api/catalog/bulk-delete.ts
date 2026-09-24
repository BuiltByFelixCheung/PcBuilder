import { api } from "../client";
import type { BulkDeleteWrite } from "../types";

function bulkDelete(path: string, body: BulkDeleteWrite) {
  return api.delete(path, { data: body });
}

export function deleteCpus(body: BulkDeleteWrite) {
  return bulkDelete("/catalog/cpu/bulk", body);
}

export function deleteChassis(body: BulkDeleteWrite) {
  return bulkDelete("/catalog/chassis/bulk", body);
}

export function deleteChassisFans(body: BulkDeleteWrite) {
  return bulkDelete("/catalog/chassis-fan/bulk", body);
}

export function deleteCpuCoolers(body: BulkDeleteWrite) {
  return bulkDelete("/catalog/cpu-cooler/bulk", body);
}

export function deleteGraphicsCards(body: BulkDeleteWrite) {
  return bulkDelete("/catalog/graphics-card/bulk", body);
}

export function deleteMemories(body: BulkDeleteWrite) {
  return bulkDelete("/catalog/ram/bulk", body);
}

export function deleteMotherboards(body: BulkDeleteWrite) {
  return bulkDelete("/catalog/motherboard/bulk", body);
}

export function deletePsus(body: BulkDeleteWrite) {
  return bulkDelete("/catalog/psu/bulk", body);
}

export function deleteStorageDrives(body: BulkDeleteWrite) {
  return bulkDelete("/catalog/storage-drive/bulk", body);
}

export function deleteWiredNetworkAdapters(body: BulkDeleteWrite) {
  return bulkDelete("/catalog/wired-network-adapter/bulk", body);
}

export function deleteWirelessNetworkAdapters(body: BulkDeleteWrite) {
  return bulkDelete("/catalog/wireless-network-adapter/bulk", body);
}
