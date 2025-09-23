import { UserService } from './services/user-service';
import { SettingsService } from './services/settings-service';
import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { UserModel } from './models/user-model';
import { SettingsModel } from './models/settings-model';
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
  @ViewChild('settingsModal') settingsModal!: TemplateRef<any>;

  // Overlay reference for modals
  overlayRef?: OverlayRef;

  // Profile data model (used for editing profile)
  profileData: UserModel = new UserModel(-1, "", "", "", "", 0);

  // Settings data model
  settingsData: SettingsModel = {
    id: -1,
    economy: 30,
    min_val_stat: 100,
    max_val_stat: 10000,
    increment: 1000,
    user_id: -1
  };

  // Password visibility toggle
  isPasswordVisible = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private overlay: Overlay,
    private vcr: ViewContainerRef,
    private userService: UserService,
    private settingsService: SettingsService // Assurez-vous d'avoir ce service
  ) {}

  ngOnInit(): void {
    // Listen to user authentication state
    this.authService.getUser().subscribe({
      next: (data) => {
        this.user = data;
        this.connected = !!data; // true if user exists
        
        if (this.user) {
          // 🔄 S'abonner aux settings globaux
          this.settingsService.settings$.subscribe(settings => {
            if (settings) {
              this.settingsData = { ...settings }; // copie pour l’UI
            }
          });
  
          // Charger les paramètres à partir de l’API si pas déjà en localStorage
          if (!localStorage.getItem('settings')) {
            this.loadSettings();
          }
        }
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

  /** Open settings modal and pre-fill with current settings */
  openSettingsModal() {
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'bg-black/50',
      panelClass: 'centered-modal',
      positionStrategy: this.overlay.position()
        .global()
        .centerHorizontally()
        .centerVertically()
    });

    const portal = new TemplatePortal(this.settingsModal, this.vcr);
    this.overlayRef.attach(portal);

    this.overlayRef.backdropClick().subscribe(() => this.closeModal());

    // S'assurer que les paramètres sont à jour
    this.loadSettings();
  }

  /** Load user settings */
  loadSettings() {
    if (this.user) {
      this.settingsService.getSettings(this.user.id).subscribe({
        next: (settings) => {
          this.settingsData = settings;
        },
        error: (err) => {
          console.error('Error loading settings:', err);
          // Utiliser les valeurs par défaut en cas d'erreur
          this.settingsData = {
            id: -1,
            economy: 30,
            min_val_stat: 100,
            max_val_stat: 10000,
            increment: 1000,
            user_id: this.user?.id || -1
          };
        }
      });
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

  /** Save updated settings */
  updateSettings() {
    if (this.user) {
      this.settingsData.user_id = this.user.id;
      this.settingsService.updateSettingsByUserId(this.user.id, this.settingsData).subscribe({
        next: (updatedSettings) => {
          // this.settingsData = updatedSettings;
          console.info("Settings updated successfully", updatedSettings);
          this.closeModal();
        },
        error: (err) => {
          console.error("Error while updating settings:", err);
          this.closeModal();
        }
      });
    }
  }

  /** Toggle password visibility */
  toggleShowPassword() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}