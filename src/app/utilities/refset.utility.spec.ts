import { RefsetUtility } from './refset.utility';

describe('RefsetUtility', () => {
	describe('getStatus', () => {
		it('should return "Active" for true', () => {
			expect(RefsetUtility.getStatus(true)).toBe('Active');
		});

		it('should return "Active" for string "true"', () => {
			expect(RefsetUtility.getStatus('true')).toBe('Active');
		});

		it('should return "Inactive" for false', () => {
			expect(RefsetUtility.getStatus(false)).toBe('Inactive');
		});

		it('should return "Inactive" for string "false"', () => {
			expect(RefsetUtility.getStatus('false')).toBe('Inactive');
		});
	});

	describe('getDefinedImage', () => {
		it('should return lined icon for defined=true', () => {
			expect(RefsetUtility.getDefinedImage(true)).toContain('linedTaxonomyIcon');
		});

		it('should return unlined icon for defined=false', () => {
			expect(RefsetUtility.getDefinedImage(false)).toContain('unlinedTaxonomyIcon');
		});
	});

	describe('getEditionFlagIcon', () => {
		it('should return flag icon path for edition branch', () => {
			const result = RefsetUtility.getEditionFlagIcon('MAIN/SNOMEDCT-US');
			expect(result).toBe('/assets/flags/us.png');
		});

		it('should return empty string when no country code is present', () => {
			const result = RefsetUtility.getEditionFlagIcon('MAIN');
			expect(result).toBe('');
		});

		it('should strip update suffix from country code', () => {
			const result = RefsetUtility.getEditionFlagIcon('MAIN/SNOMEDCT-USUpd202109');
			expect(result).toContain('/assets/flags/');
		});
	});

	describe('getLanguageRefsetFlagIcon', () => {
		it('should return flag icon path from language refset ID', () => {
			const result = RefsetUtility.getLanguageRefsetFlagIcon('900000000000509007');
			expect(result).toBe('/assets/flags/900000000000509007.png');
		});
	});

	describe('setEmptyChildrenNull', () => {
		it('should set empty children arrays to null', () => {
			const concepts = [
				{ id: '1', children: [] },
				{ id: '2', children: [{ id: '3' }] },
			];
			RefsetUtility.setEmptyChildrenNull(concepts);
			expect(concepts[0].children).toBeNull();
			expect(concepts[1].children).toEqual([{ id: '3' }]);
		});

		it('should leave null children as null', () => {
			const concepts = [{ id: '1', children: null }];
			RefsetUtility.setEmptyChildrenNull(concepts);
			expect(concepts[0].children).toBeNull();
		});
	});
});
