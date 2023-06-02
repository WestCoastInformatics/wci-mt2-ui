export class Constants {
	static SNOMED_ROOT_CONCEPT_ID = '138875005';
	static DEFAULT_LANGUAGE_CODE = 'en';
	static DEFAULT_LANGUAGE_REFSET = '900000000000509007';
	static DEFAULT_LANGUAGE_TYPE = 'PT';
	static DEFAULT_ACCEPT_LANGUAGE = Constants.DEFAULT_LANGUAGE_CODE + '-X-' + Constants.DEFAULT_LANGUAGE_REFSET;
	static INTENSIONAL = 'INTENSIONAL';
	static EXTENSIONAL = 'EXTENSIONAL';
	static COPY = 'COPY';
	static COMBINATION = 'COMBINATION';
	static EXTERNAL = 'EXTERNAL';
	static INCLUSION = 'INCLUSION';
	static EXCLUSION = 'EXCLUSION';
	static IN_DEVELOPMENT = 'IN DEVELOPMENT';
	static PUBLISHED = 'PUBLISHED';

	static REFSET_STATUS_MAP = {
		'IN DEVELOPMENT': 'In Development',
		PUBLISHED: 'Published',
		IN_EDIT: 'In Edit',
		IN_REVIEW: 'In Review',
		IN_UPGRADE: 'In Upgrade',
		READY_FOR_EDIT: 'Ready for Edit',
		READY_FOR_PUBLICATION: 'Ready for Publication',
		READY_FOR_REVIEW: 'Ready for Review',
		REVIEW_COMPLETED: 'Review Completed',
	};
}
