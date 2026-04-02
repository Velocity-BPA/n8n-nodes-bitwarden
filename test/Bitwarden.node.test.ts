/**
 * Copyright (c) 2026 Velocity BPA
 * Licensed under the Business Source License 1.1
 */

import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { Bitwarden } from '../nodes/Bitwarden/Bitwarden.node';

// Mock n8n-workflow
jest.mock('n8n-workflow', () => ({
  ...jest.requireActual('n8n-workflow'),
  NodeApiError: class NodeApiError extends Error {
    constructor(node: any, error: any) { super(error.message || 'API Error'); }
  },
  NodeOperationError: class NodeOperationError extends Error {
    constructor(node: any, message: string) { super(message); }
  },
}));

describe('Bitwarden Node', () => {
  let node: Bitwarden;

  beforeAll(() => {
    node = new Bitwarden();
  });

  describe('Node Definition', () => {
    it('should have correct basic properties', () => {
      expect(node.description.displayName).toBe('Bitwarden');
      expect(node.description.name).toBe('bitwarden');
      expect(node.description.version).toBe(1);
      expect(node.description.inputs).toContain('main');
      expect(node.description.outputs).toContain('main');
    });

    it('should define 7 resources', () => {
      const resourceProp = node.description.properties.find(
        (p: any) => p.name === 'resource'
      );
      expect(resourceProp).toBeDefined();
      expect(resourceProp!.type).toBe('options');
      expect(resourceProp!.options).toHaveLength(7);
    });

    it('should have operation dropdowns for each resource', () => {
      const operations = node.description.properties.filter(
        (p: any) => p.name === 'operation'
      );
      expect(operations.length).toBe(7);
    });

    it('should require credentials', () => {
      expect(node.description.credentials).toBeDefined();
      expect(node.description.credentials!.length).toBeGreaterThan(0);
      expect(node.description.credentials![0].required).toBe(true);
    });

    it('should have parameters with proper displayOptions', () => {
      const params = node.description.properties.filter(
        (p: any) => p.displayOptions?.show?.resource
      );
      for (const param of params) {
        expect(param.displayOptions.show.resource).toBeDefined();
        expect(Array.isArray(param.displayOptions.show.resource)).toBe(true);
      }
    });
  });

  // Resource-specific tests
describe('Organization Resource', () => {
	let mockExecuteFunctions: any;

	beforeEach(() => {
		mockExecuteFunctions = {
			getNodeParameter: jest.fn(),
			getCredentials: jest.fn().mockResolvedValue({
				accessToken: 'test-access-token',
				baseUrl: 'https://api.bitwarden.com'
			}),
			getInputData: jest.fn().mockReturnValue([{ json: {} }]),
			getNode: jest.fn().mockReturnValue({ name: 'Test Bitwarden Node' }),
			continueOnFail: jest.fn().mockReturnValue(false),
			helpers: {
				httpRequest: jest.fn(),
				requestWithAuthentication: jest.fn()
			}
		};
	});

	describe('getOrganization operation', () => {
		it('should get organization details successfully', async () => {
			const mockOrgData = {
				id: 'org-123',
				name: 'Test Organization',
				businessName: 'Test Business',
				plan: 'Enterprise'
			};

			mockExecuteFunctions.getNodeParameter.mockReturnValue('getOrganization');
			mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockOrgData);

			const items = [{ json: {} }];
			const result = await executeOrganizationOperations.call(mockExecuteFunctions, items);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
				method: 'GET',
				url: 'https://api.bitwarden.com/public/organization',
				headers: {
					'Authorization': 'Bearer test-access-token',
					'Content-Type': 'application/json'
				},
				json: true
			});

			expect(result).toEqual([{
				json: mockOrgData,
				pairedItem: { item: 0 }
			}]);
		});

		it('should handle organization API errors gracefully', async () => {
			mockExecuteFunctions.getNodeParameter.mockReturnValue('getOrganization');
			mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Unauthorized - Invalid organization access'));
			mockExecuteFunctions.continueOnFail.mockReturnValue(true);

			const items = [{ json: {} }];
			const result = await executeOrganizationOperations.call(mockExecuteFunctions, items);

			expect(result).toEqual([{
				json: { error: 'Unauthorized - Invalid organization access' },
				pairedItem: { item: 0 }
			}]);
		});

		it('should throw error when continueOnFail is false', async () => {
			mockExecuteFunctions.getNodeParameter.mockReturnValue('getOrganization');
			mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Enterprise plan required'));
			mockExecuteFunctions.continueOnFail.mockReturnValue(false);

			const items = [{ json: {} }];

			await expect(executeOrganizationOperations.call(mockExecuteFunctions, items))
				.rejects.toThrow('Enterprise plan required');
		});
	});
});

