import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication/authentication.service';

declare var toastr: any;

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
    userName: any;
    password = null;
    userData: any;

    constructor(private router: Router, private authService: AuthenticationService) {

        if (this.authService.isAuthenticated()) {

            console.log('is authenticated');
            this.router.navigate(['library']);
            //$('.logout').css('display', 'block');

        } else {

            //$('.logout').css('display', 'none');
            this.login();
        }
    }

    onSubmit(): any {

        this.authService.authenticateWithBackend(this.userData).subscribe(
            (data) => {
                localStorage.setItem('auth_token', data.authToken);
                localStorage.setItem('refset_user', JSON.stringify(data));
                this.router.navigate(['library']);
            },
            (err) => {
                //toastr.error(err.error.error);
                console.error(err);
            }
        );
    }

    login(): any {

        // IMS login
        this.authService.imsLogin();
    }

    logout(): any {

        console.debug('logout user');
        this.authService.notAuthenticated();
    }

    ngOnInit(): void { }
}
