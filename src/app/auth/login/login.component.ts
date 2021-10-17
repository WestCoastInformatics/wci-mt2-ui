import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {AuthenticationService} from '../../services/authentication/authentication.service';

declare var toastr: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    userName: any;
    password = null;

    constructor( private router: Router,
                 private authService: AuthenticationService) {
        if (this.authService.isAuthenticated()) {
            console.log('is authenticated');
            this.router.navigate(['/directory']);
            $('.logout').css('display', 'block');
        } else {
            $('.logout').css('display', 'none');
        }
    }
    onSubmit(): any {
        this.authService.login(this.userName, this.password).subscribe( data => {
            localStorage.setItem('auth_token', data.authToken);
            this.router.navigate(['directory']);
            toastr.success('Logged in Successfully');
        }, err => {
            toastr.error(err.error.error);
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
    ngOnInit(): void {
    }

}
