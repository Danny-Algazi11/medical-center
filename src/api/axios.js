import axios from "axios";

const api = axios.create({
  // "127.0.0.1" instead of "localhost": on this machine "localhost" resolves
  // to IPv6 (::1) first, but the Laravel dev server only binds IPv4, so every
  // request stalled ~30s waiting for the IPv6 attempt to fail before falling
  // back. Every page felt slow because every page hits this baseURL.
  baseURL: "http://127.0.0.1:8000/api/v1",
  headers: {
    Accept: "application/json",
  },
});

// Attach the token to every request automatically.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log("CALLING:", config.baseURL + config.url);
  return config;
});

// Normalize every error into a plain Error with .message/.errors/.status.
// Without this, err.message is just axios's generic "Request failed with
// status code 422" — the backend's actual message never reaches the UI.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data;

    if (status === 401) {
      localStorage.removeItem("token");
      window.dispatchEvent(new CustomEvent("mc:unauthorized"));
    }

    const normalized = new Error(
      payload?.message ||
        (status
          ? `Request failed with status ${status}`
          : "Network error — is the server running?"),
    );
    normalized.status = status;
    normalized.errors = payload?.errors || null;

    return Promise.reject(normalized);
  },
);

export default api;
