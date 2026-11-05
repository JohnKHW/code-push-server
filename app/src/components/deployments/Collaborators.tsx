import { useState } from "react";
import { FiUserPlus, FiX } from "react-icons/fi";
import { useDeploymentsStore } from "../../stores/deploymentsStore";
export function Collaborators() {
  const records = useDeploymentsStore((s) => s.collaborators);
  const isSaving = useDeploymentsStore((s) => s.isSaving);
  const add = useDeploymentsStore((s) => s.addCollaborator);
  const remove = useDeploymentsStore((s) => s.removeCollaborator);
  const [email, setEmail] = useState("");
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">APPLICATION SETTINGS</p>
          <h2>The people behind the release.</h2>
        </div>
      </div>
      <div className="collaborator-list">
        {Object.entries(records).map(([address, info]) => (
          <div className="inline spread" key={address}>
            <div>
              <strong>{address}</strong>
              <small className="muted">
                {info.permission}
                {info.isCurrentAccount ? " · You" : ""}
              </small>
            </div>
            {info.permission !== "Owner" && (
              <button
                className="icon-button danger"
                aria-label={`Remove ${address}`}
                disabled={isSaving}
                onClick={() => {
                  if (
                    window.confirm(`Remove ${address} from this application?`)
                  )
                    void remove(address);
                }}
              >
                <FiX />
              </button>
            )}
          </div>
        ))}
      </div>
      <form
        className="inline padded"
        onSubmit={(event) => {
          event.preventDefault();
          void add(email.trim()).then((ok) => {
            if (ok) setEmail("");
          });
        }}
      >
        <input
          required
          type="email"
          aria-label="Collaborator email"
          placeholder="colleague@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="button secondary"
          disabled={isSaving || !email.trim()}
        >
          <FiUserPlus />
          Add collaborator
        </button>
      </form>
    </section>
  );
}
