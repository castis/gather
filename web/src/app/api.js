import axios from "axios";
import { apiLocation } from "./config";

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

api.interceptors.request.use((config) => {
  const csrfToken = document.cookie
    .split(";")
    .filter((c) => c.startsWith("csrf_access_token="))[0]
    ?.split("=")[1];

  if (csrfToken && ["post", "put", "delete"].includes(config.method)) {
    config.headers["X-CSRF-TOKEN"] = csrfToken;
  }
  return config;
}, Promise.reject);
