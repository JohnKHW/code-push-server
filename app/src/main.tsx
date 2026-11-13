import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
// A shared SPA registration can return logout to its existing root redirect URI.
if (sessionStorage.getItem("codepush.signedOut") === "true") {
  sessionStorage.removeItem("codepush.signedOut");
  window.history.replaceState(null, "", "/admin/signed-out");
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
