import { useEffect } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { useMetricsStore } from "../stores/metricsStore";
import { PageHeader } from "../components/ui/PageHeader";
import { MetricsDashboard } from "../components/metrics/MetricsDashboard";
export function MetricsPage() {
  const fetchRecords = useMetricsStore((s) => s.fetchRecords);
  const isLoading = useMetricsStore((s) => s.isLoading);
  useEffect(() => {
    void fetchRecords();
    const timer = window.setInterval(() => void fetchRecords(), 60000);
    return () => window.clearInterval(timer);
  }, [fetchRecords]);
  return (
    <>
      <PageHeader
        eyebrow="WORKSPACE OVERVIEW"
        title="Every release. In view."
        description="Follow your updates from the moment they ship to the devices that run them."
      >
        <button
          className="button secondary"
          disabled={isLoading}
          onClick={() => void fetchRecords()}
        >
          <FiRefreshCw className={isLoading ? "spin" : ""} />
          Refresh
        </button>
      </PageHeader>
      <MetricsDashboard />
    </>
  );
}