describe('Member Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        accessToken: 'test-token',
        baseUrl: 'https://api.bitwarden.com'
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
      },
    };
  });

  it('should get all members successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValue('getAllMembers');
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      data: [{ id: '1', email: 'user@example.com' }]
    });

    const result = await executeMemberOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://api.bitwarden.com/public/members',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      json: true,
    });
    expect(result).toHaveLength(1);
  });

  it('should get specific member successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getMember')
      .mockReturnValueOnce('member123');
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      id: 'member123',
      email: 'user@example.com'
    });

    const result = await executeMemberOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://api.bitwarden.com/public/members/member123',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      json: true,
    });
    expect(result).toHaveLength(1);
  });

  it('should create member successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('createMember')
      .mockReturnValueOnce('newuser@example.com')
      .mockReturnValueOnce(2)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce('ext123')
      .mockReturnValueOnce([]);
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      id: 'new-member-id',
      email: 'newuser@example.com'
    });

    const result = await executeMemberOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://api.bitwarden.com/public/members',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      json: true,
      body: {
        email: 'newuser@example.com',
        type: 2,
        accessAll: false,
        externalId: 'ext123',
      },
    });
    expect(result).toHaveLength(1);
  });

  it('should handle errors gracefully when continueOnFail is true', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValue('getAllMembers');
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));

    const result = await executeMemberOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json.error).toBe('API Error');
  });

  it('should throw error when continueOnFail is false', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValue('getAllMembers');
    mockExecuteFunctions.continueOnFail.mockReturnValue(false);
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));

    await expect(
      executeMemberOperations.call(mockExecuteFunctions, [{ json: {} }])
    ).rejects.toThrow('API Error');
  });
});

describe('Group Resource', () => {
	let mockExecuteFunctions: any;

	beforeEach(() => {
		mockExecuteFunctions = {
			getNodeParameter: jest.fn(),
			getCredentials: jest.fn().mockResolvedValue({
				accessToken: 'test-token',
				baseUrl: 'https://api.bitwarden.com',
			}),
			getInputData: jest.fn().mockReturnValue([{ json: {} }]),
			getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
			continueOnFail: jest.fn().mockReturnValue(false),
			helpers: {
				httpRequest: jest.fn(),
			},
		};
	});

	it('should get all groups successfully', async () => {
		mockExecuteFunctions.getNodeParameter.mockReturnValue('getAllGroups');
		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({ data: [{ id: '1', name: 'Test Group' }] });

		const result = await executeGroupOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
			method: 'GET',
			url: 'https://api.bitwarden.com/public/groups',
			headers: {
				'Authorization': 'Bearer test-token',
				'Content-Type': 'application/json',
			},
			json: true,
		});
		expect(result[0].json).toEqual({ data: [{ id: '1', name: 'Test Group' }] });
	});

	it('should get specific group successfully', async () => {
		mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
			if (param === 'operation') return 'getGroup';
			if (param === 'groupId') return 'group-123';
			return undefined;
		});
		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({ id: 'group-123', name: 'Test Group' });

		const result = await executeGroupOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
			method: 'GET',
			url: 'https://api.bitwarden.com/public/groups/group-123',
			headers: {
				'Authorization': 'Bearer test-token',
				'Content-Type': 'application/json',
			},
			json: true,
		});
		expect(result[0].json.id).toBe('group-123');
	});

	it('should create group successfully', async () => {
		mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
			if (param === 'operation') return 'createGroup';
			if (param === 'name') return 'New Group';
			if (param === 'accessAll') return false;
			if (param === 'externalId') return 'ext-123';
			if (param === 'collections') return {};
			if (param === 'members') return 'member-1,member-2';
			return undefined;
		});
		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({ id: 'new-group', name: 'New Group' });

		const result = await executeGroupOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
			method: 'POST',
			url: 'https://api.bitwarden.com/public/groups',
			headers: {
				'Authorization': 'Bearer test-token',
				'Content-Type': 'application/json',
			},
			body: {
				name: 'New Group',
				accessAll: false,
				externalId: 'ext-123',
				members: ['member-1', 'member-2'],
			},
			json: true,
		});
		expect(result[0].json.name).toBe('New Group');
	});

	it('should handle errors gracefully when continueOnFail is true', async () => {
		mockExecuteFunctions.getNodeParameter.mockReturnValue('getAllGroups');
		mockExecuteFunctions.continueOnFail.mockReturnValue(true);
		mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));

		const result = await executeGroupOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(result[0].json.error).toBe('API Error');
		expect(result[0].pairedItem).toEqual({ item: 0 });
	});

	it('should throw error when continueOnFail is false', async () => {
		mockExecuteFunctions.getNodeParameter.mockReturnValue('getAllGroups');
		mockExecuteFunctions.continueOnFail.mockReturnValue(false);
		mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));

		await expect(executeGroupOperations.call(mockExecuteFunctions, [{ json: {} }])).rejects.toThrow('API Error');
	});
});

