/**
 * [Velocity BPA Licensing Notice]
 *
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 *
 * Use of this node by for-profit organizations in production environments requires
 * a commercial license from Velocity BPA.
 *
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
	JsonObject,
	NodeApiError,
} from 'n8n-workflow';

import { bitwardenApiRequest, bitwardenApiRequestAllItems } from './transport';
import type { IBitwardenEvent } from './types/BitwardenTypes';

export class BitwardenTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Bitwarden Trigger',
		name: 'bitwardenTrigger',
		icon: 'file:bitwarden.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Triggers on Bitwarden organization events',
		defaults: {
			name: 'Bitwarden Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'bitwardenApi',
				required: true,
			},
		],
		polling: true,
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				required: true,
				default: 'memberInvited',
				options: [
					{
						name: 'All Events',
						value: 'allEvents',
						description: 'Trigger on all organization events',
					},
					{
						name: 'Collection Created',
						value: 'collectionCreated',
						description: 'Trigger when a collection is created',
					},
					{
						name: 'Collection Deleted',
						value: 'collectionDeleted',
						description: 'Trigger when a collection is deleted',
					},
					{
						name: 'Collection Updated',
						value: 'collectionUpdated',
						description: 'Trigger when a collection is updated',
					},
					{
						name: 'Group Created',
						value: 'groupCreated',
						description: 'Trigger when a group is created',
					},
					{
						name: 'Group Deleted',
						value: 'groupDeleted',
						description: 'Trigger when a group is deleted',
					},
					{
						name: 'Group Updated',
						value: 'groupUpdated',
						description: 'Trigger when a group is updated',
					},
					{
						name: 'Member Accepted',
						value: 'memberAccepted',
						description: 'Trigger when a member accepts invitation',
					},
					{
						name: 'Member Confirmed',
						value: 'memberConfirmed',
						description: 'Trigger when a member is confirmed',
					},
					{
						name: 'Member Invited',
						value: 'memberInvited',
						description: 'Trigger when a member is invited',
					},
					{
						name: 'Member Removed',
						value: 'memberRemoved',
						description: 'Trigger when a member is removed',
					},
					{
						name: 'Member Updated',
						value: 'memberUpdated',
						description: 'Trigger when a member is updated',
					},
					{
						name: 'Organization Updated',
						value: 'organizationUpdated',
						description: 'Trigger when organization settings change',
					},
					{
						name: 'Policy Updated',
						value: 'policyUpdated',
						description: 'Trigger when a policy is updated',
					},
				],
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Include Acting User Details',
						name: 'includeActingUser',
						type: 'boolean',
						default: false,
						description: 'Whether to include details about the user who triggered the event',
					},
				],
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const webhookData = this.getWorkflowStaticData('node');
		const event = this.getNodeParameter('event') as string;
		const options = this.getNodeParameter('options') as IDataObject;

		// Map event names to Bitwarden event type codes
		const eventTypeMap: Record<string, number[]> = {
			allEvents: [],
			memberInvited: [1500],
			memberAccepted: [1501],
			memberConfirmed: [1502],
			memberUpdated: [1503],
			memberRemoved: [1504],
			collectionCreated: [1300],
			collectionUpdated: [1301],
			collectionDeleted: [1302],
			groupCreated: [1400],
			groupUpdated: [1401],
			groupDeleted: [1402],
			policyUpdated: [1600, 1601],
			organizationUpdated: [1505, 1506, 1507, 1508, 1509, 1510, 1511, 1512],
		};

		const targetEventTypes = eventTypeMap[event] || [];

		// Get last poll time or default to 5 minutes ago
		let lastPollTime = webhookData.lastPollTime as string;
		if (!lastPollTime) {
			const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
			lastPollTime = fiveMinutesAgo.toISOString();
		}

		const now = new Date();
		const query: IDataObject = {
			start: lastPollTime,
			end: now.toISOString(),
		};

		// Helper function to get event type name
		const getEventTypeName = (typeCode: number): string => {
			const eventTypeNames: Record<number, string> = {
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

				// Provider events
				1700: 'Provider User Invited',
				1701: 'Provider User Confirmed',
				1702: 'Provider User Updated',
				1703: 'Provider User Removed',
				1704: 'Provider Organization Created',
				1705: 'Provider Organization Added',
				1706: 'Provider Organization Removed',
				1707: 'Provider Organization VaultAccessed',

				// Organization domain events
				1800: 'Organization Domain Added',
				1801: 'Organization Domain Removed',
				1802: 'Organization Domain Verified',
				1803: 'Organization Domain Not Verified',

				// Secret events
				1900: 'Secret Accessed',
			};

			return eventTypeNames[typeCode] || `Unknown Event (${typeCode})`;
		};

		try {
			const events = await bitwardenApiRequestAllItems.call(
				this,
				'GET',
				'/events',
				undefined,
				query,
			);

			// Update last poll time
			webhookData.lastPollTime = now.toISOString();

			if (!events || events.length === 0) {
				return null;
			}

			// Filter events by type if not all events
			let filteredEvents = events;
			if (targetEventTypes.length > 0) {
				filteredEvents = events.filter((e: IBitwardenEvent) =>
					targetEventTypes.includes(e.type),
				);
			}

			if (filteredEvents.length === 0) {
				return null;
			}

			// Enhance events with readable type names and optional user details
			const enhancedEvents = await Promise.all(
				filteredEvents.map(async (eventData: IBitwardenEvent) => {
					const enhanced: IDataObject = {
						...eventData,
						eventTypeName: getEventTypeName(eventData.type),
						triggeredEvent: event,
					};

					// Optionally fetch acting user details
					if (options.includeActingUser && eventData.actingUserId) {
						try {
							const member = await bitwardenApiRequest.call(
								this,
								'GET',
								`/members/${eventData.actingUserId}`,
							);
							enhanced.actingUser = member;
						} catch {
							// User might not exist or not accessible
							enhanced.actingUser = null;
						}
					}

					return enhanced;
				}),
			);

			return [this.helpers.returnJsonArray(enhancedEvents)];
		} catch (error) {
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}
	}
}
