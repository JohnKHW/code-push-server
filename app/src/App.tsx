import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthPage } from "./pages/AuthPage";
import { AppsPage } from "./pages/AppsPage";
import { DeploymentsPage } from "./pages/DeploymentsPage";
import { MetricsPage } from "./pages/MetricsPage";
import { AccessKeysPage } from "./pages/AccessKeysPage";
import { AccountPage } from "./pages/AccountPage";
import { useAuthStore } from "./stores/authStore";
import { useAccountStore } from "./stores/accountStore";
function AdminRoutes() {
  const initialize = useAuthStore((s) => s.initialize);
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  const loading = useAuthStore((s) => s.isLoading);
  const fetchAccount = useAccountStore((s) => s.fetchRecord);
  const navigate = useNavigate();
  const location = useLocation();
  const signedOut = location.pathname === "/signed-out";
  useEffect(() => {
    if (signedOut) return;
    void initialize();
    const renew = () => void initialize(true);
    window.addEventListener("codepush:unauthorized", renew);
    const timer = window.setInterval(() => {
      if (useAuthStore.getState().isAuthenticated) void initialize();
    }, 60000);
    return () => {
      window.removeEventListener("codepush:unauthorized", renew);
      window.clearInterval(timer);
    };
  }, [initialize, signedOut]);
  useEffect(() => {
    if (!authenticated) return;
    void fetchAccount();
    if (location.pathname === "/auth") {
      const path = sessionStorage.getItem("codepush.returnTo");
      sessionStorage.removeItem("codepush.returnTo");
      navigate(
        path?.startsWith("/admin/") &&
          !path.startsWith("/admin/auth") &&
          !path.startsWith("/admin/signed-out")
          ? path.slice("/admin".length)
          : "/",
        { replace: true }
      );
    }
  }, [authenticated, fetchAccount, location.pathname, navigate]);
  if (signedOut)
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <span className="brand-mark">↗</span>
          <h1>You’re signed out.</h1>
          <a className="button" href="/admin/">
            Return to workspace
          </a>
        </div>
      </div>
    );
  if (loading || !authenticated) return <AuthPage />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<MetricsPage />} />
        <Route path="/apps" element={<AppsPage />} />
        <Route
          path="/apps/:appName/deployments"
          element={<DeploymentsPage />}
        />
        <Route path="/access-keys" element={<AccessKeysPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/metrics" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
export default function App() {
  return (
    <BrowserRouter basename="/admin">
      <AdminRoutes />
    </BrowserRouter>
  );
}
