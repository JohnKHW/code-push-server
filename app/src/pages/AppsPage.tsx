import { useEffect } from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { Applications } from "../components/apps/Applications";
import { useAppsStore } from "../stores/appsStore";
export function AppsPage() {
  const fetchRecords = useAppsStore((s) => s.fetchRecords);
  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);
  return (
    <>
      <PageHeader
        eyebrow="APPLICATIONS"
        title="Your fleet, ready to ship."
        description="Set up applications, manage access, and keep each deployment moving."
      />
      <Applications />
    </>
  );
}
