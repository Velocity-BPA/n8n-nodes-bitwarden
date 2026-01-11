/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { bitwardenApiRequest, bitwardenApiRequestAllItems } from '../../transport';
import { toExecutionData } from '../../utils';

/**
 * Get all events (with optional pagination)
 */
export async function getAll(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const returnAll = this.getNodeParameter('returnAll', i) as boolean;
  const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
  
  const query: IDataObject = {};
  
  if (filters.start) {
    query.start = filters.start;
  }
  if (filters.end) {
    query.end = filters.end;
  }
  if (filters.actingUserId) {
    query.actingUserId = filters.actingUserId;
  }
  if (filters.itemId) {
    query.itemId = filters.itemId;
  }
  
  if (returnAll) {
    const events = await bitwardenApiRequestAllItems.call(this, 'GET', '/events', undefined, query);
    return toExecutionData(events);
  }
  
  const limit = this.getNodeParameter('limit', i) as number;
  const response = await bitwardenApiRequest.call(this, 'GET', '/events', undefined, query);
  const events = response.data || response;
  return toExecutionData(events.slice(0, limit));
}

/**
 * Get events by date range
 */
export async function getByDateRange(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const start = this.getNodeParameter('start', i) as string;
  const end = this.getNodeParameter('end', i) as string;
  const returnAll = this.getNodeParameter('returnAll', i) as boolean;
  
  const query: IDataObject = {
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
  };
  
  if (returnAll) {
    const events = await bitwardenApiRequestAllItems.call(this, 'GET', '/events', undefined, query);
    return toExecutionData(events);
  }
  
  const limit = this.getNodeParameter('limit', i) as number;
  const response = await bitwardenApiRequest.call(this, 'GET', '/events', undefined, query);
  const events = response.data || response;
  return toExecutionData(events.slice(0, limit));
}

/**
 * Get events by member
 */
export async function getByMember(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const actingUserId = this.getNodeParameter('actingUserId', i) as string;
  const returnAll = this.getNodeParameter('returnAll', i) as boolean;
  const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
  
  const query: IDataObject = {
    actingUserId,
  };
  
  if (filters.start) {
    query.start = filters.start;
  }
  if (filters.end) {
    query.end = filters.end;
  }
  
  if (returnAll) {
    const events = await bitwardenApiRequestAllItems.call(this, 'GET', '/events', undefined, query);
    return toExecutionData(events);
  }
  
  const limit = this.getNodeParameter('limit', i) as number;
  const response = await bitwardenApiRequest.call(this, 'GET', '/events', undefined, query);
  const events = response.data || response;
  return toExecutionData(events.slice(0, limit));
}

/**
 * Get events by type
 */
export async function getByType(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const eventType = this.getNodeParameter('eventType', i) as number;
  const returnAll = this.getNodeParameter('returnAll', i) as boolean;
  const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
  
  // Note: Bitwarden API doesn't have a direct type filter, so we filter client-side
  const query: IDataObject = {};
  
  if (filters.start) {
    query.start = filters.start;
  }
  if (filters.end) {
    query.end = filters.end;
  }
  
  if (returnAll) {
    const allEvents = await bitwardenApiRequestAllItems.call(this, 'GET', '/events', undefined, query);
    const filteredEvents = allEvents.filter((event: any) => event.type === eventType);
    return toExecutionData(filteredEvents);
  }
  
  const limit = this.getNodeParameter('limit', i) as number;
  const allEvents = await bitwardenApiRequestAllItems.call(this, 'GET', '/events', undefined, query);
  const filteredEvents = allEvents.filter((event: any) => event.type === eventType);
  return toExecutionData(filteredEvents.slice(0, limit));
}
