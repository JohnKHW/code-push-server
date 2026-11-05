import { useAccountStore } from "../stores/accountStore";
import { useAuthStore } from "../stores/authStore";
import { PageHeader } from "../components/ui/PageHeader";
import { Feedback } from "../components/ui/Feedback";
import { CopyButton } from "../components/ui/CopyButton";
export function AccountPage() {
  const account = useAccountStore((s) => s.account);
  const isLoading = useAccountStore((s) => s.isLoading);
  const error = useAccountStore((s) => s.error);
  const config = useAuthStore((s) => s.config);
  const logout = useAuthStore((s) => s.logout);
  return (
    <>
      <PageHeader
        eyebrow="ACCOUNT & SETUP"
        title="Your release workspace."
        description="Your identity, environment, and connection details in one place."
      />
      {error && <Feedback message={error} />}
      {isLoading && <Feedback loading message="Loading account…" />}
      <div className="dashboard-grid">
        <section className="panel padded">
          <p className="eyebrow">YOUR ACCOUNT</p>
          <h2>{account?.name || "CodePush administrator"}</h2>
          <dl className="settings-list">
            <div>
              <dt>Email</dt>
              <dd>{account?.email || "—"}</dd>
            </div>
            <div>
              <dt>Linked providers</dt>
              <dd>
                {account?.linkedProviders?.join(", ") || "Microsoft Entra ID"}
              </dd>
            </div>
            <div>
              <dt>Authentication</dt>
              <dd>Automatic Microsoft sign-in</dd>
            </div>
          </dl>
          <button className="button secondary" onClick={() => void logout()}>
            Sign out of Microsoft
          </button>
        </section>
        <section className="panel padded">
          <p className="eyebrow">CURRENT ENVIRONMENT</p>
          <h2>{config?.environment?.toUpperCase()}</h2>
          <dl className="settings-list">
            <div>
              <dt>API server</dt>
              <dd>{window.location.origin}</dd>
            </div>
            <div>
              <dt>Admin path</dt>
              <dd>/admin</dd>
            </div>
            <div>
              <dt>Download telemetry</dt>
              <dd>
                {config?.metricsEnabled
                  ? "Redis configured"
                  : "Redis not configured"}
              </dd>
            </div>
          </dl>
          <CopyButton value={window.location.origin} label="Copy server URL" />
        </section>
      </div>
      <section className="panel padded">
        <p className="eyebrow">CONNECT THE CLI</p>
        <h2>One account. Browser and terminal.</h2>
        <p className="muted">
          Use the server origin for CLI and SDK connections. The /admin path is
          for this management workspace.
        </p>
        <div className="code-block">
          <code>
            code-push-standalone login {window.location.origin} --device-code
          </code>
          <CopyButton
            value={`code-push-standalone login ${window.location.origin} --device-code`}
          />
        </div>
        <p className="caption">
          UAT and prod use separate hosts and credentials. Sign in to the
          environment you intend to manage.
        </p>
      </section>
    </>
  );
}
