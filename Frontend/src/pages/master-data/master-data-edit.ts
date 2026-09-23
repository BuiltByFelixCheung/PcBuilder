import type { SocketOption } from "@/api/master-data";

export const newMasterDataEditValue = "new";

export function clearSocketFromAnotherManufacturer(
  manufacturerId: string,
  sockets: readonly SocketOption[],
  socketId: string,
  setValue: (name: "socketId", value: string) => void,
) {
  const socket = sockets.find((item) => item.id === socketId);
  if (socket && socket.manufacturerId !== manufacturerId) {
    setValue("socketId", "");
  }
}

export function chipsetEditPath(id: string) {
  return `/master-data/chipsets?edit=${encodeURIComponent(id)}`;
}

export function cpuSeriesEditPath(id: string) {
  return `/master-data/cpu-series?edit=${encodeURIComponent(id)}`;
}

export function manufacturerEditPath(id: string) {
  return `/master-data/manufacturers?edit=${encodeURIComponent(id)}`;
}

export function socketEditPath(id: string) {
  return `/master-data/sockets?edit=${encodeURIComponent(id)}`;
}

export function gpuSeriesEditPath(id: string) {
  return `/master-data/gpu-series?edit=${encodeURIComponent(id)}`;
}

export function gpuEditPath(id: string) {
  return `/master-data/gpus?edit=${encodeURIComponent(id)}`;
}