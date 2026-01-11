/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestMethods,
  ILoadOptionsFunctions,
  IPollFunctions,
  IRequestOptions,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import type { BitwardenEnvironment, ITokenCache, IBitwardenTokenResponse } from '../types/BitwardenTypes';

// Token cache for OAuth2 client credentials
let tokenCache: ITokenCache | null = null;

/**
 * Get the identity URL based on environment
 */
export function getIdentityUrl(
  environment: BitwardenEnvironment,
  selfHostedUrl?: string,
): string {
  switch (environment) {
    case 'cloudEU':
      return 'https://identity.bitwarden.eu';
    case 'selfHosted':
      if (!selfHostedUrl) {
        throw new Error('Self-hosted URL is required for self-hosted environment');
      }
      return `${selfHostedUrl.replace(/\/$/, '')}/identity`;
    default:
      return 'https://identity.bitwarden.com';
  }
}

/**
 * Get the API URL based on environment
 */
export function getApiUrl(
  environment: BitwardenEnvironment,
  selfHostedUrl?: string,
): string {
  switch (environment) {
    case 'cloudEU':
      return 'https://api.bitwarden.eu';
    case 'selfHosted':
      if (!selfHostedUrl) {
        throw new Error('Self-hosted URL is required for self-hosted environment');
      }
      return `${selfHostedUrl.replace(/\/$/, '')}/api`;
    default:
      return 'https://api.bitwarden.com';
  }
}

/**
 * Get OAuth2 access token using client credentials flow
 */
export async function getAccessToken(
  this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions,
): Promise<string> {
  const credentials = await this.getCredentials('bitwardenApi');

  // Check cache - return cached token if still valid
  if (tokenCache && tokenCache.expires > Date.now()) {
    return tokenCache.token;
  }

  const environment = credentials.environment as BitwardenEnvironment;
  const selfHostedUrl = credentials.selfHostedUrl as string | undefined;
  const identityUrl = getIdentityUrl(environment, selfHostedUrl);

  const options: IRequestOptions = {
    method: 'POST',
    uri: `${identityUrl}/connect/token`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    form: {
      grant_type: 'client_credentials',
      scope: 'api.organization',
      client_id: credentials.clientId as string,
      client_secret: credentials.clientSecret as string,
    },
    json: true,
  };

  try {
    const response = (await this.helpers.request(options)) as IBitwardenTokenResponse;

    // Cache the token with 60 second buffer before expiration
    tokenCache = {
      token: response.access_token,
      expires: Date.now() + (response.expires_in - 60) * 1000,
    };

    return response.access_token;
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject, {
      message: 'Failed to obtain access token',
    });
  }
}

/**
 * Clear the token cache (useful for testing or token refresh)
 */
export function clearTokenCache(): void {
  tokenCache = null;
}

/**
 * Make an authenticated request to the Bitwarden API
 */
export async function bitwardenApiRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body?: IDataObject,
  query?: IDataObject,
): Promise<any> {
  const credentials = await this.getCredentials('bitwardenApi');
  const accessToken = await getAccessToken.call(this);

  const environment = credentials.environment as BitwardenEnvironment;
  const selfHostedUrl = credentials.selfHostedUrl as string | undefined;
  const apiUrl = getApiUrl(environment, selfHostedUrl);

  const options: IRequestOptions = {
    method,
    uri: `${apiUrl}/public${endpoint}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    json: true,
  };

  if (body && Object.keys(body).length > 0) {
    options.body = body;
  }

  if (query && Object.keys(query).length > 0) {
    options.qs = query;
  }

  try {
    return await this.helpers.request(options);
  } catch (error) {
    const err = error as JsonObject;
    
    // Handle rate limiting
    if (err.statusCode === 429) {
      throw new NodeApiError(this.getNode(), err, {
        message: 'Rate limit exceeded. Please wait before making more requests.',
      });
    }

    // Handle unauthorized - clear cache and retry once
    if (err.statusCode === 401 && tokenCache) {
      clearTokenCache();
      const newAccessToken = await getAccessToken.call(this);
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${newAccessToken}`,
      };
      try {
        return await this.helpers.request(options);
      } catch (retryError) {
        throw new NodeApiError(this.getNode(), retryError as JsonObject);
      }
    }

    throw new NodeApiError(this.getNode(), err);
  }
}

/**
 * Make a paginated request to the Bitwarden API using continuation tokens
 */
export async function bitwardenApiRequestAllItems(
  this: IExecuteFunctions | IPollFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body?: IDataObject,
  query?: IDataObject,
): Promise<any[]> {
  const returnData: any[] = [];
  let continuationToken: string | undefined;

  do {
    const qs: IDataObject = { ...query };
    if (continuationToken) {
      qs.continuationToken = continuationToken;
    }

    const response = await bitwardenApiRequest.call(this, method, endpoint, body, qs);

    if (response.data && Array.isArray(response.data)) {
      returnData.push(...response.data);
      continuationToken = response.continuationToken;
    } else if (Array.isArray(response)) {
      returnData.push(...response);
      break;
    } else {
      break;
    }
  } while (continuationToken);

  return returnData;
}

/**
 * Handle Bitwarden API errors with specific messages
 */
export function handleBitwardenError(error: any): string {
  if (error.message) {
    let message = error.message;
    
    if (error.validationErrors) {
      const validationMessages = Object.entries(error.validationErrors)
        .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
        .join('; ');
      message += ` - ${validationMessages}`;
    }
    
    return message;
  }
  
  return 'Unknown error occurred';
}

/**
 * Retry helper with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      const statusCode = (error as any).statusCode;
      if (statusCode && [400, 401, 403, 404].includes(statusCode)) {
        throw error;
      }
      
      // Wait with exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
