import { http } from "../../api/http";
import type {
  AccessKey,
  Account,
  AppRecord,
  Deployment,
  DeploymentMetrics,
  Release,
  ReleaseInput,
} from "../../types/admin";
const BASE_PATH = "/apps";
const encode = encodeURIComponent;
export const deploymentPath = (app: string, deployment: string) =>
  `${BASE_PATH}/${encode(app)}/deployments/${encode(deployment)}`;
class AdminService {
  async apps() {
    return (await http.get<{ apps: AppRecord[] }>(BASE_PATH)).data.apps;
  }
  async account() {
    return (await http.get<{ account: Account }>("/account")).data.account;
  }
  async createApp(name: string) {
    await http.post(BASE_PATH, { name });
  }
  async renameApp(name: string, newName: string) {
    await http.patch(`${BASE_PATH}/${encode(name)}`, { name: newName });
  }
  async deleteApp(name: string) {
    await http.delete(`${BASE_PATH}/${encode(name)}`);
  }
  async deployments(app: string) {
    return (
      await http.get<{ deployments: Deployment[] }>(
        `${BASE_PATH}/${encode(app)}/deployments`
      )
    ).data.deployments;
  }
  async createDeployment(app: string, name: string) {
    await http.post(`${BASE_PATH}/${encode(app)}/deployments`, { name });
  }
  async deleteDeployment(app: string, name: string) {
    await http.delete(deploymentPath(app, name));
  }
  async history(app: string, deployment: string) {
    return (
      await http.get<{ history: Release[] }>(
        `${deploymentPath(app, deployment)}/history`
      )
    ).data.history;
  }
  async metrics(app: string, deployment: string) {
    return (
      await http.get<{ metrics: DeploymentMetrics }>(
        `${deploymentPath(app, deployment)}/metrics`
      )
    ).data.metrics;
  }
  async release(
    app: string,
    deployment: string,
    file: File,
    input: ReleaseInput
  ) {
    const form = new FormData();
    form.append("package", file);
    form.append("packageInfo", JSON.stringify(input));
    await http.post(`${deploymentPath(app, deployment)}/release`, form, {
      timeout: 0,
    });
  }
  async patchRelease(
    app: string,
    deployment: string,
    input: Partial<ReleaseInput>
  ) {
    await http.patch(`${deploymentPath(app, deployment)}/release`, {
      packageInfo: input,
    });
  }
  async promote(app: string, source: string, target: string) {
    await http.post(
      `${deploymentPath(app, source)}/promote/${encode(target)}`,
      { packageInfo: {} }
    );
  }
  async rollback(app: string, deployment: string) {
    await http.post(`${deploymentPath(app, deployment)}/rollback`);
  }
  async keys() {
    return (await http.get<{ accessKeys: AccessKey[] }>("/accessKeys")).data
      .accessKeys;
  }
  async createKey(friendlyName: string, ttl: number) {
    return (
      await http.post<{ accessKey: AccessKey }>("/accessKeys", {
        friendlyName,
        ttl,
        createdBy: "CodePush Admin",
      })
    ).data.accessKey;
  }
  async revokeKey(name: string) {
    await http.delete(`/accessKeys/${encode(name)}`);
  }
  async collaborators(app: string) {
    return (
      await http.get<{
        collaborators: NonNullable<AppRecord["collaborators"]>;
      }>(`${BASE_PATH}/${encode(app)}/collaborators`)
    ).data.collaborators;
  }
  async addCollaborator(app: string, email: string) {
    await http.post(
      `${BASE_PATH}/${encode(app)}/collaborators/${encode(email)}`
    );
  }
  async removeCollaborator(app: string, email: string) {
    await http.delete(
      `${BASE_PATH}/${encode(app)}/collaborators/${encode(email)}`
    );
  }
}
export const adminService = new AdminService();
