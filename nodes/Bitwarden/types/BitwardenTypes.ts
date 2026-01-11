/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject } from 'n8n-workflow';

// Environment types
export type BitwardenEnvironment = 'cloudUS' | 'cloudEU' | 'selfHosted';

// Member types
export enum MemberType {
  Owner = 0,
  Admin = 1,
  User = 2,
  Manager = 3,
  Custom = 4,
}

export enum MemberStatus {
  Invited = 0,
  Accepted = 1,
  Confirmed = 2,
  Revoked = -1,
}

export interface IBitwardenMember {
  object: string;
  id: string;
  userId: string | null;
  name: string | null;
  email: string;
  twoFactorEnabled: boolean;
  status: MemberStatus;
  type: MemberType;
  accessAll: boolean;
  externalId: string | null;
  resetPasswordEnrolled: boolean;
  collections: ICollectionAccess[];
}

export interface ICollectionAccess {
  id: string;
  readOnly: boolean;
  hidePasswords: boolean;
  manage: boolean;
}

export interface IGroupAccess {
  id: string;
  readOnly: boolean;
  hidePasswords: boolean;
  manage: boolean;
}

// Collection types
export interface IBitwardenCollection {
  object: string;
  id: string;
  organizationId: string;
  name: string;
  externalId: string | null;
  groups: IGroupAccess[];
}

// Group types
export interface IBitwardenGroup {
  object: string;
  id: string;
  organizationId: string;
  name: string;
  accessAll: boolean;
  externalId: string | null;
  collections: ICollectionAccess[];
}

// Policy types
export enum PolicyType {
  TwoFactorAuthentication = 0,
  MasterPassword = 1,
  PasswordGenerator = 2,
  SingleOrganization = 3,
  RequireSso = 4,
  PersonalOwnership = 5,
  DisableSend = 6,
  SendOptions = 7,
  ResetPassword = 8,
  MaximumVaultTimeout = 9,
  DisablePersonalVaultExport = 10,
  ActivateAutofill = 11,
}

export interface IBitwardenPolicy {
  object: string;
  id: string;
  organizationId: string;
  type: PolicyType;
  enabled: boolean;
  data: IDataObject | null;
}

// Event types
export interface IBitwardenEvent {
  object: string;
  type: number;
  itemId: string | null;
  collectionId: string | null;
  groupId: string | null;
  policyId: string | null;
  memberId: string | null;
  actingUserId: string | null;
  date: string;
  device: number | null;
  ipAddress: string | null;
}

// Organization types
export interface IBitwardenOrganization {
  object: string;
  id: string;
  name: string;
  businessName: string | null;
  businessAddress1: string | null;
  businessAddress2: string | null;
  businessAddress3: string | null;
  businessCountry: string | null;
  businessTaxNumber: string | null;
  billingEmail: string;
  plan: string;
  planType: number;
  seats: number | null;
  maxAutoscaleSeats: number | null;
  maxCollections: number | null;
  maxStorageGb: number | null;
  usePolicies: boolean;
  useGroups: boolean;
  useDirectory: boolean;
  useEvents: boolean;
  useTotp: boolean;
  use2fa: boolean;
  useSso: boolean;
  selfHost: boolean;
  usersGetPremium: boolean;
}

// SSO types
export enum SsoType {
  OpenIdConnect = 0,
  Saml2 = 1,
}

export interface IBitwardenSsoConfig {
  enabled: boolean;
  identifier: string | null;
  type: SsoType;
  keyConnectorEnabled: boolean;
  data: IDataObject | null;
}

// Directory Sync types
export enum DirectoryType {
  AzureActiveDirectory = 0,
  Okta = 1,
  OneLogin = 2,
  GSuite = 3,
  JumpCloud = 4,
  Generic = 5,
}

export interface IBitwardenDirectoryConfig {
  enabled: boolean;
  type: DirectoryType;
  syncUsers: boolean;
  syncGroups: boolean;
  overwriteExisting: boolean;
}

// Secrets Manager types
export interface IBitwardenSecret {
  object: string;
  id: string;
  organizationId: string;
  key: string;
  value: string;
  note: string | null;
  projectId: string | null;
  creationDate: string;
  revisionDate: string;
}

export interface IBitwardenProject {
  object: string;
  id: string;
  organizationId: string;
  name: string;
  creationDate: string;
  revisionDate: string;
}

export interface IBitwardenServiceAccount {
  object: string;
  id: string;
  organizationId: string;
  name: string;
  creationDate: string;
  revisionDate: string;
}

export interface IBitwardenAccessToken {
  object: string;
  id: string;
  name: string;
  scopes: string[];
  expireAt: string | null;
  creationDate: string;
  revisionDate: string;
}

// API Response types
export interface IBitwardenListResponse<T> {
  object: string;
  data: T[];
  continuationToken: string | null;
}

export interface IBitwardenTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// Error types
export interface IBitwardenError {
  message: string;
  validationErrors: Record<string, string[]> | null;
  exceptionMessage: string | null;
  exceptionStackTrace: string | null;
  innerExceptionMessage: string | null;
}

// Resource and operation types for node
export type BitwardenResource =
  | 'member'
  | 'collection'
  | 'group'
  | 'policy'
  | 'event'
  | 'organization'
  | 'sso'
  | 'directorySync'
  | 'secret'
  | 'project'
  | 'serviceAccount'
  | 'importExport';

export type MemberOperation =
  | 'getAll'
  | 'get'
  | 'create'
  | 'update'
  | 'delete'
  | 'reinvite'
  | 'confirm'
  | 'updateGroups'
  | 'updateCollections'
  | 'revoke'
  | 'restore';

export type CollectionOperation =
  | 'getAll'
  | 'get'
  | 'create'
  | 'update'
  | 'delete'
  | 'getMembers'
  | 'addMember'
  | 'removeMember'
  | 'getGroups'
  | 'updateGroups';

export type GroupOperation =
  | 'getAll'
  | 'get'
  | 'create'
  | 'update'
  | 'delete'
  | 'getMembers'
  | 'addMembers'
  | 'removeMembers'
  | 'getCollections'
  | 'updateCollections';

export type PolicyOperation = 'getAll' | 'get' | 'update';

export type EventOperation = 'getAll' | 'getByDateRange' | 'getByMember' | 'getByType';

export type OrganizationOperation =
  | 'get'
  | 'update'
  | 'getBilling'
  | 'getSubscription'
  | 'getLicense'
  | 'rotateApiKey';

export type SsoOperation = 'get' | 'update' | 'getMetadata' | 'testConnection';

export type DirectorySyncOperation = 'get' | 'update' | 'sync' | 'getSyncHistory';

export type SecretOperation = 'getAll' | 'get' | 'create' | 'update' | 'delete' | 'getByProject';

export type ProjectOperation =
  | 'getAll'
  | 'get'
  | 'create'
  | 'update'
  | 'delete'
  | 'getSecrets'
  | 'getServiceAccounts';

export type ServiceAccountOperation =
  | 'getAll'
  | 'get'
  | 'create'
  | 'update'
  | 'delete'
  | 'getAccessTokens'
  | 'createAccessToken'
  | 'revokeAccessToken';

export type ImportExportOperation =
  | 'importOrganization'
  | 'exportOrganization'
  | 'importMembers'
  | 'exportMembers';

// Token cache type
export interface ITokenCache {
  token: string;
  expires: number;
}
