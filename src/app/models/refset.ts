export class Refset {
	id: string;
	refsetId: string;
	name: string;
	type: string;
	versionStatus: string;
	versionDate: string;
	moduleId?: string;
	externalUrl?: string;
	definitionClauses?: any[];
	narrative?: string;
	versionNotes?: string;
	privateRefset: boolean;
	localSet: boolean;
	tags?: any;
	edition?: string;
	active: boolean;
	lastModifiedDate?: string;
	downloadable: boolean;
	feedbackVisible: boolean;
}
