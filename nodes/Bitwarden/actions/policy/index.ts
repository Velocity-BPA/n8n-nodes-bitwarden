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
 * Get all policies in the organization
 */
export async function getAll(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const returnAll = this.getNodeParameter('returnAll', i) as boolean;
  
  if (returnAll) {
    const policies = await bitwardenApiRequestAllItems.call(this, 'GET', '/policies');
    return toExecutionData(policies);
  }
  
  const limit = this.getNodeParameter('limit', i) as number;
  const response = await bitwardenApiRequest.call(this, 'GET', '/policies');
  const policies = response.data || response;
  return toExecutionData(policies.slice(0, limit));
}

/**
 * Get a policy by type
 */
export async function get(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const policyType = this.getNodeParameter('policyType', i) as number;
  const policy = await bitwardenApiRequest.call(this, 'GET', `/policies/${policyType}`);
  return toSingleExecutionData(policy);
}

/**
 * Update a policy
 */
export async function update(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const policyType = this.getNodeParameter('policyType', i) as number;
  const enabled = this.getNodeParameter('enabled', i) as boolean;
  const policyData = this.getNodeParameter('policyData', i, {}) as IDataObject;
  
  const body: IDataObject = {
    type: policyType,
    enabled,
    data: null,
  };
  
  // Set policy-specific data based on policy type
  if (enabled && Object.keys(policyData).length > 0) {
    body.data = policyData;
  }
  
  // Use specific data structures for different policy types
  switch (policyType) {
    case 1: // Master Password
      if (policyData.minComplexity !== undefined || 
          policyData.minLength !== undefined ||
          policyData.requireUpper !== undefined ||
          policyData.requireLower !== undefined ||
          policyData.requireNumbers !== undefined ||
          policyData.requireSpecial !== undefined) {
        body.data = {
          minComplexity: policyData.minComplexity,
          minLength: policyData.minLength,
          requireUpper: policyData.requireUpper,
          requireLower: policyData.requireLower,
          requireNumbers: policyData.requireNumbers,
          requireSpecial: policyData.requireSpecial,
        };
      }
      break;
    case 2: // Password Generator
      if (policyData.defaultType !== undefined ||
          policyData.minLength !== undefined ||
          policyData.minNumbers !== undefined ||
          policyData.minSpecial !== undefined) {
        body.data = {
          defaultType: policyData.defaultType,
          minLength: policyData.minLength,
          minNumbers: policyData.minNumbers,
          minSpecial: policyData.minSpecial,
          useUpper: policyData.useUpper,
          useLower: policyData.useLower,
          useNumbers: policyData.useNumbers,
          useSpecial: policyData.useSpecial,
        };
      }
      break;
    case 9: // Maximum Vault Timeout
      if (policyData.minutes !== undefined) {
        body.data = {
          minutes: policyData.minutes,
        };
      }
      break;
    case 7: // Send Options
      if (policyData.disableHideEmail !== undefined) {
        body.data = {
          disableHideEmail: policyData.disableHideEmail,
        };
      }
      break;
    default:
      // For other policies that don't require specific data structure
      if (Object.keys(policyData).length > 0) {
        body.data = policyData;
      }
      break;
  }
  
  const policy = await bitwardenApiRequest.call(this, 'PUT', `/policies/${policyType}`, body);
  return toSingleExecutionData(policy);
}
