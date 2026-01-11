/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, INodeExecutionData } from 'n8n-workflow';

/**
 * Convert an array of items to n8n execution data format
 */
export function toExecutionData(items: IDataObject[]): INodeExecutionData[] {
  return items.map((item) => ({
    json: item,
  }));
}

/**
 * Convert a single item to n8n execution data format
 */
export function toSingleExecutionData(item: IDataObject): INodeExecutionData[] {
  return [{ json: item }];
}

/**
 * Parse a collection access array from node parameters
 */
export function parseCollectionAccess(
  collections: Array<{
    collectionId: string;
    readOnly?: boolean;
    hidePasswords?: boolean;
    manage?: boolean;
  }>,
): Array<{ id: string; readOnly: boolean; hidePasswords: boolean; manage: boolean }> {
  return collections.map((c) => ({
    id: c.collectionId,
    readOnly: c.readOnly ?? false,
    hidePasswords: c.hidePasswords ?? false,
    manage: c.manage ?? false,
  }));
}

/**
 * Parse a group access array from node parameters
 */
export function parseGroupAccess(
  groups: Array<{
    groupId: string;
    readOnly?: boolean;
    hidePasswords?: boolean;
    manage?: boolean;
  }>,
): Array<{ id: string; readOnly: boolean; hidePasswords: boolean; manage: boolean }> {
  return groups.map((g) => ({
    id: g.groupId,
    readOnly: g.readOnly ?? false,
    hidePasswords: g.hidePasswords ?? false,
    manage: g.manage ?? false,
  }));
}

/**
 * Validate a GUID format
 */
export function isValidGuid(value: string): boolean {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(value);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format a date string to ISO format
 */
export function toIsoDateString(date: string | Date): string {
  if (date instanceof Date) {
    return date.toISOString();
  }
  return new Date(date).toISOString();
}

/**
 * Get member type name from type number
 */
export function getMemberTypeName(type: number): string {
  const types: Record<number, string> = {
    0: 'Owner',
    1: 'Admin',
    2: 'User',
    3: 'Manager',
    4: 'Custom',
  };
  return types[type] || 'Unknown';
}

/**
 * Get member status name from status number
 */
export function getMemberStatusName(status: number): string {
  const statuses: Record<number, string> = {
    '-1': 'Revoked',
    0: 'Invited',
    1: 'Accepted',
    2: 'Confirmed',
  };
  return statuses[status] || 'Unknown';
}

/**
 * Get policy type name from type number
 */
export function getPolicyTypeName(type: number): string {
  const types: Record<number, string> = {
    0: 'Two-Factor Authentication',
    1: 'Master Password',
    2: 'Password Generator',
    3: 'Single Organization',
    4: 'Require SSO',
    5: 'Personal Ownership',
    6: 'Disable Send',
    7: 'Send Options',
    8: 'Reset Password',
    9: 'Maximum Vault Timeout',
    10: 'Disable Personal Vault Export',
    11: 'Activate Autofill',
  };
  return types[type] || 'Unknown';
}

/**
 * Get event type category
 */
export function getEventTypeCategory(type: number): string {
  if (type >= 1000 && type < 1100) return 'User';
  if (type >= 1100 && type < 1200) return 'Cipher';
  if (type >= 1300 && type < 1400) return 'Collection';
  if (type >= 1400 && type < 1500) return 'Group';
  if (type >= 1500 && type < 1600) return 'Organization';
  if (type >= 1600 && type < 1700) return 'Policy';
  return 'Other';
}

/**
 * Get event type name from type number
 */
export function getEventTypeName(type: number): string {
  const eventTypes: Record<number, string> = {
    // User events
    1000: 'User Logged In',
    1001: 'User Changed Password',
    1002: 'User Updated 2FA',
    1003: 'User Disabled 2FA',
    1004: 'User Recovered 2FA',
    1005: 'User Failed Login',
    1006: 'User Failed 2FA',
    1007: 'User Client Export Vault',
    1008: 'User Updated Temp Password',

    // Cipher events
    1100: 'Cipher Created',
    1101: 'Cipher Updated',
    1102: 'Cipher Deleted',
    1103: 'Cipher Attachment Created',
    1104: 'Cipher Attachment Deleted',
    1105: 'Cipher Shared',
    1106: 'Cipher Updated Collections',
    1107: 'Cipher Client Viewed',
    1108: 'Cipher Client Toggled Password Visible',
    1109: 'Cipher Client Toggled Hidden Field Visible',
    1110: 'Cipher Client Toggled Card Code Visible',
    1111: 'Cipher Client Copied Password',
    1112: 'Cipher Client Copied Hidden Field',
    1113: 'Cipher Client Copied Card Code',
    1114: 'Cipher Client Autofilled',
    1115: 'Cipher Soft Deleted',
    1116: 'Cipher Restored',

    // Collection events
    1300: 'Collection Created',
    1301: 'Collection Updated',
    1302: 'Collection Deleted',

    // Group events
    1400: 'Group Created',
    1401: 'Group Updated',
    1402: 'Group Deleted',

    // Organization user events
    1500: 'Organization User Invited',
    1501: 'Organization User Confirmed',
    1502: 'Organization User Updated',
    1503: 'Organization User Removed',
    1504: 'Organization User Updated Groups',
    1505: 'Organization Updated',
    1506: 'Organization Purged Vault',
    1507: 'Organization Client Exported Vault',
    1508: 'Organization Vault Accessed',
    1509: 'Organization Enabled SSO',
    1510: 'Organization Disabled SSO',
    1511: 'Organization Enabled Key Connector',
    1512: 'Organization Disabled Key Connector',

    // Policy events
    1600: 'Policy Updated',
    1601: 'Policy Enabled',
  };
  return eventTypes[type] || 'Unknown';
}

/**
 * Format execution data - wrap item(s) for n8n output
 */
export function formatExecutionData(data: IDataObject | IDataObject[]): INodeExecutionData[] {
  if (Array.isArray(data)) {
    return data.map((item) => ({ json: item }));
  }
  return [{ json: data }];
}

/**
 * Format date to ISO string
 */
export function formatDate(date: string | Date): string {
  if (date instanceof Date) {
    return date.toISOString();
  }
  return new Date(date).toISOString();
}

/**
 * Clean empty values from an object
 */
export function cleanEmptyValues(obj: IDataObject): IDataObject {
  const cleaned: IDataObject = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        const cleanedNested = cleanEmptyValues(value as IDataObject);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = value;
      }
    }
  }
  
  return cleaned;
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Extract error message from Bitwarden API error response
 */
export function extractErrorMessage(error: any): string {
  if (error.response?.body) {
    const body = error.response.body;
    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        return parsed.message || parsed.error || body;
      } catch {
        return body;
      }
    }
    if (body.message) {
      return body.message;
    }
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unknown error occurred';
}
