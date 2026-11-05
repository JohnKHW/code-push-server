import { useState } from "react";
import { FiKey, FiPlus, FiTrash2 } from "react-icons/fi";
import { useKeysStore } from "../../stores/keysStore";
import { timestamp } from "../metrics/formatters";
import { Feedback } from "../ui/Feedback";
import { CopyButton } from "../ui/CopyButton";
export function AccessTokens() {
  const records = useKeysStore((s) => s.records);
  const createdKey = useKeysStore((s) => s.createdKey);
  const isLoading = useKeysStore((s) => s.isLoading);
  const isSaving = useKeysStore((s) => s.isSaving);
  const error = useKeysStore((s) => s.error);
  const create = useKeysStore((s) => s.create);
  const revoke = useKeysStore((s) => s.revoke);
  const dismiss = useKeysStore((s) => s.dismissKey);
  const [name, setName] = useState("");
  const [days, setDays] = useState(30);
  return (
    <>
      <form
        className="panel create-form"
        onSubmit={(event) => {
          event.preventDefault();
          void create(name.trim(), days).then((ok) => {
            if (ok) setName("");
          });
        }}
      >
        <div>
          <p className="eyebrow">PERSONAL ACCESS TOKEN</p>
          <h2>Give your pipeline a key.</h2>
          <p className="muted">
            Tokens inherit your account’s application permissions.
          </p>
        </div>
        <label>
          Token name
          <input
            required
            placeholder="e.g. uat-release-pipeline"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Expires in
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={1}>1 day</option>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </label>
        <button className="button" disabled={isSaving || !name.trim()}>
          <FiPlus />
          Create token
        </button>
      </form>
      {error && <Feedback message={error} />}
      {isLoading && <Feedback loading message="Loading access tokens…" />}
      {createdKey && (
        <section className="panel new-token">
          <div className="inline spread">
            <div>
              <p className="eyebrow">TOKEN CREATED</p>
              <h2>Copy it while it’s here.</h2>
              <p>
                This token is only shown once. Save it in your pipeline’s secret
                store.
              </p>
            </div>
            <button className="button secondary" onClick={dismiss}>
              Dismiss
            </button>
          </div>
          <div className="token-value">
            <code>{createdKey}</code>
            <CopyButton value={createdKey} />
          </div>
        </section>
      )}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">CREDENTIALS</p>
            <h2>Access tokens & sessions</h2>
          </div>
          <FiKey />
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Created by</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((key) => (
                <tr key={key.friendlyName}>
                  <td>
                    <strong>{key.friendlyName}</strong>
                  </td>
                  <td>
                    <span className="tag">
                      {key.isSession ? "Sign-in session" : "Access token"}
                    </span>
                  </td>
                  <td>{timestamp(key.createdTime)}</td>
                  <td>
                    <span
                      className={key.expires < Date.now() ? "text-danger" : ""}
                    >
                      {timestamp(key.expires)}
                    </span>
                  </td>
                  <td>{key.createdBy}</td>
                  <td>
                    <button
                      className="icon-button danger"
                      aria-label={`Revoke ${key.friendlyName}`}
                      disabled={isSaving}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Revoke ${key.friendlyName}? Any tools using this credential will lose access.`
                          )
                        )
                          void revoke(key.friendlyName);
                      }}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!records.length && !isLoading && (
            <div className="empty-state compact">
              <p>No access tokens have been created.</p>
            </div>
          )}
        </div>
      </section>
      <section className="panel padded">
        <p className="eyebrow">CLI SIGN-IN</p>
        <h2>From your terminal to your workspace.</h2>
        <p className="muted">
          Use Microsoft device sign-in for your account, or an access token for
          unattended releases.
        </p>
        <div className="code-block">
          <code>
            code-push-standalone login {window.location.origin} --device-code
          </code>
          <CopyButton
            value={`code-push-standalone login ${window.location.origin} --device-code`}
          />
        </div>
        <div className="code-block">
          <code>
            code-push-standalone login {window.location.origin} --accessKey
            "$CODEPUSH_ACCESS_KEY"
          </code>
          <CopyButton
            value={`code-push-standalone login ${window.location.origin} --accessKey "$CODEPUSH_ACCESS_KEY"`}
          />
        </div>
      </section>
    </>
  );
}
