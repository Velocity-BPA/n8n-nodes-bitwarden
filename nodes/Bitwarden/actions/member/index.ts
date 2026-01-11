/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { bitwardenApiRequest, bitwardenApiRequestAllItems } from '../../transport';
import { toExecutionData, toSingleExecutionData, parseCollectionAccess } from '../../utils';

/**
 * Get all members in the organization
 */
export async function getAll(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const returnAll = this.getNodeParameter('returnAll', i) as boolean;
  
  if (returnAll) {
    const members = await bitwardenApiRequestAllItems.call(this, 'GET', '/members');
    return toExecutionData(members);
  }
  
  const limit = this.getNodeParameter('limit', i) as number;
  const response = await bitwardenApiRequest.call(this, 'GET', '/members');
  const members = response.data || response;
  return toExecutionData(members.slice(0, limit));
}

/**
 * Get a single member by ID
 */
export async function get(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const memberId = this.getNodeParameter('memberId', i) as string;
  const member = await bitwardenApiRequest.call(this, 'GET', `/members/${memberId}`);
  return toSingleExecutionData(member);
}

/**
 * Create (invite) a new member
 */
export async function create(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const email = this.getNodeParameter('email', i) as string;
  const type = this.getNodeParameter('type', i) as number;
  const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
  
  const body: IDataObject = {
    email,
    type,
    accessAll: additionalFields.accessAll ?? false,
  };
  
  if (additionalFields.externalId) {
    body.externalId = additionalFields.externalId;
  }
  
  if (additionalFields.collections) {
    const collections = additionalFields.collections as Array<{
      collectionId: string;
      readOnly?: boolean;
      hidePasswords?: boolean;
      manage?: boolean;
    }>;
    body.collections = parseCollectionAccess(collections);
  }
  
  const member = await bitwardenApiRequest.call(this, 'POST', '/members', body);
  return toSingleExecutionData(member);
}

/**
 * Update a member
 */
export async function update(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const memberId = this.getNodeParameter('memberId', i) as string;
  const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
  
  // First get the current member to preserve existing values
  const currentMember = await bitwardenApiRequest.call(this, 'GET', `/members/${memberId}`);
  
  const body: IDataObject = {
    type: updateFields.type ?? currentMember.type,
    accessAll: updateFields.accessAll ?? currentMember.accessAll,
  };
  
  if (updateFields.externalId !== undefined) {
    body.externalId = updateFields.externalId || null;
  } else {
    body.externalId = currentMember.externalId;
  }
  
  if (updateFields.collections) {
    const collections = updateFields.collections as Array<{
      collectionId: string;
      readOnly?: boolean;
      hidePasswords?: boolean;
      manage?: boolean;
    }>;
    body.collections = parseCollectionAccess(collections);
  } else {
    body.collections = currentMember.collections;
  }
  
  const member = await bitwardenApiRequest.call(this, 'PUT', `/members/${memberId}`, body);
  return toSingleExecutionData(member);
}

/**
 * Delete a member
 */
export async function deleteMember(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const memberId = this.getNodeParameter('memberId', i) as string;
  await bitwardenApiRequest.call(this, 'DELETE', `/members/${memberId}`);
  return toSingleExecutionData({ success: true, memberId });
}

/**
 * Reinvite a pending member
 */
export async function reinvite(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const memberId = this.getNodeParameter('memberId', i) as string;
  await bitwardenApiRequest.call(this, 'POST', `/members/${memberId}/reinvite`);
  return toSingleExecutionData({ success: true, memberId, action: 'reinvited' });
}

/**
 * Confirm an accepted member
 */
export async function confirm(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const memberId = this.getNodeParameter('memberId', i) as string;
  await bitwardenApiRequest.call(this, 'POST', `/members/${memberId}/confirm`);
  return toSingleExecutionData({ success: true, memberId, action: 'confirmed' });
}

/**
 * Update member's group assignments
 */
export async function updateGroups(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const memberId = this.getNodeParameter('memberId', i) as string;
  const groupIds = this.getNodeParameter('groupIds', i) as string[];
  
  const body: IDataObject = {
    groupIds,
  };
  
  await bitwardenApiRequest.call(this, 'PUT', `/members/${memberId}/group-ids`, body);
  return toSingleExecutionData({ success: true, memberId, groupIds });
}

/**
 * Update member's collection access
 */
export async function updateCollections(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const memberId = this.getNodeParameter('memberId', i) as string;
  const collections = this.getNodeParameter('collections', i) as Array<{
    collectionId: string;
    readOnly?: boolean;
    hidePasswords?: boolean;
    manage?: boolean;
  }>;
  
  // Get current member first
  const currentMember = await bitwardenApiRequest.call(this, 'GET', `/members/${memberId}`);
  
  const body: IDataObject = {
    type: currentMember.type,
    accessAll: currentMember.accessAll,
    externalId: currentMember.externalId,
    collections: parseCollectionAccess(collections),
  };
  
  const member = await bitwardenApiRequest.call(this, 'PUT', `/members/${memberId}`, body);
  return toSingleExecutionData(member);
}

/**
 * Revoke member access
 */
export async function revoke(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const memberId = this.getNodeParameter('memberId', i) as string;
  await bitwardenApiRequest.call(this, 'PUT', `/members/${memberId}/revoke`);
  return toSingleExecutionData({ success: true, memberId, action: 'revoked' });
}

/**
 * Restore a revoked member
 */
export async function restore(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const memberId = this.getNodeParameter('memberId', i) as string;
  await bitwardenApiRequest.call(this, 'PUT', `/members/${memberId}/restore`);
  return toSingleExecutionData({ success: true, memberId, action: 'restored' });
}
