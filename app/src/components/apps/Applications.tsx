import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  FiBox,
  FiArrowUpRight,
  FiSearch,
  FiPlus,
  FiTrash2,
  FiEdit2,
} from "react-icons/fi";
import { useAppsStore } from "../../stores/appsStore";
import { Feedback } from "../ui/Feedback";
export function Applications() {
  const records = useAppsStore((s) => s.records);
  const isLoading = useAppsStore((s) => s.isLoading);
  const isSaving = useAppsStore((s) => s.isSaving);
  const error = useAppsStore((s) => s.error);
  const create = useAppsStore((s) => s.create);
  const remove = useAppsStore((s) => s.remove);
  const rename = useAppsStore((s) => s.rename);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await create(name.trim())) setName("");
  };
  const apps = records.filter((app) =>
    app.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <>
      <form
        className="panel create-form"
        onSubmit={(event) => void submit(event)}
      >
        <div>
          <p className="eyebrow">NEW APPLICATION</p>
          <h2>Make room for your next update.</h2>
          <p className="muted">
            New apps use the API’s standard Production and Staging deployments.
          </p>
        </div>
        <label>
          <span className="sr-only">Application name</span>
          <input
            required
            maxLength={100}
            placeholder="Application name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button className="button" disabled={isSaving || !name.trim()}>
          <FiPlus />
          Create application
        </button>
      </form>
      {error && <Feedback message={error} />}
      {isLoading && <Feedback loading message="Loading applications…" />}
      <div className="toolbar">
        <span className="muted">
          {records.length} applications in this environment
        </span>
        <label className="search-field">
          <FiSearch />
          <input
            aria-label="Search applications"
            placeholder="Find an application…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {apps.length ? (
        <div className="apps-grid">
          {apps.map((app) => (
            <article className="panel app-card" key={app.name}>
              <div className="inline spread">
                <span className="app-icon">
                  <FiBox />
                </span>
                <div className="inline">
                  <button
                    className="icon-button"
                    title="Rename application"
                    aria-label={`Rename ${app.name}`}
                    disabled={isSaving}
                    onClick={() => {
                      setEditing(app.name);
                      setNewName(app.name);
                    }}
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="icon-button danger"
                    title="Delete application"
                    aria-label={`Delete ${app.name}`}
                    disabled={isSaving}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete ${app.name} and all its deployments and releases? This cannot be undone.`
                        )
                      )
                        void remove(app.name);
                    }}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              <h2>
                <Link to={`/apps/${encodeURIComponent(app.name)}/deployments`}>
                  {app.name}
                </Link>
              </h2>
              <p className="muted">
                {app.deployments?.length || 0} deployment channels
              </p>
              <div className="tags">
                {app.deployments?.map((deployment) => (
                  <span key={deployment} className="tag">
                    {deployment}
                  </span>
                ))}
              </div>
              <Link
                className="app-card-link"
                to={`/apps/${encodeURIComponent(app.name)}/deployments`}
              >
                Manage releases <FiArrowUpRight />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        !isLoading && (
          <div className="panel empty-state">
            <FiBox />
            <h2>{search ? "No matching applications." : "A clear runway."}</h2>
            <p>
              {search
                ? "Try a different application name."
                : "Create your first application above to start delivering updates."}
            </p>
          </div>
        )
      )}
      {editing && (
        <div className="modal-backdrop">
          <form
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-title"
            onSubmit={(event) => {
              event.preventDefault();
              void rename(editing, newName.trim()).then((ok) => {
                if (ok) setEditing(null);
              });
            }}
          >
            <h2 id="rename-title">Rename {editing}</h2>
            <label>
              Application name
              <input
                autoFocus
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </label>
            {error && <Feedback message={error} />}
            <div className="header-actions">
              <button
                type="button"
                className="button secondary"
                disabled={isSaving}
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button className="button" disabled={isSaving || !newName.trim()}>
                Save name
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
