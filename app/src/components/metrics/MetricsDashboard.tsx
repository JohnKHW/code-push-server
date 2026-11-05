import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowDown,
  FiCheckCircle,
  FiUsers,
  FiAlertTriangle,
  FiArrowUpRight,
  FiActivity,
} from "react-icons/fi";
import { useMetricsStore } from "../../stores/metricsStore";
import { useAuthStore } from "../../stores/authStore";
import { count, percent, timestamp, totals } from "./formatters";
import { Feedback } from "../ui/Feedback";
export function MetricsDashboard() {
  const rows = useMetricsStore((s) => s.rows);
  const apps = useMetricsStore((s) => s.apps);
  const deploymentCount = useMetricsStore((s) => s.deploymentCount);
  const deploymentCounts = useMetricsStore((s) => s.deploymentCounts);
  const isLoading = useMetricsStore((s) => s.isLoading);
  const error = useMetricsStore((s) => s.error);
  const warnings = useMetricsStore((s) => s.warnings);
  const updatedAt = useMetricsStore((s) => s.updatedAt);
  const rate = useMetricsStore((s) => s.downloadsPerMinute);
  const enabled = useAuthStore((s) => s.config?.metricsEnabled);
  const [selected, setSelected] = useState("");
  const filtered = rows.filter((row) => !selected || row.app === selected);
  const total = totals(filtered);
  const topApps = apps
    .filter((app) => !selected || app === selected)
    .map((app) => ({
      name: app,
      ...totals(rows.filter((row) => row.app === app)),
    }))
    .sort((a, b) => b.downloaded - a.downloaded);
  const max = Math.max(...topApps.map((app) => app.downloaded), 1);
  return (
    <>
      <div className="toolbar">
        <div className="inline">
          <span className="live-label">
            <span className="status-dot" />
            Delivery telemetry
          </span>
          <span className="muted">All recorded activity</span>
        </div>
        <label className="inline">
          <span className="sr-only">Filter application</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">All applications</option>
            {apps.map((app) => (
              <option key={app}>{app}</option>
            ))}
          </select>
        </label>
      </div>
      {error && <Feedback message={error} />}
      {isLoading && !updatedAt && (
        <Feedback loading message="Loading application telemetry…" />
      )}
      {!enabled && (
        <div className="notice">
          Download telemetry requires the API’s external Redis connection. No
          recorded counters are available until Redis is configured.
        </div>
      )}
      {warnings.length > 0 && (
        <details className="notice">
          <summary>
            {warnings.length} deployments could not be loaded. Totals below are
            partial.
          </summary>
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </details>
      )}
      <div className="stat-grid">
        <article className="stat-card">
          <span className="stat-icon blue">
            <FiArrowDown />
          </span>
          <p>Package downloads</p>
          <strong>{count(total.downloaded)}</strong>
          <small>
            {rate === null || selected
              ? "SDK-reported downloads"
              : `${rate.toFixed(1)} downloads / min · since previous refresh`}
          </small>
        </article>
        <article className="stat-card">
          <span className="stat-icon green">
            <FiCheckCircle />
          </span>
          <p>Successful installs</p>
          <strong>{count(total.installed)}</strong>
          <small>
            {percent(total.installed, total.downloaded)} install / download
            ratio
          </small>
        </article>
        <article className="stat-card">
          <span className="stat-icon purple">
            <FiUsers />
          </span>
          <p>Active devices</p>
          <strong>{count(total.active)}</strong>
          <small>Last reported package per device</small>
        </article>
        <article className="stat-card">
          <span className="stat-icon amber">
            <FiAlertTriangle />
          </span>
          <p>Failed installs</p>
          <strong>{count(total.failed)}</strong>
          <small>
            {percent(total.failed, total.installed + total.failed)} of reported
            install results
          </small>
        </article>
      </div>
      <section className="delivery-strip">
        <div>
          <span className="eyebrow">YOUR DELIVERY NETWORK</span>
          <h2>From release to running.</h2>
        </div>
        <div>
          <strong>{selected ? 1 : apps.length}</strong>
          <span>applications</span>
        </div>
        <span className="delivery-arrow">→</span>
        <div>
          <strong>
            {selected ? deploymentCounts[selected] || 0 : deploymentCount}
          </strong>
          <span>deployments</span>
        </div>
        <span className="delivery-arrow">→</span>
        <div>
          <strong>{count(total.active)}</strong>
          <span>active devices</span>
        </div>
        <FiActivity className="strip-icon" />
      </section>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">DISTRIBUTION</p>
              <h2>Downloads by application</h2>
            </div>
            <span className="tag">Cumulative</span>
          </div>
          {topApps.length === 0 ? (
            <div className="empty-state">
              <FiArrowDown />
              <h3>Your first release starts here.</h3>
              <p>
                Create an application and publish an update to start tracking
                delivery.
              </p>
              <Link className="button secondary" to="/apps">
                Manage applications <FiArrowUpRight />
              </Link>
            </div>
          ) : (
            <div className="app-bars">
              {topApps.map((app) => (
                <div className="app-bar" key={app.name}>
                  <div>
                    <Link
                      to={`/apps/${encodeURIComponent(app.name)}/deployments`}
                    >
                      {app.name} <FiArrowUpRight />
                    </Link>
                    <strong>{count(app.downloaded)}</strong>
                  </div>
                  <div className="bar-track">
                    <div
                      style={{ width: `${(app.downloaded / max) * 100}%` }}
                    />
                  </div>
                  <small>
                    {count(app.installed)} installed <span>·</span>{" "}
                    {count(app.active)} active
                  </small>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">DELIVERY HEALTH</p>
              <h2>Every download counts.</h2>
            </div>
            <FiCheckCircle className="muted" />
          </div>
          <div className="health-summary">
            <strong>{percent(total.installed, total.downloaded)}</strong>
            <p>Install / download ratio</p>
            <div className="health-track">
              <span
                style={{
                  width: `${Math.min(
                    100,
                    total.downloaded
                      ? (total.installed / total.downloaded) * 100
                      : 0
                  )}%`,
                }}
              />
            </div>
            <dl>
              <div>
                <dt>Downloaded</dt>
                <dd>{count(total.downloaded)}</dd>
              </div>
              <div>
                <dt>Installed</dt>
                <dd>{count(total.installed)}</dd>
              </div>
              <div>
                <dt>Failed</dt>
                <dd>{count(total.failed)}</dd>
              </div>
            </dl>
            <p className="caption">
              Counters are reported by the CodePush SDK. Downloads and install
              results are independent reports and may arrive at different times.
            </p>
          </div>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">RELEASE DETAIL</p>
            <h2>Delivery ledger</h2>
          </div>
          <span className="caption">
            {updatedAt
              ? `Updated ${timestamp(updatedAt)}`
              : "Waiting for telemetry"}
          </span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Application / deployment</th>
                <th>Release</th>
                <th>Downloads</th>
                <th>Installed</th>
                <th>Install / download</th>
                <th>Active</th>
                <th>Failed</th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .sort((a, b) => b.downloaded - a.downloaded)
                .map((row) => (
                  <tr
                    key={JSON.stringify([row.app, row.deployment, row.label])}
                  >
                    <td>
                      <Link
                        className="record-link"
                        to={`/apps/${encodeURIComponent(
                          row.app
                        )}/deployments?deployment=${encodeURIComponent(
                          row.deployment
                        )}`}
                      >
                        {row.app}
                      </Link>
                      <small>{row.deployment}</small>
                    </td>
                    <td>
                      <code className="tag">{row.label}</code>
                    </td>
                    <td>{count(row.downloaded)}</td>
                    <td>{count(row.installed)}</td>
                    <td>{percent(row.installed, row.downloaded)}</td>
                    <td>{count(row.active)}</td>
                    <td>
                      <span className={row.failed ? "text-danger" : "muted"}>
                        {count(row.failed)}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state compact">
              <p>No recorded delivery events for this selection.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
