import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RefsetService } from '../rest/refset.service';

@Injectable({
    providedIn: 'root',
})
export class WorkflowService {
    constructor(private readonly refsetService: RefsetService) {}

    saveNotes(refsetInternalId: string, workflowHistoryNotes: string): Observable<any> {
        return this.refsetService
            .updateWorkflowStatus(refsetInternalId, workflowHistoryNotes);
    }

    setWorkflowStatusByAction(
        refsetInternalId: string,
        user: string,
        action: string,
        workflowHistoryNotes: string
    ): Observable<any> {
        return this.refsetService.setWorkflowStatusByAction(
            refsetInternalId,
            action,
            user,
            workflowHistoryNotes
        );
    }
}
