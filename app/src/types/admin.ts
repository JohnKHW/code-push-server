export interface AuthConfig {
  clientId: string;
  cliClientId: string;
  authority: string;
  scope: string;
  redirectPath?: "/" | "/admin/" | "/admin/auth";
  environment: string;
  metricsEnabled: boolean;
}
export interface Account {
  name: string;
  email: string;
  linkedProviders: string[];
}
export interface AppRecord {
  name: string;
  deployments: string[];
  collaborators?: Record<
    string,
    { permission: string; isCurrentAccount?: boolean }
  >;
}
export interface Release {
  label: string;
  appVersion: string;
  description?: string;
  uploadTime: number;
  releasedBy?: string;
  rollout?: number;
  isMandatory: boolean;
  isDisabled: boolean;
  size: number;
  releaseMethod?: string;
}
export interface Deployment {
  name: string;
  key: string;
  package?: Release;
}
export interface ReleaseMetrics {
  downloaded?: number;
  installed?: number;
  failed?: number;
  active?: number;
}
export type DeploymentMetrics = Record<string, ReleaseMetrics>;
export interface MetricRow {
  app: string;
  deployment: string;
  label: string;
  downloaded: number;
  installed: number;
  failed: number;
  active: number;
}
export interface AccessKey {
  friendlyName: string;
  createdTime: number;
  expires: number;
  createdBy: string;
  isSession?: boolean;
  name: string;
}
export interface ReleaseInput {
  appVersion: string;
  description: string;
  rollout: number;
  isMandatory: boolean;
  isDisabled: boolean;
}
