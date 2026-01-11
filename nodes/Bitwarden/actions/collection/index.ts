/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { bitwardenApiRequest, bitwardenApiRequestAllItems } from '../../transport';
import { toExecutionData, toSingleExecutionData, parseGroupAccess } from '../../utils';

/**
 * Get all collections in the organization
 */
export async function getAll(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const returnAll = this.getNodeParameter('returnAll', i) as boolean;
  
  if (returnAll) {
    const collections = await bitwardenApiRequestAllItems.call(this, 'GET', '/collections');
    return toExecutionData(collections);
  }
  
  const limit = this.getNodeParameter('limit', i) as number;
  const response = await bitwardenApiRequest.call(this, 'GET', '/collections');
  const collections = response.data || response;
  return toExecutionData(collections.slice(0, limit));
}

/**
 * Get a single collection by ID
 */
export async function get(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const collectionId = this.getNodeParameter('collectionId', i) as string;
  const collection = await bitwardenApiRequest.call(this, 'GET', `/collections/${collectionId}`);
  return toSingleExecutionData(collection);
}

/**
 * Create a new collection
 */
export async function create(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const name = this.getNodeParameter('name', i) as string;
  const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
  
  const body: IDataObject = {
    name,
    groups: [],
  };
  
  if (additionalFields.externalId) {
    body.externalId = additionalFields.externalId;
  }
  
  if (additionalFields.groups) {
    const groups = additionalFields.groups as Array<{
      groupId: string;
      readOnly?: boolean;
      hidePasswords?: boolean;
      manage?: boolean;
    }>;
    body.groups = parseGroupAccess(groups);
  }
  
  const collection = await bitwardenApiRequest.call(this, 'POST', '/collections', body);
  return toSingleExecutionData(collection);
}

/**
 * Update a collection
 */
export async function update(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const collectionId = this.getNodeParameter('collectionId', i) as string;
  const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
  
  // Get current collection first
  const currentCollection = await bitwardenApiRequest.call(this, 'GET', `/collections/${collectionId}`);
  
  const body: IDataObject = {
    name: updateFields.name ?? currentCollection.name,
    externalId: updateFields.externalId !== undefined ? (updateFields.externalId || null) : currentCollection.externalId,
    groups: currentCollection.groups || [],
  };
  
  if (updateFields.groups) {
    const groups = updateFields.groups as Array<{
      groupId: string;
      readOnly?: boolean;
      hidePasswords?: boolean;
      manage?: boolean;
    }>;
    body.groups = parseGroupAccess(groups);
  }
  
  const collection = await bitwardenApiRequest.call(this, 'PUT', `/collections/${collectionId}`, body);
  return toSingleExecutionData(collection);
}

/**
 * Delete a collection
 */
export async function deleteCollection(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const collectionId = this.getNodeParameter('collectionId', i) as string;
  await bitwardenApiRequest.call(this, 'DELETE', `/collections/${collectionId}`);
  return toSingleExecutionData({ success: true, collectionId });
}

/**
 * Get members with access to a collection
 */
export async function getMembers(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const collectionId = this.getNodeParameter('collectionId', i) as string;
  
  // Get all members and filter those with access to this collection
  const members = await bitwardenApiRequestAllItems.call(this, 'GET', '/members');
  
  const membersWithAccess = members.filter((member: any) => {
    if (member.accessAll) return true;
    if (member.collections && Array.isArray(member.collections)) {
      return member.collections.some((c: any) => c.id === collectionId);
    }
    return false;
  });
  
  return toExecutionData(membersWithAccess);
}

/**
 * Add a member to a collection
 */
export async function addMember(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const collectionId = this.getNodeParameter('collectionId', i) as string;
  const memberId = this.getNodeParameter('memberId', i) as string;
  const readOnly = this.getNodeParameter('readOnly', i, false) as boolean;
  const hidePasswords = this.getNodeParameter('hidePasswords', i, false) as boolean;
  const manage = this.getNodeParameter('manage', i, false) as boolean;
  
  // Get current member
  const member = await bitwardenApiRequest.call(this, 'GET', `/members/${memberId}`);
  
  // Add collection to member's collections
  const collections = member.collections || [];
  const existingIndex = collections.findIndex((c: any) => c.id === collectionId);
  
  if (existingIndex >= 0) {
    collections[existingIndex] = { id: collectionId, readOnly, hidePasswords, manage };
  } else {
    collections.push({ id: collectionId, readOnly, hidePasswords, manage });
  }
  
  const body: IDataObject = {
    type: member.type,
    accessAll: member.accessAll,
    externalId: member.externalId,
    collections,
  };
  
  const updatedMember = await bitwardenApiRequest.call(this, 'PUT', `/members/${memberId}`, body);
  return toSingleExecutionData(updatedMember);
}

/**
 * Remove a member from a collection
 */
export async function removeMember(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const collectionId = this.getNodeParameter('collectionId', i) as string;
  const memberId = this.getNodeParameter('memberId', i) as string;
  
  // Get current member
  const member = await bitwardenApiRequest.call(this, 'GET', `/members/${memberId}`);
  
  // Remove collection from member's collections
  const collections = (member.collections || []).filter((c: any) => c.id !== collectionId);
  
  const body: IDataObject = {
    type: member.type,
    accessAll: member.accessAll,
    externalId: member.externalId,
    collections,
  };
  
  const updatedMember = await bitwardenApiRequest.call(this, 'PUT', `/members/${memberId}`, body);
  return toSingleExecutionData(updatedMember);
}

/**
 * Get groups with access to a collection
 */
export async function getGroups(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const collectionId = this.getNodeParameter('collectionId', i) as string;
  const collection = await bitwardenApiRequest.call(this, 'GET', `/collections/${collectionId}`);
  return toExecutionData(collection.groups || []);
}

/**
 * Update group access to a collection
 */
export async function updateGroups(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const collectionId = this.getNodeParameter('collectionId', i) as string;
  const groups = this.getNodeParameter('groups', i) as Array<{
    groupId: string;
    readOnly?: boolean;
    hidePasswords?: boolean;
    manage?: boolean;
  }>;
  
  // Get current collection
  const currentCollection = await bitwardenApiRequest.call(this, 'GET', `/collections/${collectionId}`);
  
  const body: IDataObject = {
    name: currentCollection.name,
    externalId: currentCollection.externalId,
    groups: parseGroupAccess(groups),
  };
  
  const collection = await bitwardenApiRequest.call(this, 'PUT', `/collections/${collectionId}`, body);
  return toSingleExecutionData(collection);
}
