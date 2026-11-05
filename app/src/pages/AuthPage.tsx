import { useAuthStore } from "../stores/authStore";
import { Feedback } from "../components/ui/Feedback";
export function AuthPage() {
  const error = useAuthStore((s) => s.error);
  const initialize = useAuthStore((s) => s.initialize);
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <span className="brand-mark">↗</span>
        <p className="eyebrow">CODEPUSH / ADMIN</p>
        <h1>
          {error ? "Sign-in needs attention." : "Connecting your workspace."}
        </h1>
        <p className="muted">
          {error
            ? "Check your Microsoft account access and the server’s Entra configuration."
            : "You’ll be redirected to Microsoft automatically."}
        </p>
        <Feedback
          loading={!error}
          message={error || "Signing in with Microsoft Entra ID…"}
        />
        {error && (
          <button className="button" onClick={() => void initialize(true)}>
            Try sign-in again
          </button>
        )}
      </div>
    </div>
  );
}
