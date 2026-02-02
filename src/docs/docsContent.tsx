"use client";

import type { ReactNode } from "react";
import { planCaps, type PlanTier } from "@/src/lib/planCaps";
import { formatLimit, type PlanLimits } from "@/src/lib/plans";
import {
  XLSX_HARD_LIMIT_BYTES,
  XLSX_MAX_BYTES_BY_PLAN,
} from "@/src/lib/xlsxImportConfig";
import {
  Callout,
  CodeBlock,
  Section,
  Steps,
} from "@/src/components/docs/DocsPrimitives";
import { FeatureFlags } from "@/src/config/flags";

export type DocsNavGroup = {
  label: string;
  items: { title: string; href: string }[];
};

const supportsExcel = FeatureFlags.ENABLE_XLSX;
const supportsParquet = FeatureFlags.ENABLE_PARQUET;
const formatList = ["CSV"]
  .concat(supportsParquet ? ["Parquet"] : [])
  .concat(supportsExcel ? ["Excel (.xlsx)"] : []);
const formatShortList = ["CSV"]
  .concat(supportsParquet ? ["Parquet"] : [])
  .concat(supportsExcel ? ["Excel"] : []);

function joinList(items: string[]) {
  if (items.length === 0) {
    return "";
  }
  if (items.length === 1) {
    return items[0];
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

export const docsNav: DocsNavGroup[] = [
  {
    label: "Getting Started",
    items: [
      { title: "Overview", href: "/docs" },
      { title: "Quickstart", href: "/docs/quickstart" },
    ],
  },
  {
    label: "Import",
    items: [
      { title: "Import CSV", href: "/docs/import/csv" },
      ...(supportsExcel ? [{ title: "Import Excel", href: "/docs/import/excel" }] : []),
    ],
  },
  {
    label: "Session",
    items: [{ title: "Session persistence", href: "/docs/session" }],
  },
  {
    label: "Export",
    items: [{ title: "Export results", href: "/docs/export" }],
  },
  {
    label: "Troubleshooting",
    items: [{ title: "Troubleshooting", href: "/docs/troubleshooting" }],
  },
];

export const docsSearchIndex = [
  { title: "Overview", href: "/docs" },
  { title: "What QuackNinja is", href: "/docs#what-is-filesql" },
  { title: "What it’s for", href: "/docs#what-its-for" },
  { title: "3-minute start", href: "/docs#three-minute-start" },
  { title: "Privacy", href: "/docs#privacy-model" },
  { title: "Import formats and limits", href: "/docs#import-formats" },
  { title: "Preview vs export", href: "/docs#preview-vs-export" },
  { title: "Copy/paste examples", href: "/docs#sql-snippets" },
  { title: "Fix column types", href: "/docs#type-casting" },
  { title: "Common tasks", href: "/docs#core-flows" },
  { title: "Plan limits at a glance", href: "/docs#plan-limits" },
  { title: "File size limits", href: "/docs#file-limits" },
  { title: "Quickstart", href: "/docs/quickstart" },
  { title: "Attach files", href: "/docs/quickstart#attach" },
  { title: "Run SQL", href: "/docs/quickstart#query" },
  { title: "Export results", href: "/docs/quickstart#export" },
  { title: "Import CSV", href: "/docs/import/csv" },
  { title: "Default CSV behavior", href: "/docs/import/csv#defaults" },
  { title: "CSV best practices", href: "/docs/import/csv#best-practices" },
  { title: "Inspect imported tables", href: "/docs/import/csv#inspect" },
  { title: "CSV import settings", href: "/docs/import/csv#csv-settings" },
  { title: "CSV common issues", href: "/docs/import/csv#csv-errors" },
  ...(supportsExcel
    ? [
        { title: "Import Excel", href: "/docs/import/excel" },
        { title: "Wizard flow", href: "/docs/import/excel#wizard" },
        { title: "Range detection", href: "/docs/import/excel#range-detection" },
        { title: "Header row behavior", href: "/docs/import/excel#headers" },
      ]
    : []),
  { title: "Session persistence", href: "/docs/session" },
  { title: "What persists", href: "/docs/session#what-persists" },
  { title: "Reconnect permissions", href: "/docs/session#permissions" },
  { title: "Detach behavior", href: "/docs/session#detach" },
  { title: "Export results", href: "/docs/export" },
  { title: "How export works", href: "/docs/export#export-flow" },
  { title: "Plan caps", href: "/docs/export#caps" },
  { title: "Troubleshooting", href: "/docs/troubleshooting" },
  {
    title: "Tables disappeared after refresh",
    href: "/docs/troubleshooting#missing-tables",
  },
  {
    title: "I see old tables briefly",
    href: "/docs/troubleshooting#old-tables",
  },
  { title: "CSV imported 0 rows", href: "/docs/troubleshooting#csv-zero" },
  ...(supportsExcel
    ? [{ title: "Excel columns show col_1...", href: "/docs/troubleshooting#excel-cols" }]
    : []),
  { title: "Table not found", href: "/docs/troubleshooting#table-not-found" },
];

export type DocsSection = {
  id: string;
  heading: string;
  body: ReactNode;
};

export type DocsPage = {
  slug: string;
  title: string;
  description: string;
  sections: DocsSection[];
};

type DocsContext = {
  plan: PlanTier;
  limits: PlanLimits;
};

function planCapsTable() {
  return [
    {
      label: "Free",
      file: formatBytes(planCaps.free.maxSingleFileBytes),
      total: formatBytes(planCaps.free.maxSessionFileBytes),
      preview: planCaps.free.previewLimit.toLocaleString(),
      export: formatLimit(planCaps.free.exportMaxRows),
    },
    {
      label: "Pro",
      file: formatBytes(planCaps.pro.maxSingleFileBytes),
      total: formatBytes(planCaps.pro.maxSessionFileBytes),
      preview: planCaps.pro.previewLimit.toLocaleString(),
      export: formatLimit(planCaps.pro.exportMaxRows),
    },
  ];
}

export function getDocsPage(slug: string, ctx: DocsContext): DocsPage {
  switch (slug) {
    case "quickstart":
      return quickstartPage();
    case "import-csv":
      return csvPage();
    case "import-excel":
      return excelPage();
    case "session":
      return sessionPage();
    case "export":
      return exportPage();
    case "troubleshooting":
      return troubleshootingPage();
    default:
      return overviewPage(ctx);
  }
}

function overviewPage(ctx: DocsContext): DocsPage {
  const coreCards = [
    {
      title: "Quickstart",
      body: "Attach files, run SQL, and export results.",
      href: "/docs/quickstart",
    },
    {
      title: "Import CSV",
      body: "Simple defaults for quick CSV imports.",
      href: "/docs/import/csv",
    },
    ...(supportsExcel
      ? [
          {
            title: "Import Excel",
            body: "Guided import with sheet selection.",
            href: "/docs/import/excel",
          },
        ]
      : []),
    {
      title: "Session persistence",
      body: "Restore the last files you attached.",
      href: "/docs/session",
    },
    {
      title: "Export results",
      body: "Download results as a clean CSV.",
      href: "/docs/export",
    },
    {
      title: "Troubleshooting",
      body: "Fix missing tables and common import issues.",
      href: "/docs/troubleshooting",
    },
  ];

  return {
    slug: "overview",
    title: "Quick answers from real exports",
    description:
      "Runs in your browser. Files stay on your computer.",
    sections: [
      {
        id: "what-is-filesql",
        heading: "What QuackNinja is",
        body: (
          <>
            <p>
              QuackNinja helps you get quick answers from real exports. It runs in
              your browser and keeps files on your computer.
            </p>
            <p className="mt-3">
              Attach {joinList(formatShortList)} files, run SQL, and export
              results as CSV. No setup needed.
            </p>
            <Callout tone="note">
              <p>
                This is a single-session experience per browser tab.
              </p>
            </Callout>
          </>
        ),
      },
      {
        id: "what-its-for",
        heading: "What it’s for",
        body: (
          <>
            <ul className="list-disc pl-5">
              <li>Check an export before sharing (missing values, duplicates).</li>
              <li>Combine two exports (customers + transactions).</li>
              <li>Confirm a number before you send a report.</li>
              <li>Clean a messy CSV without spreadsheets.</li>
              <li>Query one sheet from an Excel workbook.</li>
              <li>Pull a subset and export it for stakeholders.</li>
            </ul>
          </>
        ),
      },
      {
        id: "three-minute-start",
        heading: "3-minute start",
        body: (
          <>
            <Steps
              items={[
                <span key="1">Open the Console.</span>,
                <span key="2">Attach one or more files.</span>,
                <span key="3">Run a SQL query.</span>,
                <span key="4">Export results as CSV.</span>,
              ]}
            />
          </>
        ),
      },
      {
        id: "privacy-model",
        heading: "Privacy",
        body: (
          <>
            <p>
              QuackNinja runs in your browser. Files stay on your computer by
              default. No upload is required.
            </p>
            <Callout tone="note">
              <p>
                If you refresh, QuackNinja may ask to reconnect file permissions.
              </p>
            </Callout>
          </>
        ),
      },
      {
        id: "import-formats",
        heading: "Import formats and limits",
        body: (
          <>
            <p>Supported formats: {joinList(formatList)}.</p>
            <ul className="list-disc pl-5">
              <li>Max single file size (your plan): {formatBytes(ctx.limits.maxSingleFileBytes)}.</li>
              <li>Total session size (your plan): {formatBytes(ctx.limits.maxSessionFileBytes)}.</li>
            </ul>
          </>
        ),
      },
      {
        id: "preview-vs-export",
        heading: "Preview vs export",
        body: (
          <>
            <p>
              Preview keeps the grid fast. Export uses your full SQL but
              respects your plan’s row cap.
            </p>
            <ul className="list-disc pl-5">
              <li>Preview limit: {ctx.limits.previewLimit.toLocaleString()} rows.</li>
              <li>Export cap: {formatLimit(ctx.limits.exportMaxRows)} rows.</li>
            </ul>
            <Callout tone="tip">
              <p>
                If your SQL has no LIMIT, QuackNinja adds a preview limit and
                shows a banner.
              </p>
            </Callout>
          </>
        ),
      },
      {
        id: "sql-snippets",
        heading: "Copy/paste examples",
        body: (
          <>
            <p>
              Quick examples you can copy and run right away:
            </p>
            <CodeBlock
              code={`SELECT * FROM customers LIMIT 25;\n\nSELECT status, COUNT(*) AS total\nFROM customers\nGROUP BY status\nORDER BY total DESC;\n\nSELECT *\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nLIMIT 100;\n\nSELECT id, COUNT(*) AS dupes\nFROM customers\nGROUP BY id\nHAVING COUNT(*) > 1;\n\nSELECT *\nFROM customers\nWHERE email IS NULL;\n\nSELECT region, SUM(revenue) AS total\nFROM sales\nGROUP BY region\nORDER BY total DESC;\n\nSELECT *\nFROM events\nWHERE created_at >= '2024-01-01'\nLIMIT 100;`}
            />
          </>
        ),
      },
      {
        id: "type-casting",
        heading: "Fix column types",
        body: (
          <>
            <p>
              If a column looks like text but should be a number or date, use
              CAST or TRY_CAST in your SQL.
            </p>
            <CodeBlock
              code={`SELECT\n  TRY_CAST(total AS DOUBLE) AS total_num,\n  TRY_CAST(created_at AS TIMESTAMP) AS created_at_ts\nFROM orders\nLIMIT 100;`}
            />
          </>
        ),
      },
      {
        id: "core-flows",
        heading: "Common tasks",
        body: (
          <div className="grid gap-3 md:grid-cols-2">
            {coreCards.map((card) => (
              <a
                key={card.title}
                href={card.href}
                className="rounded-xl border border-[#E6EEF7] bg-white p-4 text-sm text-[#4A5A72] hover:border-[#CFE0F4]"
              >
                <p className="text-base font-semibold text-[#0B1220]">
                  {card.title}
                </p>
                <p className="mt-2">{card.body}</p>
              </a>
            ))}
          </div>
        ),
      },
      {
        id: "plan-limits",
        heading: "Plan limits at a glance",
        body: (
          <div className="overflow-hidden rounded-xl border border-[#E6EEF7] bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7FAFC] text-xs uppercase tracking-[0.2em] text-[#5B6B82]">
                <tr>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Max single file size</th>
                  <th className="px-4 py-3">Total session size</th>
                  <th className="px-4 py-3">Preview rows</th>
                  <th className="px-4 py-3">Export rows</th>
                </tr>
              </thead>
              <tbody>
                {planCapsTable().map((row) => (
                  <tr key={row.label} className="border-t border-[#E6EEF7]">
                    <td className="px-4 py-3 font-semibold text-[#0B1220]">
                      {row.label}
                    </td>
                    <td className="px-4 py-3">{row.file}</td>
                    <td className="px-4 py-3">{row.total}</td>
                    <td className="px-4 py-3">{row.preview}</td>
                    <td className="px-4 py-3">{row.export}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      },
      {
        id: "file-limits",
        heading: "File size limits",
        body: (
          <Callout tone="warning">
            <p>
              QuackNinja enforces max single file size and total session size
              based on your plan. If you hit the limit, split the file or
              remove unused columns before importing.
            </p>
          </Callout>
        ),
      },
    ],
  };
}

function quickstartPage(): DocsPage {
  return {
    slug: "quickstart",
    title: "Quickstart",
    description: "Attach files, run SQL, and export results in minutes.",
    sections: [
      {
        id: "attach",
        heading: "Attach files",
        body: (
          <>
            <Steps
              items={[
                <span key="1">Click Attach in the Console.</span>,
                <span key="2">Select {joinList(formatList)} files.</span>,
                <span key="3">Confirm table names and import.</span>,
              ]}
            />
            <Callout tone="note">
              <p>Multiple files can be attached in the same session.</p>
            </Callout>
          </>
        ),
      },
      {
        id: "query",
        heading: "Run SQL",
        body: (
          <>
            <p>Tables appear in the table list after import.</p>
            <CodeBlock
              code={`SELECT * FROM customers LIMIT 20;\n\nSELECT o.id, c.name\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nLIMIT 50;`}
            />
          </>
        ),
      },
      {
        id: "export",
        heading: "Export results",
        body: (
          <>
            <p>
              Use Export to download a CSV without showing every row on screen.
            </p>
            <Callout tone="tip">
              <p>
                Preview rows are capped for speed. Export uses your full SQL
                (within your plan limits).
              </p>
            </Callout>
          </>
        ),
      },
    ],
  };
}

function csvPage(): DocsPage {
  return {
    slug: "import-csv",
    title: "Import CSV",
    description: "Simple defaults for CSV imports.",
    sections: [
      {
        id: "defaults",
        heading: "Default CSV behavior",
        body: (
          <>
            <p>CSV imports use simple defaults:</p>
            <ul className="list-disc pl-5">
              <li>Delimiter: comma by default.</li>
              <li>Header row: on.</li>
              <li>All columns are imported as text.</li>
            </ul>
            <Callout tone="note">
              <p>
                Need number or date columns? Use “Detect column types” in the
                table menu after import.
              </p>
            </Callout>
          </>
        ),
      },
      {
        id: "best-practices",
        heading: "Best practices",
        body: (
          <>
            <ul className="list-disc pl-5">
              <li>Keep headers clean (avoid merged or blank header cells).</li>
              <li>Use consistent delimiters across the file.</li>
              <li>Prefer UTF-8 encoding when possible.</li>
            </ul>
          </>
        ),
      },
      {
        id: "inspect",
        heading: "Check imported tables",
        body: (
          <>
            <CodeBlock code={`SELECT COUNT(*) FROM customers;\nSELECT * FROM customers LIMIT 10;`} />
          </>
        ),
      },
      {
        id: "csv-settings",
        heading: "Import settings (if enabled)",
        body: (
          <>
            <p>
              Some builds expose CSV import settings for delimiter and header
              handling. If you adjust them, the import will follow your selected
              delimiter and header row.
            </p>
          </>
        ),
      },
      {
        id: "csv-errors",
        heading: "Common issues",
        body: (
          <>
            <Callout tone="warning" title="0 rows imported">
              <p>
                This can happen if the file encoding is unexpected or the
                browser lost file permissions. Reattach the file or export a
                clean UTF-8 CSV.
              </p>
            </Callout>
            <Callout tone="note" title="Table not found">
              <p>
                Tables only exist for attached files. If you refreshed and
                didn’t reconnect, reattach the file.
              </p>
            </Callout>
          </>
        ),
      },
    ],
  };
}

function excelPage(): DocsPage {
  if (!supportsExcel) {
    return {
      slug: "import-excel",
      title: "Import Excel (XLSX)",
      description: "Excel imports are not enabled in this build.",
      sections: [
        {
          id: "excel-disabled",
          heading: "Excel imports are disabled",
          body: (
            <Callout tone="warning">
              <p>
                Excel import is not enabled in this build. CSV imports are
                available from the Console.
              </p>
            </Callout>
          ),
        },
      ],
    };
  }

  return {
    slug: "import-excel",
    title: "Import Excel (XLSX)",
    description: "Use the guided import to pick sheets and ranges.",
    sections: [
      {
        id: "wizard",
        heading: "Guided flow",
        body: (
          <>
            <Steps
              items={[
                <span key="1">Select sheets to import.</span>,
                <span key="2">Confirm detected table range or pick manually.</span>,
                <span key="3">Confirm header row and table name.</span>,
              ]}
            />
            <Callout tone="warning">
              <p>
                Excel imports follow plan limits (Free:{" "}
                {formatBytes(XLSX_MAX_BYTES_BY_PLAN.free)}, Pro:{" "}
                {formatBytes(XLSX_MAX_BYTES_BY_PLAN.pro)}) and a max size of{" "}
                {formatBytes(XLSX_HARD_LIMIT_BYTES)}. Large workbooks may use a
                simplified import for stability.
              </p>
            </Callout>
          </>
        ),
      },
      {
        id: "range-detection",
        heading: "Range detection",
        body: (
          <>
            <p>
              QuackNinja detects a single table range. If your sheet has extra
              cells outside the main table, use manual selection to expand or
              tighten the range.
            </p>
            <Callout tone="tip">
              <p>
                Keep your sheet simple: one header row, no merged cells, and
                data in a rectangle.
              </p>
            </Callout>
          </>
        ),
      },
      {
        id: "headers",
        heading: "Header row behavior",
        body: (
          <>
            <p>
              When “First row is header” is enabled, the column names come from
              the selected header row. Clean, unique headers work best.
            </p>
          </>
        ),
      },
    ],
  };
}

function sessionPage(): DocsPage {
  return {
    slug: "session",
    title: "Session persistence",
    description:
      "QuackNinja restores only the last files you attached after refresh.",
    sections: [
      {
        id: "what-persists",
        heading: "What persists",
        body: (
          <>
            <p>
              QuackNinja remembers which files were attached just before refresh.
              After reload, it tries to reconnect to the same files.
            </p>
            <Callout tone="note">
              <p>Your files stay on your computer.</p>
            </Callout>
          </>
        ),
      },
      {
        id: "permissions",
        heading: "When you need to reconnect",
        body: (
          <>
            <p>
              Some browsers require permission after refresh. If so, you’ll see
              a “Reconnect files” banner. Click it to re-grant access.
            </p>
          </>
        ),
      },
      {
        id: "detach",
        heading: "Detach behavior",
        body: (
          <>
            <p>
              Detach removes tables from the session. After detaching all files,
              refreshing should show an empty table list.
            </p>
            <Callout tone="note">
              <p>
                Upgrade prompts appear only when an attach would exceed your
                plan limits. If nothing is attached, no upgrade modal appears.
              </p>
            </Callout>
          </>
        ),
      },
    ],
  };
}

function exportPage(): DocsPage {
  return {
    slug: "export",
    title: "Export results",
    description: "Export results as CSV.",
    sections: [
      {
        id: "export-flow",
        heading: "How export works",
        body: (
          <>
            <p>
              Export downloads the results of your SQL without showing every
              row on screen.
            </p>
            <CodeBlock
              code={`SELECT * FROM customers WHERE status = 'active';`}
            />
          </>
        ),
      },
      {
        id: "caps",
        heading: "Plan caps",
        body: (
          <>
            <p>
              Your plan controls export caps. Preview rows are separate from
              export limits.
            </p>
            <ul className="list-disc pl-5">
              <li>Free export cap: {formatLimit(planCaps.free.exportMaxRows)} rows.</li>
              <li>Pro export cap: {formatLimit(planCaps.pro.exportMaxRows)} rows.</li>
            </ul>
            <Callout tone="warning">
              <p>
                Large exports may be slow. Consider adding LIMIT or exporting
                in smaller chunks.
              </p>
            </Callout>
          </>
        ),
      },
    ],
  };
}

function troubleshootingPage(): DocsPage {
  const sections: DocsSection[] = [
    {
      id: "missing-tables",
      heading: "Tables disappeared after refresh",
      body: (
        <>
          <p>
            QuackNinja restores only the last attached snapshot. If you didn’t
            reconnect, reattach your files to restore tables.
          </p>
        </>
      ),
    },
    {
      id: "old-tables",
      heading: "I see old tables briefly",
      body: (
        <>
          <p>
            This should no longer happen. If it does, clear your session and
            refresh. If the issue persists, report it with the file type and
            browser name.
          </p>
        </>
      ),
    },
    {
      id: "csv-zero",
      heading: "CSV imported 0 rows",
      body: (
        <>
          <p>
            Check encoding (UTF-8 preferred) and delimiter consistency. Try
            reattaching the file to restore permissions.
          </p>
        </>
      ),
    },
    ...(supportsExcel
      ? [
          {
            id: "excel-cols",
            heading: "Excel columns show col_1...",
            body: (
              <>
                <p>
                  Ensure the header row contains real names and that “First row
                  is header” is enabled in the wizard.
                </p>
              </>
            ),
          },
        ]
      : []),
    {
      id: "table-not-found",
      heading: "Table not found",
      body: (
        <>
          <p>
            The table might have been detached. Reattach the file or check the
            table list.
          </p>
        </>
      ),
    },
  ];

  return {
    slug: "troubleshooting",
    title: "Troubleshooting",
    description: "Fix common import, session, and query issues.",
    sections,
  };
}

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${Math.round(value)}${units[index]}`;
}

export function buildSectionList(sections: DocsSection[]) {
  return sections.map((section) => ({
    id: section.id,
    heading: section.heading,
  }));
}

export function renderSections(sections: DocsSection[]) {
  return sections.map((section) => (
    <Section key={section.id} id={section.id} title={section.heading}>
      {section.body}
    </Section>
  ));
}
