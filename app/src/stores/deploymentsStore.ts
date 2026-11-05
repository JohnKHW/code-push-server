import { create } from "zustand";
import { adminService } from "../services/admin/adminService";
import { getAxiosErrorMessage } from "../utils/apiUtils";
import type {
  AppRecord,
  Deployment,
  DeploymentMetrics,
  Release,
  ReleaseInput,
} from "../types/admin";
interface DeploymentsState {
  app: string;
  records: Deployment[];
  selected: string;
  history: Release[];
  metrics: DeploymentMetrics;
  collaborators: NonNullable<AppRecord["collaborators"]>;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  metricsError: string | null;
  load: (app: string, selected?: string) => Promise<void>;
  select: (name: string) => Promise<void>;
  add: (name: string) => Promise<boolean>;
  remove: (name: string) => Promise<boolean>;
  release: (file: File, input: ReleaseInput) => Promise<boolean>;
  patchRelease: (input: Partial<ReleaseInput>) => Promise<boolean>;
  promote: (target: string) => Promise<boolean>;
  rollback: () => Promise<boolean>;
  addCollaborator: (email: string) => Promise<boolean>;
  removeCollaborator: (email: string) => Promise<boolean>;
}
let requestId = 0;
export const useDeploymentsStore = create<DeploymentsState>((set, get) => {
  const mutate = async (action: (state: DeploymentsState) => Promise<void>) => {
    const state = get();
    set({ isSaving: true, error: null });
    try {
      await action(state);
      if (get().app === state.app) await get().load(state.app, state.selected);
      set({ isSaving: false });
      return true;
    } catch (error) {
      set({ isSaving: false, error: getAxiosErrorMessage(error) });
      return false;
    }
  };
  return {
    app: "",
    records: [],
    selected: "",
    history: [],
    metrics: {},
    collaborators: {},
    isLoading: false,
    isSaving: false,
    error: null,
    metricsError: null,
    load: async (app, requested) => {
      const id = ++requestId;
      if (get().app !== app)
        set({ records: [], history: [], metrics: {}, collaborators: {} });
      set({ app, isLoading: true, error: null, metricsError: null });
      try {
        const [records, collaborators] = await Promise.all([
          adminService.deployments(app),
          adminService.collaborators(app),
        ]);
        const selected = records.some((record) => record.name === requested)
          ? requested!
          : records[0]?.name || "";
        const [history, metrics] = await Promise.all([
          selected ? adminService.history(app, selected) : Promise.resolve([]),
          selected
            ? adminService.metrics(app, selected).catch((error) => {
                if (id === requestId)
                  set({ metricsError: getAxiosErrorMessage(error) });
                return {};
              })
            : Promise.resolve({}),
        ]);
        if (id === requestId)
          set({
            records,
            collaborators,
            selected,
            history: [...history].reverse(),
            metrics,
            isLoading: false,
          });
      } catch (error) {
        if (id === requestId)
          set({ error: getAxiosErrorMessage(error), isLoading: false });
      }
    },
    select: (name) => get().load(get().app, name),
    add: (name) =>
      mutate((state) => adminService.createDeployment(state.app, name)),
    remove: (name) =>
      mutate((state) => adminService.deleteDeployment(state.app, name)),
    release: (file, input) =>
      mutate((state) =>
        adminService.release(state.app, state.selected, file, input)
      ),
    patchRelease: (input) =>
      mutate((state) =>
        adminService.patchRelease(state.app, state.selected, input)
      ),
    promote: (target) =>
      mutate((state) =>
        adminService.promote(state.app, state.selected, target)
      ),
    rollback: () =>
      mutate((state) => adminService.rollback(state.app, state.selected)),
    addCollaborator: (email) =>
      mutate((state) => adminService.addCollaborator(state.app, email)),
    removeCollaborator: (email) =>
      mutate((state) => adminService.removeCollaborator(state.app, email)),
  };
});
