import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AccountService } from '../../core/services/account.service';
import { SyncService } from '../../core/services/sync.service';

@Component({
  selector: 'app-account',
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonLabel,
    IonItem,
    IonInput,
    IonButton,
    IonNote,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar class="app-toolbar">
        <ion-title>
          <div class="page-title">
            <span class="brand-mark" aria-hidden="true"><i class="pi pi-wallet"></i></span>
            <span class="page-title__copy"><span class="brand">Kajy Vola</span><span class="page-title__label">Profil</span></span>
          </div>
        </ion-title>
        <button slot="end" type="button" class="header-action" aria-label="Retour à l’accueil" (click)="go('/tabs/home')">
          <i class="pi pi-times"></i>
        </button>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main class="account-page page-shell">
        @if (!account.initialized()) {
          <section class="account-loading" aria-live="polite">
            <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
            <p>Préparation de votre profil…</p>
          </section>
        } @else if (account.account(); as user) {
          <section class="profile-card">
            <div class="profile-card__identity">
              <span class="profile-avatar" aria-hidden="true">{{ initials(user.first_name || user.name) }}</span>
              <div>
                <p>PROFIL CONNECTÉ</p>
                <h1>{{ user.first_name || user.name }}</h1>
                <span>{{ user.username }}</span>
              </div>
            </div>
            <div class="profile-card__rule"></div>
            <p class="profile-card__copy">Votre compte permet de synchroniser vos catégories et transactions lorsque vous le décidez.</p>
          </section>

          <section class="sync-card">
            <span class="sync-card__icon"><i class="pi pi-sync"></i></span>
            <div>
              <p class="section-kicker">DONNÉES LOCALES</p>
              <h2>Synchroniser maintenant</h2>
              <p>Envoyez uniquement vos nouvelles catégories et transactions.</p>
            </div>
            <ion-button expand="block" [disabled]="working()" (click)="sync()">
              <i class="pi" [class.pi-spin]="working()" [class.pi-spinner]="working()" [class.pi-cloud-upload]="!working()"></i>
              {{ working() ? 'Synchronisation…' : 'Synchroniser' }}
            </ion-button>
          </section>

          <section class="profile-links" aria-label="Gestion du profil">
            <button type="button" (click)="go('/settings')">
              <span class="profile-links__icon"><i class="pi pi-sliders-h"></i></span>
              <span><b>Paramètres</b><small>Langue, apparence et budget</small></span>
              <i class="pi pi-angle-right" aria-hidden="true"></i>
            </button>
            <button type="button" class="profile-links__logout" [disabled]="working()" (click)="logout()">
              <span class="profile-links__icon"><i class="pi pi-sign-out"></i></span>
              <span><b>Se déconnecter</b><small>Vos données locales restent sur cet appareil</small></span>
              <i class="pi pi-angle-right" aria-hidden="true"></i>
            </button>
          </section>
        } @else {
          <section class="welcome-card">
            <span class="welcome-card__icon"><i class="pi pi-cloud"></i></span>
            <p class="section-kicker">COMPTE KAJY VOLA</p>
            <h1>Gardez le contrôle, même hors ligne.</h1>
            <p>Créez un compte ou connectez-vous lorsque vous êtes en ligne. Vous choisissez ensuite le moment de synchroniser vos données locales.</p>
          </section>

          <section class="auth-card">
            <div class="auth-mode-switch" role="group" aria-label="Choisir connexion ou inscription">
              <button type="button" class="auth-mode-switch__button" [class.active]="mode() === 'login'" [attr.aria-pressed]="mode() === 'login'" (click)="mode.set('login')">Connexion</button>
              <button type="button" class="auth-mode-switch__button" [class.active]="mode() === 'register'" [attr.aria-pressed]="mode() === 'register'" (click)="mode.set('register')">Inscription</button>
            </div>

            @if (mode() === 'login') {
              <div class="auth-card__heading">
                <h2>Ravi de vous revoir</h2>
                <p>Connectez-vous pour accéder à la synchronisation.</p>
              </div>
              <form [formGroup]="loginForm" (ngSubmit)="login()">
                <ion-item class="account-field">
                  <ion-label position="stacked">Nom d’utilisateur</ion-label>
                  <ion-input formControlName="username" autocomplete="username" inputmode="text"></ion-input>
                </ion-item>
                <ion-item class="account-field">
                  <ion-label position="stacked">Mot de passe</ion-label>
                  <ion-input formControlName="password" type="password" autocomplete="current-password"></ion-input>
                </ion-item>
                <ion-button type="submit" expand="block" [disabled]="loginForm.invalid || working()">
                  {{ working() ? 'Connexion…' : 'Se connecter' }}
                </ion-button>
              </form>
            } @else {
              <div class="auth-card__heading">
                <h2>Créer votre compte</h2>
                <p>Vos données restent utilisables sur cet appareil, même sans connexion.</p>
              </div>
              <form [formGroup]="registerForm" (ngSubmit)="register()">
                <div class="name-fields">
                  <ion-item class="account-field">
                    <ion-label position="stacked">Nom</ion-label>
                    <ion-input formControlName="name" autocomplete="family-name"></ion-input>
                  </ion-item>
                  <ion-item class="account-field">
                    <ion-label position="stacked">Prénom</ion-label>
                    <ion-input formControlName="firstName" autocomplete="given-name"></ion-input>
                  </ion-item>
                </div>
                <ion-item class="account-field">
                  <ion-label position="stacked">Nom d’utilisateur</ion-label>
                  <ion-input formControlName="username" autocomplete="username" inputmode="text"></ion-input>
                </ion-item>
                <ion-item class="account-field">
                  <ion-label position="stacked">Mot de passe</ion-label>
                  <ion-input formControlName="password" type="password" autocomplete="new-password"></ion-input>
                </ion-item>
                <ion-button type="submit" expand="block" [disabled]="registerForm.invalid || working()">
                  {{ working() ? 'Création…' : 'Créer mon compte' }}
                </ion-button>
              </form>
            }
          </section>
        }

        @if (message()) {
          <ion-note class="account-feedback" [class.is-error]="error()" role="status" aria-live="polite">
            <i class="pi" [class.pi-check-circle]="!error()" [class.pi-exclamation-circle]="error()"></i>
            {{ message() }}
          </ion-note>
        }

        <section class="offline-note">
          <i class="pi pi-mobile"></i>
          <p><b>Vos données restent disponibles hors ligne.</b> La synchronisation est toujours déclenchée par vous.</p>
        </section>
      </main>
    </ion-content>
  `,
  styles: [`
    .account-page { display:grid; gap:1rem; padding-top:1rem; }
    .account-title { align-items:center; display:flex; gap:.58rem; line-height:1.05; }.account-title__mark { align-items:center; background:#0968d8; border-radius:.7rem; box-shadow:0 5px 14px rgb(9 104 216 / .2); color:#fff; display:inline-flex; font-size:.9rem; height:2.15rem; justify-content:center; width:2.15rem; }.account-title > span:last-child { display:grid; gap:.18rem; }.account-title small { color:#0968d8; font-size:.6rem; font-weight:850; letter-spacing:.1em; text-transform:uppercase; }.account-title strong { color:#10213f; font-size:1.12rem; letter-spacing:-.035em; }.header-close { align-items:center; background:#edf4ff; border:0; border-radius:50%; color:#0968d8; display:inline-flex; font-size:1rem; height:2.35rem; justify-content:center; width:2.35rem; }
    .account-loading { align-items:center; color:#64718a; display:grid; font-size:.84rem; justify-items:center; min-height:13rem; text-align:center; }.account-loading i { color:#0968d8; font-size:1.6rem; }.account-loading p { color:inherit; margin:.7rem 0 0; }
    .profile-card,.sync-card,.auth-card,.welcome-card { background:#fff; border:1px solid #e3eafd; border-radius:1.05rem; box-shadow:0 8px 24px rgb(38 74 142 / .055); }.profile-card { display:grid; gap:1rem; padding:1.1rem; }.profile-card__identity { align-items:center; display:flex; gap:.82rem; }.profile-avatar { align-items:center; background:linear-gradient(145deg,#3188ee,#0459bd); border:3px solid #e8f1ff; border-radius:50%; color:#fff; display:inline-flex; flex:0 0 auto; font-size:1rem; font-weight:850; height:3.85rem; justify-content:center; letter-spacing:-.04em; width:3.85rem; }.profile-card p { color:#0968d8; font-size:.67rem; font-weight:850; letter-spacing:.09em; margin:0; text-transform:uppercase; }.profile-card h1 { color:#10213f; font-size:1.25rem; margin:.18rem 0; }.profile-card__identity div > span { color:#64718a; font-size:.76rem; }.profile-card__rule { background:#e6edfc; height:1px; }.profile-card__copy { color:#64718a !important; font-size:.78rem !important; font-weight:500 !important; letter-spacing:0 !important; line-height:1.5; text-transform:none !important; }
    .sync-card { display:grid; gap:.72rem; padding:1.05rem; }.sync-card__icon { align-items:center; background:#e8f1ff; border-radius:.8rem; color:#0968d8; display:inline-flex; font-size:1.1rem; height:2.8rem; justify-content:center; width:2.8rem; }.section-kicker { color:#0968d8; font-size:.67rem; font-weight:850; letter-spacing:.1em; margin:0; text-transform:uppercase; }.sync-card h2 { color:#10213f; font-size:1.02rem; margin:.18rem 0; }.sync-card p:not(.section-kicker) { color:#64718a; font-size:.77rem; line-height:1.45; margin:0; }.sync-card ion-button { --background:#0968d8; --background-activated:#0459bd; --box-shadow:none; margin:.15rem 0 0; }.sync-card ion-button i { margin-right:.42rem; }
    .profile-links { background:#fff; border:1px solid #e3eafd; border-radius:1.05rem; box-shadow:0 8px 24px rgb(38 74 142 / .055); overflow:hidden; }.profile-links button { align-items:center; background:transparent; border:0; color:#10213f; display:grid; gap:.72rem; grid-template-columns:auto minmax(0,1fr) auto; min-height:4.85rem; padding:.75rem .9rem; text-align:left; width:100%; }.profile-links button + button { border-top:1px solid #edf1fb; }.profile-links button:active { background:#f5f8ff; }.profile-links__icon { align-items:center; background:#edf4ff; border-radius:.7rem; color:#0968d8; display:inline-flex; font-size:1rem; height:2.45rem; justify-content:center; width:2.45rem; }.profile-links span:nth-child(2) { display:grid; gap:.2rem; min-width:0; }.profile-links b { font-size:.84rem; }.profile-links small { color:#64718a; font-size:.69rem; line-height:1.3; }.profile-links > button > i { color:#8190ab; }.profile-links__logout .profile-links__icon { background:#fff0f1; color:#c81e2a; }.profile-links__logout b { color:#b82734; }
    .welcome-card { display:grid; gap:.58rem; padding:1.2rem; }.welcome-card__icon { align-items:center; background:#e8f1ff; border-radius:.85rem; color:#0968d8; display:inline-flex; font-size:1.25rem; height:3rem; justify-content:center; margin-bottom:.15rem; width:3rem; }.welcome-card h1 { color:#10213f; font-size:1.42rem; line-height:1.14; margin:0; }.welcome-card p:not(.section-kicker) { color:#64718a; font-size:.8rem; line-height:1.52; margin:0; }
    .auth-card { display:grid; gap:1rem; padding:1rem; }.auth-mode-switch { display:grid; gap:.45rem; grid-template-columns:repeat(2,minmax(0,1fr)); margin-bottom:.05rem; }.auth-mode-switch__button { -webkit-tap-highlight-color:transparent; appearance:none; background:#fff; border:1px solid #e1e9f5; border-radius:.82rem; color:#1b2a48; font-size:.69rem; font-weight:760; min-height:2.42rem; min-width:0; overflow:hidden; padding:0 .3rem; text-overflow:ellipsis; white-space:nowrap; }.auth-mode-switch__button.active { background:#0968d8; border-color:#0968d8; box-shadow:0 6px 13px -9px rgb(9 104 216 / .76); color:#fff; }.auth-mode-switch__button:active { transform:scale(.97); }.auth-mode-switch__button:focus-visible { outline:3px solid rgb(9 104 216 / .28); outline-offset:2px; }.auth-card__heading h2 { color:#10213f; font-size:1.04rem; margin:0 0 .22rem; }.auth-card__heading p { color:#64718a; font-size:.76rem; line-height:1.45; margin:0; }.auth-card form { display:grid; gap:.72rem; }.name-fields { display:grid; gap:.72rem; grid-template-columns:1fr 1fr; }.account-field { --background:#fff; --border-color:transparent; --border-radius:.82rem; --color:#10213f; --inner-border-width:0; border:1px solid #dfe8fb; border-radius:.82rem; min-height:3.7rem; }.account-field ion-label { color:#64718a !important; font-size:.76rem !important; }.account-field ion-input { --color:#10213f; }.account-field.ion-focused { border-color:#0968d8; box-shadow:0 0 0 3px rgb(9 104 216 / .1); }.auth-card ion-button { --background:#0968d8; --background-activated:#0459bd; --box-shadow:none; margin:.12rem 0 0; }
    .account-feedback { align-items:flex-start; background:#eaf8f4; border:1px solid #bfebdf; border-radius:.85rem; color:#007e70; display:flex; font-size:.77rem; gap:.55rem; line-height:1.42; padding:.78rem .85rem; }.account-feedback i { margin-top:.04rem; }.account-feedback.is-error { background:#fff2f3; border-color:#ffd6db; color:#c81e2a; }.offline-note { align-items:flex-start; color:#64718a; display:flex; font-size:.72rem; gap:.55rem; line-height:1.45; padding:.1rem .2rem 0; }.offline-note i { color:#0968d8; margin-top:.12rem; }.offline-note p { color:inherit; margin:0; }.offline-note b { color:#324562; }
    @media (max-width:340px) { .name-fields { grid-template-columns:1fr; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountPage {
  readonly account = inject(AccountService);
  private readonly syncService = inject(SyncService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly working = signal(false);
  readonly message = signal('');
  readonly error = signal(false);
  readonly mode = signal<'login' | 'register'>('login');
  readonly loginForm = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });
  readonly registerForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    firstName: ['', [Validators.required]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  initials(value: string): string {
    return value.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toLocaleUpperCase('fr-FR') || 'KV';
  }

  async login(): Promise<void> {
    if (this.loginForm.invalid) return;
    const { username, password } = this.loginForm.getRawValue();
    await this.execute(() => this.account.login(username, password), 'Connexion réussie.');
  }

  async register(): Promise<void> {
    if (this.registerForm.invalid) return;
    await this.execute(() => this.account.register(this.registerForm.getRawValue()), 'Compte créé. Vous pouvez synchroniser vos données.');
  }

  async sync(): Promise<void> {
    await this.execute(async () => {
      const result = await this.syncService.synchronize();
      this.message.set(`${result.categories} catégorie(s) et ${result.transactions} transaction(s) synchronisée(s).`);
    }, '');
  }

  async logout(): Promise<void> {
    await this.account.logout();
    this.error.set(false);
    this.message.set('Déconnecté. Vos données locales restent disponibles.');
  }

  go(url: string): void { void this.router.navigateByUrl(url); }

  private async execute(action: () => Promise<void>, success: string): Promise<void> {
    this.working.set(true);
    this.error.set(false);
    this.message.set('');
    try {
      await action();
      if (success) this.message.set(success);
    } catch (error) {
      this.error.set(true);
      this.message.set(this.errorMessage(error));
    } finally {
      this.working.set(false);
    }
  }

  private errorMessage(error: unknown): string {
    if (!error || typeof error !== 'object') return 'Une erreur est survenue.';

    const response = error as { error?: unknown; message?: unknown; status?: unknown };
    const status = typeof response.status === 'number' ? response.status : null;
    const payload = response.error;

    if (status === 0) return 'Impossible de joindre le service. Vérifiez votre connexion Internet puis réessayez.';
    if (status === 401) return 'Identifiant ou mot de passe incorrect.';
    if (status === 422) return this.validationMessage(payload) ?? 'Vérifiez les informations saisies puis réessayez.';
    if (status !== null && status >= 500) return 'Le service est temporairement indisponible. Réessayez dans un instant.';

    if (payload && typeof payload === 'object') {
      const detail = (payload as { detail?: unknown; message?: unknown }).detail ?? (payload as { message?: unknown }).message;
      if (typeof detail === 'string' && detail.trim()) return detail;
      if (typeof (payload as { message?: unknown }).message === 'string') return (payload as { message: string }).message;
    }
    if (error instanceof Error && error.message) return error.message;
    return typeof response.message === 'string' && response.message ? response.message : 'Une erreur est survenue.';
  }

  private validationMessage(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') return null;
    const detail = (payload as { detail?: unknown }).detail;
    if (!Array.isArray(detail)) return typeof detail === 'string' ? detail : null;
    const messages = detail
      .map((item) => item && typeof item === 'object' && typeof (item as { msg?: unknown }).msg === 'string' ? (item as { msg: string }).msg : '')
      .filter(Boolean);
    return messages.length ? messages.join(' ') : null;
  }
}
