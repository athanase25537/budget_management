import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule, ɵInternalFormsSharedModule } from "@angular/forms";
import { AuthService } from '../../services/auth-service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ɵInternalFormsSharedModule, CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  username: string = "";
  password: string = "";
  isShow:boolean = false;
  error: boolean = false;

  @Output() isConnected = new EventEmitter<boolean>();

  constructor(private authService: AuthService, private router: Router) { }

  toggleShowPassword(e: Event) {
    this.isShow = !this.isShow;
  }

  onSubmit() {
    this.authService.login(this.username, this.password).subscribe({
      next: (data) => {
        if(data.status == "fail") {
          this.error = true;
        } else {
          this.isConnected.emit(true)
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        console.log("error:", err)
      }
    })
  }
}
