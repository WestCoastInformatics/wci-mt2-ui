import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RefsetService } from '../rest/refset.service';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  
  constructor(private readonly refsetService: RefsetService) { }

  saveNotes(refsetId: string, workflowHistoryNotes: string): void {
    console.log(refsetId);
    console.log(workflowHistoryNotes);
    this.refsetService.updateWorkflowStatus(refsetId, workflowHistoryNotes).subscribe((results) => {
      console.log(results);
    });
  }

  setWorkflowStatusByAction(refsetId: string, user: string, action: string, workflowHistoryNotes: string): Observable<any> {
    return this.refsetService.setWorkflowStatusByAction(refsetId, action, user, workflowHistoryNotes);
  }
}
