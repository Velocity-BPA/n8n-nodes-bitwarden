/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { bitwardenApiRequest } from '../../transport';
import { toSingleExecutionData } from '../../utils';

/**
 * Get organization details
 */
export async function get(this: IExecuteFunctions, _i: number): Promise<INodeExecutionData[]> {
  const organization = await bitwardenApiRequest.call(this, 'GET', '/organizations/self');
  return toSingleExecutionData(organization);
}

/**
 * Update organization settings
 */
export async function update(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
  
  // Get current organization first
  const currentOrg = await bitwardenApiRequest.call(this, 'GET', '/organizations/self');
  
  const body: IDataObject = {
    name: updateFields.name ?? currentOrg.name,
    businessName: updateFields.businessName ?? currentOrg.businessName,
    billingEmail: updateFields.billingEmail ?? currentOrg.billingEmail,
    identifier: updateFields.identifier ?? currentOrg.identifier,
  };
  
  // Add optional fields if provided
  if (updateFields.businessAddress1 !== undefined) {
    body.businessAddress1 = updateFields.businessAddress1;
  }
  if (updateFields.businessAddress2 !== undefined) {
    body.businessAddress2 = updateFields.businessAddress2;
  }
  if (updateFields.businessAddress3 !== undefined) {
    body.businessAddress3 = updateFields.businessAddress3;
  }
  if (updateFields.businessCountry !== undefined) {
    body.businessCountry = updateFields.businessCountry;
  }
  if (updateFields.businessTaxNumber !== undefined) {
    body.businessTaxNumber = updateFields.businessTaxNumber;
  }
  
  const organization = await bitwardenApiRequest.call(this, 'PUT', '/organizations/self', body);
  return toSingleExecutionData(organization);
}

/**
 * Get billing information
 */
export async function getBilling(this: IExecuteFunctions, _i: number): Promise<INodeExecutionData[]> {
  const billing = await bitwardenApiRequest.call(this, 'GET', '/organizations/self/billing');
  return toSingleExecutionData(billing);
}

/**
 * Get subscription details
 */
export async function getSubscription(this: IExecuteFunctions, _i: number): Promise<INodeExecutionData[]> {
  const subscription = await bitwardenApiRequest.call(this, 'GET', '/organizations/self/subscription');
  return toSingleExecutionData(subscription);
}

/**
 * Get organization license
 */
export async function getLicense(this: IExecuteFunctions, _i: number): Promise<INodeExecutionData[]> {
  const license = await bitwardenApiRequest.call(this, 'GET', '/organizations/self/license');
  return toSingleExecutionData(license);
}

/**
 * Rotate API key
 */
export async function rotateApiKey(this: IExecuteFunctions, _i: number): Promise<INodeExecutionData[]> {
  const result = await bitwardenApiRequest.call(this, 'POST', '/organizations/self/api-key');
  return toSingleExecutionData({
    success: true,
    message: 'API key rotated successfully. Please update your credentials.',
    ...result,
  });
}
