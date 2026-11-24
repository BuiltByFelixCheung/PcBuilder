import type { CompatibilityFact } from "@/api/builds";
import i18n from "@/i18n";
import { enumText, ui } from "@/i18n/translate-enum";

function translateToken(token: string): string {
  for (const translate of Object.values(enumText)) {
    const translated = translate(token);
    if (translated !== token) {
      return translated;
    }
  }
  return token;
}

function translateList(value: string | null): string {
  if (!value) {
    return "";
  }
  return value
    .split(",")
    .map((part) => translateToken(part.trim()))
    .join(", ");
}

function formatPair(value: string | null): string {
  if (!value) {
    return "";
  }
  const [kind, count] = value.split("|");
  if (count === undefined) {
    return translateToken(value);
  }
  return `${count} × ${translateToken(kind)}`;
}

function formatDriveBays(fact: CompatibilityFact): string {
  const [need25 = "", need35 = ""] = (fact.actual ?? "").split("|");
  const [only25 = "", only35 = "", shared = ""] = (fact.limit ?? "").split("|");
  return ui.message("compatibilityFact.driveBays", {
    need25,
    need35,
    only25,
    only35,
    shared,
  });
}

function formatFanMounts(fact: CompatibilityFact): string {
  const actual = (fact.actual ?? "")
    .split(",")
    .filter(Boolean)
    .map((entry) => formatPair(entry))
    .join(", ");
  const limit = (fact.limit ?? "")
    .split(";")
    .filter(Boolean)
    .map((entry) => {
      const [location = "", diameter = "", count = ""] = entry.split("|");
      return `${translateToken(location)} ${translateToken(diameter)} × ${count}`;
    })
    .join(", ");
  return ui.message("compatibilityFact.fanMounts", { actual, limit });
}

function formatM2(fact: CompatibilityFact): string {
  const actual = (fact.actual ?? "")
    .split("|")
    .filter(Boolean)
    .map((part) => translateToken(part))
    .join(" ");
  const limit = fact.limit
    ? fact.limit
        .split(";")
        .map((slot) =>
          slot
            .split("|")
            .flatMap((part) => part.split(","))
            .filter(Boolean)
            .map((part) => translateToken(part))
            .join(" "),
        )
        .join(", ")
    : "";
  return ui.message("compatibilityFact.m2Slot", { actual, limit });
}

export function formatCompatibilityFact(fact: CompatibilityFact): string {
  if (fact.aspect === "DriveBays") {
    return formatDriveBays(fact);
  }
  if (fact.aspect === "FanMounts") {
    return formatFanMounts(fact);
  }
  if (fact.aspect === "M2Slot") {
    return formatM2(fact);
  }
  if (
    fact.aspect === "PciePowerCable" ||
    fact.aspect === "PcieSlotCount" ||
    fact.aspect === "UsbPort"
  ) {
    const key = `compatibilityFact.${fact.aspect.charAt(0).toLowerCase()}${fact.aspect.slice(1)}`;
    return ui.message(key, {
      actual: formatPair(fact.actual),
      limit: formatPair(fact.limit),
    });
  }

  const limit = translateList(fact.limit);
  const actual = translateList(fact.actual);
  const aspectKey = `${fact.aspect.charAt(0).toLowerCase()}${fact.aspect.slice(1)}`;
  const key =
    fact.aspect === "Chipset" && actual
      ? "compatibilityFact.chipsetSupported"
      : `compatibilityFact.${aspectKey}`;
  if (!i18n.exists(`messages.${key}`)) {
    return [actual, limit].filter(Boolean).join(" / ");
  }
  return ui.message(key, { limit, actual });
}
