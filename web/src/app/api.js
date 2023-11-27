import axios from "axios";
import { apiLocation } from "./config";
import { local } from "d3";

export const api = axios.create({
  baseURL: apiLocation,
  withCredentials: true,
  headers: {
    post: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
  },
});

const getCSRFToken = () =>
  document.cookie
    .split(";")
    .filter((c) => c.startsWith("csrf_access_token="))[0]
    ?.split("=")[1];

api.interceptors.request.use((config) => {
  const csrfToken = getCSRFToken();
  if (csrfToken && ["post", "put", "delete"].includes(config.method)) {
    config.headers["X-CSRF-TOKEN"] = csrfToken;
  }
  return config;
}, Promise.reject);
