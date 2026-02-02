export type RangeBounds = {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
};

export function columnLabelToIndex(label: string) {
  let index = 0;
  for (const char of label.toUpperCase()) {
    index = index * 26 + (char.charCodeAt(0) - 64);
  }
  return index - 1;
}

export function indexToColumnLabel(index: number) {
  let current = index + 1;
  let label = "";
  while (current > 0) {
    const remainder = (current - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    current = Math.floor((current - 1) / 26);
  }
  return label;
}

export function parseA1Range(range: string): RangeBounds | null {
  const match = range.trim().match(/^([A-Za-z]+)(\d+):([A-Za-z]+)(\d+)$/);
  if (!match) {
    return null;
  }
  const [, startColLabel, startRowRaw, endColLabel, endRowRaw] = match;
  const startCol = columnLabelToIndex(startColLabel);
  const endCol = columnLabelToIndex(endColLabel);
  const startRow = Number(startRowRaw) - 1;
  const endRow = Number(endRowRaw) - 1;
  if (startRow < 0 || endRow < 0 || startCol < 0 || endCol < 0) {
    return null;
  }
  return {
    startRow: Math.min(startRow, endRow),
    endRow: Math.max(startRow, endRow),
    startCol: Math.min(startCol, endCol),
    endCol: Math.max(startCol, endCol),
  };
}

export function boundsToA1(bounds: RangeBounds) {
  const startLabel = `${indexToColumnLabel(bounds.startCol)}${bounds.startRow + 1}`;
  const endLabel = `${indexToColumnLabel(bounds.endCol)}${bounds.endRow + 1}`;
  return `${startLabel}:${endLabel}`;
}
