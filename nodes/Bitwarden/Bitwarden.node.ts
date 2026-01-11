/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

import * as member from './actions/member';
import * as collection from './actions/collection';
import * as group from './actions/group';
import * as policy from './actions/policy';
import * as event from './actions/event';
import * as organization from './actions/organization';
import * as sso from './actions/sso';
import * as directorySync from './actions/directorySync';
import * as secret from './actions/secret';
import * as project from './actions/project';
import * as serviceAccount from './actions/serviceAccount';
import * as importExport from './actions/importExport';

// Emit licensing notice once on module load
const LICENSING_NOTICE = `[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`;

let licenseNoticeEmitted = false;
if (!licenseNoticeEmitted) {
  console.warn(LICENSING_NOTICE);
  licenseNoticeEmitted = true;
}

export class Bitwarden implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Bitwarden',
    name: 'bitwarden',
    icon: 'file:bitwarden.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with Bitwarden API for organization management, members, collections, groups, policies, events, SSO, directory sync, and Secrets Manager',
    defaults: {
      name: 'Bitwarden',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'bitwardenApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Collection', value: 'collection' },
          { name: 'Directory Sync', value: 'directorySync' },
          { name: 'Event', value: 'event' },
          { name: 'Group', value: 'group' },
          { name: 'Import/Export', value: 'importExport' },
          { name: 'Member', value: 'member' },
          { name: 'Organization', value: 'organization' },
          { name: 'Policy', value: 'policy' },
          { name: 'Project (Secrets Manager)', value: 'project' },
          { name: 'Secret (Secrets Manager)', value: 'secret' },
          { name: 'Service Account (Secrets Manager)', value: 'serviceAccount' },
          { name: 'SSO', value: 'sso' },
        ],
        default: 'member',
      },
      // Member operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['member'] } },
        options: [
          { name: 'Confirm', value: 'confirm', description: 'Confirm an accepted member', action: 'Confirm a member' },
          { name: 'Create', value: 'create', description: 'Invite a new member', action: 'Create a member' },
          { name: 'Delete', value: 'delete', description: 'Remove a member', action: 'Delete a member' },
          { name: 'Get', value: 'get', description: 'Get a member by ID', action: 'Get a member' },
          { name: 'Get Many', value: 'getAll', description: 'Get all members', action: 'Get many members' },
          { name: 'Reinvite', value: 'reinvite', description: 'Resend invitation', action: 'Reinvite a member' },
          { name: 'Restore', value: 'restore', description: 'Restore a revoked member', action: 'Restore a member' },
          { name: 'Revoke', value: 'revoke', description: 'Revoke member access', action: 'Revoke a member' },
          { name: 'Update', value: 'update', description: 'Update a member', action: 'Update a member' },
          { name: 'Update Collections', value: 'updateCollections', description: 'Update member collection access', action: 'Update member collections' },
          { name: 'Update Groups', value: 'updateGroups', description: 'Update member group assignments', action: 'Update member groups' },
        ],
        default: 'getAll',
      },
      // Collection operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['collection'] } },
        options: [
          { name: 'Add Member', value: 'addMember', description: 'Add member to collection', action: 'Add member to collection' },
          { name: 'Create', value: 'create', description: 'Create a collection', action: 'Create a collection' },
          { name: 'Delete', value: 'delete', description: 'Delete a collection', action: 'Delete a collection' },
          { name: 'Get', value: 'get', description: 'Get a collection', action: 'Get a collection' },
          { name: 'Get Groups', value: 'getGroups', description: 'Get groups with access', action: 'Get collection groups' },
          { name: 'Get Many', value: 'getAll', description: 'Get all collections', action: 'Get many collections' },
          { name: 'Get Members', value: 'getMembers', description: 'Get members with access', action: 'Get collection members' },
          { name: 'Remove Member', value: 'removeMember', description: 'Remove member from collection', action: 'Remove member from collection' },
          { name: 'Update', value: 'update', description: 'Update a collection', action: 'Update a collection' },
          { name: 'Update Groups', value: 'updateGroups', description: 'Update group access', action: 'Update collection groups' },
        ],
        default: 'getAll',
      },
      // Group operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['group'] } },
        options: [
          { name: 'Add Members', value: 'addMembers', description: 'Add members to group', action: 'Add members to group' },
          { name: 'Create', value: 'create', description: 'Create a group', action: 'Create a group' },
          { name: 'Delete', value: 'delete', description: 'Delete a group', action: 'Delete a group' },
          { name: 'Get', value: 'get', description: 'Get a group', action: 'Get a group' },
          { name: 'Get Collections', value: 'getCollections', description: 'Get collection access', action: 'Get group collections' },
          { name: 'Get Many', value: 'getAll', description: 'Get all groups', action: 'Get many groups' },
          { name: 'Get Members', value: 'getMembers', description: 'Get members in group', action: 'Get group members' },
          { name: 'Remove Members', value: 'removeMembers', description: 'Remove members from group', action: 'Remove members from group' },
          { name: 'Update', value: 'update', description: 'Update a group', action: 'Update a group' },
          { name: 'Update Collections', value: 'updateCollections', description: 'Update collection access', action: 'Update group collections' },
        ],
        default: 'getAll',
      },
      // Policy operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['policy'] } },
        options: [
          { name: 'Get', value: 'get', description: 'Get a policy by type', action: 'Get a policy' },
          { name: 'Get Many', value: 'getAll', description: 'Get all policies', action: 'Get many policies' },
          { name: 'Update', value: 'update', description: 'Update a policy', action: 'Update a policy' },
        ],
        default: 'getAll',
      },
      // Event operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['event'] } },
        options: [
          { name: 'Get by Date Range', value: 'getByDateRange', description: 'Get events in date range', action: 'Get events by date range' },
          { name: 'Get by Member', value: 'getByMember', description: 'Get events for a member', action: 'Get events by member' },
          { name: 'Get by Type', value: 'getByType', description: 'Get events by type', action: 'Get events by type' },
          { name: 'Get Many', value: 'getAll', description: 'Get all events', action: 'Get many events' },
        ],
        default: 'getAll',
      },
      // Organization operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['organization'] } },
        options: [
          { name: 'Get', value: 'get', description: 'Get organization details', action: 'Get organization' },
          { name: 'Get Billing', value: 'getBilling', description: 'Get billing information', action: 'Get organization billing' },
          { name: 'Get License', value: 'getLicense', description: 'Get organization license', action: 'Get organization license' },
          { name: 'Get Subscription', value: 'getSubscription', description: 'Get subscription details', action: 'Get organization subscription' },
          { name: 'Rotate API Key', value: 'rotateApiKey', description: 'Rotate API key', action: 'Rotate organization API key' },
          { name: 'Update', value: 'update', description: 'Update organization', action: 'Update organization' },
        ],
        default: 'get',
      },
      // SSO operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['sso'] } },
        options: [
          { name: 'Get', value: 'get', description: 'Get SSO configuration', action: 'Get SSO configuration' },
          { name: 'Get Metadata', value: 'getMetadata', description: 'Get SSO metadata', action: 'Get SSO metadata' },
          { name: 'Test Connection', value: 'testConnection', description: 'Test SSO connection', action: 'Test SSO connection' },
          { name: 'Update', value: 'update', description: 'Update SSO configuration', action: 'Update SSO configuration' },
        ],
        default: 'get',
      },
      // Directory Sync operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['directorySync'] } },
        options: [
          { name: 'Get', value: 'get', description: 'Get directory configuration', action: 'Get directory sync configuration' },
          { name: 'Get Sync History', value: 'getSyncHistory', description: 'Get sync history', action: 'Get directory sync history' },
          { name: 'Sync', value: 'sync', description: 'Trigger directory sync', action: 'Trigger directory sync' },
          { name: 'Update', value: 'update', description: 'Update directory configuration', action: 'Update directory sync configuration' },
        ],
        default: 'get',
      },
      // Secret operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['secret'] } },
        options: [
          { name: 'Create', value: 'create', description: 'Create a secret', action: 'Create a secret' },
          { name: 'Delete', value: 'delete', description: 'Delete a secret', action: 'Delete a secret' },
          { name: 'Get', value: 'get', description: 'Get a secret', action: 'Get a secret' },
          { name: 'Get by Project', value: 'getByProject', description: 'Get secrets by project', action: 'Get secrets by project' },
          { name: 'Get Many', value: 'getAll', description: 'Get all secrets', action: 'Get many secrets' },
          { name: 'Update', value: 'update', description: 'Update a secret', action: 'Update a secret' },
        ],
        default: 'getAll',
      },
      // Project operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['project'] } },
        options: [
          { name: 'Create', value: 'create', description: 'Create a project', action: 'Create a project' },
          { name: 'Delete', value: 'delete', description: 'Delete a project', action: 'Delete a project' },
          { name: 'Get', value: 'get', description: 'Get a project', action: 'Get a project' },
          { name: 'Get Many', value: 'getAll', description: 'Get all projects', action: 'Get many projects' },
          { name: 'Get Secrets', value: 'getSecrets', description: 'Get secrets in project', action: 'Get project secrets' },
          { name: 'Get Service Accounts', value: 'getServiceAccounts', description: 'Get service accounts', action: 'Get project service accounts' },
          { name: 'Update', value: 'update', description: 'Update a project', action: 'Update a project' },
        ],
        default: 'getAll',
      },
      // Service Account operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['serviceAccount'] } },
        options: [
          { name: 'Create', value: 'create', description: 'Create service account', action: 'Create a service account' },
          { name: 'Create Access Token', value: 'createAccessToken', description: 'Create access token', action: 'Create access token' },
          { name: 'Delete', value: 'delete', description: 'Delete service account', action: 'Delete a service account' },
          { name: 'Get', value: 'get', description: 'Get service account', action: 'Get a service account' },
          { name: 'Get Access Tokens', value: 'getAccessTokens', description: 'Get access tokens', action: 'Get access tokens' },
          { name: 'Get Many', value: 'getAll', description: 'Get all service accounts', action: 'Get many service accounts' },
          { name: 'Revoke Access Token', value: 'revokeAccessToken', description: 'Revoke access token', action: 'Revoke access token' },
          { name: 'Update', value: 'update', description: 'Update service account', action: 'Update a service account' },
        ],
        default: 'getAll',
      },
      // Import/Export operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['importExport'] } },
        options: [
          { name: 'Export Members', value: 'exportMembers', description: 'Export members to CSV', action: 'Export members' },
          { name: 'Export Organization', value: 'exportOrganization', description: 'Export organization vault', action: 'Export organization' },
          { name: 'Import Members', value: 'importMembers', description: 'Import members from CSV', action: 'Import members' },
          { name: 'Import Organization', value: 'importOrganization', description: 'Import organization vault', action: 'Import organization' },
        ],
        default: 'exportMembers',
      },
      // ============= MEMBER PARAMETERS =============
      {
        displayName: 'Member ID',
        name: 'memberId',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            resource: ['member'],
            operation: ['get', 'update', 'delete', 'reinvite', 'confirm', 'updateGroups', 'updateCollections', 'revoke', 'restore'],
          },
        },
        default: '',
        description: 'The ID of the member',
      },
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        required: true,
        displayOptions: {
          show: { resource: ['member'], operation: ['create'] },
        },
        default: '',
        placeholder: 'name@example.com',
        description: 'Email address for the new member invitation',
      },
      {
        displayName: 'Member Type',
        name: 'type',
        type: 'options',
        required: true,
        displayOptions: {
          show: { resource: ['member'], operation: ['create'] },
        },
        options: [
          { name: 'Owner', value: 0 },
          { name: 'Admin', value: 1 },
          { name: 'User', value: 2 },
          { name: 'Manager', value: 3 },
          { name: 'Custom', value: 4 },
        ],
        default: 2,
        description: 'The type/role of the member',
      },
      {
        displayName: 'Group IDs',
        name: 'groupIds',
        type: 'string',
        typeOptions: { multipleValues: true },
        required: true,
        displayOptions: {
          show: { resource: ['member'], operation: ['updateGroups'] },
        },
        default: [],
        description: 'List of group IDs to assign to the member',
      },
      {
        displayName: 'Collections',
        name: 'collections',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        required: true,
        displayOptions: {
          show: { resource: ['member'], operation: ['updateCollections'] },
        },
        default: {},
        options: [
          {
            name: 'collectionValues',
            displayName: 'Collection',
            values: [
              { displayName: 'Collection ID', name: 'collectionId', type: 'string', default: '' },
              { displayName: 'Read Only', name: 'readOnly', type: 'boolean', default: false },
              { displayName: 'Hide Passwords', name: 'hidePasswords', type: 'boolean', default: false },
              { displayName: 'Manage', name: 'manage', type: 'boolean', default: false },
            ],
          },
        ],
      },
      // ============= COLLECTION PARAMETERS =============
      {
        displayName: 'Collection ID',
        name: 'collectionId',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            resource: ['collection'],
            operation: ['get', 'update', 'delete', 'getMembers', 'addMember', 'removeMember', 'getGroups', 'updateGroups'],
          },
        },
        default: '',
        description: 'The ID of the collection',
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        required: true,
        displayOptions: {
          show: { resource: ['collection'], operation: ['create'] },
        },
        default: '',
        description: 'Name of the collection',
      },
      {
        displayName: 'Member ID',
        name: 'memberId',
        type: 'string',
        required: true,
        displayOptions: {
          show: { resource: ['collection'], operation: ['addMember', 'removeMember'] },
        },
        default: '',
        description: 'The ID of the member',
      },
      {
        displayName: 'Read Only',
        name: 'readOnly',
        type: 'boolean',
        displayOptions: {
          show: { resource: ['collection'], operation: ['addMember'] },
        },
        default: false,
        description: 'Whether the member has read-only access',
      },
      {
        displayName: 'Hide Passwords',
        name: 'hidePasswords',
        type: 'boolean',
        displayOptions: {
          show: { resource: ['collection'], operation: ['addMember'] },
        },
        default: false,
        description: 'Whether to hide passwords from the member',
      },
      {
        displayName: 'Manage',
        name: 'manage',
        type: 'boolean',
        displayOptions: {
          show: { resource: ['collection'], operation: ['addMember'] },
        },
        default: false,
        description: 'Whether the member can manage the collection',
      },
      {
        displayName: 'Groups',
        name: 'groups',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        required: true,
        displayOptions: {
          show: { resource: ['collection'], operation: ['updateGroups'] },
        },
        default: {},
        options: [
          {
            name: 'groupValues',
            displayName: 'Group',
            values: [
              { displayName: 'Group ID', name: 'groupId', type: 'string', default: '' },
              { displayName: 'Read Only', name: 'readOnly', type: 'boolean', default: false },
              { displayName: 'Hide Passwords', name: 'hidePasswords', type: 'boolean', default: false },
              { displayName: 'Manage', name: 'manage', type: 'boolean', default: false },
            ],
          },
        ],
      },
      // ============= GROUP PARAMETERS =============
      {
        displayName: 'Group ID',
        name: 'groupId',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            resource: ['group'],
            operation: ['get', 'update', 'delete', 'getMembers', 'addMembers', 'removeMembers', 'getCollections', 'updateCollections'],
          },
        },
        default: '',
        description: 'The ID of the group',
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        required: true,
        displayOptions: {
          show: { resource: ['group'], operation: ['create'] },
        },
        default: '',
        description: 'Name of the group',
      },
      {
        displayName: 'Member IDs',
        name: 'memberIds',
        type: 'string',
        typeOptions: { multipleValues: true },
        required: true,
        displayOptions: {
          show: { resource: ['group'], operation: ['addMembers', 'removeMembers'] },
        },
        default: [],
        description: 'List of member IDs',
      },
      // ============= POLICY PARAMETERS =============
      {
        displayName: 'Policy Type',
        name: 'policyType',
        type: 'options',
        required: true,
        displayOptions: {
          show: { resource: ['policy'], operation: ['get', 'update'] },
        },
        options: [
          { name: 'Two-Factor Authentication', value: 0 },
          { name: 'Master Password', value: 1 },
          { name: 'Password Generator', value: 2 },
          { name: 'Single Organization', value: 3 },
          { name: 'Require SSO', value: 4 },
          { name: 'Personal Ownership', value: 5 },
          { name: 'Disable Send', value: 6 },
          { name: 'Send Options', value: 7 },
          { name: 'Reset Password', value: 8 },
          { name: 'Maximum Vault Timeout', value: 9 },
          { name: 'Disable Personal Vault Export', value: 10 },
          { name: 'Activate Autofill', value: 11 },
        ],
        default: 0,
        description: 'Type of policy',
      },
      {
        displayName: 'Enabled',
        name: 'enabled',
        type: 'boolean',
        required: true,
        displayOptions: {
          show: { resource: ['policy'], operation: ['update'] },
        },
        default: true,
        description: 'Whether the policy is enabled',
      },
      {
        displayName: 'Policy Data',
        name: 'policyData',
        type: 'json',
        displayOptions: {
          show: { resource: ['policy'], operation: ['update'] },
        },
        default: '{}',
        description: 'Policy-specific configuration data',
      },
      // ============= EVENT PARAMETERS =============
      {
        displayName: 'Start Date',
        name: 'start',
        type: 'dateTime',
        required: true,
        displayOptions: {
          show: { resource: ['event'], operation: ['getByDateRange'] },
        },
        default: '',
        description: 'Start date for the date range',
      },
      {
        displayName: 'End Date',
        name: 'end',
        type: 'dateTime',
        required: true,
        displayOptions: {
          show: { resource: ['event'], operation: ['getByDateRange'] },
        },
        default: '',
        description: 'End date for the date range',
      },
      {
        displayName: 'Acting User ID',
        name: 'actingUserId',
        type: 'string',
        required: true,
        displayOptions: {
          show: { resource: ['event'], operation: ['getByMember'] },
        },
        default: '',
        description: 'User ID of the member to filter events',
      },
      {
        displayName: 'Event Type',
        name: 'eventType',
        type: 'number',
        required: true,
        displayOptions: {
          show: { resource: ['event'], operation: ['getByType'] },
        },
        default: 1000,
        description: 'Event type code to filter by',
      },
      // ============= SSO PARAMETERS =============
      {
        displayName: 'Enabled',
        name: 'enabled',
        type: 'boolean',
        required: true,
        displayOptions: {
          show: { resource: ['sso'], operation: ['update'] },
        },
        default: true,
        description: 'Whether SSO is enabled',
      },
      {
        displayName: 'SSO Type',
        name: 'ssoType',
        type: 'options',
        required: true,
        displayOptions: {
          show: { resource: ['sso'], operation: ['update'] },
        },
        options: [
          { name: 'OpenID Connect', value: 0 },
          { name: 'SAML 2.0', value: 1 },
        ],
        default: 0,
        description: 'Type of SSO configuration',
      },
      // ============= DIRECTORY SYNC PARAMETERS =============
      {
        displayName: 'Enabled',
        name: 'enabled',
        type: 'boolean',
        required: true,
        displayOptions: {
          show: { resource: ['directorySync'], operation: ['update'] },
        },
        default: true,
        description: 'Whether directory sync is enabled',
      },
      {
        displayName: 'Directory Type',
        name: 'directoryType',
        type: 'options',
        required: true,
        displayOptions: {
          show: { resource: ['directorySync'], operation: ['update'] },
        },
        options: [
          { name: 'Azure Active Directory', value: 0 },
          { name: 'Okta', value: 1 },
          { name: 'OneLogin', value: 2 },
          { name: 'GSuite', value: 3 },
          { name: 'JumpCloud', value: 4 },
          { name: 'Generic LDAP', value: 5 },
        ],
        default: 0,
        description: 'Type of directory to sync with',
      },
      {
        displayName: 'Sync Type',
        name: 'syncType',
        type: 'options',
        displayOptions: {
          show: { resource: ['directorySync'], operation: ['sync'] },
        },
        options: [
          { name: 'Full', value: 'full' },
          { name: 'Incremental', value: 'incremental' },
        ],
        default: 'full',
        description: 'Type of sync to perform',
      },
      // ============= SECRET PARAMETERS =============
      {
        displayName: 'Secret ID',
        name: 'secretId',
        type: 'string',
        required: true,
        displayOptions: {
          show: { resource: ['secret'], operation: ['get', 'update', 'delete'] },
        },
        default: '',
        description: 'The ID of the secret',
      },
      {
        displayName: 'Key',
        name: 'key',
        type: 'string',
        required: true,
        displayOptions: {
          show: { resource: ['secret'], operation: ['create'] },
        },
        default: '',
        description: 'Name/key of the secret',
      },
      {
        displayName: 'Value',
        name: 'value',
        type: 'string',
        required: true,
        typeOptions: { password: true },
        displayOptions: {
          show: { resource: ['secret'], operation: ['create'] },
        },
        default: '',
        description: 'Value of the secret',
      },
      {
        displayName: 'Project ID',
        name: 'projectId',
        type: 'string',
        required: true,
        displayOptions: {
          show: { resource: ['secret'], operation: ['getByProject'] },
        },
        default: '',
        description: 'The ID of the project',
      },
      // ============= PROJECT PARAMETERS =============
      {
        displayName: 'Project ID',
        name: 'projectId',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            resource: ['project'],
            operation: ['get', 'update', 'delete', 'getSecrets', 'getServiceAccounts'],
          },
        },
        default: '',
        description: 'The ID of the project',
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        required: true,
        displayOptions: {
          show: { resource: ['project'], operation: ['create', 'update'] },
        },
        default: '',
        description: 'Name of the project',
      },
      // ============= SERVICE ACCOUNT PARAMETERS =============
      {
        displayName: 'Service Account ID',
        name: 'serviceAccountId',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            resource: ['serviceAccount'],
            operation: ['get', 'update', 'delete', 'getAccessTokens', 'createAccessToken', 'revokeAccessToken'],
          },
        },
        default: '',
        description: 'The ID of the service account',
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        required: true,
        displayOptions: {
          show: { resource: ['serviceAccount'], operation: ['create', 'update'] },
        },
        default: '',
        description: 'Name of the service account',
      },
      {
        displayName: 'Token Name',
        name: 'tokenName',
        type: 'string',
        required: true,
        displayOptions: {
          show: { resource: ['serviceAccount'], operation: ['createAccessToken'] },
        },
        default: '',
        description: 'Name for the access token',
      },
      {
        displayName: 'Access Token ID',
        name: 'accessTokenId',
        type: 'string',
        required: true,
        displayOptions: {
          show: { resource: ['serviceAccount'], operation: ['revokeAccessToken'] },
        },
        default: '',
        description: 'The ID of the access token to revoke',
      },
      // ============= IMPORT/EXPORT PARAMETERS =============
      {
        displayName: 'Format',
        name: 'format',
        type: 'options',
        required: true,
        displayOptions: {
          show: { resource: ['importExport'], operation: ['importOrganization', 'exportOrganization'] },
        },
        options: [
          { name: 'JSON', value: 'json' },
          { name: 'CSV', value: 'csv' },
          { name: 'Encrypted JSON', value: 'encrypted_json' },
        ],
        default: 'json',
        description: 'Format of the data',
      },
      {
        displayName: 'Data',
        name: 'data',
        type: 'string',
        typeOptions: { rows: 10 },
        required: true,
        displayOptions: {
          show: { resource: ['importExport'], operation: ['importOrganization'] },
        },
        default: '',
        description: 'Data to import',
      },
      {
        displayName: 'CSV Data',
        name: 'csvData',
        type: 'string',
        typeOptions: { rows: 10 },
        required: true,
        displayOptions: {
          show: { resource: ['importExport'], operation: ['importMembers'] },
        },
        default: 'email,type,accessAll,externalId\n',
        description: 'CSV data with headers: email, type, accessAll, externalId',
      },
      // ============= COMMON PARAMETERS =============
      {
        displayName: 'Return All',
        name: 'returnAll',
        type: 'boolean',
        displayOptions: {
          show: {
            operation: ['getAll', 'getByDateRange', 'getByMember', 'getByType', 'getByProject', 'getSecrets', 'getServiceAccounts', 'getAccessTokens', 'getSyncHistory'],
          },
        },
        default: false,
        description: 'Whether to return all results or only up to a given limit',
      },
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        displayOptions: {
          show: {
            operation: ['getAll', 'getByDateRange', 'getByMember', 'getByType', 'getByProject', 'getSecrets', 'getServiceAccounts', 'getAccessTokens', 'getSyncHistory'],
            returnAll: [false],
          },
        },
        typeOptions: { minValue: 1 },
        default: 50,
        description: 'Max number of results to return',
      },
      // Additional Fields collections
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: { resource: ['member'], operation: ['create'] },
        },
        options: [
          { displayName: 'Access All', name: 'accessAll', type: 'boolean', default: false },
          { displayName: 'External ID', name: 'externalId', type: 'string', default: '' },
        ],
      },
      {
        displayName: 'Update Fields',
        name: 'updateFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: { resource: ['member'], operation: ['update'] },
        },
        options: [
          {
            displayName: 'Type',
            name: 'type',
            type: 'options',
            options: [
              { name: 'Owner', value: 0 },
              { name: 'Admin', value: 1 },
              { name: 'User', value: 2 },
              { name: 'Manager', value: 3 },
              { name: 'Custom', value: 4 },
            ],
            default: 2,
          },
          { displayName: 'Access All', name: 'accessAll', type: 'boolean', default: false },
          { displayName: 'External ID', name: 'externalId', type: 'string', default: '' },
        ],
      },
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: { resource: ['collection'], operation: ['create'] },
        },
        options: [
          { displayName: 'External ID', name: 'externalId', type: 'string', default: '' },
        ],
      },
      {
        displayName: 'Update Fields',
        name: 'updateFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: { resource: ['collection'], operation: ['update'] },
        },
        options: [
          { displayName: 'Name', name: 'name', type: 'string', default: '' },
          { displayName: 'External ID', name: 'externalId', type: 'string', default: '' },
        ],
      },
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: { resource: ['group'], operation: ['create'] },
        },
        options: [
          { displayName: 'Access All', name: 'accessAll', type: 'boolean', default: false },
          { displayName: 'External ID', name: 'externalId', type: 'string', default: '' },
        ],
      },
      {
        displayName: 'Update Fields',
        name: 'updateFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: { resource: ['group'], operation: ['update'] },
        },
        options: [
          { displayName: 'Name', name: 'name', type: 'string', default: '' },
          { displayName: 'Access All', name: 'accessAll', type: 'boolean', default: false },
          { displayName: 'External ID', name: 'externalId', type: 'string', default: '' },
        ],
      },
      {
        displayName: 'Update Fields',
        name: 'updateFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: { resource: ['organization'], operation: ['update'] },
        },
        options: [
          { displayName: 'Name', name: 'name', type: 'string', default: '' },
          { displayName: 'Business Name', name: 'businessName', type: 'string', default: '' },
          { displayName: 'Billing Email', name: 'billingEmail', type: 'string', default: '' },
          { displayName: 'Identifier', name: 'identifier', type: 'string', default: '' },
        ],
      },
      {
        displayName: 'Update Fields',
        name: 'updateFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: { resource: ['sso'], operation: ['update'] },
        },
        options: [
          { displayName: 'Identifier', name: 'identifier', type: 'string', default: '' },
          { displayName: 'Key Connector Enabled', name: 'keyConnectorEnabled', type: 'boolean', default: false },
          { displayName: 'Authority (OIDC)', name: 'authority', type: 'string', default: '' },
          { displayName: 'Client ID (OIDC)', name: 'clientId', type: 'string', default: '' },
          { displayName: 'Client Secret (OIDC)', name: 'clientSecret', type: 'string', default: '' },
        ],
      },
      {
        displayName: 'Update Fields',
        name: 'updateFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: { resource: ['directorySync'], operation: ['update'] },
        },
        options: [
          { displayName: 'Sync Users', name: 'syncUsers', type: 'boolean', default: true },
          { displayName: 'Sync Groups', name: 'syncGroups', type: 'boolean', default: true },
          { displayName: 'Overwrite Existing', name: 'overwriteExisting', type: 'boolean', default: false },
        ],
      },
      {
        displayName: 'Filters',
        name: 'filters',
        type: 'collection',
        placeholder: 'Add Filter',
        default: {},
        displayOptions: {
          show: { resource: ['event'], operation: ['getAll', 'getByMember', 'getByType'] },
        },
        options: [
          { displayName: 'Start Date', name: 'start', type: 'dateTime', default: '' },
          { displayName: 'End Date', name: 'end', type: 'dateTime', default: '' },
          { displayName: 'Acting User ID', name: 'actingUserId', type: 'string', default: '' },
          { displayName: 'Item ID', name: 'itemId', type: 'string', default: '' },
        ],
      },
      {
        displayName: 'Filters',
        name: 'filters',
        type: 'collection',
        placeholder: 'Add Filter',
        default: {},
        displayOptions: {
          show: { resource: ['directorySync'], operation: ['getSyncHistory'] },
        },
        options: [
          { displayName: 'Start Date', name: 'start', type: 'dateTime', default: '' },
          { displayName: 'End Date', name: 'end', type: 'dateTime', default: '' },
        ],
      },
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: { resource: ['secret'], operation: ['create'] },
        },
        options: [
          { displayName: 'Note', name: 'note', type: 'string', default: '' },
          { displayName: 'Project ID', name: 'projectId', type: 'string', default: '' },
        ],
      },
      {
        displayName: 'Update Fields',
        name: 'updateFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: { resource: ['secret'], operation: ['update'] },
        },
        options: [
          { displayName: 'Key', name: 'key', type: 'string', default: '' },
          { displayName: 'Value', name: 'value', type: 'string', typeOptions: { password: true }, default: '' },
          { displayName: 'Note', name: 'note', type: 'string', default: '' },
          { displayName: 'Project ID', name: 'projectId', type: 'string', default: '' },
        ],
      },
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: { resource: ['serviceAccount'], operation: ['createAccessToken'] },
        },
        options: [
          { displayName: 'Expire At', name: 'expireAt', type: 'dateTime', default: '' },
        ],
      },
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: { resource: ['importExport'], operation: ['importOrganization'] },
        },
        options: [
          { displayName: 'Collection ID', name: 'collectionId', type: 'string', default: '' },
        ],
      },
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: { resource: ['importExport'], operation: ['exportOrganization'] },
        },
        options: [
          { displayName: 'Include Attachments', name: 'includeAttachments', type: 'boolean', default: false },
        ],
      },
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: { resource: ['importExport'], operation: ['importMembers'] },
        },
        options: [],
      },
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: { resource: ['importExport'], operation: ['exportMembers'] },
        },
        options: [
          { displayName: 'Include Collections', name: 'includeCollections', type: 'boolean', default: false },
        ],
      },
      // Collections parameters for group updateCollections
      {
        displayName: 'Collections',
        name: 'collections',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        required: true,
        displayOptions: {
          show: { resource: ['group'], operation: ['updateCollections'] },
        },
        default: {},
        options: [
          {
            name: 'collectionValues',
            displayName: 'Collection',
            values: [
              { displayName: 'Collection ID', name: 'collectionId', type: 'string', default: '' },
              { displayName: 'Read Only', name: 'readOnly', type: 'boolean', default: false },
              { displayName: 'Hide Passwords', name: 'hidePasswords', type: 'boolean', default: false },
              { displayName: 'Manage', name: 'manage', type: 'boolean', default: false },
            ],
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let result: INodeExecutionData[] = [];

        switch (resource) {
          case 'member':
            switch (operation) {
              case 'getAll':
                result = await member.getAll.call(this, i);
                break;
              case 'get':
                result = await member.get.call(this, i);
                break;
              case 'create':
                result = await member.create.call(this, i);
                break;
              case 'update':
                result = await member.update.call(this, i);
                break;
              case 'delete':
                result = await member.deleteMember.call(this, i);
                break;
              case 'reinvite':
                result = await member.reinvite.call(this, i);
                break;
              case 'confirm':
                result = await member.confirm.call(this, i);
                break;
              case 'updateGroups':
                result = await member.updateGroups.call(this, i);
                break;
              case 'updateCollections':
                result = await member.updateCollections.call(this, i);
                break;
              case 'revoke':
                result = await member.revoke.call(this, i);
                break;
              case 'restore':
                result = await member.restore.call(this, i);
                break;
            }
            break;

          case 'collection':
            switch (operation) {
              case 'getAll':
                result = await collection.getAll.call(this, i);
                break;
              case 'get':
                result = await collection.get.call(this, i);
                break;
              case 'create':
                result = await collection.create.call(this, i);
                break;
              case 'update':
                result = await collection.update.call(this, i);
                break;
              case 'delete':
                result = await collection.deleteCollection.call(this, i);
                break;
              case 'getMembers':
                result = await collection.getMembers.call(this, i);
                break;
              case 'addMember':
                result = await collection.addMember.call(this, i);
                break;
              case 'removeMember':
                result = await collection.removeMember.call(this, i);
                break;
              case 'getGroups':
                result = await collection.getGroups.call(this, i);
                break;
              case 'updateGroups':
                result = await collection.updateGroups.call(this, i);
                break;
            }
            break;

          case 'group':
            switch (operation) {
              case 'getAll':
                result = await group.getAll.call(this, i);
                break;
              case 'get':
                result = await group.get.call(this, i);
                break;
              case 'create':
                result = await group.create.call(this, i);
                break;
              case 'update':
                result = await group.update.call(this, i);
                break;
              case 'delete':
                result = await group.deleteGroup.call(this, i);
                break;
              case 'getMembers':
                result = await group.getMembers.call(this, i);
                break;
              case 'addMembers':
                result = await group.addMembers.call(this, i);
                break;
              case 'removeMembers':
                result = await group.removeMembers.call(this, i);
                break;
              case 'getCollections':
                result = await group.getCollections.call(this, i);
                break;
              case 'updateCollections':
                result = await group.updateCollections.call(this, i);
                break;
            }
            break;

          case 'policy':
            switch (operation) {
              case 'getAll':
                result = await policy.getAll.call(this, i);
                break;
              case 'get':
                result = await policy.get.call(this, i);
                break;
              case 'update':
                result = await policy.update.call(this, i);
                break;
            }
            break;

          case 'event':
            switch (operation) {
              case 'getAll':
                result = await event.getAll.call(this, i);
                break;
              case 'getByDateRange':
                result = await event.getByDateRange.call(this, i);
                break;
              case 'getByMember':
                result = await event.getByMember.call(this, i);
                break;
              case 'getByType':
                result = await event.getByType.call(this, i);
                break;
            }
            break;

          case 'organization':
            switch (operation) {
              case 'get':
                result = await organization.get.call(this, i);
                break;
              case 'update':
                result = await organization.update.call(this, i);
                break;
              case 'getBilling':
                result = await organization.getBilling.call(this, i);
                break;
              case 'getSubscription':
                result = await organization.getSubscription.call(this, i);
                break;
              case 'getLicense':
                result = await organization.getLicense.call(this, i);
                break;
              case 'rotateApiKey':
                result = await organization.rotateApiKey.call(this, i);
                break;
            }
            break;

          case 'sso':
            switch (operation) {
              case 'get':
                result = await sso.get.call(this, i);
                break;
              case 'update':
                result = await sso.update.call(this, i);
                break;
              case 'getMetadata':
                result = await sso.getMetadata.call(this, i);
                break;
              case 'testConnection':
                result = await sso.testConnection.call(this, i);
                break;
            }
            break;

          case 'directorySync':
            switch (operation) {
              case 'get':
                result = await directorySync.get.call(this, i);
                break;
              case 'update':
                result = await directorySync.update.call(this, i);
                break;
              case 'sync':
                result = await directorySync.sync.call(this, i);
                break;
              case 'getSyncHistory':
                result = await directorySync.getSyncHistory.call(this, i);
                break;
            }
            break;

          case 'secret':
            switch (operation) {
              case 'getAll':
                result = await secret.getAll.call(this, i);
                break;
              case 'get':
                result = await secret.get.call(this, i);
                break;
              case 'create':
                result = await secret.create.call(this, i);
                break;
              case 'update':
                result = await secret.update.call(this, i);
                break;
              case 'delete':
                result = await secret.deleteSecret.call(this, i);
                break;
              case 'getByProject':
                result = await secret.getByProject.call(this, i);
                break;
            }
            break;

          case 'project':
            switch (operation) {
              case 'getAll':
                result = await project.getAll.call(this, i);
                break;
              case 'get':
                result = await project.get.call(this, i);
                break;
              case 'create':
                result = await project.create.call(this, i);
                break;
              case 'update':
                result = await project.update.call(this, i);
                break;
              case 'delete':
                result = await project.deleteProject.call(this, i);
                break;
              case 'getSecrets':
                result = await project.getSecrets.call(this, i);
                break;
              case 'getServiceAccounts':
                result = await project.getServiceAccounts.call(this, i);
                break;
            }
            break;

          case 'serviceAccount':
            switch (operation) {
              case 'getAll':
                result = await serviceAccount.getAll.call(this, i);
                break;
              case 'get':
                result = await serviceAccount.get.call(this, i);
                break;
              case 'create':
                result = await serviceAccount.create.call(this, i);
                break;
              case 'update':
                result = await serviceAccount.update.call(this, i);
                break;
              case 'delete':
                result = await serviceAccount.deleteServiceAccount.call(this, i);
                break;
              case 'getAccessTokens':
                result = await serviceAccount.getAccessTokens.call(this, i);
                break;
              case 'createAccessToken':
                result = await serviceAccount.createAccessToken.call(this, i);
                break;
              case 'revokeAccessToken':
                result = await serviceAccount.revokeAccessToken.call(this, i);
                break;
            }
            break;

          case 'importExport':
            switch (operation) {
              case 'importOrganization':
                result = await importExport.importOrganization.call(this, i);
                break;
              case 'exportOrganization':
                result = await importExport.exportOrganization.call(this, i);
                break;
              case 'importMembers':
                result = await importExport.importMembers.call(this, i);
                break;
              case 'exportMembers':
                result = await importExport.exportMembers.call(this, i);
                break;
            }
            break;
        }

        returnData.push(...result);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: (error as Error).message,
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
