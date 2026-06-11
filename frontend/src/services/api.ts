import axios from "axios";

// Lokal geliştirme: localhost:3000
// Production: Railway URL (Vercel'de EXPO_PUBLIC_API_URL env var'ından gelir)
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Token varsa her isteğe ekle
API.interceptors.request.use((config) => {
  const token = globalThis.__tapuToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;

// Global token store
declare global {
  var __tapuToken: string | undefined;
}