describe('Collection Resource', () => {
	let mockExecuteFunctions: any;

	beforeEach(() => {
		mockExecuteFunctions = {
			getNodeParameter: jest.fn(),
			getCredentials: jest.fn().mockResolvedValue({
				accessToken: 'test-token',
				baseUrl: 'https://api.bitwarden.com',
			}),
			getInputData: jest.fn().mockReturnValue([{ json: {} }]),
			getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
			continueOnFail: jest.fn().mockReturnValue(false),
			helpers: {
				httpRequest: jest.fn(),
				requestWithAuthentication: jest.fn(),
			},
		};
	});

	test('getAllCollections should fetch all collections successfully', async () => {
		const mockResponse = { data: [{ id: '1', name: 'Test Collection' }] };
		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);
		mockExecuteFunctions.getNodeParameter.mockReturnValue('getAllCollections');

		const result = await executeCollectionOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
			method: 'GET',
			url: 'https://api.bitwarden.com/public/collections',
			headers: {
				Authorization: 'Bearer test-token',
				'Content-Type': 'application/json',
			},
			json: true,
		});
		expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
	});

	test('getCollection should fetch specific collection successfully', async () => {
		const mockResponse = { id: '1', name: 'Test Collection' };
		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);
		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('getCollection')
			.mockReturnValueOnce('collection-123');

		const result = await executeCollectionOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
			method: 'GET',
			url: 'https://api.bitwarden.com/public/collections/collection-123',
			headers: {
				Authorization: 'Bearer test-token',
				'Content-Type': 'application/json',
			},
			json: true,
		});
		expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
	});

	test('createCollection should create collection successfully', async () => {
		const mockResponse = { id: '1', name: 'New Collection' };
		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);
		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('createCollection')
			.mockReturnValueOnce('New Collection')
			.mockReturnValueOnce('ext-123')
			.mockReturnValueOnce('[]')
			.mockReturnValueOnce('[]');

		const result = await executeCollectionOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
			method: 'POST',
			url: 'https://api.bitwarden.com/public/collections',
			headers: {
				Authorization: 'Bearer test-token',
				'Content-Type': 'application/json',
			},
			body: {
				name: 'New Collection',
				externalId: 'ext-123',
			},
			json: true,
		});
		expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
	});

	test('updateCollection should update collection successfully', async () => {
		const mockResponse = { id: '1', name: 'Updated Collection' };
		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);
		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('updateCollection')
			.mockReturnValueOnce('collection-123')
			.mockReturnValueOnce('Updated Collection')
			.mockReturnValueOnce('ext-456')
			.mockReturnValueOnce('[]')
			.mockReturnValueOnce('[]');

		const result = await executeCollectionOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
			method: 'PUT',
			url: 'https://api.bitwarden.com/public/collections/collection-123',
			headers: {
				Authorization: 'Bearer test-token',
				'Content-Type': 'application/json',
			},
			body: {
				name: 'Updated Collection',
				externalId: 'ext-456',
			},
			json: true,
		});
		expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
	});

	test('deleteCollection should delete collection successfully', async () => {
		const mockResponse = { success: true };
		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);
		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('deleteCollection')
			.mockReturnValueOnce('collection-123');

		const result = await executeCollectionOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
			method: 'DELETE',
			url: 'https://api.bitwarden.com/public/collections/collection-123',
			headers: {
				Authorization: 'Bearer test-token',
				'Content-Type': 'application/json',
			},
			json: true,
		});
		expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
	});

	test('should handle API errors correctly', async () => {
		const error = new Error('API Error');
		mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(error);
		mockExecuteFunctions.getNodeParameter.mockReturnValue('getAllCollections');

		await expect(
			executeCollectionOperations.call(mockExecuteFunctions, [{ json: {} }]),
		).rejects.toThrow('API Error');
	});

	test('should continue on fail when enabled', async () => {
		const error = new Error('API Error');
		mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(error);
		mockExecuteFunctions.getNodeParameter.mockReturnValue('getAllCollections');
		mockExecuteFunctions.continueOnFail.mockReturnValue(true);

		const result = await executeCollectionOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(result).toEqual([{ json: { error: 'API Error' }, pairedItem: { item: 0 } }]);
	});
});

