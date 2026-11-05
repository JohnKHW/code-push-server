import { create } from "zustand";
import { adminService } from "../services/admin/adminService";
import { getAxiosErrorMessage } from "../utils/apiUtils";
import type { AccessKey } from "../types/admin";
interface KeysState {
  records: AccessKey[];
  createdKey: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchRecords: () => Promise<void>;
  create: (name: string, days: number) => Promise<boolean>;
  revoke: (name: string) => Promise<void>;
  dismissKey: () => void;
}
export const useKeysStore = create<KeysState>((set, get) => ({
  records: [],
  createdKey: null,
  isLoading: false,
  isSaving: false,
  error: null,
  fetchRecords: async () => {
    set({ isLoading: true, error: null });
    try {
      set({ records: await adminService.keys(), isLoading: false });
    } catch (error) {
      set({ error: getAxiosErrorMessage(error), isLoading: false });
    }
  },
  create: async (name, days) => {
    set({ isSaving: true, error: null, createdKey: null });
    try {
      const key = await adminService.createKey(name, days * 86400000);
      await get().fetchRecords();
      set({ createdKey: key.name, isSaving: false });
      return true;
    } catch (error) {
      set({ error: getAxiosErrorMessage(error), isSaving: false });
      return false;
    }
  },
  revoke: async (name) => {
    set({ isSaving: true, error: null });
    try {
      await adminService.revokeKey(name);
      await get().fetchRecords();
      set({ isSaving: false });
    } catch (error) {
      set({ error: getAxiosErrorMessage(error), isSaving: false });
    }
  },
  dismissKey: () => set({ createdKey: null }),
}));
