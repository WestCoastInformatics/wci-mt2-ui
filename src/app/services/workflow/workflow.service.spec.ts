import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrModule } from 'ngx-toastr';

import { WorkflowService } from './workflow.service';

describe('WorkflowService', () => {
	let service: WorkflowService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				HttpClientTestingModule,
				ToastrModule.forRoot()
			]
		});
		service = TestBed.inject(WorkflowService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
