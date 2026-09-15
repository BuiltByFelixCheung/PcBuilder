export const DDR_GENERATIONS = ["Ddr4", "Ddr5"] as const;
export type DdrGeneration = (typeof DDR_GENERATIONS)[number];

export const RAM_RANKS = ["SingleRank", "DualRank"] as const;
export type RamRank = (typeof RAM_RANKS)[number];

export const PCIE_GENERATIONS = ["Gen3", "Gen4", "Gen5", "Gen6"] as const;
export type PcieGeneration = (typeof PCIE_GENERATIONS)[number];

export const PSU_CABLE_TYPES = [
  "Motherboard24Pin",
  "Cpu4Plus4Pin",
  "Pcie6Plus2Pin",
  "Pcie12VHighPower",
  "Pcie12V2X6",
  "Sata",
  "Molex",
  "Floppy",
] as const;
export type PsuCableType = (typeof PSU_CABLE_TYPES)[number];

export const RAM_FORM_FACTORS = ["UDimm", "SoDimm"] as const;
export type RamFormFactor = (typeof RAM_FORM_FACTORS)[number];

export const VIDEO_MEMORY_GB = [4, 6, 8, 12, 16, 24, 32, 64] as const;
export type VideoMemoryGb = (typeof VIDEO_MEMORY_GB)[number];

export const PCIE_SLOTS_USED = [1, 2, 3, 4] as const;
export type PcieSlotsUsed = (typeof PCIE_SLOTS_USED)[number];

export const DDR4_MODULE_SIZE_GB = [4, 8, 16, 32] as const;
export type Ddr4ModuleSizeGb = (typeof DDR4_MODULE_SIZE_GB)[number];

export const DDR5_MODULE_SIZE_GB = [8, 16, 32, 64] as const;
export type Ddr5ModuleSizeGb = (typeof DDR5_MODULE_SIZE_GB)[number];

export const DDR4_KIT_SIZE_GB = [8, 16, 32, 64] as const;
export type Ddr4KitSizeGb = (typeof DDR4_KIT_SIZE_GB)[number];

export const DDR5_KIT_SIZE_GB = [16, 32, 48, 64, 96, 128] as const;
export type Ddr5KitSizeGb = (typeof DDR5_KIT_SIZE_GB)[number];

export const DDR4_SPEED_MT_S = [2133, 2400, 2666, 3200, 3600] as const;
export type Ddr4SpeedMtS = (typeof DDR4_SPEED_MT_S)[number];

export const DDR5_SPEED_MT_S = [4000, 4400, 4800, 5200, 5600, 6000, 6400, 6800, 7200, 7600, 8000, 8200, 8400, 8600] as const;
export type Ddr5SpeedMtS = (typeof DDR5_SPEED_MT_S)[number];

export const MODULES_COUNT = [1, 2, 4] as const;
export type ModulesCount = (typeof MODULES_COUNT)[number];

export const MB_FORM_FACTORS = ["Mitx", "Matx", "Atx", "Eatx"] as const;
export type MbFormFactor = (typeof MB_FORM_FACTORS)[number];

export const FAN_MOUNT_LOCATIONS = ["Front", "Top", "Bottom", "Rear", "Sides"] as const;
export type FanMountLocation = (typeof FAN_MOUNT_LOCATIONS)[number];

export const FAN_DIAMETERS_MM = [
  "Mm80",
  "Mm92",
  "Mm120",
  "Mm140",
  "Mm200",
] as const;
export type FanDiameterMm = (typeof FAN_DIAMETERS_MM)[number];

export function formatFanDiameterMm(diameter: FanDiameterMm): string {
  return `${stripMmPrefix(diameter)} mm`;
}

export const DRIVE_BAY_FORM_FACTORS = ["2.5", "3.5", "5.25"] as const;
export type DriveBayFormFactor = (typeof DRIVE_BAY_FORM_FACTORS)[number];

export const PCIE_SLOT_ORIENTATIONS = ["Vertical", "Horizontal"] as const;
export type PcieSlotOrientation = (typeof PCIE_SLOT_ORIENTATIONS)[number];

export const RADIATOR_LENGTHS = [
  "Mm120",
  "Mm140",
  "Mm240",
  "Mm280",
  "Mm360",
  "Mm420",
] as const;
export type RadiatorLength = (typeof RADIATOR_LENGTHS)[number];

export function formatRadiatorLength(length: RadiatorLength): string {
  return `${stripMmPrefix(length)} mm`;
}

function stripMmPrefix(value: string): string {
  return value.replace(/^Mm/, "");
}

export const RADIATOR_MOUNT_LOCATIONS = ["Front", "Top", "Bottom", "Rear", "Sides"] as const;
export type RadiatorMountLocation = (typeof RADIATOR_MOUNT_LOCATIONS)[number];

export const PSU_FORM_FACTORS = ["FlexAtx", "Tfx", "Sfx", "SfxL", "Atx"] as const;
export type PsuFormFactor = (typeof PSU_FORM_FACTORS)[number];

export const PCIE_SLOT_TYPES = ["X1", "X4", "X8", "X16"] as const;
export type PcieSlotType = (typeof PCIE_SLOT_TYPES)[number];

export const PCIE_SLOT_LANES = ["X1", "X4", "X8", "X16"] as const;
export type PcieSlotLane = (typeof PCIE_SLOT_LANES)[number];

export const M2_KEYS = ["M", "B", "E", "BM"] as const;
export type M2Key = (typeof M2_KEYS)[number];

export const M2_FORM_FACTORS = [
  "M22230",
  "M22242",
  "M22260",
  "M22280",
  "M222110",
] as const;
export type M2FormFactor = (typeof M2_FORM_FACTORS)[number];

export function formatM2FormFactor(formFactor: M2FormFactor): string {
  return formFactor.replace(/^M2/, "");
}

export const USB_VERSIONS = ["Usb20", "Usb32Gen1", "Usb32Gen2", "Usb4"] as const;
export type UsbVersion = (typeof USB_VERSIONS)[number];

export const USB_TYPES = ["TypeA", "TypeC"] as const;
export type UsbType = (typeof USB_TYPES)[number];