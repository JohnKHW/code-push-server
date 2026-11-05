import { useState, type FormEvent } from "react";
import {
  FiUploadCloud,
  FiGitBranch,
  FiRotateCcw,
  FiTrash2,
  FiPlus,
  FiPause,
  FiPlay,
} from "react-icons/fi";
import { useDeploymentsStore } from "../../stores/deploymentsStore";
import { Feedback } from "../ui/Feedback";
import { CopyButton } from "../ui/CopyButton";
import { count, timestamp } from "../metrics/formatters";
export function ReleaseManager() {
  const records = useDeploymentsStore((s) => s.records);
  const selected = useDeploymentsStore((s) => s.selected);
  const history = useDeploymentsStore((s) => s.history);
  const metrics = useDeploymentsStore((s) => s.metrics);
  const error = useDeploymentsStore((s) => s.error);
  const metricsError = useDeploymentsStore((s) => s.metricsError);
  const isLoading = useDeploymentsStore((s) => s.isLoading);
  const isSaving = useDeploymentsStore((s) => s.isSaving);
  const select = useDeploymentsStore((s) => s.select);
  const add = useDeploymentsStore((s) => s.add);
  const remove = useDeploymentsStore((s) => s.remove);
  const release = useDeploymentsStore((s) => s.release);
  const patchRelease = useDeploymentsStore((s) => s.patchRelease);
  const promote = useDeploymentsStore((s) => s.promote);
  const rollback = useDeploymentsStore((s) => s.rollback);
  const [channel, setChannel] = useState("");
  const [target, setTarget] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");
  const [description, setDescription] = useState("");
  const [rollout, setRollout] = useState(100);
  const [mandatory, setMandatory] = useState(false);
  const current = records.find((record) => record.name === selected);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;
    const form = event.currentTarget;
    if (
      await release(file, {
        appVersion: version,
        description,
        rollout,
        isMandatory: mandatory,
        isDisabled: false,
      })
    ) {
      setFile(null);
      setDescription("");
      form.reset();
    }
  };
  return (
    <>
      {error && <Feedback message={error} />}
      {isLoading && (
        <Feedback loading message="Loading deployments and release history…" />
      )}
      <div className="toolbar">
        <div
          className="channel-tabs"
          role="group"
          aria-label="Deployment channels"
        >
          {records.map((record) => (
            <button
              className={selected === record.name ? "active" : ""}
              key={record.name}
              disabled={isLoading || isSaving}
              onClick={() => void select(record.name)}
            >
              <FiGitBranch />
              {record.name}
            </button>
          ))}
        </div>
        <form
          className="inline"
          onSubmit={(event) => {
            event.preventDefault();
            void add(channel.trim()).then((ok) => {
              if (ok) setChannel("");
            });
          }}
        >
          <input
            aria-label="New deployment name"
            placeholder="New deployment name"
            required
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          />
          <button
            className="button secondary"
            disabled={isSaving || !channel.trim()}
          >
            <FiPlus />
            Add channel
          </button>
        </form>
      </div>
      {!records.length && !isLoading && (
        <div className="panel empty-state">
          <FiGitBranch />
          <h2>No deployment channels yet.</h2>
          <p>Add a channel to publish your first release.</p>
        </div>
      )}
      {current && (
        <>
          <section className="panel deployment-summary">
            <div>
              <p className="eyebrow">DEPLOYMENT CHANNEL</p>
              <h2>{current.name}</h2>
              <p className="muted">
                {current.package
                  ? `${current.package.label} · Binary ${current.package.appVersion}`
                  : "Ready for its first release"}
              </p>
            </div>
            <div className="deployment-key">
              <span className="caption">
                Deployment key · for the mobile SDK
              </span>
              <div className="inline">
                <code>{current.key}</code>
                <CopyButton value={current.key} />
              </div>
            </div>
            <button
              className="icon-button danger"
              aria-label="Delete selected deployment"
              disabled={isSaving || isLoading}
              onClick={() => {
                if (
                  window.confirm(
                    `Delete ${selected}? Apps using this deployment key will stop receiving updates.`
                  )
                )
                  void remove(selected);
              }}
            >
              <FiTrash2 />
            </button>
          </section>
          <div className="dashboard-grid">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">PUBLISH AN UPDATE</p>
                  <h2>Next stop: your users.</h2>
                </div>
                <FiUploadCloud />
              </div>
              <form
                className="stacked-form"
                onSubmit={(event) => void submit(event)}
              >
                <label className="upload-field">
                  <FiUploadCloud />
                  <strong>{file?.name || "Choose a release package"}</strong>
                  <span>Upload a CodePush .zip bundle</span>
                  <input
                    aria-label="Release package"
                    type="file"
                    accept=".zip"
                    required
                    disabled={isSaving}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
                <div className="form-grid">
                  <label>
                    Target binary version
                    <input
                      required
                      placeholder="e.g. 1.2.0 or ~1.2.0"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                    />
                  </label>
                  <label>
                    Rollout percentage
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={rollout}
                      onChange={(e) => setRollout(Number(e.target.value))}
                    />
                  </label>
                </div>
                <label>
                  Release notes
                  <textarea
                    rows={3}
                    placeholder="What changed in this update?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={mandatory}
                    onChange={(e) => setMandatory(e.target.checked)}
                  />
                  Make this a mandatory update
                </label>
                <button
                  className="button"
                  disabled={isSaving || isLoading || !file}
                >
                  <FiUploadCloud />
                  {isSaving ? "Saving…" : `Publish to ${selected}`}
                </button>
              </form>
            </section>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">RELEASE CONTROLS</p>
                  <h2>Keep delivery in your hands.</h2>
                </div>
              </div>
              <div className="stacked-form">
                <div className="control-block">
                  <div className="inline spread">
                    <h3>Current release</h3>
                    <span
                      className={`tag ${
                        current.package?.isDisabled ? "amber" : "green"
                      }`}
                    >
                      {current.package
                        ? current.package.isDisabled
                          ? "Paused"
                          : "Enabled"
                        : "No release"}
                    </span>
                  </div>
                  <p className="muted">
                    {current.package
                      ? `${current.package.rollout ?? 100}% rollout · ${
                          current.package.isMandatory ? "Mandatory" : "Optional"
                        }`
                      : "Publish a package to enable release controls."}
                  </p>
                  <button
                    className="button secondary full"
                    disabled={!current.package || isSaving || isLoading}
                    onClick={() =>
                      void patchRelease({
                        isDisabled: !current.package?.isDisabled,
                      })
                    }
                  >
                    {current.package?.isDisabled ? <FiPlay /> : <FiPause />}
                    {current.package?.isDisabled
                      ? "Resume delivery"
                      : "Pause delivery"}
                  </button>
                </div>
                <form
                  className="control-block"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    void patchRelease({ rollout: Number(data.get("rollout")) });
                  }}
                >
                  <label>
                    Adjust current rollout
                    <input
                      key={`${selected}-${current.package?.rollout}`}
                      name="rollout"
                      type="number"
                      min={1}
                      max={100}
                      defaultValue={current.package?.rollout ?? 100}
                      required
                    />
                  </label>
                  <button
                    className="button secondary full"
                    disabled={!current.package || isSaving || isLoading}
                  >
                    Update rollout
                  </button>
                </form>
                <div className="control-block">
                  <h3>Promote this release</h3>
                  <p className="muted">
                    Deliver the same package to another channel.
                  </p>
                  <label>
                    <span className="sr-only">Promotion target</span>
                    <select
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                    >
                      <option value="">Choose target deployment</option>
                      {records
                        .filter((record) => record.name !== selected)
                        .map((record) => (
                          <option key={record.name}>{record.name}</option>
                        ))}
                    </select>
                  </label>
                  <button
                    className="button secondary full"
                    disabled={
                      !current.package ||
                      !records.some(
                        (record) =>
                          record.name === target && record.name !== selected
                      ) ||
                      isSaving ||
                      isLoading
                    }
                    onClick={() => {
                      if (
                        window.confirm(
                          `Promote ${current.package?.label} from ${selected} to ${target}?`
                        )
                      )
                        void promote(target);
                    }}
                  >
                    <FiGitBranch />
                    Promote release
                  </button>
                </div>
                <div className="control-block">
                  <h3>Return to a previous release</h3>
                  <p className="muted">
                    Roll back the selected channel to its previous package.
                  </p>
                  <button
                    className="button secondary full"
                    disabled={history.length < 2 || isSaving || isLoading}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Roll back ${selected} to its previous release?`
                        )
                      )
                        void rollback();
                    }}
                  >
                    <FiRotateCcw />
                    Roll back
                  </button>
                </div>
              </div>
            </section>
          </div>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">RELEASE HISTORY</p>
                <h2>The delivery record.</h2>
              </div>
              <span className="tag">{history.length} releases</span>
            </div>
            {metricsError && (
              <Feedback message={`Telemetry: ${metricsError}`} />
            )}
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Release</th>
                    <th>Binary / notes</th>
                    <th>Released</th>
                    <th>Rollout</th>
                    <th>Downloads</th>
                    <th>Installed</th>
                    <th>Failed</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.label}>
                      <td>
                        <strong>{item.label}</strong>
                        <small>
                          {item.releaseMethod || "Upload"}
                          {item.isDisabled ? " · Paused" : ""}
                        </small>
                      </td>
                      <td>
                        <code>{item.appVersion}</code>
                        <small className="release-notes">
                          {item.description || "No release notes"}
                        </small>
                      </td>
                      <td>
                        {timestamp(item.uploadTime)}
                        <small>{item.releasedBy}</small>
                      </td>
                      <td>
                        {item.rollout ?? 100}%
                        <small>
                          {item.isMandatory ? "Mandatory" : "Optional"}
                        </small>
                      </td>
                      <td>
                        {metricsError
                          ? "—"
                          : count(metrics[item.label]?.downloaded || 0)}
                      </td>
                      <td>
                        {metricsError
                          ? "—"
                          : count(metrics[item.label]?.installed || 0)}
                      </td>
                      <td>
                        {metricsError
                          ? "—"
                          : count(metrics[item.label]?.failed || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!history.length && (
                <div className="empty-state compact">
                  <p>No releases published to {selected} yet.</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
