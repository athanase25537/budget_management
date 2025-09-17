import { UserService } from './services/user-service';
import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { UserModel } from './models/user-model';
import { AuthService } from './services/auth-service';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {

  // Application title
  protected title = 'frontend';

  // Menu toggle state
  isMenuOpen = false;

  // Authentication state
  connected = false;
  user: UserModel | null = null;

  // Modal templates
  @ViewChild('profileModal') profileModal!: TemplateRef<any>;
  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;

  // Overlay reference for modals
  overlayRef?: OverlayRef;

  // Profile data model (used for editing profile)
  profileData: UserModel = new UserModel(-1, "", "", "", "", 0);

  // Password visibility toggle
  isPasswordVisible = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private overlay: Overlay,
    private vcr: ViewContainerRef,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Listen to user authentication state
    this.authService.getUser().subscribe({
      next: (data) => {
        this.user = data;
        this.connected = !!data; // true if user exists
      },
      error: (err) => {
        console.error('Error while fetching user:', err);
      }
    });
  }

  /** Logout and redirect to login page */
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /** Toggle dropdown menu */
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /** Confirm before deleting account */
  confirmDeleteAccount() {
    if (this.user) {
      this.userService.deleteUser(this.user.id).subscribe({
        next: () => {
          this.closeModal();

          // Nettoyer la session
          this.logout();
        },
        error: (err) => {
          console.error("Delete failed", err);
          alert("Failed to delete account. Please try again.");
        }
      });
    }
  }


  /** Close menu if user clicks outside */
  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.menu-container')) {
      this.isMenuOpen = false;
    }
  }

  /** Open generic modal */
  openModal() {
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'bg-black/50',
      panelClass: 'centered-modal',
      positionStrategy: this.overlay.position()
        .global()
        .centerHorizontally()
        .centerVertically()
    });

    const portal = new TemplatePortal(this.modalTemplate, this.vcr);
    this.overlayRef.attach(portal);

    this.overlayRef.backdropClick().subscribe(() => this.closeModal());
  }

  /** Close currently opened modal */
  closeModal() {
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
  }

  /** Open profile modal and pre-fill with user data */
  openProfileModal() {
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'bg-black/50',
      panelClass: 'centered-modal',
      positionStrategy: this.overlay.position()
        .global()
        .centerHorizontally()
        .centerVertically()
    });

    const portal = new TemplatePortal(this.profileModal, this.vcr);
    this.overlayRef.attach(portal);

    this.overlayRef.backdropClick().subscribe(() => this.closeModal());

    // Pre-fill with logged-in user data
    if (this.user) {
      this.profileData = { 
        ...this.user, 
        name: this.user.name.toLocaleUpperCase(), 
        first_name: this.user.first_name.charAt(0).toUpperCase() + this.user.first_name.slice(1).toLowerCase(), 
        password: "" 
      };
          }
  }

  /** Save updated profile */
  updateProfile() {
    this.userService.updateUser(this.profileData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser.user;
        console.info("Profile updated successfully");
      },
      error: (err) => {
        console.error("Error while updating profile:", err);
      }
    });
    this.closeModal();
  }

  /** Toggle password visibility */
  toggleShowPassword() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}
