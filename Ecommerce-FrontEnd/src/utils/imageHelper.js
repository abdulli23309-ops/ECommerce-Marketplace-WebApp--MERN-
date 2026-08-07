export const getImageUrl = (relativeUrl) => {
  if (!relativeUrl) return null;
  if (relativeUrl.startsWith("http")) return relativeUrl;

  // The API base URL is e.g. http://localhost:5000/api/v1
  // We need the root: http://localhost:5000
  const root = import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/v1.*$/, "") || "http://localhost:5000";
  return `${root}${relativeUrl}`;
};