export type SocketChoice = {
  id: string;
  name: string;
  manufacturerName?: string | null;
};

export function socketsByManufacturer(
  sockets: readonly SocketChoice[],
): [string, SocketChoice[]][] {
  const groups = new Map<string, SocketChoice[]>();
  for (const socket of sockets) {
    const manufacturer = socket.manufacturerName?.trim() ?? "";
    const current = groups.get(manufacturer) ?? [];
    current.push(socket);
    groups.set(manufacturer, current);
  }

  for (const choices of groups.values()) {
    choices.sort((left, right) => left.name.localeCompare(right.name));
  }

  return [...groups.entries()].sort(([left], [right]) => {
    if (!left) return 1;
    if (!right) return -1;
    return left.localeCompare(right);
  });
}
