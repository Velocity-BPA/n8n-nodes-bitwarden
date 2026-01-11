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
 * Get SSO configuration
 */
export async function get(this: IExecuteFunctions, _i: number): Promise<INodeExecutionData[]> {
  const ssoConfig = await bitwardenApiRequest.call(this, 'GET', '/organizations/sso');
  return toSingleExecutionData(ssoConfig);
}

/**
 * Update SSO configuration
 */
export async function update(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const enabled = this.getNodeParameter('enabled', i) as boolean;
  const ssoType = this.getNodeParameter('ssoType', i) as number;
  const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
  
  const body: IDataObject = {
    enabled,
    type: ssoType,
    keyConnectorEnabled: updateFields.keyConnectorEnabled ?? false,
    data: null,
  };
  
  if (updateFields.identifier) {
    body.identifier = updateFields.identifier;
  }
  
  // Configure SSO provider-specific data
  if (enabled) {
    const ssoData: IDataObject = {};
    
    if (ssoType === 0) {
      // OpenID Connect
      if (updateFields.authority) ssoData.authority = updateFields.authority;
      if (updateFields.clientId) ssoData.clientId = updateFields.clientId;
      if (updateFields.clientSecret) ssoData.clientSecret = updateFields.clientSecret;
      if (updateFields.metadataAddress) ssoData.metadataAddress = updateFields.metadataAddress;
      if (updateFields.redirectBehavior !== undefined) ssoData.redirectBehavior = updateFields.redirectBehavior;
      if (updateFields.getClaimsFromUserInfoEndpoint !== undefined) {
        ssoData.getClaimsFromUserInfoEndpoint = updateFields.getClaimsFromUserInfoEndpoint;
      }
    } else if (ssoType === 1) {
      // SAML 2.0
      if (updateFields.spNameIdFormat) ssoData.spNameIdFormat = updateFields.spNameIdFormat;
      if (updateFields.spOutboundSigningAlgorithm) {
        ssoData.spOutboundSigningAlgorithm = updateFields.spOutboundSigningAlgorithm;
      }
      if (updateFields.spSigningBehavior) ssoData.spSigningBehavior = updateFields.spSigningBehavior;
      if (updateFields.spMinIncomingSigningAlgorithm) {
        ssoData.spMinIncomingSigningAlgorithm = updateFields.spMinIncomingSigningAlgorithm;
      }
      if (updateFields.spWantAssertionsSigned !== undefined) {
        ssoData.spWantAssertionsSigned = updateFields.spWantAssertionsSigned;
      }
      if (updateFields.spValidateCertificates !== undefined) {
        ssoData.spValidateCertificates = updateFields.spValidateCertificates;
      }
      if (updateFields.idpEntityId) ssoData.idpEntityId = updateFields.idpEntityId;
      if (updateFields.idpBindingType) ssoData.idpBindingType = updateFields.idpBindingType;
      if (updateFields.idpSingleSignOnServiceUrl) {
        ssoData.idpSingleSignOnServiceUrl = updateFields.idpSingleSignOnServiceUrl;
      }
      if (updateFields.idpSingleLogoutServiceUrl) {
        ssoData.idpSingleLogoutServiceUrl = updateFields.idpSingleLogoutServiceUrl;
      }
      if (updateFields.idpArtifactResolutionServiceUrl) {
        ssoData.idpArtifactResolutionServiceUrl = updateFields.idpArtifactResolutionServiceUrl;
      }
      if (updateFields.idpX509PublicCert) ssoData.idpX509PublicCert = updateFields.idpX509PublicCert;
      if (updateFields.idpOutboundSigningAlgorithm) {
        ssoData.idpOutboundSigningAlgorithm = updateFields.idpOutboundSigningAlgorithm;
      }
      if (updateFields.idpAllowUnsolicitedAuthnResponse !== undefined) {
        ssoData.idpAllowUnsolicitedAuthnResponse = updateFields.idpAllowUnsolicitedAuthnResponse;
      }
      if (updateFields.idpDisableOutboundLogoutRequests !== undefined) {
        ssoData.idpDisableOutboundLogoutRequests = updateFields.idpDisableOutboundLogoutRequests;
      }
      if (updateFields.idpWantAuthnRequestsSigned !== undefined) {
        ssoData.idpWantAuthnRequestsSigned = updateFields.idpWantAuthnRequestsSigned;
      }
    }
    
    if (Object.keys(ssoData).length > 0) {
      body.data = ssoData;
    }
  }
  
  const ssoConfig = await bitwardenApiRequest.call(this, 'PUT', '/organizations/sso', body);
  return toSingleExecutionData(ssoConfig);
}

/**
 * Get SSO metadata
 */
export async function getMetadata(this: IExecuteFunctions, _i: number): Promise<INodeExecutionData[]> {
  const metadata = await bitwardenApiRequest.call(this, 'GET', '/organizations/sso/metadata');
  return toSingleExecutionData(metadata);
}

/**
 * Test SSO connection
 */
export async function testConnection(this: IExecuteFunctions, _i: number): Promise<INodeExecutionData[]> {
  try {
    // Get current SSO config to verify it's properly configured
    const ssoConfig = await bitwardenApiRequest.call(this, 'GET', '/organizations/sso');
    
    if (!ssoConfig.enabled) {
      return toSingleExecutionData({
        success: false,
        message: 'SSO is not enabled for this organization',
      });
    }
    
    // Attempt to get metadata which validates the configuration
    const metadata = await bitwardenApiRequest.call(this, 'GET', '/organizations/sso/metadata');
    
    return toSingleExecutionData({
      success: true,
      message: 'SSO configuration is valid',
      ssoType: ssoConfig.type === 0 ? 'OpenID Connect' : 'SAML 2.0',
      identifier: ssoConfig.identifier,
      metadata,
    });
  } catch (error) {
    return toSingleExecutionData({
      success: false,
      message: 'SSO connection test failed',
      error: (error as Error).message,
    });
  }
}