describe('Event Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        accessToken: 'test-token',
        baseUrl: 'https://api.bitwarden.com',
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn(),
      },
    };
  });

  describe('getAllEvents operation', () => {
    it('should retrieve all events successfully', async () => {
      const mockResponse = {
        data: [
          {
            id: 'event-1',
            type: 'user_loggedIn',
            userId: 'user-123',
            date: '2023-01-01T10:00:00Z',
          },
        ],
        object: 'list',
      };

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getAllEvents')
        .mockReturnValueOnce('2023-01-01T00:00:00Z')
        .mockReturnValueOnce('2023-01-31T23:59:59Z')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('');

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeEventOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.bitwarden.com/public/events?start=2023-01-01T00%3A00%3A00Z&end=2023-01-31T23%3A59%3A59Z',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        json: true,
      });

      expect(result).toEqual([
        {
          json: mockResponse,
          pairedItem: { item: 0 },
        },
      ]);
    });

    it('should handle getAllEvents with all filters', async () => {
      const mockResponse = { data: [], object: 'list' };

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getAllEvents')
        .mockReturnValueOnce('2023-01-01T00:00:00Z')
        .mockReturnValueOnce('2023-01-31T23:59:59Z')
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce('item-456');

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeEventOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.bitwarden.com/public/events?start=2023-01-01T00%3A00%3A00Z&end=2023-01-31T23%3A59%3A59Z&actingUserId=user-123&itemId=item-456',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        json: true,
      });

      expect(result).toEqual([
        {
          json: mockResponse,
          pairedItem: { item: 0 },
        },
      ]);
    });

    it('should handle API errors gracefully', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getAllEvents')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('');

      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);

      const result = await executeEventOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toEqual([
        {
          json: { error: 'API Error' },
          pairedItem: { item: 0 },
        },
      ]);
    });

    it('should throw error when continueOnFail is false', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getAllEvents')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('');

      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));
      mockExecuteFunctions.continueOnFail.mockReturnValue(false);

      await expect(executeEventOperations.call(mockExecuteFunctions, [{ json: {} }])).rejects.toThrow('API Error');
    });
  });
});

