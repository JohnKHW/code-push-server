"""Render public deployment configuration before Kustomize calculates ConfigMap hashes."""
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

if len(sys.argv) != 2 or sys.argv[1] not in ("uat", "prod"):
    sys.exit("Usage: deploy/render.sh uat|prod")
values = {name: os.environ.get(name, "") for name in (
    "PUBLIC_HOST", "API_IMAGE", "APP_IMAGE", "MSAL_CLIENT_ID", "MSAL_CLI_CLIENT_ID",
    "MSAL_TENANT_ID", "MSAL_API_AUDIENCE", "MSAL_API_SCOPE", "MSAL_REQUIRED_ROLE",
    "GATEWAY_NAME", "GATEWAY_NAMESPACE", "GATEWAY_LISTENER",
)}
values["MSAL_CLI_CLIENT_ID"] = values["MSAL_CLI_CLIENT_ID"] or values["MSAL_CLIENT_ID"]
values["GATEWAY_LISTENER"] = values["GATEWAY_LISTENER"] or "https"
for name, value in values.items():
    if name == "MSAL_REQUIRED_ROLE" and not value:
        continue
    if not value or not re.fullmatch(r"[a-zA-Z0-9_./:@+-]+", value):
        sys.exit(f"Set {name} to a valid public configuration value (no whitespace or YAML metacharacters).")
for name in ("MSAL_CLIENT_ID", "MSAL_CLI_CLIENT_ID", "MSAL_TENANT_ID"):
    if not re.fullmatch(r"[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}", values[name]):
        sys.exit(f"{name} must be a GUID")
if not re.fullmatch(r"[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?", values["PUBLIC_HOST"]):
    sys.exit("PUBLIC_HOST must be a hostname without protocol, port or path")
for name in ("GATEWAY_NAME", "GATEWAY_NAMESPACE", "GATEWAY_LISTENER"):
    if not re.fullmatch(r"[a-z0-9](?:[a-z0-9-]*[a-z0-9])?", values[name]):
        sys.exit(f"{name} must be a Kubernetes DNS label")
with tempfile.TemporaryDirectory(prefix="codepush-render-") as directory:
    root = Path(directory) / "k8s"
    shutil.copytree(Path(__file__).parent / "k8s", root)
    for path in root.rglob("*.yaml"):
        text = path.read_text()
        text = re.sub(r"\$\{([A-Z_]+)\}", lambda match: values[match[1]], text)
        text = text.replace("codepush-api:deployment", values["API_IMAGE"]).replace("codepush-app:deployment", values["APP_IMAGE"])
        path.write_text(text)
    subprocess.run(["kubectl", "kustomize", str(root / "overlays" / sys.argv[1])], check=True)
