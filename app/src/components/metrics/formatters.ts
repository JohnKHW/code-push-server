import type { MetricRow } from "../../types/admin";
export const count = (value: number) => new Intl.NumberFormat().format(value);
export const percent = (numerator: number, denominator: number) =>
  denominator ? `${((numerator / denominator) * 100).toFixed(1)}%` : "—";
export const timestamp = (value: number) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
export const totals = (rows: MetricRow[]) =>
  rows.reduce(
    (result, row) => ({
      downloaded: result.downloaded + row.downloaded,
      installed: result.installed + row.installed,
      failed: result.failed + row.failed,
      active: result.active + row.active,
    }),
    { downloaded: 0, installed: 0, failed: 0, active: 0 }
  );
