import { create } from "zustand";
import API from "../services/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  kycStatus: string;
  walletBalance: number;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  loading: boolean;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: object) => Promise<User>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  hydrate: () => void;
}

// localStorage helpers (web-safe)
function saveToken(token: string) {
  try { localStorage.setItem("tapu_token", token); } catch {}
}
function loadToken(): string | null {
  try { return localStorage.getItem("tapu_token"); } catch { return null; }
}
function clearToken() {
  try { localStorage.removeItem("tapu_token"); } catch {}
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  user: null,
  loading: false,
  hydrated: false,

  // Uygulama açılınca localStorage'dan token'ı yükle
  hydrate: async () => {
    const saved = loadToken();
    if (saved) {
      globalThis.__tapuToken = saved;
      set({ token: saved });
      try {
        const res = await API.get("/auth/me");
        set({ user: res.data.user, hydrated: true });
      } catch {
        clearToken();
        globalThis.__tapuToken = undefined;
        set({ token: null, user: null, hydrated: true });
      }
    } else {
      set({ hydrated: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    const res = await API.post("/auth/login", { email, password });
    globalThis.__tapuToken = res.data.token;
    saveToken(res.data.token);
    set({ token: res.data.token, user: res.data.user, loading: false });
    return res.data.user;
  },

  register: async (data) => {
    set({ loading: true });
    const res = await API.post("/auth/register", data);
    globalThis.__tapuToken = res.data.token;
    saveToken(res.data.token);
    set({ token: res.data.token, user: res.data.user, loading: false });
    return res.data.user;
  },

  logout: () => {
    globalThis.__tapuToken = undefined;
    clearToken();
    set({ token: null, user: null });
  },

  fetchMe: async () => {
    if (!get().token) return;
    const res = await API.get("/auth/me");
    set({ user: res.data.user });
  },
}));
