/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class BitwardenApi implements ICredentialType {
  name = 'bitwardenApi';
  displayName = 'Bitwarden API';
  documentationUrl = 'https://bitwarden.com/help/public-api/';

  properties: INodeProperties[] = [
    {
      displayName: 'Client ID',
      name: 'clientId',
      type: 'string',
      default: '',
      required: true,
      description:
        'Organization API Client ID from Admin Console > Settings > Organization info > API Key',
      placeholder: 'organization.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    },
    {
      displayName: 'Client Secret',
      name: 'clientSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'Organization API Client Secret from Admin Console',
    },
    {
      displayName: 'Environment',
      name: 'environment',
      type: 'options',
      default: 'cloudUS',
      options: [
        {
          name: 'Cloud US',
          value: 'cloudUS',
        },
        {
          name: 'Cloud EU',
          value: 'cloudEU',
        },
        {
          name: 'Self-Hosted',
          value: 'selfHosted',
        },
      ],
      description: 'The Bitwarden environment to connect to',
    },
    {
      displayName: 'Self-Hosted URL',
      name: 'selfHostedUrl',
      type: 'string',
      default: '',
      placeholder: 'https://bitwarden.example.com',
      description: 'The base URL of your self-hosted Bitwarden instance',
      displayOptions: {
        show: {
          environment: ['selfHosted'],
        },
      },
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {},
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.environment === "cloudEU" ? "https://api.bitwarden.eu" : $credentials.environment === "selfHosted" ? $credentials.selfHostedUrl + "/api" : "https://api.bitwarden.com"}}',
      url: '/public/organizations/self',
      method: 'GET',
    },
  };
}
