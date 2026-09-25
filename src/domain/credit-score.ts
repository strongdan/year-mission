export function normalizeCreditIdentifier(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function escapeIlikeLiteral(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
