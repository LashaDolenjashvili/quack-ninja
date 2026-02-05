export type ExampleQuery = {
  id: string;
  title: string;
  outcome: string;
  sql: string;
};

export const EXAMPLE_QUERIES: ExampleQuery[] = [
  {
    id: "duplicates",
    title: "Find duplicate customer IDs",
    outcome: "Catch repeated IDs and see how many times they appear.",
    sql: `SELECT
  customer_id,
  COUNT(*) AS cnt
FROM customers
GROUP BY 1
HAVING COUNT(*) > 1
ORDER BY cnt DESC
LIMIT 50;`,
  },
  {
    id: "join-customers",
    title: "Join customers to transactions",
    outcome: "Answer: who spent the most (with customer names).",
    sql: `SELECT
  c.customer_id,
  c.name,
  SUM(t.amount) AS total_spend,
  COUNT(*) AS txn_count
FROM customers c
JOIN transactions t
  ON t.customer_id = c.customer_id
GROUP BY 1,2
ORDER BY total_spend DESC
LIMIT 25;`,
  },
  {
    id: "weird-rows",
    title: "Spot weird rows fast",
    outcome: "Find null spikes + negative/zero amounts.",
    sql: `SELECT
  COUNT(*) AS rows_total,
  SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) AS missing_customer_id,
  SUM(CASE WHEN amount IS NULL THEN 1 ELSE 0 END) AS missing_amount,
  SUM(CASE WHEN amount <= 0 THEN 1 ELSE 0 END) AS non_positive_amount
FROM transactions;`,
  },
  {
    id: "reconcile",
    title: "Reconcile totals",
    outcome: "Check if payments match transactions.",
    sql: `WITH tx AS (
  SELECT
    customer_id,
    SUM(amount) AS tx_total
  FROM transactions
  GROUP BY 1
),
pay AS (
  SELECT
    customer_id,
    SUM(amount) AS pay_total
  FROM payments
  GROUP BY 1
)
SELECT
  COALESCE(tx.customer_id, pay.customer_id) AS customer_id,
  COALESCE(tx_total, 0) AS tx_total,
  COALESCE(pay_total, 0) AS pay_total,
  (COALESCE(pay_total, 0) - COALESCE(tx_total, 0)) AS diff
FROM tx
FULL OUTER JOIN pay
  ON tx.customer_id = pay.customer_id
ORDER BY ABS(diff) DESC
LIMIT 50;`,
  },
];

export function getExampleQueryById(id: string | null | undefined) {
  if (!id) {
    return null;
  }
  return EXAMPLE_QUERIES.find((item) => item.id === id) ?? null;
}
