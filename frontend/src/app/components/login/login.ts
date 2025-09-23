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
  isShow: boolean = false;
  error: boolean = false;
  errorMessage: string = ''; // 🔥 message détaillé

  signin = false;

  @Output() isConnected = new EventEmitter<boolean>();

  constructor(private authService: AuthService, private router: Router) { }

  toggleShowPassword(e: Event) {
    this.isShow = !this.isShow;
  }

  onSubmit() {
    this.signin = true;
    this.error = false;
    this.errorMessage = '';

    this.authService.login(this.username, this.password).subscribe({
      next: (data) => {
        this.signin = false;
        if (data.status === "fail") {
          this.error = true;
          this.errorMessage = "Username or password incorrect."; // 🔥
        } else {
          this.isConnected.emit(true);
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        console.error("error:", err);
        this.signin = false;
        this.error = true;

        // 🔥 Gestion fine des erreurs serveur
        if (err.status === 0) {
          this.errorMessage = "Cannot reach the server. Please check your internet connection.";
        } else if (err.status === 401) {
          this.errorMessage = "Unauthorized: invalid credentials.";
        } else if (err.status === 500) {
          this.errorMessage = "Server error. Please try again later.";
        } else {
          this.errorMessage = "An unexpected error occurred. Please try again.";
        }
      }
    });
  }
}