describe('Secret Resource', () => {
	let mockExecuteFunctions: any;

	beforeEach(() => {
		mockExecuteFunctions = {
			getNodeParameter: jest.fn(),
			getCredentials: jest.fn().mockResolvedValue({
				accessToken: 'test-token',
				baseUrl: 'https://api.bitwarden.com',
			}),
			getInputData: jest.fn().mockReturnValue([{ json: {} }]),
			getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
			continueOnFail: jest.fn().mockReturnValue(false),
			helpers: {
				httpRequest: jest.fn(),
			},
		};
	});

	it('should get all secrets', async () => {
		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('getAllSecrets')
			.mockReturnValueOnce('org-123');

		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
			secrets: [{ id: '1', key: 'test-key' }],
		});

		const result = await executeSecretOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
			method: 'GET',
			url: 'https://api.bitwarden.com/secrets',
			headers: {
				Authorization: 'Bearer test-token',
				'Content-Type': 'application/json',
			},
			qs: { organizationId: 'org-123' },
			json: true,
		});
		expect(result).toHaveLength(1);
	});

	it('should get a specific secret', async () => {
		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('getSecret')
			.mockReturnValueOnce('secret-123');

		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
			id: 'secret-123',
			key: 'test-key',
		});

		const result = await executeSecretOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
			method: 'GET',
			url: 'https://api.bitwarden.com/secrets/secret-123',
			headers: {
				Authorization: 'Bearer test-token',
				'Content-Type': 'application/json',
			},
			json: true,
		});
		expect(result).toHaveLength(1);
	});

	it('should create a secret', async () => {
		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('createSecret')
			.mockReturnValueOnce('org-123')
			.mockReturnValueOnce('test-key')
			.mockReturnValueOnce('test-value')
			.mockReturnValueOnce('test note')
			.mockReturnValueOnce('proj-1,proj-2');

		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
			id: 'secret-123',
			key: 'test-key',
		});

		const result = await executeSecretOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
			method: 'POST',
			url: 'https://api.bitwarden.com/secrets',
			headers: {
				Authorization: 'Bearer test-token',
				'Content-Type': 'application/json',
			},
			body: {
				organizationId: 'org-123',
				key: 'test-key',
				value: 'test-value',
				note: 'test note',
				projectIds: ['proj-1', 'proj-2'],
			},
			json: true,
		});
		expect(result).toHaveLength(1);
	});

	it('should update a secret', async () => {
		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('updateSecret')
			.mockReturnValueOnce('secret-123')
			.mockReturnValueOnce('updated-key')
			.mockReturnValueOnce('updated-value')
			.mockReturnValueOnce('updated note')
			.mockReturnValueOnce('proj-3');

		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
			id: 'secret-123',
			key: 'updated-key',
		});

		const result = await executeSecretOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
			method: 'PUT',
			url: 'https://api.bitwarden.com/secrets/secret-123',
			headers: {
				Authorization: 'Bearer test-token',
				'Content-Type': 'application/json',
			},
			body: {
				key: 'updated-key',
				value: 'updated-value',
				note: 'updated note',
				projectIds: ['proj-3'],
			},
			json: true,
		});
		expect(result).toHaveLength(1);
	});

	it('should delete a secret', async () => {
		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('deleteSecret')
			.mockReturnValueOnce('secret-123');

		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({ success: true });

		const result = await executeSecretOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
			method: 'DELETE',
			url: 'https://api.bitwarden.com/secrets/secret-123',
			headers: {
				Authorization: 'Bearer test-token',
				'Content-Type': 'application/json',
			},
			json: true,
		});
		expect(result).toHaveLength(1);
	});

	it('should handle errors gracefully when continueOnFail is true', async () => {
		mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('getSecret');
		mockExecuteFunctions.continueOnFail.mockReturnValue(true);
		mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));

		const result = await executeSecretOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(result).toHaveLength(1);
		expect(result[0].json.error).toBe('API Error');
	});
});

describe('Project Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        accessToken: 'test-token',
        baseUrl: 'https://api.bitwarden.com'
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn()
      },
    };
  });

  describe('getAllProjects operation', () => {
    it('should list all projects successfully', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getAllProjects')
        .mockReturnValueOnce('org-123');

      const mockResponse = {
        data: [
          { id: 'proj-1', name: 'Project 1' },
          { id: 'proj-2', name: 'Project 2' }
        ]
      };

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeProjectOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.bitwarden.com/projects?organizationId=org-123',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        json: true,
      });
    });

    it('should handle getAllProjects error', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getAllProjects')
        .mockReturnValueOnce('org-123');
      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));

      await expect(executeProjectOperations.call(mockExecuteFunctions, [{ json: {} }])).rejects.toThrow('API Error');
    });
  });

  describe('getProject operation', () => {
    it('should get project successfully', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getProject')
        .mockReturnValueOnce('proj-123');

      const mockResponse = { id: 'proj-123', name: 'Test Project' };
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeProjectOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
    });

    it('should handle getProject error', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getProject')
        .mockReturnValueOnce('proj-123');
      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Project not found'));

      await expect(executeProjectOperations.call(mockExecuteFunctions, [{ json: {} }])).rejects.toThrow('Project not found');
    });
  });

  describe('createProject operation', () => {
    it('should create project successfully', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('createProject')
        .mockReturnValueOnce('org-123')
        .mockReturnValueOnce('New Project');

      const mockResponse = { id: 'proj-456', name: 'New Project', organizationId: 'org-123' };
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeProjectOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.bitwarden.com/projects',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: {
          organizationId: 'org-123',
          name: 'New Project',
        },
        json: true,
      });
    });
  });

  describe('updateProject operation', () => {
    it('should update project successfully', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('updateProject')
        .mockReturnValueOnce('proj-123')
        .mockReturnValueOnce('Updated Project');

      const mockResponse = { id: 'proj-123', name: 'Updated Project' };
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeProjectOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
    });
  });

  describe('deleteProject operation', () => {
    it('should delete project successfully', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('deleteProject')
        .mockReturnValueOnce('proj-123');

      const mockResponse = { success: true };
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeProjectOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'DELETE',
        url: 'https://api.bitwarden.com/projects/proj-123',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        json: true,
      });
    });
  });
});
});
