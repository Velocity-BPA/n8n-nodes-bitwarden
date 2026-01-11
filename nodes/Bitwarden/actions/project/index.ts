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
 * Get all projects
 */
export async function getAll(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const returnAll = this.getNodeParameter('returnAll', i) as boolean;
  
  if (returnAll) {
    const projects = await bitwardenApiRequestAllItems.call(this, 'GET', '/projects');
    return toExecutionData(projects);
  }
  
  const limit = this.getNodeParameter('limit', i) as number;
  const response = await bitwardenApiRequest.call(this, 'GET', '/projects');
  const projects = response.data || response;
  return toExecutionData(projects.slice(0, limit));
}

/**
 * Get a single project by ID
 */
export async function get(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const projectId = this.getNodeParameter('projectId', i) as string;
  const project = await bitwardenApiRequest.call(this, 'GET', `/projects/${projectId}`);
  return toSingleExecutionData(project);
}

/**
 * Create a new project
 */
export async function create(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const name = this.getNodeParameter('name', i) as string;
  
  const body: IDataObject = {
    name,
  };
  
  const project = await bitwardenApiRequest.call(this, 'POST', '/projects', body);
  return toSingleExecutionData(project);
}

/**
 * Update a project
 */
export async function update(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const projectId = this.getNodeParameter('projectId', i) as string;
  const name = this.getNodeParameter('name', i) as string;
  
  const body: IDataObject = {
    name,
  };
  
  const project = await bitwardenApiRequest.call(this, 'PUT', `/projects/${projectId}`, body);
  return toSingleExecutionData(project);
}

/**
 * Delete a project
 */
export async function deleteProject(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const projectId = this.getNodeParameter('projectId', i) as string;
  await bitwardenApiRequest.call(this, 'DELETE', `/projects/${projectId}`);
  return toSingleExecutionData({ success: true, projectId });
}

/**
 * Get secrets in a project
 */
export async function getSecrets(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
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

/**
 * Get service accounts with access to a project
 */
export async function getServiceAccounts(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const projectId = this.getNodeParameter('projectId', i) as string;
  const returnAll = this.getNodeParameter('returnAll', i) as boolean;
  
  if (returnAll) {
    const serviceAccounts = await bitwardenApiRequestAllItems.call(
      this,
      'GET',
      `/projects/${projectId}/service-accounts`,
    );
    return toExecutionData(serviceAccounts);
  }
  
  const limit = this.getNodeParameter('limit', i) as number;
  const response = await bitwardenApiRequest.call(
    this,
    'GET',
    `/projects/${projectId}/service-accounts`,
  );
  const serviceAccounts = response.data || response;
  return toExecutionData(serviceAccounts.slice(0, limit));
}
