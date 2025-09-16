import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { UserModel } from './models/user-model';
import { AuthService } from './services/auth-service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {

  protected title = 'frontend';
  isMenuOpen = false;
  connected: boolean = false;
  user: UserModel | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Écoute des changements de l'utilisateur
    this.authService.getUser().subscribe({
      next: (data) => {
        this.user = data;
        this.connected = !!data; // true si user existe
        console.log("connected", this.connected)
      },
      error: (err) => {
        console.error('Erreur:', err);
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  confirmDeleteAccount() {
    const confirmation = confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.");
    // if (confirmation) {
    //   this.deleteAccount();
    // }
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const target = event.target as HTMLElement;
    // si le clic n'est pas dans le bouton/menu → on ferme
    if (!target.closest('.menu-container')) {
      this.isMenuOpen = false;
    }
  }
}