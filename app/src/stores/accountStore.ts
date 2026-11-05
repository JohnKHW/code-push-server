import { create } from "zustand";
import { adminService } from "../services/admin/adminService";
import { getAxiosErrorMessage } from "../utils/apiUtils";
import type { Account } from "../types/admin";
interface AccountState {
  account: Account | null;
  isLoading: boolean;
  error: string | null;
  fetchRecord: () => Promise<void>;
}
export const useAccountStore = create<AccountState>((set) => ({
  account: null,
  isLoading: false,
  error: null,
  fetchRecord: async () => {
    set({ isLoading: true, error: null });
    try {
      set({ account: await adminService.account(), isLoading: false });
    } catch (error) {
      set({ error: getAxiosErrorMessage(error), isLoading: false });
    }
  },
}));
