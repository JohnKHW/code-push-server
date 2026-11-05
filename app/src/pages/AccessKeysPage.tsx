import { useEffect } from "react";
import { useKeysStore } from "../stores/keysStore";
import { AccessTokens } from "../components/keys/AccessTokens";
import { PageHeader } from "../components/ui/PageHeader";
export function AccessKeysPage() {
  const fetchRecords = useKeysStore((s) => s.fetchRecords);
  const dismiss = useKeysStore((s) => s.dismissKey);
  useEffect(() => {
    void fetchRecords();
    return dismiss;
  }, [fetchRecords, dismiss]);
  return (
    <>
      <PageHeader
        eyebrow="ACCESS TOKENS"
        title="The keys to delivery."
        description="Manage credentials for the CLI, release pipelines, and your signed-in sessions."
      />
      <AccessTokens />
    </>
  );
}
