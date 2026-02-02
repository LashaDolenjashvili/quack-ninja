export type SavedQueryRecord = {
  deletedAt?: number | null;
};

export function countActiveSavedQueries(queries: SavedQueryRecord[]) {
  return queries.filter((query) => !query.deletedAt).length;
}
