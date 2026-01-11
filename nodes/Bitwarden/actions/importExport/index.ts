/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { bitwardenApiRequest, bitwardenApiRequestAllItems } from '../../transport';
import { toSingleExecutionData } from '../../utils';

/**
 * Import organization vault data
 */
export async function importOrganization(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const format = this.getNodeParameter('format', i) as string;
  const data = this.getNodeParameter('data', i) as string;
  const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
  
  const body: IDataObject = {
    format,
    data,
  };
  
  if (additionalFields.collectionId) {
    body.collectionId = additionalFields.collectionId;
  }
  
  const result = await bitwardenApiRequest.call(this, 'POST', '/import', body);
  return toSingleExecutionData({
    success: true,
    message: 'Import completed successfully',
    ...result,
  });
}

/**
 * Export organization vault
 */
export async function exportOrganization(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const format = this.getNodeParameter('format', i) as string;
  const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
  
  const query: IDataObject = {
    format,
  };
  
  if (additionalFields.includeAttachments !== undefined) {
    query.includeAttachments = additionalFields.includeAttachments;
  }
  
  const result = await bitwardenApiRequest.call(this, 'GET', '/export', undefined, query);
  return toSingleExecutionData({
    success: true,
    format,
    data: result,
  });
}

/**
 * Import members from CSV
 */
export async function importMembers(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const csvData = this.getNodeParameter('csvData', i) as string;
  const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
  
  // Parse CSV data
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  
  const members: IDataObject[] = [];
  
  for (let j = 1; j < lines.length; j++) {
    const values = lines[j].split(',').map((v) => v.trim());
    const member: IDataObject = {};
    
    headers.forEach((header, index) => {
      if (values[index]) {
        member[header] = values[index];
      }
    });
    
    if (member.email) {
      members.push(member);
    }
  }
  
  // Process each member
  const results: IDataObject[] = [];
  
  for (const member of members) {
    try {
      const body: IDataObject = {
        email: member.email,
        type: member.type ? parseInt(member.type as string, 10) : 2, // Default to User
        accessAll: member.accessall === 'true',
      };
      
      if (member.externalid) {
        body.externalId = member.externalid;
      }
      
      if (additionalFields.defaultCollections) {
        body.collections = additionalFields.defaultCollections;
      }
      
      const result = await bitwardenApiRequest.call(this, 'POST', '/members', body);
      results.push({
        success: true,
        email: member.email,
        memberId: result.id,
      });
    } catch (error) {
      results.push({
        success: false,
        email: member.email,
        error: (error as Error).message,
      });
    }
  }
  
  return toSingleExecutionData({
    totalProcessed: members.length,
    successCount: results.filter((r) => r.success).length,
    failureCount: results.filter((r) => !r.success).length,
    results,
  });
}

/**
 * Export members to CSV
 */
export async function exportMembers(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
  
  // Get all members
  const members = await bitwardenApiRequestAllItems.call(this, 'GET', '/members');
  
  // Define CSV headers
  const headers = ['id', 'email', 'name', 'type', 'status', 'twoFactorEnabled', 'accessAll', 'externalId'];
  
  if (additionalFields.includeCollections) {
    headers.push('collections');
  }
  
  // Build CSV content
  const csvLines: string[] = [headers.join(',')];
  
  for (const member of members) {
    const values = [
      member.id || '',
      member.email || '',
      `"${(member.name || '').replace(/"/g, '""')}"`,
      member.type,
      member.status,
      member.twoFactorEnabled,
      member.accessAll,
      member.externalId || '',
    ];
    
    if (additionalFields.includeCollections) {
      const collections = (member.collections || [])
        .map((c: any) => c.id)
        .join(';');
      values.push(`"${collections}"`);
    }
    
    csvLines.push(values.join(','));
  }
  
  return toSingleExecutionData({
    success: true,
    totalMembers: members.length,
    csv: csvLines.join('\n'),
  });
}
