import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserModel } from '../../models/user-model';
import { UserService } from '../../services/user-service';
import { Router, RouterLink } from '@angular/router';
import { SettingsService } from '../../services/settings-service';
import { SettingsModel } from '../../models/settings-model';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.scss'
})

export class Signup {

  data = {
    name: '',
    first_name: '',
    username: '',
    password: ''
  };

  isShow = false; 

  constructor(
    private userService: UserService,
    private router: Router,
    private settingsService: SettingsService
  ) { }

  toggleShowPassword() {
    this.isShow = !this.isShow;
  }

  onSubmit() {
    let user = new UserModel(-1, this.data.name, this.data.first_name, this.data.username, this.data.password, 0);
    this.userService.addUser(user).subscribe({
      next: (data) => {
        let user_id = data.user.id;
        let defaultSettings = new SettingsModel(-1, 30, 100, 100000, 1000, user_id);
        this.settingsService.createSettings(defaultSettings).subscribe({
          next: (data) => {
            this.router.navigate(["/login"]);
          },
          error: (err) => console.log("error:", err)
        });
        
      },
      error: (err) => {
        console.log("error", err)
      }
    })
  }
}
