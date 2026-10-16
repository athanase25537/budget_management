import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { PreferencesService } from '../../core/services/preferences.service';
import { FeedbackToastService } from '../../core/services/feedback-toast.service';

@Component({
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonLabel,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar class="app-toolbar">
        <ion-title>
          <div class="page-title">
            <span class="brand-mark" aria-hidden="true"><i class="pi pi-wallet"></i></span>
            <span class="page-title__copy"><span class="brand">Kajy Vola</span><span class="page-title__label">Paramètres</span></span>
          </div>
        </ion-title>
        <button slot="end" type="button" class="header-action" aria-label="Retour à l’accueil" (click)="goHome()">
          <i class="pi pi-times"></i>
        </button>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main class="settings-page page-shell">
        <section class="settings-intro">
          <span><i class="pi pi-sparkles"></i></span>
          <div>
            <p>VOTRE ESPACE</p>
            <h1>Une expérience adaptée à vous.</h1>
            <p>Ces préférences sont enregistrées sur cet appareil.</p>
          </div>
        </section>

        <form [formGroup]="form" (ngSubmit)="save()">
          <section class="settings-section">
            <div class="settings-section__heading">
              <span class="settings-section__icon"><i class="pi pi-palette"></i></span>
              <div><p>PRÉFÉRENCES</p><h2>Langue et apparence</h2></div>
            </div>
            <div class="settings-fields">
              <ion-item class="settings-field">
                <span slot="start" class="field-icon"><i class="pi pi-language"></i></span>
                <ion-label>Langue<small>Langue de l’application</small></ion-label>
                <ion-select formControlName="language" interface="action-sheet" aria-label="Langue de l’application">
                  <ion-select-option value="fr">Français</ion-select-option>
                  <ion-select-option value="mg">Malagasy</ion-select-option>
                  <ion-select-option value="en">English</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item class="settings-field">
                <span slot="start" class="field-icon"><i class="pi pi-sun"></i></span>
                <ion-label>Thème<small>Choisissez l’apparence</small></ion-label>
                <ion-select formControlName="theme" interface="action-sheet" aria-label="Thème de l’application">
                  <ion-select-option value="light">Clair</ion-select-option>
                  <ion-select-option value="dark">Sombre</ion-select-option>
                  <ion-select-option value="system">Système</ion-select-option>
                </ion-select>
              </ion-item>
            </div>
          </section>

          <section class="settings-section">
            <div class="settings-section__heading">
              <span class="settings-section__icon settings-section__icon--budget"><i class="pi pi-chart-line"></i></span>
              <div><p>BUDGET ET RAPPORTS</p><h2>Repères personnels</h2></div>
            </div>
            <p class="settings-section__copy">Ajustez les bornes utilisées par vos statistiques et votre objectif d’épargne.</p>
            <div class="budget-fields">
              <ion-item class="number-field number-field--wide">
                <ion-label position="stacked">Taux d’épargne</ion-label>
                <ion-input formControlName="economy" type="number" min="0" max="100" inputmode="numeric" aria-label="Taux d’épargne"></ion-input>
                <span slot="end">%</span>
              </ion-item>
              <ion-item class="number-field">
                <ion-label position="stacked">Valeur minimale</ion-label>
                <ion-input formControlName="minValStat" type="number" min="0" inputmode="decimal" aria-label="Valeur minimale des statistiques"></ion-input>
                <span slot="end">MGA</span>
              </ion-item>
              <ion-item class="number-field">
                <ion-label position="stacked">Valeur maximale</ion-label>
                <ion-input formControlName="maxValStat" type="number" min="0" inputmode="decimal" aria-label="Valeur maximale des statistiques"></ion-input>
                <span slot="end">MGA</span>
              </ion-item>
              <ion-item class="number-field number-field--wide">
                <ion-label position="stacked">Incrément des statistiques</ion-label>
                <ion-input formControlName="increment" type="number" min="1" inputmode="decimal" aria-label="Incrément des statistiques"></ion-input>
                <span slot="end">MGA</span>
              </ion-item>
            </div>
          </section>

          <ion-button class="save-settings" expand="block" type="submit" [disabled]="form.invalid">
            <i class="pi pi-check"></i> Enregistrer les paramètres
          </ion-button>
        </form>

        <button type="button" class="account-link" (click)="goAccount()">
          <span><i class="pi pi-user"></i></span>
          <span><b>Compte et synchronisation</b><small>Connexion, inscription et synchronisation volontaire</small></span>
          <i class="pi pi-angle-right" aria-hidden="true"></i>
        </button>
      </main>
    </ion-content>
  `,
  styles: [`
    .settings-page { display:grid; gap:1rem; padding-top:1rem; }.settings-title { align-items:center; display:flex; gap:.58rem; line-height:1.05; }.settings-title__mark { align-items:center; background:#0968d8; border-radius:.7rem; box-shadow:0 5px 14px rgb(9 104 216 / .2); color:#fff; display:inline-flex; font-size:.9rem; height:2.15rem; justify-content:center; width:2.15rem; }.settings-title > span:last-child { display:grid; gap:.18rem; }.settings-title small { color:#0968d8; font-size:.6rem; font-weight:850; letter-spacing:.1em; text-transform:uppercase; }.settings-title strong { color:#10213f; font-size:1.12rem; letter-spacing:-.035em; }.settings-close { align-items:center; background:#edf4ff; border:0; border-radius:50%; color:#0968d8; display:inline-flex; font-size:1rem; height:2.35rem; justify-content:center; width:2.35rem; }
    .settings-intro { align-items:flex-start; background:#eaf2ff; border:1px solid #d5e5ff; border-radius:1rem; display:flex; gap:.75rem; padding:1rem; }.settings-intro > span { align-items:center; background:#fff; border-radius:.75rem; color:#0968d8; display:flex; flex:0 0 auto; font-size:1.05rem; height:2.65rem; justify-content:center; width:2.65rem; }.settings-intro > div { display:grid; gap:.18rem; }.settings-intro p { color:#64718a; font-size:.74rem; margin:0; }.settings-intro div > p:first-child { color:#0968d8; font-size:.65rem; font-weight:850; letter-spacing:.09em; text-transform:uppercase; }.settings-intro h1 { color:#10213f; font-size:1.05rem; letter-spacing:-.03em; margin:0; }
    form { display:grid; gap:1rem; }.settings-section { background:#fff; border:1px solid #e3eafd; border-radius:1.05rem; box-shadow:0 8px 24px rgb(38 74 142 / .055); display:grid; gap:.95rem; padding:1rem; }.settings-section__heading { align-items:center; display:flex; gap:.7rem; }.settings-section__icon { align-items:center; background:#e8f1ff; border-radius:.72rem; color:#0968d8; display:inline-flex; font-size:1rem; height:2.5rem; justify-content:center; width:2.5rem; }.settings-section__icon--budget { background:#e6f8f3; color:#007e70; }.settings-section__heading div { display:grid; gap:.15rem; }.settings-section__heading p { color:#0968d8; font-size:.65rem; font-weight:850; letter-spacing:.09em; margin:0; text-transform:uppercase; }.settings-section__heading h2 { color:#10213f; font-size:.98rem; margin:0; }.settings-section__copy { color:#64718a; font-size:.75rem; line-height:1.45; margin:-.25rem 0 0; }
    .settings-fields { border:1px solid #e6edfc; border-radius:.86rem; overflow:hidden; }.settings-field { --background:#fff; --border-color:transparent; --color:#10213f; --inner-border-width:0; --padding-end:.7rem; --padding-start:.7rem; min-height:4.05rem; }.settings-field + .settings-field { border-top:1px solid #edf1fb; }.settings-field ion-label { color:#10213f !important; font-size:.82rem !important; font-weight:750; }.settings-field ion-label small { color:#64718a; display:block; font-size:.67rem; font-weight:500; margin-top:.12rem; }.field-icon { align-items:center; background:#eef4ff; border-radius:50%; color:#0968d8; display:inline-flex; font-size:.84rem; height:2.05rem; justify-content:center; margin-right:.1rem; width:2.05rem; }.settings-field ion-select { --color:#0968d8; --placeholder-color:#0968d8; font-size:.76rem; font-weight:800; max-width:7rem; text-align:right; }
    .budget-fields { display:grid; gap:.68rem; grid-template-columns:1fr 1fr; }.number-field { --background:#f9fbff; --border-color:transparent; --border-radius:.82rem; --color:#10213f; --inner-border-width:0; --padding-end:.7rem; --padding-start:.75rem; border:1px solid #e2eafe; border-radius:.82rem; min-height:4.4rem; }.number-field--wide { grid-column:1 / -1; }.number-field ion-label { color:#64718a !important; font-size:.69rem !important; }.number-field ion-input { --color:#10213f; --padding-bottom:0; --padding-top:.05rem; font-size:.86rem; font-weight:800; }.number-field > span { color:#0968d8; font-size:.67rem; font-weight:800; margin-top:1.05rem; }.number-field.ion-focused { border-color:#0968d8; box-shadow:0 0 0 3px rgb(9 104 216 / .1); }
    .save-settings { --background:#0968d8; --background-activated:#0459bd; --box-shadow:none; margin:0; }.save-settings i { margin-right:.42rem; }.account-link { align-items:center; background:#fff; border:1px solid #e3eafd; border-radius:1rem; box-shadow:0 8px 24px rgb(38 74 142 / .055); color:#10213f; display:grid; gap:.68rem; grid-template-columns:auto minmax(0,1fr) auto; min-height:4.75rem; padding:.75rem .9rem; text-align:left; width:100%; }.account-link:active { background:#f5f8ff; }.account-link > span:first-child { align-items:center; background:#eef4ff; border-radius:.7rem; color:#0968d8; display:inline-flex; font-size:1rem; height:2.4rem; justify-content:center; width:2.4rem; }.account-link > span:nth-child(2) { display:grid; gap:.2rem; min-width:0; }.account-link b { font-size:.82rem; }.account-link small { color:#64718a; font-size:.67rem; line-height:1.3; }.account-link > i { color:#8190ab; }
    @media (max-width:340px) { .budget-fields { grid-template-columns:1fr; }.number-field--wide { grid-column:auto; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  private readonly preferences = inject(PreferencesService);
  private readonly feedbackToast = inject(FeedbackToastService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    language: this.fb.nonNullable.control<'fr' | 'en' | 'mg'>(this.preferences.state().language),
    theme: this.fb.nonNullable.control<'dark' | 'light' | 'system'>(this.preferences.state().theme),
    economy: this.fb.nonNullable.control(this.preferences.state().economy, [Validators.min(0), Validators.max(100)]),
    minValStat: this.fb.nonNullable.control(this.preferences.state().minValStat, [Validators.min(0)]),
    maxValStat: this.fb.nonNullable.control(this.preferences.state().maxValStat, [Validators.min(0)]),
    increment: this.fb.nonNullable.control(this.preferences.state().increment, [Validators.min(1)]),
  });

  async save(): Promise<void> {
    if (this.form.invalid) return;
    await this.preferences.update(this.form.getRawValue());
    await this.feedbackToast.show('update', 'Paramètres mis à jour.');
  }

  goAccount(): void { void this.router.navigateByUrl('/account'); }
  goHome(): void { void this.router.navigateByUrl('/tabs/home'); }
}
