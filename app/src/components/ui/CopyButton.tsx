import { useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";
export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [status, setStatus] = useState("");
  return (
    <button
      className="button small secondary"
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(
          () => setStatus("Copied"),
          () => setStatus("Copy failed")
        );
      }}
    >
      {status === "Copied" ? <FiCheck /> : <FiCopy />}
      {status || label}
    </button>
  );
}
