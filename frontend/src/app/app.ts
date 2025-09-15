import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { UserModel } from './models/user-model';
import { Login } from './components/login/login';
import { AuthService } from './services/auth-service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterModule, Login],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {

  protected title = 'frontend';
  connected: boolean = false;
  user: UserModel | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Écoute des changements de l'utilisateur
    this.authService.getUser().subscribe({
      next: (data) => {
        this.user = data;
        this.connected = !!data; // true si user existe
      },
      error: (err) => {
        console.error('Erreur:', err);
      }
    });
  }

  onConnected(isConnected: boolean) {
    // appelé par <app-login (isConnected)="...">
    this.connected = isConnected;
    if (isConnected) {
      this.router.navigate(['/dashboard']);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
