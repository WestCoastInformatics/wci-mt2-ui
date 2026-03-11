import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';

import { WorkflowService } from './workflow.service';
import { RefsetService } from '../rest/refset.service';

describe('WorkflowService', () => {
	let service: WorkflowService;
	let refsetService: RefsetService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				HttpClientTestingModule,
				ToastrModule.forRoot()
			]
		});
		service = TestBed.inject(WorkflowService);
		refsetService = TestBed.inject(RefsetService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('saveNotes should delegate to refsetService.updateWorkflowStatus', () => {
		const spy = jest.spyOn(refsetService, 'updateWorkflowStatus').mockReturnValue(of({}));
		service.saveNotes('id-123', 'some notes');
		expect(spy).toHaveBeenCalledWith('id-123', 'some notes');
	});

	it('setWorkflowStatusByAction should delegate to refsetService.setWorkflowStatusByAction', () => {
		const spy = jest.spyOn(refsetService, 'setWorkflowStatusByAction').mockReturnValue(of({}));
		service.setWorkflowStatusByAction('id-123', 'user1', 'APPROVE', 'notes');
		expect(spy).toHaveBeenCalledWith('id-123', 'APPROVE', 'user1', 'notes');
	});
});
