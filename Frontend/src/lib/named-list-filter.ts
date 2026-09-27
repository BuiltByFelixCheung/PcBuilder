import { useMemo } from "react";
import { uniqueById } from "@/lib/unique-by-id";

export function useIdNameChoices<T>(
  items: readonly T[],
  idKey: keyof T & string,
  nameKey: keyof T & string,
) {
  return useMemo(
    () =>
      uniqueById(
        items.map((item) => ({
          id: String(item[idKey]),
          name: String(item[nameKey]),
        })),
      ),
    [items, idKey, nameKey],
  );
}

export function useSocketChoices<
  T extends { socketId: string; socketName: string; manufacturerId: string },
>(items: readonly T[]) {
  return useMemo(
    () =>
      uniqueById(
        items.map((item) => ({
          id: item.socketId,
          name: item.socketName,
          manufacturerId: item.manufacturerId,
        })),
      ),
    [items],
  );
}

export function socketsForManufacturer<T extends { manufacturerId: string }>(
  sockets: readonly T[],
  manufacturerId: string | undefined,
) {
  if (!manufacturerId) return sockets;
  return sockets.filter((item) => item.manufacturerId === manufacturerId);
}

export function filterByNameAndFields<T extends { name: string }>(
  items: readonly T[],
  applied: { name?: string } & Partial<T>,
  fields: readonly (keyof T & string)[],
) {
  const name = applied.name?.trim().toLowerCase();
  return items.filter((item) => {
    if (name && !item.name.toLowerCase().includes(name)) return false;
    return fields.every((field) => {
      const expected = applied[field];
      return expected == null || expected === "" || item[field] === expected;
    });
  });
}
