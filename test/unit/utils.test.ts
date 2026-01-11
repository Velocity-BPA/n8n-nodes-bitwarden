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
	formatExecutionData,
	parseCollectionAccess,
	parseGroupAccess,
	isValidGuid,
	isValidEmail,
	formatDate,
	getMemberTypeName,
	getMemberStatusName,
	getPolicyTypeName,
	getEventTypeName,
	cleanEmptyValues,
	chunkArray,
} from '../../nodes/Bitwarden/utils';

describe('Bitwarden Utils', () => {
	describe('formatExecutionData', () => {
		it('should format single item correctly', () => {
			const data = { id: '123', name: 'Test' };
			const result = formatExecutionData(data);
			expect(result).toEqual([{ json: { id: '123', name: 'Test' } }]);
		});

		it('should format array of items correctly', () => {
			const data = [
				{ id: '1', name: 'First' },
				{ id: '2', name: 'Second' },
			];
			const result = formatExecutionData(data);
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ json: { id: '1', name: 'First' } });
			expect(result[1]).toEqual({ json: { id: '2', name: 'Second' } });
		});

		it('should handle empty array', () => {
			const result = formatExecutionData([]);
			expect(result).toEqual([]);
		});
	});

	describe('parseCollectionAccess', () => {
		it('should parse collection access array correctly', () => {
			const input = [
				{ collectionId: 'col1', readOnly: true, hidePasswords: false, manage: false },
				{ collectionId: 'col2', readOnly: false, hidePasswords: true, manage: true },
			];
			const result = parseCollectionAccess(input);
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				id: 'col1',
				readOnly: true,
				hidePasswords: false,
				manage: false,
			});
			expect(result[1]).toEqual({
				id: 'col2',
				readOnly: false,
				hidePasswords: true,
				manage: true,
			});
		});

		it('should handle empty array', () => {
			const result = parseCollectionAccess([]);
			expect(result).toEqual([]);
		});

		it('should handle single collection', () => {
			const input = [{ collectionId: 'col1', readOnly: true }];
			const result = parseCollectionAccess(input);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				id: 'col1',
				readOnly: true,
				hidePasswords: false,
				manage: false,
			});
		});

		it('should default optional values to false', () => {
			const input = [{ collectionId: 'col1' }];
			const result = parseCollectionAccess(input);
			expect(result[0]).toEqual({
				id: 'col1',
				readOnly: false,
				hidePasswords: false,
				manage: false,
			});
		});
	});

	describe('parseGroupAccess', () => {
		it('should parse group access array correctly', () => {
			const input = [
				{ groupId: 'grp1', readOnly: true, hidePasswords: false, manage: false },
				{ groupId: 'grp2', readOnly: false, hidePasswords: true, manage: true },
			];
			const result = parseGroupAccess(input);
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				id: 'grp1',
				readOnly: true,
				hidePasswords: false,
				manage: false,
			});
		});

		it('should handle empty array', () => {
			const result = parseGroupAccess([]);
			expect(result).toEqual([]);
		});
	});

	describe('isValidGuid', () => {
		it('should validate correct GUIDs', () => {
			expect(isValidGuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
			expect(isValidGuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
		});

		it('should reject invalid GUIDs', () => {
			expect(isValidGuid('invalid')).toBe(false);
			expect(isValidGuid('550e8400-e29b-41d4-a716')).toBe(false);
			expect(isValidGuid('')).toBe(false);
		});
	});

	describe('isValidEmail', () => {
		it('should validate correct emails', () => {
			expect(isValidEmail('test@example.com')).toBe(true);
			expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
		});

		it('should reject invalid emails', () => {
			expect(isValidEmail('invalid')).toBe(false);
			expect(isValidEmail('test@')).toBe(false);
			expect(isValidEmail('@example.com')).toBe(false);
			expect(isValidEmail('')).toBe(false);
		});
	});

	describe('formatDate', () => {
		it('should format Date object correctly', () => {
			const date = new Date('2024-01-15T10:30:00Z');
			const result = formatDate(date);
			expect(result).toBe('2024-01-15T10:30:00.000Z');
		});

		it('should format date string correctly', () => {
			const result = formatDate('2024-01-15');
			expect(result).toContain('2024-01-15');
		});
	});

	describe('getMemberTypeName', () => {
		it('should return correct type names', () => {
			expect(getMemberTypeName(0)).toBe('Owner');
			expect(getMemberTypeName(1)).toBe('Admin');
			expect(getMemberTypeName(2)).toBe('User');
			expect(getMemberTypeName(3)).toBe('Manager');
			expect(getMemberTypeName(4)).toBe('Custom');
		});

		it('should return Unknown for invalid types', () => {
			expect(getMemberTypeName(99)).toBe('Unknown');
		});
	});

	describe('getMemberStatusName', () => {
		it('should return correct status names', () => {
			expect(getMemberStatusName(0)).toBe('Invited');
			expect(getMemberStatusName(1)).toBe('Accepted');
			expect(getMemberStatusName(2)).toBe('Confirmed');
			expect(getMemberStatusName(-1)).toBe('Revoked');
		});

		it('should return Unknown for invalid statuses', () => {
			expect(getMemberStatusName(99)).toBe('Unknown');
		});
	});

	describe('getPolicyTypeName', () => {
		it('should return correct policy type names', () => {
			expect(getPolicyTypeName(0)).toBe('Two-Factor Authentication');
			expect(getPolicyTypeName(1)).toBe('Master Password');
			expect(getPolicyTypeName(4)).toBe('Require SSO');
		});

		it('should return Unknown for invalid policy types', () => {
			expect(getPolicyTypeName(99)).toBe('Unknown');
		});
	});

	describe('getEventTypeName', () => {
		it('should return correct event type names', () => {
			expect(getEventTypeName(1000)).toBe('User Logged In');
			expect(getEventTypeName(1100)).toBe('Cipher Created');
			expect(getEventTypeName(1300)).toBe('Collection Created');
		});

		it('should return Unknown for invalid event types', () => {
			expect(getEventTypeName(9999)).toBe('Unknown');
		});
	});

	describe('cleanEmptyValues', () => {
		it('should remove null and undefined values', () => {
			const input = { a: 1, b: null, c: undefined, d: 'test', e: 0 };
			const result = cleanEmptyValues(input);
			expect(result).toEqual({ a: 1, d: 'test', e: 0 });
		});

		it('should remove empty strings', () => {
			const input = { a: '', b: 'test' };
			const result = cleanEmptyValues(input);
			expect(result).toEqual({ b: 'test' });
		});

		it('should handle empty object', () => {
			const result = cleanEmptyValues({});
			expect(result).toEqual({});
		});
	});

	describe('chunkArray', () => {
		it('should chunk array correctly', () => {
			const input = [1, 2, 3, 4, 5];
			const result = chunkArray(input, 2);
			expect(result).toEqual([[1, 2], [3, 4], [5]]);
		});

		it('should handle empty array', () => {
			const result = chunkArray([], 2);
			expect(result).toEqual([]);
		});

		it('should handle chunk size larger than array', () => {
			const input = [1, 2];
			const result = chunkArray(input, 10);
			expect(result).toEqual([[1, 2]]);
		});
	});
});

describe('Bitwarden Types', () => {
	describe('MemberType enum values', () => {
		it('should have correct member type values', () => {
			// These are implicitly tested through getMemberTypeName
			expect(getMemberTypeName(0)).toBe('Owner');
			expect(getMemberTypeName(1)).toBe('Admin');
			expect(getMemberTypeName(2)).toBe('User');
			expect(getMemberTypeName(3)).toBe('Manager');
			expect(getMemberTypeName(4)).toBe('Custom');
		});
	});
});
