import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Component({
    selector: 'landing-page',
    templateUrl: './landing-page.component.html'
})
export class LandingPageComponent implements OnInit {
    year: number = new Date().getFullYear();
    isGuestMode = true;
    loginForm: FormGroup;

    constructor(private authService: AuthenticationService,
        private formBuilder: FormBuilder) {
        document.body.scrollTop = 0;
    }

    ngOnInit(): void {
        this.loginForm = this.formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });
    }

    login(): void {
        this.authService.imsLogin();
    }

    onSubmit() {

        const formControls = this.loginForm.controls;
        console.log(formControls.username.value);
        console.log(formControls.password.value);

    }
}
