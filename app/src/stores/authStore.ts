import { create } from "zustand";
import { readSession } from "../api/session";
import { authService } from "../services/auth/authService";
import { getAxiosErrorMessage } from "../utils/apiUtils";
import type { AuthConfig } from "../types/admin";
interface AuthState {
  config: AuthConfig | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  initialize: (force?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}
export const useAuthStore = create<AuthState>((set, get) => ({
  config: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  initialize: async (force = false) => {
    if (!force && get().isAuthenticated && readSession()) return;
    set({
      isLoading: force || !get().isAuthenticated,
      isAuthenticated: force ? false : get().isAuthenticated,
      error: null,
    });
    try {
      const config = await authService.initialize(force);
      set({ config, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({
        error: getAxiosErrorMessage(error, "Microsoft sign-in failed."),
        isLoading: false,
        isAuthenticated: false,
      });
    }
  },
  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.logout();
      set({ isAuthenticated: false, isLoading: false });
    } catch (error) {
      set({ error: getAxiosErrorMessage(error), isLoading: false });
    }
  },
}));
