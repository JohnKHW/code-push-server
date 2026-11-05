import { FiAlertCircle, FiLoader } from "react-icons/fi";
export function Feedback({
  message,
  loading = false,
}: {
  message: string;
  loading?: boolean;
}) {
  return (
    <div
      className={loading ? "feedback loading" : "feedback error"}
      role={loading ? "status" : "alert"}
    >
      {loading ? <FiLoader className="spin" /> : <FiAlertCircle />}
      <span>{message}</span>
    </div>
  );
}
