import axios from "axios";

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("salesia_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
