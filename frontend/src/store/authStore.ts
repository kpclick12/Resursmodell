import { create } from "zustand";
import { login as apiLogin } from "@/lib/api";

interface AuthState {
  token: string | null;
  isAuthenticated: () => boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem("token"),

  isAuthenticated: () => !!get().token,

  login: async (password: string) => {
    const data = await apiLogin(password);
    localStorage.setItem("token", data.access_token);
    set({ token: data.access_token });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null });
  },
}));
