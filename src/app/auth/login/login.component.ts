import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication/authentication.service';

declare var toastr: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    userName: any;
    password = null;
    userData: any;

    constructor( private router: Router,
                 private authService: AuthenticationService) {

        if (this.authService.isAuthenticated()) {
            console.log('is authenticated');
            this.router.navigate(['/directory']);
            $('.logout').css('display', 'block');
        } else {
            $('.logout').css('display', 'none');
            this.login();
        }
    }

    onSubmit(): any {
        this.authService.login(this.userName, this.userData).subscribe( data => {
            localStorage.setItem('auth_token', data.authToken);
            localStorage.setItem('refset_user', JSON.stringify(data));
            this.router.navigate(['directory']);
            toastr.success('Logged in Successfully');

        }, err => {
            //toastr.error(err.error.error);
            console.error(err);
        });
    }

    getActiveUserDetails(token: any): any {
        // this.ngxLoader.start();
        // this.authService.getActiveUserDetails(token).subscribe( data => {
        //     const userData = JSON.stringify(data);
        //     localStorage.setItem('user_data', userData);
        //     this.ngxLoader.stop();
        // }, err => {
        //     this.ngxLoader.stop();
        //     toastr.error(err.error.error);
        // });
    }

    login(): any {
        console.debug("login user");

        // check ims-api/account for user info
        // returns a 403 error is user is not logged through IMS
        this.authService.setUser();

        this.authService.getUser().subscribe(data => {
            console.log("user is ------------------", data);

            this.userData = data;
            // TODO: needs clean up
            //if user data is null, redirect to
            if (data == null) {

            }
            else
            {
                this.userName = data.username;
                const token = localStorage.getItem('auth_token');
                 console.log("token is", token);
                 if (!token || token == null) {
                    console.log("token is ", token, ", call onSubmit")
                    this.onSubmit();
                 }
            }
        }, err => {
            toastr.error(err.error.error);
        });

        // if previous call shows error

    }

    logout(): any {
        console.debug("logout user");
        this.authService.notAuthenticated();
    }

    ngOnInit(): void {
    }

}
