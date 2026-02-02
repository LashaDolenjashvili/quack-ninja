export type CellValue = string | number | boolean | null | Date;

export type DetectedRegion = {
  headerRow: number;
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
  ambiguous: boolean;
  reason?: string;
  strayCellsCount?: number;
  strayCellExamples?: string[];
  strayBounds?: {
    rowStart: number;
    rowEnd: number;
    colStart: number;
    colEnd: number;
  };
};

type DetectionOptions = {
  scanWindowRows?: number;
  scanWindowCols?: number;
};

const DEFAULT_SCAN_ROWS = 200;
const DEFAULT_SCAN_COLS = 80;

function nonEmpty(value: CellValue) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

function columnIndexToLetters(index: number) {
  let value = index + 1;
  let letters = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    value = Math.floor((value - 1) / 26);
  }
  return letters;
}

export function detectTableRegion(
  grid: CellValue[][],
  options: DetectionOptions = {}
): DetectedRegion | null {
  const scanRows = Math.min(options.scanWindowRows ?? DEFAULT_SCAN_ROWS, grid.length);
  const scanCols =
    Math.min(
      options.scanWindowCols ?? DEFAULT_SCAN_COLS,
      grid.reduce((max, row) => Math.max(max, row.length), 0)
    ) || 0;
  if (scanRows === 0 || scanCols === 0) {
    return null;
  }

  let headerRow = -1;
  for (let r = 0; r < scanRows; r += 1) {
    const row = grid[r] ?? [];
    let nonEmptyCount = 0;
    let stringCount = 0;
    let numberCount = 0;
    for (let c = 0; c < scanCols; c += 1) {
      const value = row[c];
      if (nonEmpty(value)) {
        nonEmptyCount += 1;
        if (typeof value === "string") {
          stringCount += 1;
        } else if (typeof value === "number") {
          numberCount += 1;
        }
      }
    }
    const density = nonEmptyCount / scanCols;
    if (
      nonEmptyCount >= 3 &&
      (density >= 0.15 || nonEmptyCount >= 6) &&
      stringCount >= numberCount
    ) {
      headerRow = r;
      break;
    }
  }

  if (headerRow === -1) {
    return null;
  }

  const header = grid[headerRow] ?? [];
  const segments: { start: number; end: number; length: number }[] = [];
  let currentStart = -1;
  for (let c = 0; c < scanCols; c += 1) {
    if (nonEmpty(header[c])) {
      if (currentStart === -1) {
        currentStart = c;
      }
    } else if (currentStart !== -1) {
      segments.push({ start: currentStart, end: c - 1, length: c - currentStart });
      currentStart = -1;
    }
  }
  if (currentStart !== -1) {
    segments.push({
      start: currentStart,
      end: scanCols - 1,
      length: scanCols - currentStart,
    });
  }
  if (segments.length === 0) {
    return null;
  }
  const largest = segments.reduce((acc, seg) =>
    seg.length > acc.length ? seg : acc
  );
  if (segments.length > 1) {
    const sorted = [...segments].sort((a, b) => b.length - a.length);
    const first = sorted[0];
    const second = sorted[1];
    if (second && second.length >= 3 && second.start - first.end >= 2) {
      return {
        headerRow,
        rowStart: headerRow,
        rowEnd: headerRow,
        colStart: first.start,
        colEnd: first.end,
        ambiguous: true,
        reason: "Multiple dense blocks detected.",
      };
    }
  }
  if (largest.length < 3 && segments.length > 1) {
    return {
      headerRow,
      rowStart: headerRow,
      rowEnd: headerRow,
      colStart: largest.start,
      colEnd: largest.end,
      ambiguous: true,
      reason: "Multiple small header segments detected.",
    };
  }

  let colStart = largest.start;
  let colEnd = largest.end;
  const sampleRows = Math.min(30, scanRows - headerRow - 1);
  const densities = (col: number) => {
    if (sampleRows <= 0) {
      return 0;
    }
    let filled = 0;
    for (let r = headerRow + 1; r < headerRow + 1 + sampleRows; r += 1) {
      if (nonEmpty(grid[r]?.[col])) {
        filled += 1;
      }
    }
    return filled / sampleRows;
  };

  const expandLeft = () => {
    const candidate = colStart - 1;
    if (candidate < 0) {
      return false;
    }
    const density = densities(candidate);
    const headerFilled = nonEmpty(header[candidate]);
    if (density >= 0.2 || (headerFilled && density >= 0.1)) {
      colStart = candidate;
      return true;
    }
    return false;
  };

  const expandRight = () => {
    const candidate = colEnd + 1;
    if (candidate >= scanCols) {
      return false;
    }
    if (!nonEmpty(header[candidate]) && nonEmpty(header[candidate - 1]) && densities(candidate) < 0.1) {
      return false;
    }
    const density = densities(candidate);
    const headerFilled = nonEmpty(header[candidate]);
    if (density >= 0.2 || (headerFilled && density >= 0.1)) {
      colEnd = candidate;
      return true;
    }
    return false;
  };

  while (expandLeft()) {
    // keep expanding left
  }
  while (expandRight()) {
    // keep expanding right
  }

  const spanWidth = colEnd - colStart + 1;
  const rowStart = headerRow;
  let rowEnd = headerRow;
  let emptyStreak = 0;
  for (let r = headerRow + 1; r < scanRows; r += 1) {
    let filled = 0;
    for (let c = colStart; c <= colEnd; c += 1) {
      if (nonEmpty(grid[r]?.[c])) {
        filled += 1;
      }
    }
    const rowDensity = spanWidth > 0 ? filled / spanWidth : 0;
    if (rowDensity < 0.1) {
      emptyStreak += 1;
      if (emptyStreak >= 3) {
        break;
      }
    } else {
      emptyStreak = 0;
      rowEnd = r;
    }
  }

  let ambiguous = false;
  let reason = "";
  const avgRowDensity = (() => {
    let total = 0;
    let count = 0;
    for (let r = headerRow + 1; r <= rowEnd; r += 1) {
      let filled = 0;
      for (let c = colStart; c <= colEnd; c += 1) {
        if (nonEmpty(grid[r]?.[c])) {
          filled += 1;
        }
      }
      total += spanWidth > 0 ? filled / spanWidth : 0;
      count += 1;
    }
    return count === 0 ? 0 : total / count;
  })();

  if (spanWidth > 50 && avgRowDensity < 0.25) {
    ambiguous = true;
    reason = "Wide table with low density.";
  }
  const headerEmpty = header.slice(colStart, colEnd + 1).filter((cell) => !nonEmpty(cell)).length;
  if (headerEmpty / spanWidth > 0.3) {
    ambiguous = true;
    reason = "Header row has many empty cells.";
  }
  if (headerRow > 50 || colStart > 10) {
    ambiguous = true;
    reason = "Table starts far from top-left.";
  }

  const detected = {
    headerRow,
    rowStart: headerRow,
    rowEnd,
    colStart,
    colEnd,
    ambiguous,
    reason: ambiguous ? reason : undefined,
  } as DetectedRegion;

  let strayCount = 0;
  const examples: string[] = [];
  let strayRowStart = rowStart;
  let strayRowEnd = rowEnd;
  let strayColStart = colStart;
  let strayColEnd = colEnd;

  for (let r = 0; r < scanRows; r += 1) {
    for (let c = 0; c < scanCols; c += 1) {
      if (r >= rowStart && r <= rowEnd && c >= colStart && c <= colEnd) {
        continue;
      }
      if (nonEmpty(grid[r]?.[c])) {
        strayCount += 1;
        if (examples.length < 3) {
          examples.push(`${columnIndexToLetters(c)}${r + 1}`);
        }
        strayRowStart = Math.min(strayRowStart, r);
        strayRowEnd = Math.max(strayRowEnd, r);
        strayColStart = Math.min(strayColStart, c);
        strayColEnd = Math.max(strayColEnd, c);
      }
    }
  }

  if (strayCount > 0) {
    detected.strayCellsCount = strayCount;
    detected.strayCellExamples = examples;
    detected.strayBounds = {
      rowStart: strayRowStart,
      rowEnd: strayRowEnd,
      colStart: strayColStart,
      colEnd: strayColEnd,
    };
  }

  return detected;
}
