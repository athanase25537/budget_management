import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms";
import { AuthService } from '../../services/auth-service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  loginForm!: FormGroup;
  isShow: boolean = false;
  error: boolean = false;
  errorMessage: string = '';
  signin = false;

  @Output() isConnected = new EventEmitter<boolean>();

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  toggleShowPassword(e: Event) {
    this.isShow = !this.isShow;
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.signin = true;
    this.error = false;
    this.errorMessage = '';

    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: (data) => {
        this.signin = false;
        if (data.status === "fail") {
          this.error = true;
          this.errorMessage = "Username or password incorrect.";
        } else {
          this.isConnected.emit(true);
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        console.error("error:", err);
        this.signin = false;
        this.error = true;

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