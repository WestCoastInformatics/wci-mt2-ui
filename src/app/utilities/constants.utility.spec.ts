import { Constants } from './constants.utility';

describe('Constants', () => {
	it('should have SNOMED root concept ID', () => {
		expect(Constants.SNOMED_ROOT_CONCEPT_ID).toBe('138875005');
	});

	it('should have default language code', () => {
		expect(Constants.DEFAULT_LANGUAGE_CODE).toBe('en');
	});

	it('should have default language refset', () => {
		expect(Constants.DEFAULT_LANGUAGE_REFSET).toBe('900000000000509007');
	});

	it('should have INTENSIONAL type', () => {
		expect(Constants.INTENSIONAL).toBe('INTENSIONAL');
	});

	it('should have EXTENSIONAL type', () => {
		expect(Constants.EXTENSIONAL).toBe('EXTENSIONAL');
	});

	it('should have IN_DEVELOPMENT status', () => {
		expect(Constants.IN_DEVELOPMENT).toBe('IN DEVELOPMENT');
	});

	it('should have PUBLISHED status', () => {
		expect(Constants.PUBLISHED).toBe('PUBLISHED');
	});

	it('should have a REFSET_STATUS_MAP with expected keys', () => {
		expect(Constants.REFSET_STATUS_MAP).toBeDefined();
		expect(Constants.REFSET_STATUS_MAP['IN DEVELOPMENT']).toBe('In Development');
		expect(Constants.REFSET_STATUS_MAP['PUBLISHED']).toBe('Published');
		expect(Constants.REFSET_STATUS_MAP['IN_EDIT']).toBe('In Edit');
		expect(Constants.REFSET_STATUS_MAP['IN_REVIEW']).toBe('In Review');
	});

	it('should derive DEFAULT_ACCEPT_LANGUAGE from language code and refset', () => {
		expect(Constants.DEFAULT_ACCEPT_LANGUAGE).toBe('en-X-900000000000509007');
	});
});
