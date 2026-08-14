import { UserService } from './core/services/user-service';
import { SettingsService } from './core/services/settings-service';
import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { UserModel } from './core/models/user-model';
import { SettingsModel } from './core/models/settings-model';
import { AuthService } from './core/services/auth-service';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Toast } from "./components/shared/toast/toast";
import { TransactionStore } from './core/data/transaction-store';
import { TranslationService } from './core/services/translation-service';

interface GlobalSearchResult {
  title: string;
  description: string;
  route: string;
  icon: string;
  keywords: string[];
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterModule, Toast, FormsModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {

  // Application title
  protected title = 'frontend';
  confirm = false;

  settings$ = inject(SettingsService).settings$;
  translationService = inject(TranslationService);

  // Menu toggle state
  isMenuOpen = false;
  searchQuery = '';
  isSearchOpen = false;

  readonly globalSearchResults: GlobalSearchResult[] = [
    {
      title: 'Dashboard',
      description: 'Balance, income and expenses overview',
      route: '/dashboard',
      icon: 'fa-regular fa-house',
      keywords: ['dashboard', 'tableau de bord', 'tabilao', 'balance', 'solde']
    },
    {
      title: 'Statistics',
      description: 'Charts and financial insights',
      route: '/stats',
      icon: 'fa-solid fa-chart-line',
      keywords: ['statistics', 'statistiques', 'antontanisa', 'charts', 'graphique']
    },
    {
      title: 'Transactions',
      description: 'Income and expense history',
      route: '/transactions',
      icon: 'fa-regular fa-chart-bar',
      keywords: ['transactions', 'fifandraisana', 'income', 'expense', 'entrée', 'sortie']
    },
    {
      title: 'Categories',
      description: 'Manage transaction categories',
      route: '/categories',
      icon: 'fa-solid fa-layer-group',
      keywords: ['categories', 'catégories', 'sokajy']
    }
  ];

  // Authentication state
  connected = false;
  user: UserModel | null = null;

  // Ajoute cette propriété avec les autres états
  isSidebarOpen = false;

  // Ajoute cette méthode
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  get searchResults(): GlobalSearchResult[] {
    const query = this.searchQuery.trim().toLocaleLowerCase();
    if (!query) return [];

    return this.globalSearchResults.filter((result) =>
      [result.title, result.description, ...result.keywords]
        .some((value) => value.toLocaleLowerCase().includes(query))
    );
  }

  onSearchInput() {
    this.isSearchOpen = this.searchQuery.trim().length > 0;
  }

  onSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.isSearchOpen = false;
      return;
    }

    if (event.key === 'Enter' && this.searchResults.length > 0) {
      this.openSearchResult(this.searchResults[0]);
    }
  }

  openSearchResult(result: GlobalSearchResult) {
    this.router.navigate([result.route]);
    this.searchQuery = '';
    this.isSearchOpen = false;
  }

  // Modal templates
  @ViewChild('profileModal') profileModal!: TemplateRef<any>;
  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  @ViewChild('settingsModal') settingsModal!: TemplateRef<any>;

  // Overlay reference for modals
  overlayRef?: OverlayRef;

  // Profile data model (used for editing profile)
  profileData: UserModel = new UserModel(-1, "", "", "", "", 0);

  // Settings data model
  settingsData$ = inject(TransactionStore).setting$
  save$ = inject(TransactionStore).save$;
  settingForm!: FormGroup;

  // Password visibility toggle
  isPasswordVisible = false;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private overlay: Overlay,
    private vcr: ViewContainerRef,
    private userService: UserService,
    private transactionStore$: TransactionStore,
  ) {
    this.settingForm = this.fb.group({
      saving: [30, Validators.required],
      min_val_stat: [1000, Validators.required],
      max_val_stat: [500000, Validators.required],
      increment: [100, Validators.required]
    })
  }

  ngOnInit(): void {
    this.translationService.initialize();
    // Listen to user authentication state

    this.authService.getUser().subscribe({
      next: (data) => {
        this.user = data;
        this.connected = !!data; // true if user exists
        
        if (this.user) {

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

  changeLanguage(language: string) {
    this.translationService.setLanguage(language);
  }
  

  /** Logout and redirect to login page */
  logout() {
    this.authService.logout();

    this.isMenuOpen = false;

    this.connected = false;

    this.isSidebarOpen = false;

    this.router.navigate(['/login']);
  }

  /** Toggle dropdown menu */
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /** Confirm before deleting account */
  confirmDeleteAccount() {
    if (this.user) {
      this.confirm = true;

      this.userService.deleteUser().subscribe({
        next: () => {
          this.confirm = false;

          this.closeModal();

          // Nettoyer la session
          this.logout();
        },
        error: (err) => {
          this.confirm = false;
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
    if (!target.closest('.search-container')) {
      this.isSearchOpen = false;
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
    this.settings$.subscribe({
      next: (settings) => {
        if(settings) {
          this.settingForm.patchValue({
          saving: settings.economy,
          min_val_stat: settings.min_val_stat,
          max_val_stat: settings.max_val_stat,
          increment: settings.increment
        });
        }

      },
      error: (err) => {
        console.error("Error while fetching settings:", err);
      }
    });
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
    let settingData: SettingsModel = {
      id: -1,
      economy: this.settingForm.value.saving,
      min_val_stat: this.settingForm.value.min_val_stat,
      max_val_stat: this.settingForm.value.max_val_stat,
      increment: this.settingForm.value.increment,
      user_id: -1
    };
    
    this.transactionStore$.updateSettingReq(settingData);

    this.closeModal();
  }

  /** Toggle password visibility */
  toggleShowPassword() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  toggleDarkMode() {
    const htmlElement = document.documentElement;
    htmlElement.classList.toggle('dark');

    // Save the current theme to localStorage
    const currentTheme = htmlElement.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
  }
}
