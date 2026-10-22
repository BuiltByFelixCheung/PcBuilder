import i18n from "@/i18n";

export function translateEnum(path: string, value: string): string {
  if (!value) return value;
  const key = `enums.${path}.${value}`;
  return i18n.exists(key) ? i18n.t(key) : value;
}

export function enumLabel<T extends string>(path: string) {
  return (value: T) => translateEnum(path, value);
}

export const enumText = {
  ddrGeneration: enumLabel("Ddr.Generation"),
  ramRank: enumLabel("Ddr.Rank"),
  ramFormFactor: enumLabel("Ddr.FormFactor"),
  pcieGeneration: enumLabel("Pcie.Generation"),
  pcieSlotType: enumLabel("Pcie.SlotType"),
  pcieSlotLane: enumLabel("Pcie.SlotLane"),
  pcieSlotOrientation: enumLabel("Pcie.SlotOrientation"),
  mbFormFactor: enumLabel("Motherboard.FormFactor"),
  psuCableType: enumLabel("Psu.CableType"),
  psuFormFactor: enumLabel("Psu.FormFactor"),
  psuModularity: enumLabel("Psu.Modularity"),
  fanMount: enumLabel("Fan.MountLocation"),
  fanDiameterMm: enumLabel("Fan.DiameterMm"),
  fanHeaderType: enumLabel("Fan.HeaderType"),
  radiatorMount: enumLabel("Radiator.MountLocation"),
  radiatorClass: enumLabel("Radiator.Class"),
  driveBayFormFactor: enumLabel("DriveBay.FormFactor"),
  m2FormFactor: enumLabel("M2.FormFactor"),
  m2Key: enumLabel("M2.Key"),
  usbVersion: enumLabel("Usb.Version"),
  usbType: enumLabel("Usb.Type"),
  cpuCoolerType: enumLabel("CpuCooler.Type"),
  storageMedia: enumLabel("Storage.Media"),
  storageInterface: enumLabel("Storage.Interface"),
  storageFormFactor: enumLabel("Storage.FormFactor"),
  wifiStandard: enumLabel("Wifi.Standard"),
  wifiInterface: enumLabel("Wifi.Interface"),
  ethernetInterface: enumLabel("Ethernet.Interface"),
  bluetoothVersion: enumLabel("Bluetooth.Version"),
  compatibilityStatus: enumLabel("Compatibility.Status"),
  compatibilityReason: enumLabel("Compatibility.Reasons"),
  compatibilitySlot: enumLabel("Compatibility.Slots"),
};

type Vars = Record<string, string | number>;

export function label(key: string, vars?: Vars): string {
  return i18n.t(`labels.${key}`, vars);
}

export function header(key: string): string {
  return i18n.t(`headers.${key}`);
}

export function action(key: string): string {
  return i18n.t(`actions.${key}`);
}

export function section(key: string): string {
  return i18n.t(`sections.${key}`);
}

export function nav(key: string): string {
  return i18n.t(`nav.${key}`);
}

export function dialog(key: string): string {
  return i18n.t(`dialogs.${key}`);
}

export function page(key: string): string {
  return i18n.t(`pages.${key}`);
}

export function empty(key: string, vars?: Vars): string {
  return i18n.t(`empty.${key}`, vars);
}

export function entity(key: string): string {
  return i18n.t(`entities.${key}`);
}

export function unit(key: string): string {
  return i18n.t(`units.${key}`);
}

export function message(key: string, vars?: Vars): string {
  return i18n.t(`messages.${key}`, vars);
}

export const ui = {
  label,
  header,
  action,
  section,
  nav,
  dialog,
  page,
  empty,
  entity,
  unit,
  message,
};
