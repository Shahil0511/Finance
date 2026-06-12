const trimSlashes = (value = "") => value.replace(/^\/+|\/+$/g, "");

const configuredBase = import.meta.env.VITE_BASE_PATH || import.meta.env.BASE_URL || "/";
const normalizedBase = trimSlashes(configuredBase);

export const APP_BASE_PATH = normalizedBase ? `/${normalizedBase}` : "";
export const API_BASE_PATH = `${APP_BASE_PATH}/api`;

export function apiUrl(path = "") {
  const normalizedPath = trimSlashes(path);
  return normalizedPath ? `${API_BASE_PATH}/${normalizedPath}` : API_BASE_PATH;
}
