import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule, ɵInternalFormsSharedModule } from "@angular/forms";
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-login',
  imports: [ɵInternalFormsSharedModule, CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  username: string = "";
  password: string = "";
  isShow:boolean = false;
  error: boolean = false;

  @Output() isConnected = new EventEmitter<boolean>();

  constructor(private authService: AuthService) { }

  toggleShowPassword(e: Event) {
    this.isShow = !this.isShow;
  }

  onSubmit() {
    this.authService.login(this.username, this.password).subscribe({
      next: (data) => {
        console.log(data.status)
        if(data.status == "fail") {
          this.error = true;
        } else {
          console.log("you are connected")
          this.isConnected.emit(true)
        }
      },
      error: (err) => {
        console.log("error:", err)
      }
    })
  }
}
