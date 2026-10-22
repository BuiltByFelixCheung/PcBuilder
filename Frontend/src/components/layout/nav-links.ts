import { ui } from "@/i18n/translate-enum";

export function getCatalogLinks() {
  return [
    { name: ui.nav("products.chassis"), href: "/catalog/chassis" },
    { name: ui.nav("products.motherboards"), href: "/catalog/motherboards" },
    { name: ui.nav("products.cpus"), href: "/catalog/cpus" },
    { name: ui.nav("products.cpuCoolers"), href: "/catalog/cpu-coolers" },
    { name: ui.nav("products.ram"), href: "/catalog/memories" },
    {
      name: ui.nav("products.graphicsCards"),
      href: "/catalog/graphics-cards",
    },
    { name: ui.nav("products.psus"), href: "/catalog/psus" },
    { name: ui.nav("products.storage"), href: "/catalog/storage" },
    { name: ui.nav("products.chassisFans"), href: "/catalog/chassis-fans" },
    {
      name: ui.nav("products.wiredNetworkAdapters"),
      href: "/catalog/wired-network-adapters",
    },
    {
      name: ui.nav("products.wirelessNetworkAdapters"),
      href: "/catalog/wireless-network-adapters",
    },
  ];
}

export function getMasterDataLinks() {
  return [
    { name: ui.nav("master.chipsets"), href: "/master-data/chipsets" },
    { name: ui.nav("master.cpuSeries"), href: "/master-data/cpu-series" },
    { name: ui.nav("master.gpus"), href: "/master-data/gpus" },
    { name: ui.nav("master.gpuSeries"), href: "/master-data/gpu-series" },
    {
      name: ui.nav("master.manufacturers"),
      href: "/master-data/manufacturers",
    },
    { name: ui.nav("master.sockets"), href: "/master-data/sockets" },
  ];
}
