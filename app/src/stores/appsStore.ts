import { create } from "zustand";
import { adminService } from "../services/admin/adminService";
import { getAxiosErrorMessage } from "../utils/apiUtils";
import type { AppRecord } from "../types/admin";
interface AppsState {
  records: AppRecord[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchRecords: () => Promise<void>;
  create: (name: string) => Promise<boolean>;
  rename: (name: string, newName: string) => Promise<boolean>;
  remove: (name: string) => Promise<boolean>;
}
export const useAppsStore = create<AppsState>((set, get) => {
  const mutate = async (action: () => Promise<void>) => {
    set({ isSaving: true, error: null });
    try {
      await action();
      await get().fetchRecords();
      set({ isSaving: false });
      return true;
    } catch (error) {
      set({ error: getAxiosErrorMessage(error), isSaving: false });
      return false;
    }
  };
  return {
    records: [],
    isLoading: false,
    isSaving: false,
    error: null,
    fetchRecords: async () => {
      set({ isLoading: true, error: null });
      try {
        set({ records: await adminService.apps(), isLoading: false });
      } catch (error) {
        set({ error: getAxiosErrorMessage(error), isLoading: false });
      }
    },
    create: (name) => mutate(() => adminService.createApp(name)),
    rename: (name, newName) =>
      mutate(() => adminService.renameApp(name, newName)),
    remove: (name) => mutate(() => adminService.deleteApp(name)),
  };
});
