const SIMPLE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const RESERVED_WORDS = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "TABLE",
  "GROUP",
  "ORDER",
  "BY",
  "LIMIT",
  "OFFSET",
  "INSERT",
  "UPDATE",
  "DELETE",
  "CREATE",
  "DROP",
  "ALTER",
  "JOIN",
  "ON",
  "AS",
  "AND",
  "OR",
  "NOT",
  "NULL",
  "TRUE",
  "FALSE",
]);

export function formatSqlIdentifier(value: string) {
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();
  if (SIMPLE_IDENTIFIER.test(trimmed) && !RESERVED_WORDS.has(upper)) {
    return trimmed;
  }
  return `"${trimmed.replace(/"/g, '""')}"`;
}
