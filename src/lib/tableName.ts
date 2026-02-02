export function normalizeTableName(fileName: string) {
  const base = fileName.replace(/\.[^/.]+$/, "");
  const sanitized = base
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return sanitized || `table_${Date.now()}`;
}

export function sanitizeTableName(
  name: string,
  existingTables: string[] = []
) {
  const baseName = normalizeTableName(name) || "table_data";
  let tableName = baseName;
  if (existingTables.includes(tableName)) {
    const suffix = Date.now().toString(36);
    tableName = `${baseName}_${suffix}`.slice(0, 64);
  }
  return tableName;
}
