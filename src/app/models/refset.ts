export class Refset {
    id: string;
    refsetId: string;
    name: string;
    type: string;
    versionStatus: string;
    versionDate: string;
    narrative?: string;
    versionNotes?: string;
    isPrivate: boolean;
    tags?: any;
    edition?: string;
    active: boolean;
    lastModifiedDate?: string;
}