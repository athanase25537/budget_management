import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonHeader, IonInput, IonItem, IonLabel, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { LocalDatabaseService } from '../../core/data/local-database.service';
import { categoryIconClass } from '../../core/models/category-icons';
import { LocalCategory } from '../../core/models/offline.models';
import { formatAriary } from '../../core/formatting';
import { FeedbackToastService } from '../../core/services/feedback-toast.service';

type ListedTransaction = Awaited<ReturnType<LocalDatabaseService['listTransactions']>>[number];
type TransactionType = 'income' | 'outcome';

@Component({
  selector: 'app-add-transaction',
  imports: [ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonLabel, IonItem, IonInput],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar class="app-toolbar">
        <button slot="start" class="header-back" type="button" aria-label="Retour" (click)="backOrClose()"><i class="pi pi-arrow-left"></i></button>
        <ion-title>
          <div class="page-title">
            <span class="brand-mark" aria-hidden="true"><i class="pi pi-wallet"></i></span>
            <span class="page-title__copy"><span class="brand">Kajy Vola</span><span class="page-title__label">{{ editingId() ? 'Modifier la transaction' : 'Nouvelle transaction' }}</span></span>
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main class="add-page page-shell">
        <section class="add-progress-card" [attr.aria-label]="'Étape ' + step() + ' sur 3'">
          <p><i class="pi pi-circle-fill"></i> Étape {{ step() }} sur 3</p>
          <div class="add-progress-bars" aria-hidden="true"><i [class.active]="step() >= 1"></i><i [class.active]="step() >= 2"></i><i [class.active]="step() >= 3"></i></div>
          <div class="add-progress-steps" aria-hidden="true">
            <span [class.active]="step() === 1" [class.done]="step() > 1"><b>1</b> Montant</span>
            <span [class.active]="step() === 2" [class.done]="step() > 2"><b>2</b> Catégorie</span>
            <span [class.active]="step() === 3"><b>3</b> Confirmation</span>
          </div>
        </section>

        <form [formGroup]="form" (ngSubmit)="save()">
          @if (step() === 1) {
            <section class="amount-entry-stage">
              <div class="transaction-type-field">
                <span>Type de transaction</span>
                <div class="transaction-type-picker" role="radiogroup" aria-label="Type de transaction">
                  <button type="button" role="radio" [attr.aria-checked]="form.controls.type.value === 'outcome'" [class.selected]="form.controls.type.value === 'outcome'" (click)="selectType('outcome')"><i class="pi pi-arrow-up-right"></i> Dépense</button>
                  <button type="button" role="radio" [attr.aria-checked]="form.controls.type.value === 'income'" [class.selected]="form.controls.type.value === 'income'" (click)="selectType('income')"><i class="pi pi-arrow-down-left"></i> Revenu</button>
                </div>
              </div>

              <section class="amount-panel">
                <header><p>MONTANT À SAISIR</p><span><i class="pi pi-circle-fill"></i> Ariary (MGA)</span></header>
                <label class="kv-amount-input" for="transaction-amount">
                  <input id="transaction-amount" [value]="formattedAmount()" (input)="setAmountFromText($any($event.target).value)" inputmode="numeric" autocomplete="off" pattern="[0-9 ]*" placeholder="25 000" aria-label="Montant de la transaction en ariary"><b>Ar</b>
                </label>
                <p class="fmg-equivalent" [class.fmg-equivalent--placeholder]="!form.controls.amount.value" aria-live="polite"><i class="pi pi-sync"></i> {{ form.controls.amount.value ? fmg(form.controls.amount.value) : '— Fmg' }}</p>
                <i class="amount-divider" aria-hidden="true"></i>
                <div class="amount-suggestions" aria-label="Suggestions de montant">
                  <button type="button" (click)="addAmount(5000)">+5 000 Ar</button><button type="button" (click)="addAmount(10000)">+10 000 Ar</button>
                  <button type="button" (click)="addAmount(25000)">+25 000 Ar</button><button type="button" (click)="addAmount(50000)">+50 000 Ar</button>
                </div>
              </section>

            </section>
          } @else if (step() === 2) {
            <section class="add-card">
              <p class="add-eyebrow">Étape 2 · Catégorie</p>
              <h1>Choisissez une catégorie</h1>
              <p class="add-helper">Elle permet d’organiser votre suivi et vos rapports.</p>
              @if (categories().length) {
                <div class="category-choices">
                  @for (category of categories(); track category.localId) {
                    <button type="button" class="category-choice" [class.selected]="form.controls.categoryLocalId.value === category.localId" (click)="selectCategory(category.localId)">
                      <span [style.background]="category.color + '20'" [style.color]="category.color"><i [class]="iconClass(category.icon)"></i></span>
                      <b>{{ category.name }}</b><i class="pi pi-check-circle"></i>
                    </button>
                  }
                </div>
              } @else {
                <section class="no-categories"><span><i class="pi pi-tag"></i></span><h2>Aucune catégorie disponible</h2><p>Créez d’abord une catégorie {{ form.controls.type.value === 'income' ? 'de revenu' : 'de dépense' }}.</p><button type="button" (click)="openCategories()">Créer une catégorie <i class="pi pi-arrow-right"></i></button></section>
              }
            </section>
          } @else {
            <section class="add-card">
              <p class="add-eyebrow">Étape 3 · Confirmation</p>
              <h1>Vérifiez les derniers détails</h1>
              @if (selectedCategory(); as category) {
                <section class="selected-summary"><span [style.background]="category.color + '20'" [style.color]="category.color"><i [class]="iconClass(category.icon)"></i></span><div><b>{{ category.name }}</b><p>{{ form.controls.type.value === 'income' ? 'Revenu' : 'Dépense' }} · {{ mga(form.controls.amount.value) }}</p></div><button type="button" aria-label="Changer de catégorie" (click)="step.set(2)"><i class="pi pi-pencil"></i></button></section>
              }
              <ion-item class="add-field"><ion-label position="stacked">Date</ion-label><ion-input [formControl]="form.controls.occurredAt" type="date" aria-label="Date de la transaction"></ion-input></ion-item>
              <ion-item class="add-field"><ion-label position="stacked">Note <span>facultatif</span></ion-label><ion-input [formControl]="form.controls.reason" placeholder="Ex. Déjeuner au bureau"></ion-input></ion-item>
              @if (selectedCategory(); as category) {
                @if (category.budgetAmount && form.controls.type.value === 'outcome') {
                  <section class="budget-impact"><div><span>Impact sur {{ category.name }}</span><b>{{ impactPercentage() }} %</b></div><p>{{ mga(spentForCategory(category.localId)) }} déjà utilisés sur {{ mga(category.budgetAmount) }}.</p><i><em [style.width.%]="impactPercentage()"></em></i><p>Il restera {{ mga(remainingForCategory(category.localId, category.budgetAmount)) }} après cette dépense.</p></section>
                }
              }
              <p class="offline-note"><i class="pi pi-shield"></i> Enregistré localement, même sans connexion.</p>
            </section>
          }
        </form>
      </main>
    </ion-content>

    <footer class="add-actions">
      <button type="button" class="add-secondary" (click)="backOrClose()">{{ step() === 1 ? 'Annuler' : 'Retour' }}</button>
      @if (step() < 3) {
        <button type="button" class="add-primary" [disabled]="cannotContinue()" (click)="continue()">Suivant <i class="pi pi-arrow-right"></i></button>
      } @else {
        <button type="button" class="add-primary" [disabled]="form.invalid || saving()" (click)="save()">{{ saving() ? 'Enregistrement…' : editingId() ? 'Enregistrer' : 'Enregistrer la transaction' }} <i class="pi pi-check"></i></button>
      }
    </footer>
  `,
  styles: [`
    .add-page { display:grid; gap:1rem; padding-bottom:8.75rem; padding-top:.9rem; }
    .add-progress-card { background:#fff; border:1px solid #e1eafb; border-radius:1rem; box-shadow:0 8px 22px rgb(38 74 142 / .04); display:grid; gap:.6rem; padding:.95rem; }.add-progress-card p { align-items:center; color:#0968d8; display:flex; font-size:.75rem; font-weight:850; gap:.38rem; margin:0; }.add-progress-card p i { font-size:.48rem; }.add-progress-bars { display:grid; gap:.4rem; grid-template-columns:repeat(3,1fr); }.add-progress-bars i { background:#dbe7fa; border-radius:999px; height:.34rem; }.add-progress-bars i.active { background:#0968d8; }.add-progress-steps { display:grid; gap:.25rem; grid-template-columns:1.15fr 1fr 1.25fr; }.add-progress-steps span { align-items:center; color:#64718a; display:flex; font-size:.64rem; gap:.3rem; min-width:0; white-space:nowrap; }.add-progress-steps b { align-items:center; background:#e0e9f8; border-radius:50%; color:#64718a; display:inline-flex; flex:0 0 auto; font-size:.58rem; height:1rem; justify-content:center; width:1rem; }.add-progress-steps span.active,.add-progress-steps span.done { color:#0968d8; font-weight:800; }.add-progress-steps span.active b,.add-progress-steps span.done b { background:#0968d8; color:#fff; }
    .amount-entry-stage { display:grid; gap:1rem; }.transaction-type-field { display:grid; gap:.5rem; }.transaction-type-field > span { color:#526078; font-size:.73rem; font-weight:750; }.transaction-type-picker { background:#e3edff; border-radius:.92rem; display:grid; gap:.2rem; grid-template-columns:1fr 1fr; padding:.25rem; }.transaction-type-picker button { align-items:center; background:transparent; border:0; border-radius:.7rem; color:#526078; display:flex; font-size:.78rem; font-weight:800; gap:.35rem; justify-content:center; min-height:2.5rem; padding:0 .35rem; }.transaction-type-picker button.selected { background:#0968d8; box-shadow:0 5px 12px -7px rgb(9 104 216 / .9); color:#fff; }.transaction-type-picker button i { font-size:.82rem; }
    .amount-panel { background:linear-gradient(135deg, #fff 5%, #f2f6ff 100%); border:1px solid #d8e5fc; border-radius:1rem; box-shadow:0 10px 22px rgb(38 74 142 / .045); display:grid; gap:.78rem; padding:1rem; }.amount-panel header { align-items:center; display:flex; justify-content:space-between; gap:.6rem; }.amount-panel header p { color:#4c5362; font-size:.73rem; font-weight:850; letter-spacing:.035em; margin:0; }.amount-panel header span { align-items:center; background:#cef6f1; border-radius:999px; color:#147f79; display:inline-flex; font-size:.62rem; font-weight:800; gap:.3rem; padding:.32rem .52rem; white-space:nowrap; }.amount-panel header span i { font-size:.36rem; }.fmg-equivalent { align-items:center; background:#e9f0ff; border-radius:999px; color:#253750; display:flex; font-size:.82rem; gap:.35rem; justify-self:center; margin:-.15rem 0 0; padding:.4rem .65rem; }.fmg-equivalent i { color:#0968d8; font-size:.8rem; }.fmg-equivalent--placeholder { color:#8791a4; }.fmg-equivalent--placeholder i { color:#8791a4; }.amount-divider { background:#dce6f7; display:block; height:1px; width:100%; }.amount-suggestions { display:grid; gap:.45rem; grid-template-columns:1fr 1fr; }.amount-suggestions button { background:#dce9ff; border:0; border-radius:.55rem; color:#0968d8; font-size:.78rem; font-weight:850; min-height:2.1rem; padding:.35rem; }.amount-suggestions button:active { background:#cbdfff; transform:translateY(1px); }
    .add-card { background:#fff; border:1px solid #e3eafd; border-radius:1rem; box-shadow:0 8px 24px rgb(38 74 142 / .055); display:grid; gap:1rem; padding:1.1rem; }.add-eyebrow { color:#0968d8; font-size:.7rem; font-weight:800; letter-spacing:.08em; margin:0; text-transform:uppercase; }.add-card h1 { color:#10213f; font-size:1.24rem; letter-spacing:-.045em; line-height:1.18; margin:0; }.add-card h2 { color:#10213f; font-size:1rem; margin:0; }.add-helper { color:#64718a; font-size:.78rem; line-height:1.45; margin:-.5rem 0 0; }
    .category-choices { display:grid; gap:.65rem; }.category-choice { align-items:center; appearance:none; background:#fff; border:1px solid #e0e8f7; border-radius:.85rem; color:#10213f; display:grid; font-weight:750; gap:.7rem; grid-template-columns:auto minmax(0,1fr) auto; min-height:4rem; padding:.65rem .75rem; text-align:left; width:100%; }.category-choice > span,.selected-summary > span { align-items:center; border-radius:.65rem; display:inline-flex; font-size:.95rem; height:2.3rem; justify-content:center; width:2.3rem; }.category-choice > i { color:transparent; font-size:1rem; }.category-choice.selected { background:#f0f6ff; border-color:#0968d8; }.category-choice.selected > i { color:#0968d8; }.no-categories { align-items:center; background:#f6f9ff; border:1px dashed #cbdaf4; border-radius:.85rem; display:grid; justify-items:center; padding:1.5rem 1rem; text-align:center; }.no-categories > span { align-items:center; background:#e5efff; border-radius:50%; color:#0968d8; display:flex; font-size:1.2rem; height:3.1rem; justify-content:center; width:3.1rem; }.no-categories h2 { margin:.75rem 0 .25rem; }.no-categories p { color:#64718a; font-size:.78rem; line-height:1.45; margin:0; }.no-categories button { background:#e8f1ff; border:0; border-radius:.65rem; color:#0968d8; font-size:.76rem; font-weight:800; margin-top:1rem; min-height:2.55rem; padding:.45rem .7rem; }
    .selected-summary { align-items:center; background:#eef4ff; border-radius:.85rem; display:grid; gap:.7rem; grid-template-columns:auto minmax(0,1fr) auto; padding:.75rem; }.selected-summary b { color:#10213f; font-size:.85rem; }.selected-summary p { color:#64718a; font-size:.71rem; margin:.16rem 0 0; }.selected-summary button { align-items:center; background:transparent; border:0; color:#0968d8; display:inline-flex; font-size:.85rem; height:2rem; justify-content:center; width:2rem; }.add-field { --background:#fff; --border-color:#dfe7f5; --color:#10213f; --inner-padding-bottom:.3rem; --inner-padding-end:0; --inner-padding-top:.3rem; --padding-end:.95rem; --padding-start:.95rem; --padding-top:.3rem; --padding-bottom:.3rem; border:1px solid #dfe7f5; border-radius:.9rem; min-height:4.6rem; }.add-field ion-label { color:#64718a !important; font-size:.74rem !important; font-weight:700; }.add-field ion-label span { color:#8b96a9; font-weight:500; }.add-field ion-input { --padding-bottom:.5rem; --padding-end:0; --padding-start:0; --padding-top:.22rem; font-size:.92rem; }
    .budget-impact { background:#effaf7; border:1px solid #d3f0e7; border-radius:.85rem; display:grid; gap:.55rem; padding:.8rem; }.budget-impact > div { align-items:baseline; color:#007e70; display:flex; font-size:.75rem; justify-content:space-between; }.budget-impact > div b { color:#007e70; }.budget-impact p { color:#4e706a; font-size:.7rem; line-height:1.4; margin:0; }.budget-impact > i { background:#cce9df; border-radius:999px; display:block; height:.42rem; overflow:hidden; }.budget-impact > i em { background:#007e70; border-radius:inherit; display:block; height:100%; }.offline-note { align-items:center; color:#64718a; display:flex; font-size:.7rem; gap:.4rem; margin:0; }.offline-note i { color:#0968d8; }
    .add-actions { align-items:center; background:rgb(255 255 255 / .97); border-top:1px solid #e2eaf8; bottom:0; box-shadow:0 -8px 22px rgb(38 74 142 / .045); display:grid; gap:.65rem; grid-template-columns:auto minmax(0,1fr); left:0; padding:.7rem 1rem calc(.7rem + env(safe-area-inset-bottom)); position:fixed; right:0; z-index:20; }.add-actions button { border-radius:.85rem; font-size:.8rem; font-weight:800; min-height:3rem; padding:0 1rem; }.add-secondary { background:#fff; border:1px solid #cbd8f2; color:#526078; }.add-primary { background:#0968d8; border:0; box-shadow:0 8px 18px -10px rgb(9 104 216 / .8); color:#fff; }.add-primary[disabled] { opacity:.55; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTransactionPage {
  private static readonly maxAmount = 999_999_999;
  private readonly database = inject(LocalDatabaseService);
  private readonly feedbackToast = inject(FeedbackToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private categoryLoadRequest = 0;

  readonly saving = signal(false);
  readonly step = signal<1 | 2 | 3>(1);
  readonly categories = signal<LocalCategory[]>([]);
  readonly transactions = signal<ListedTransaction[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly selectedCategoryId = signal('');
  readonly iconClass = categoryIconClass;
  readonly selectedCategory = computed(() => this.categories().find((category) => category.localId === this.selectedCategoryId()) ?? null);
  readonly form = this.fb.nonNullable.group({
    type: this.fb.nonNullable.control<TransactionType>('outcome'),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    categoryLocalId: this.fb.nonNullable.control(''),
    occurredAt: this.fb.nonNullable.control(new Date().toISOString().slice(0, 10)),
    reason: this.fb.nonNullable.control(''),
  });

  ionViewWillEnter(): void { void this.loadForRoute(); }

  cannotContinue(): boolean { return this.step() === 1 ? this.form.controls.amount.invalid : !this.form.controls.categoryLocalId.value; }
  continue(): void { if (this.cannotContinue()) return; this.step.update((current) => current === 1 ? 2 : 3); }
  backOrClose(): void { if (this.step() > 1) { this.step.update((current) => current === 3 ? 2 : 1); return; } void this.router.navigateByUrl(this.editingId() ? '/tabs/transactions' : '/tabs/home'); }

  async selectType(value: unknown): Promise<void> {
    if (value !== 'income' && value !== 'outcome') return;
    this.form.controls.type.setValue(value);
    await this.loadCategories();
  }

  selectCategory(value: string): void { this.form.controls.categoryLocalId.setValue(value); this.selectedCategoryId.set(value); }
  openCategories(): void { void this.router.navigateByUrl('/tabs/categories'); }

  spentForCategory(localId: string): number {
    return this.transactions().filter((item) => !item.isIncome && item.categoryLocalId === localId && this.isThisMonth(item.occurredAt)).reduce((total, item) => total + item.amount, 0);
  }

  remainingForCategory(localId: string, budget: number): number { return Math.max(0, budget - this.spentForCategory(localId) - (Number(this.form.controls.amount.value) || 0)); }
  impactPercentage(): number { const category = this.selectedCategory(); return category?.budgetAmount ? Math.min(100, Math.round(((this.spentForCategory(category.localId) + (Number(this.form.controls.amount.value) || 0)) / category.budgetAmount) * 100)) : 0; }
  amount(value: number): string { return formatAriary(value); }
  mga(value: number | null | undefined): string { return this.amount(Number(value) || 0) + ' MGA'; }
  formattedAmount(): string {
    const value = this.form.controls.amount.value;
    return value ? this.amount(value) : '';
  }
  fmg(value: number | null | undefined): string { return this.amount((Number(value) || 0) * 5) + ' Fmg'; }

  setAmountFromText(value: string): void {
    const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 9);
    this.setAmountValue(digits ? Number(digits) : null);
  }

  addAmount(value: number): void { this.setAmountValue((Number(this.form.controls.amount.value) || 0) + value); }

  async save(): Promise<void> {
    if (this.form.invalid || this.saving()) return;
    const isEditing = Boolean(this.editingId());
    this.saving.set(true);
    try {
      const value = this.form.getRawValue();
      const input = { amount: Number(value.amount), occurredAt: value.occurredAt + 'T12:00:00.000Z', isIncome: value.type === 'income', reason: value.reason, categoryLocalId: value.categoryLocalId || null };
      if (isEditing) await this.database.updateTransaction(this.editingId()!, input);
      else await this.database.createTransaction(input);
      await this.router.navigateByUrl('/tabs/transactions');
      await this.feedbackToast.show(isEditing ? 'update' : 'create', isEditing ? 'Transaction mise à jour.' : 'Transaction ajoutée.');
    } finally { this.saving.set(false); }
  }

  private async loadForRoute(): Promise<void> {
    const editId = this.route.snapshot.queryParamMap.get('edit');
    const requestedType = this.route.snapshot.queryParamMap.get('type');
    this.step.set(1);
    this.transactions.set(await this.database.listTransactions());
    if (editId) {
      this.editingId.set(editId);
      const transaction = await this.database.getTransaction(editId);
      if (transaction) {
        this.form.patchValue({ type: transaction.isIncome ? 'income' : 'outcome', amount: transaction.amount, occurredAt: transaction.occurredAt.slice(0, 10), reason: transaction.reason, categoryLocalId: transaction.categoryLocalId ?? '' });
        await this.loadCategories(false);
        this.selectedCategoryId.set(transaction.categoryLocalId ?? '');
        return;
      }
    }
    const type: TransactionType = requestedType === 'income' || requestedType === 'outcome' ? requestedType : 'outcome';
    this.editingId.set(null);
    this.form.reset({ type, amount: null, categoryLocalId: '', occurredAt: new Date().toISOString().slice(0, 10), reason: '' });
    this.selectedCategoryId.set('');
    await this.loadCategories(false);
  }

  private async loadCategories(resetCategory = true): Promise<void> {
    const request = ++this.categoryLoadRequest;
    const categories = await this.database.listCategories(this.form.controls.type.value);
    if (request !== this.categoryLoadRequest) return;
    this.categories.set(categories);
    if (resetCategory) this.selectCategory('');
  }

  private setAmountValue(value: number | null): void {
    const normalized = value === null ? null : Number.isFinite(value) ? Math.max(0, Math.min(AddTransactionPage.maxAmount, Math.floor(value))) : null;
    this.form.controls.amount.setValue(normalized);
  }

  private isThisMonth(value: string): boolean { const date = new Date(value); const now = new Date(); return !Number.isNaN(date.getTime()) && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth(); }
}
