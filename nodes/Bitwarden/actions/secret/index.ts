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
 * Get all secrets
 */
export async function getAll(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const returnAll = this.getNodeParameter('returnAll', i) as boolean;
  
  if (returnAll) {
    const secrets = await bitwardenApiRequestAllItems.call(this, 'GET', '/secrets');
    return toExecutionData(secrets);
  }
  
  const limit = this.getNodeParameter('limit', i) as number;
  const response = await bitwardenApiRequest.call(this, 'GET', '/secrets');
  const secrets = response.data || response;
  return toExecutionData(secrets.slice(0, limit));
}

/**
 * Get a single secret by ID
 */
export async function get(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const secretId = this.getNodeParameter('secretId', i) as string;
  const secret = await bitwardenApiRequest.call(this, 'GET', `/secrets/${secretId}`);
  return toSingleExecutionData(secret);
}

/**
 * Create a new secret
 */
export async function create(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const key = this.getNodeParameter('key', i) as string;
  const value = this.getNodeParameter('value', i) as string;
  const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
  
  const body: IDataObject = {
    key,
    value,
  };
  
  if (additionalFields.note) {
    body.note = additionalFields.note;
  }
  
  if (additionalFields.projectId) {
    body.projectIds = [additionalFields.projectId];
  }
  
  const secret = await bitwardenApiRequest.call(this, 'POST', '/secrets', body);
  return toSingleExecutionData(secret);
}

/**
 * Update a secret
 */
export async function update(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const secretId = this.getNodeParameter('secretId', i) as string;
  const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
  
  // Get current secret first
  const currentSecret = await bitwardenApiRequest.call(this, 'GET', `/secrets/${secretId}`);
  
  const body: IDataObject = {
    key: updateFields.key ?? currentSecret.key,
    value: updateFields.value ?? currentSecret.value,
    note: updateFields.note !== undefined ? (updateFields.note || null) : currentSecret.note,
  };
  
  if (updateFields.projectId) {
    body.projectIds = [updateFields.projectId];
  } else if (currentSecret.projectId) {
    body.projectIds = [currentSecret.projectId];
  }
  
  const secret = await bitwardenApiRequest.call(this, 'PUT', `/secrets/${secretId}`, body);
  return toSingleExecutionData(secret);
}

/**
 * Delete a secret
 */
export async function deleteSecret(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const secretId = this.getNodeParameter('secretId', i) as string;
  await bitwardenApiRequest.call(this, 'DELETE', `/secrets/${secretId}`);
  return toSingleExecutionData({ success: true, secretId });
}

/**
 * Get secrets by project
 */
export async function getByProject(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const projectId = this.getNodeParameter('projectId', i) as string;
  const returnAll = this.getNodeParameter('returnAll', i) as boolean;
  
  if (returnAll) {
    const secrets = await bitwardenApiRequestAllItems.call(
      this,
      'GET',
      `/projects/${projectId}/secrets`,
    );
    return toExecutionData(secrets);
  }
  
  const limit = this.getNodeParameter('limit', i) as number;
  const response = await bitwardenApiRequest.call(this, 'GET', `/projects/${projectId}/secrets`);
  const secrets = response.data || response;
  return toExecutionData(secrets.slice(0, limit));
}
