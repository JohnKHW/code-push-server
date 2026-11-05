import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { PageHeader } from "../components/ui/PageHeader";
import { ReleaseManager } from "../components/deployments/ReleaseManager";
import { Collaborators } from "../components/deployments/Collaborators";
import { useDeploymentsStore } from "../stores/deploymentsStore";
export function DeploymentsPage() {
  const { appName = "" } = useParams();
  const [params] = useSearchParams();
  const deployment = params.get("deployment") || undefined;
  const load = useDeploymentsStore((s) => s.load);
  useEffect(() => {
    void load(appName, deployment);
  }, [load, appName, deployment]);
  return (
    <>
      <PageHeader
        eyebrow="APPLICATION / RELEASES"
        title={appName}
        description="Publish, promote, and manage updates across your deployment channels."
      >
        <Link className="button secondary" to="/apps">
          <FiArrowLeft />
          Applications
        </Link>
      </PageHeader>
      <ReleaseManager key={appName} />
      <Collaborators key={appName} />
    </>
  );
}
