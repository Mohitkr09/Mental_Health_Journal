// src/utils/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && token !== "null") {
    config.headers.Authorization = `Bearer ${token.trim()}`;
  } else {
    console.warn("⚠️ No token found in localStorage");
  }
  return config;
});

export default api;
