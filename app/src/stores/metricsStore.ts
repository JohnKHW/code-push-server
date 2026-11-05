import { create } from "zustand";
import { adminService } from "../services/admin/adminService";
import { getAxiosErrorMessage } from "../utils/apiUtils";
import type { MetricRow } from "../types/admin";
interface MetricsState {
  rows: MetricRow[];
  apps: string[];
  deploymentCount: number;
  deploymentCounts: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  warnings: string[];
  updatedAt: number | null;
  downloadsPerMinute: number | null;
  fetchRecords: () => Promise<void>;
}
export const useMetricsStore = create<MetricsState>((set, get) => ({
  rows: [],
  apps: [],
  deploymentCount: 0,
  deploymentCounts: {},
  isLoading: false,
  error: null,
  warnings: [],
  updatedAt: null,
  downloadsPerMinute: null,
  fetchRecords: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const apps = await adminService.apps();
      const targets = apps.flatMap((app) =>
        (app.deployments || []).map((deployment) => ({
          app: app.name,
          deployment,
        }))
      );
      // Limit requests so large installations do not exhaust browser or API connections.
      const rows: MetricRow[] = [];
      const warnings: string[] = [];
      for (let start = 0; start < targets.length; start += 6) {
        await Promise.all(
          targets.slice(start, start + 6).map(async ({ app, deployment }) => {
            try {
              const metrics = await adminService.metrics(app, deployment);
              Object.entries(metrics).forEach(([label, metric]) => {
                // Native binary baselines contribute to active devices, but have no OTA download.
                rows.push({
                  app,
                  deployment,
                  label,
                  downloaded: metric.downloaded || 0,
                  installed: metric.installed || 0,
                  failed: metric.failed || 0,
                  active: metric.active || 0,
                });
              });
            } catch (error) {
              warnings.push(
                `${app} / ${deployment}: ${getAxiosErrorMessage(error)}`
              );
            }
          })
        );
      }
      const now = Date.now();
      const previous = get();
      const total = rows.reduce((sum, row) => sum + row.downloaded, 0);
      const previousTotal = previous.rows.reduce(
        (sum, row) => sum + row.downloaded,
        0
      );
      const sameTargets =
        previous.deploymentCount === targets.length &&
        previous.apps.join() === apps.map((app) => app.name).join();
      const sameLabels =
        previous.rows
          .map((row) => `${row.app}/${row.deployment}/${row.label}`)
          .sort()
          .join() ===
        rows
          .map((row) => `${row.app}/${row.deployment}/${row.label}`)
          .sort()
          .join();
      const rate =
        previous.updatedAt &&
        !warnings.length &&
        !previous.warnings.length &&
        sameTargets &&
        sameLabels &&
        total >= previousTotal &&
        now - previous.updatedAt >= 1000
          ? (total - previousTotal) / ((now - previous.updatedAt) / 60000)
          : null;
      set({
        rows,
        apps: apps.map((app) => app.name),
        deploymentCount: targets.length,
        deploymentCounts: Object.fromEntries(
          apps.map((app) => [app.name, app.deployments?.length || 0])
        ),
        warnings,
        updatedAt: now,
        downloadsPerMinute: rate,
        isLoading: false,
      });
    } catch (error) {
      set({ error: getAxiosErrorMessage(error), isLoading: false });
    }
  },
}));
