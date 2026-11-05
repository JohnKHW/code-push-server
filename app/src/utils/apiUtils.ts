import axios from "axios";
export function getAxiosErrorMessage(
  error: unknown,
  fallback = "The request could not be completed."
): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (typeof data === "string" && !data.startsWith("<")) return data;
    if (
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
    )
      return data.message;
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
