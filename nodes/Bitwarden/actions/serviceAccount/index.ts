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
 * Get all service accounts
 */
export async function getAll(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const returnAll = this.getNodeParameter('returnAll', i) as boolean;
  
  if (returnAll) {
    const serviceAccounts = await bitwardenApiRequestAllItems.call(this, 'GET', '/service-accounts');
    return toExecutionData(serviceAccounts);
  }
  
  const limit = this.getNodeParameter('limit', i) as number;
  const response = await bitwardenApiRequest.call(this, 'GET', '/service-accounts');
  const serviceAccounts = response.data || response;
  return toExecutionData(serviceAccounts.slice(0, limit));
}

/**
 * Get a single service account by ID
 */
export async function get(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const serviceAccountId = this.getNodeParameter('serviceAccountId', i) as string;
  const serviceAccount = await bitwardenApiRequest.call(
    this,
    'GET',
    `/service-accounts/${serviceAccountId}`,
  );
  return toSingleExecutionData(serviceAccount);
}

/**
 * Create a new service account
 */
export async function create(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const name = this.getNodeParameter('name', i) as string;
  
  const body: IDataObject = {
    name,
  };
  
  const serviceAccount = await bitwardenApiRequest.call(this, 'POST', '/service-accounts', body);
  return toSingleExecutionData(serviceAccount);
}

/**
 * Update a service account
 */
export async function update(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const serviceAccountId = this.getNodeParameter('serviceAccountId', i) as string;
  const name = this.getNodeParameter('name', i) as string;
  
  const body: IDataObject = {
    name,
  };
  
  const serviceAccount = await bitwardenApiRequest.call(
    this,
    'PUT',
    `/service-accounts/${serviceAccountId}`,
    body,
  );
  return toSingleExecutionData(serviceAccount);
}

/**
 * Delete a service account
 */
export async function deleteServiceAccount(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const serviceAccountId = this.getNodeParameter('serviceAccountId', i) as string;
  await bitwardenApiRequest.call(this, 'DELETE', `/service-accounts/${serviceAccountId}`);
  return toSingleExecutionData({ success: true, serviceAccountId });
}

/**
 * Get access tokens for a service account
 */
export async function getAccessTokens(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const serviceAccountId = this.getNodeParameter('serviceAccountId', i) as string;
  const returnAll = this.getNodeParameter('returnAll', i) as boolean;
  
  if (returnAll) {
    const tokens = await bitwardenApiRequestAllItems.call(
      this,
      'GET',
      `/service-accounts/${serviceAccountId}/access-tokens`,
    );
    return toExecutionData(tokens);
  }
  
  const limit = this.getNodeParameter('limit', i) as number;
  const response = await bitwardenApiRequest.call(
    this,
    'GET',
    `/service-accounts/${serviceAccountId}/access-tokens`,
  );
  const tokens = response.data || response;
  return toExecutionData(tokens.slice(0, limit));
}

/**
 * Create an access token for a service account
 */
export async function createAccessToken(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const serviceAccountId = this.getNodeParameter('serviceAccountId', i) as string;
  const name = this.getNodeParameter('tokenName', i) as string;
  const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
  
  const body: IDataObject = {
    name,
  };
  
  if (additionalFields.expireAt) {
    body.expireAt = additionalFields.expireAt;
  }
  
  if (additionalFields.scopes) {
    body.scopes = additionalFields.scopes;
  }
  
  const token = await bitwardenApiRequest.call(
    this,
    'POST',
    `/service-accounts/${serviceAccountId}/access-tokens`,
    body,
  );
  return toSingleExecutionData(token);
}

/**
 * Revoke an access token
 */
export async function revokeAccessToken(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const serviceAccountId = this.getNodeParameter('serviceAccountId', i) as string;
  const accessTokenId = this.getNodeParameter('accessTokenId', i) as string;
  
  await bitwardenApiRequest.call(
    this,
    'DELETE',
    `/service-accounts/${serviceAccountId}/access-tokens/${accessTokenId}`,
  );
  return toSingleExecutionData({ success: true, serviceAccountId, accessTokenId });
}
