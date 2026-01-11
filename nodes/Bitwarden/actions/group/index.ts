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
 * Get all groups in the organization
 */
export async function getAll(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const returnAll = this.getNodeParameter('returnAll', i) as boolean;
  
  if (returnAll) {
    const groups = await bitwardenApiRequestAllItems.call(this, 'GET', '/groups');
    return toExecutionData(groups);
  }
  
  const limit = this.getNodeParameter('limit', i) as number;
  const response = await bitwardenApiRequest.call(this, 'GET', '/groups');
  const groups = response.data || response;
  return toExecutionData(groups.slice(0, limit));
}

/**
 * Get a single group by ID
 */
export async function get(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const groupId = this.getNodeParameter('groupId', i) as string;
  const group = await bitwardenApiRequest.call(this, 'GET', `/groups/${groupId}`);
  return toSingleExecutionData(group);
}

/**
 * Create a new group
 */
export async function create(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const name = this.getNodeParameter('name', i) as string;
  const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
  
  const body: IDataObject = {
    name,
    accessAll: additionalFields.accessAll ?? false,
    collections: [],
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
  
  const group = await bitwardenApiRequest.call(this, 'POST', '/groups', body);
  return toSingleExecutionData(group);
}

/**
 * Update a group
 */
export async function update(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const groupId = this.getNodeParameter('groupId', i) as string;
  const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
  
  // Get current group first
  const currentGroup = await bitwardenApiRequest.call(this, 'GET', `/groups/${groupId}`);
  
  const body: IDataObject = {
    name: updateFields.name ?? currentGroup.name,
    accessAll: updateFields.accessAll ?? currentGroup.accessAll,
    externalId: updateFields.externalId !== undefined ? (updateFields.externalId || null) : currentGroup.externalId,
    collections: currentGroup.collections || [],
  };
  
  if (updateFields.collections) {
    const collections = updateFields.collections as Array<{
      collectionId: string;
      readOnly?: boolean;
      hidePasswords?: boolean;
      manage?: boolean;
    }>;
    body.collections = parseCollectionAccess(collections);
  }
  
  const group = await bitwardenApiRequest.call(this, 'PUT', `/groups/${groupId}`, body);
  return toSingleExecutionData(group);
}

/**
 * Delete a group
 */
export async function deleteGroup(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const groupId = this.getNodeParameter('groupId', i) as string;
  await bitwardenApiRequest.call(this, 'DELETE', `/groups/${groupId}`);
  return toSingleExecutionData({ success: true, groupId });
}

/**
 * Get members in a group
 */
export async function getMembers(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const groupId = this.getNodeParameter('groupId', i) as string;
  const response = await bitwardenApiRequest.call(this, 'GET', `/groups/${groupId}/member-ids`);
  
  // Response is an array of member IDs, fetch each member's details
  const memberIds = response || [];
  const members: IDataObject[] = [];
  
  for (const memberId of memberIds) {
    try {
      const member = await bitwardenApiRequest.call(this, 'GET', `/members/${memberId}`);
      members.push(member);
    } catch {
      // Skip if member not found
      members.push({ id: memberId, error: 'Member not found' });
    }
  }
  
  return toExecutionData(members);
}

/**
 * Add members to a group
 */
export async function addMembers(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const groupId = this.getNodeParameter('groupId', i) as string;
  const memberIds = this.getNodeParameter('memberIds', i) as string[];
  
  // Get current member IDs in the group
  const currentMemberIds = await bitwardenApiRequest.call(this, 'GET', `/groups/${groupId}/member-ids`) || [];
  
  // Merge with new member IDs (avoiding duplicates)
  const allMemberIds = [...new Set([...currentMemberIds, ...memberIds])];
  
  const body: IDataObject = {
    memberIds: allMemberIds,
  };
  
  await bitwardenApiRequest.call(this, 'PUT', `/groups/${groupId}/member-ids`, body);
  return toSingleExecutionData({ success: true, groupId, memberIds: allMemberIds });
}

/**
 * Remove members from a group
 */
export async function removeMembers(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const groupId = this.getNodeParameter('groupId', i) as string;
  const memberIdsToRemove = this.getNodeParameter('memberIds', i) as string[];
  
  // Get current member IDs in the group
  const currentMemberIds = await bitwardenApiRequest.call(this, 'GET', `/groups/${groupId}/member-ids`) || [];
  
  // Remove specified member IDs
  const remainingMemberIds = currentMemberIds.filter((id: string) => !memberIdsToRemove.includes(id));
  
  const body: IDataObject = {
    memberIds: remainingMemberIds,
  };
  
  await bitwardenApiRequest.call(this, 'PUT', `/groups/${groupId}/member-ids`, body);
  return toSingleExecutionData({ success: true, groupId, memberIds: remainingMemberIds });
}

/**
 * Get collections the group has access to
 */
export async function getCollections(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const groupId = this.getNodeParameter('groupId', i) as string;
  const group = await bitwardenApiRequest.call(this, 'GET', `/groups/${groupId}`);
  return toExecutionData(group.collections || []);
}

/**
 * Update collection access for a group
 */
export async function updateCollections(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const groupId = this.getNodeParameter('groupId', i) as string;
  const collections = this.getNodeParameter('collections', i) as Array<{
    collectionId: string;
    readOnly?: boolean;
    hidePasswords?: boolean;
    manage?: boolean;
  }>;
  
  // Get current group
  const currentGroup = await bitwardenApiRequest.call(this, 'GET', `/groups/${groupId}`);
  
  const body: IDataObject = {
    name: currentGroup.name,
    accessAll: currentGroup.accessAll,
    externalId: currentGroup.externalId,
    collections: parseCollectionAccess(collections),
  };
  
  const group = await bitwardenApiRequest.call(this, 'PUT', `/groups/${groupId}`, body);
  return toSingleExecutionData(group);
}
