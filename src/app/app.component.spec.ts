import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { EnvService } from './services/environment/env.service';
import { AuthenticationService } from './services/authentication/authentication.service';

describe('AppComponent', () => {
	let component: AppComponent;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RouterTestingModule],
			declarations: [AppComponent],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
			providers: [
				{
					provide: AuthenticationService,
					useValue: { prepareUserSession: jest.fn() }
				},
				{
					provide: EnvService,
					useValue: { env: 'test' }
				},
				Title,
			],
		}).compileComponents();

		const fixture = TestBed.createComponent(AppComponent);
		component = fixture.componentInstance;
	});

	it('should create the app', () => {
		expect(component).toBeTruthy();
	});

	it('should have an empty history array initially', () => {
		expect(component.history).toEqual([]);
	});
});
