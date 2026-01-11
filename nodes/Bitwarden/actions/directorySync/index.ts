/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { bitwardenApiRequest, bitwardenApiRequestAllItems } from '../../transport';
import { toExecutionData, toSingleExecutionData } from '../../utils';

/**
 * Get directory sync configuration
 */
export async function get(this: IExecuteFunctions, _i: number): Promise<INodeExecutionData[]> {
  const config = await bitwardenApiRequest.call(this, 'GET', '/organizations/directory');
  return toSingleExecutionData(config);
}

/**
 * Update directory sync configuration
 */
export async function update(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const enabled = this.getNodeParameter('enabled', i) as boolean;
  const directoryType = this.getNodeParameter('directoryType', i) as number;
  const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
  
  const body: IDataObject = {
    enabled,
    type: directoryType,
    syncUsers: updateFields.syncUsers ?? true,
    syncGroups: updateFields.syncGroups ?? true,
    overwriteExisting: updateFields.overwriteExisting ?? false,
  };
  
  // Add directory-specific configuration
  const directoryConfig: IDataObject = {};
  
  if (updateFields.ldapDirectory) {
    directoryConfig.ldapDirectory = updateFields.ldapDirectory;
  }
  if (updateFields.syncSettings) {
    directoryConfig.syncSettings = updateFields.syncSettings;
  }
  if (updateFields.filter) {
    directoryConfig.filter = updateFields.filter;
  }
  
  // Azure AD specific
  if (directoryType === 0) {
    if (updateFields.tenantId) directoryConfig.tenantId = updateFields.tenantId;
    if (updateFields.applicationId) directoryConfig.applicationId = updateFields.applicationId;
    if (updateFields.secret) directoryConfig.secret = updateFields.secret;
  }
  
  // Okta specific
  if (directoryType === 1) {
    if (updateFields.orgUrl) directoryConfig.orgUrl = updateFields.orgUrl;
    if (updateFields.token) directoryConfig.token = updateFields.token;
  }
  
  // OneLogin specific
  if (directoryType === 2) {
    if (updateFields.clientId) directoryConfig.clientId = updateFields.clientId;
    if (updateFields.clientSecret) directoryConfig.clientSecret = updateFields.clientSecret;
    if (updateFields.region) directoryConfig.region = updateFields.region;
  }
  
  // GSuite specific
  if (directoryType === 3) {
    if (updateFields.domain) directoryConfig.domain = updateFields.domain;
    if (updateFields.adminUser) directoryConfig.adminUser = updateFields.adminUser;
    if (updateFields.serviceAccountKey) directoryConfig.serviceAccountKey = updateFields.serviceAccountKey;
  }
  
  if (Object.keys(directoryConfig).length > 0) {
    body.configuration = directoryConfig;
  }
  
  const config = await bitwardenApiRequest.call(this, 'PUT', '/organizations/directory', body);
  return toSingleExecutionData(config);
}

/**
 * Trigger directory sync
 */
export async function sync(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const syncType = this.getNodeParameter('syncType', i, 'full') as string;
  
  const body: IDataObject = {
    type: syncType,
  };
  
  const result = await bitwardenApiRequest.call(this, 'POST', '/organizations/directory/sync', body);
  return toSingleExecutionData({
    success: true,
    message: 'Directory sync triggered successfully',
    syncType,
    ...result,
  });
}

/**
 * Get directory sync history
 */
export async function getSyncHistory(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const returnAll = this.getNodeParameter('returnAll', i) as boolean;
  const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
  
  const query: IDataObject = {};
  
  if (filters.start) {
    query.start = filters.start;
  }
  if (filters.end) {
    query.end = filters.end;
  }
  
  if (returnAll) {
    const history = await bitwardenApiRequestAllItems.call(
      this,
      'GET',
      '/organizations/directory/sync-history',
      undefined,
      query,
    );
    return toExecutionData(history);
  }
  
  const limit = this.getNodeParameter('limit', i) as number;
  const response = await bitwardenApiRequest.call(
    this,
    'GET',
    '/organizations/directory/sync-history',
    undefined,
    query,
  );
  const history = response.data || response;
  return toExecutionData(history.slice(0, limit));
}
