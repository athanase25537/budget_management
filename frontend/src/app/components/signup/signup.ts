import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user-service';
import { SettingsService } from '../../services/settings-service';
import { UserModel } from '../../models/user-model';
import { SettingsModel } from '../../models/settings-model';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.scss'
})
export class Signup {
  signupForm: FormGroup;
  isShow = false;
  errorMessage: string | null = null;

  signup = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private settingsService: SettingsService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  toggleShowPassword() {
    this.isShow = !this.isShow;
  }

  get f() {
    return this.signupForm.controls;
  }

  onSubmit() {
    this.signup = true;
    this.errorMessage = null;
  
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      this.signup = false;
      return;
    }
  
    const { name, first_name, username, password } = this.signupForm.value;
    let user = new UserModel(-1, name, first_name, username, password, 0);
  
    this.userService.addUser(user).subscribe({
      next: (response) => {
        if (response.status === "success" && response.user) {
          // success -> on continue avec la création des settings
          let user_id = response.user.id;
          let defaultSettings = new SettingsModel(-1, 30, 100, 100000, 1000, user_id);
  
          this.settingsService.createSettings(defaultSettings).subscribe({
            next: () => {
              this.signup = false;
              this.router.navigate(['/login']);
            },
            error: () => {
              this.signup = false;
              this.errorMessage = "Erreur lors de la création des paramètres par défaut.";
            }
          });
  
        } else if (response.status === "fail" && response.message) {
          // échec renvoyé par l’API
          this.errorMessage = response.message;
          this.signup = false;
        }
      },
      error: (err) => {
        console.error("HTTP error", err);
        this.errorMessage = "Erreur réseau ou serveur. Veuillez réessayer plus tard.";
      }
    });
  }
  
}
