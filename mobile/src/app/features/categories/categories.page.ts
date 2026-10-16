import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonInput, IonItem, IonLabel, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { LocalDatabaseService } from '../../core/data/local-database.service';
import { CATEGORY_ICON_OPTIONS, categoryIconClass, DEFAULT_CATEGORY_ICON } from '../../core/models/category-icons';
import { LocalCategory } from '../../core/models/offline.models';
import { formatAriary } from '../../core/formatting';
import { FeedbackToastService } from '../../core/services/feedback-toast.service';

type ListedTransaction = Awaited<ReturnType<LocalDatabaseService['listTransactions']>>[number];
type CategoryKind = LocalCategory['type'];

const COLORS = ['#0968d8', '#007e70', '#b67600', '#253750', '#8e4ec6', '#c81e2a'];

@Component({
  selector: 'app-categories',
  imports: [ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, IonLabel, IonItem, IonInput],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar class="app-toolbar">
        @if (composerOpen()) {
          <button slot="start" class="header-back" type="button" aria-label="Retour aux catégories" (click)="backOrCancel()"><i class="pi pi-arrow-left"></i></button>
        }
        <ion-title>
          <div class="page-title">
            <span class="brand-mark" aria-hidden="true"><i class="pi pi-wallet"></i></span>
            <span class="page-title__copy"><span class="brand">Kajy Vola</span><span class="page-title__label">{{ composerOpen() ? (editingId() ? 'Modifier la catégorie' : 'Nouvelle catégorie') : 'Catégories' }}</span></span>
          </div>
        </ion-title>
        @if (!composerOpen()) {
          <button slot="end" class="header-action" type="button" aria-label="Créer une catégorie" (click)="openCreate()"><i class="pi pi-plus"></i></button>
        }
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main class="categories-page page-shell">
        @if (!composerOpen()) {
          <section class="categories-tools">
            <label class="categories-search"><i class="pi pi-search" aria-hidden="true"></i><input type="search" [value]="query()" (input)="query.set($any($event.target).value)" placeholder="Rechercher une catégorie…" aria-label="Rechercher une catégorie"></label>
            <ion-segment class="kv-choice-segment" [value]="categoryForm.controls.type.value" (ionChange)="changeType($event.detail.value)" aria-label="Type de catégories">
              <ion-segment-button value="outcome"><ion-label>Dépenses</ion-label></ion-segment-button>
              <ion-segment-button value="income"><ion-label>Revenus</ion-label></ion-segment-button>
            </ion-segment>
          </section>

          @if (filteredCategories().length) {
            <section class="category-cards">
              @for (category of filteredCategories(); track category.localId) {
                <article class="budget-category-card">
                  <div class="budget-category-card__head">
                    <span class="category-symbol" [style.background]="category.color + '20'" [style.color]="category.color"><i [class]="iconClass(category.icon)"></i></span>
                    <div><h2>{{ category.name }}</h2><p>{{ category.type === 'outcome' ? 'Enveloppe mensuelle' : 'Source de revenu' }}</p></div>
                    <button type="button" class="category-edit" [attr.aria-label]="'Modifier ' + category.name" (click)="openEdit(category)"><i class="pi pi-pencil"></i></button>
                  </div>
                  @if (category.type === 'outcome' && category.budgetAmount; as budget) {
                    <div class="budget-category-card__amounts"><b>{{ mga(spentFor(category.localId)) }} / {{ mga(budget) }}</b><span>{{ usage(category) }} % consommé</span></div>
                    <div class="category-progress"><i [style.width.%]="usage(category)" [style.background]="category.color"></i></div>
                    <div class="budget-category-card__footer"><span [class.warning]="usage(category) >= 80" [class.danger]="usage(category) >= 100"><i [class]="statusIcon(category)"></i> {{ statusLabel(category) }}</span><b>Reste : {{ mga(remainingFor(category)) }}</b></div>
                  } @else {
                    <div class="income-category-note"><i class="pi pi-arrow-down-left"></i> Vos nouveaux revenus pourront utiliser cette catégorie.</div>
                  }
                  <button type="button" class="category-delete" [attr.aria-label]="'Supprimer ' + category.name" (click)="remove(category.localId)">Supprimer</button>
                </article>
              }
            </section>
          } @else {
            <section class="categories-empty"><span><i class="pi pi-tag"></i></span><h1>Aucune catégorie trouvée</h1><p>Créez une catégorie pour commencer à organiser votre budget.</p><button type="button" (click)="openCreate()">Créer une catégorie</button></section>
          }
        } @else {
          <section class="category-composer">
            <div class="composer-progress"><span>Étape {{ composerStep() }}/2</span><div><i [class.done]="composerStep() > 1"></i><i [class.active]="composerStep() === 2"></i></div></div>
            @if (composerStep() === 1) {
              <section class="composer-card">
                <p class="composer-eyebrow">1. Informations</p><h1>{{ editingId() ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}</h1>
                <ion-segment class="kv-choice-segment" [value]="categoryForm.controls.type.value" (ionChange)="changeType($event.detail.value)" aria-label="Type de la catégorie"><ion-segment-button value="outcome"><ion-label>Dépense</ion-label></ion-segment-button><ion-segment-button value="income"><ion-label>Revenu</ion-label></ion-segment-button></ion-segment>
                <ion-item class="form-item"><ion-label position="stacked">Nom de la catégorie</ion-label><ion-input [formControl]="categoryForm.controls.name" placeholder="Ex. Alimentation"></ion-input></ion-item>
                <div class="color-picker"><span>Couleur d’identification</span><div>@for (color of colors; track color) { <button type="button" [style.background]="color" [class.selected]="categoryForm.controls.color.value === color" [attr.aria-label]="'Choisir la couleur ' + color" (click)="categoryForm.controls.color.setValue(color)"><i class="pi pi-check"></i></button> }</div></div>
                <div class="icon-picker"><span>Icône de la catégorie</span><div>@for (icon of categoryIcons; track icon.value) { <button type="button" [class.selected]="categoryForm.controls.icon.value === icon.value" [attr.aria-label]="'Choisir l’icône ' + icon.label" (click)="categoryForm.controls.icon.setValue(icon.value)"><i [class]="icon.className"></i><small>{{ icon.label }}</small></button> }</div></div>
                <section class="category-preview"><span class="category-symbol" [style.background]="categoryForm.controls.color.value + '20'" [style.color]="categoryForm.controls.color.value"><i [class]="iconClass(categoryForm.controls.icon.value)"></i></span><div><b>{{ categoryForm.controls.name.value || 'Votre catégorie' }}</b><p>{{ categoryForm.controls.type.value === 'outcome' ? 'Budget à définir' : 'Source de revenu' }}</p></div></section>
              </section>
            } @else {
              <section class="composer-card">
                <p class="composer-eyebrow">2. Budget</p><h1>{{ categoryForm.controls.type.value === 'outcome' ? 'Définir le plafond mensuel' : 'Finaliser la catégorie' }}</h1>
                @if (categoryForm.controls.type.value === 'outcome') {
                  <section class="budget-input-hero">
                    <header><span>PLAFOND MENSUEL</span><span class="budget-currency"><i class="pi pi-circle-fill"></i> Ariary (MGA)</span></header>
                    <label class="kv-amount-input" for="category-budget-amount"><input id="category-budget-amount" [value]="formattedBudgetAmount()" (input)="setBudgetFromText($any($event.target).value)" inputmode="numeric" autocomplete="off" pattern="[0-9 ]*" placeholder="100 000" aria-label="Plafond mensuel en ariary"><b>Ar</b></label>
                    <p>Vous pourrez l’ajuster à tout moment.</p>
                  </section>
                  <div class="budget-shortcuts"><button type="button" (click)="addBudget(50000)">+50 000 Ar</button><button type="button" (click)="addBudget(100000)">+100 000 Ar</button><button type="button" (click)="addBudget(250000)">+250 000 Ar</button></div>
                } @else { <p class="composer-copy">Cette catégorie sera disponible lors de l’ajout d’un revenu.</p> }
              </section>
            }
            <footer class="composer-actions"><button type="button" class="secondary" (click)="backOrCancel()">{{ composerStep() === 1 ? 'Annuler' : 'Retour' }}</button><button type="button" class="primary" [disabled]="categoryForm.controls.name.invalid || saving()" (click)="composerStep() === 1 ? continueComposer() : save()">{{ composerStep() === 1 ? 'Continuer' : saving() ? 'Enregistrement…' : editingId() ? 'Enregistrer' : 'Créer la catégorie' }} <i class="pi pi-arrow-right"></i></button></footer>
          </section>
        }
      </main>
    </ion-content>
  `,
  styles: [`
    .categories-page { display:grid; gap:1rem; padding-top:1rem; }
    .categories-add-icon { align-items:center; background:#e8f1ff; border:0; border-radius:50%; color:#0968d8; display:inline-flex; font-size:1rem; height:2.35rem; justify-content:center; width:2.35rem; }
    .categories-tools { display:grid; gap:.75rem; }
    .categories-search { align-items:center; background:#fff; border:1px solid #e3eafd; border-radius:999px; box-shadow:0 8px 24px rgb(38 74 142 / .055); display:flex; gap:.65rem; min-height:3rem; padding:0 .9rem; }
    .categories-search i { color:#64718a; }.categories-search input { background:transparent; border:0; color:#10213f; flex:1; min-width:0; outline:0; }.categories-search input::placeholder { color:#8791a4; }
    .budget-scope { background:#fff; border:1px solid #e3eafd; border-radius:1rem; box-shadow:0 8px 24px rgb(38 74 142 / .055); display:grid; gap:.26rem; padding:1rem; }
    .budget-scope > span { color:#0968d8; font-size:.7rem; font-weight:800; }.budget-scope h1 { font-size:1.06rem; margin:.1rem 0; }.budget-scope p { color:#64718a; font-size:.75rem; margin:0; }.budget-scope b { color:#10213f; }
    .category-cards { display:grid; gap:.8rem; }.budget-category-card { background:#fff; border:1px solid #e3eafd; border-radius:1rem; box-shadow:0 8px 24px rgb(38 74 142 / .055); display:grid; gap:.68rem; padding:1rem; }
    .budget-category-card__head { align-items:center; display:grid; gap:.65rem; grid-template-columns:auto minmax(0,1fr) auto; }.category-symbol { align-items:center; border-radius:50%; display:inline-flex; flex:0 0 auto; font-size:1rem; height:2.65rem; justify-content:center; width:2.65rem; }.budget-category-card h2 { font-size:.95rem; margin:0 0 .1rem; }.budget-category-card p { color:#64718a; font-size:.7rem; margin:0; }.category-edit { background:#edf4ff; border:0; border-radius:50%; color:#0968d8; height:2rem; width:2rem; }
    .budget-category-card__amounts { align-items:baseline; display:flex; justify-content:space-between; gap:.5rem; }.budget-category-card__amounts b { font-size:.77rem; }.budget-category-card__amounts span { color:#64718a; font-size:.68rem; }.category-progress { background:#e6edfc; border-radius:999px; height:.5rem; overflow:hidden; }.category-progress i { border-radius:inherit; display:block; height:100%; }.budget-category-card__footer { align-items:center; color:#007e70; display:flex; font-size:.67rem; font-weight:700; justify-content:space-between; gap:.5rem; }.budget-category-card__footer span.warning { color:#a56a00; }.budget-category-card__footer span.danger { color:#c81e2a; }.budget-category-card__footer b { color:#64718a; font-weight:650; white-space:nowrap; }.category-delete { background:transparent; border:0; color:#9a6470; font-size:.67rem; justify-self:end; padding:0; }
    .income-category-note { align-items:center; background:#effaf7; border-radius:.7rem; color:#007e70; display:flex; font-size:.72rem; gap:.45rem; padding:.65rem; }.categories-empty { align-items:center; background:#fff; border:1px solid #e3eafd; border-radius:1rem; display:grid; justify-items:center; padding:2rem 1.2rem; text-align:center; }.categories-empty span { align-items:center; background:#e8f1ff; border-radius:50%; color:#0968d8; display:flex; font-size:1.4rem; height:3.5rem; justify-content:center; width:3.5rem; }.categories-empty h1 { font-size:1.1rem; margin:1rem 0 .3rem; }.categories-empty p { color:#64718a; font-size:.8rem; line-height:1.45; margin:0; }.categories-empty button { background:#e8f1ff; border:0; border-radius:.85rem; color:#0968d8; font-weight:800; margin-top:1rem; padding:.78rem 1rem; }
    .category-composer { display:grid; gap:1rem; }.composer-progress { background:#fff; border:1px solid #e3eafd; border-radius:1rem; display:grid; gap:.6rem; padding:.9rem; }.composer-progress > span,.composer-eyebrow { color:#0968d8; font-size:.7rem; font-weight:800; margin:0; text-transform:uppercase; }.composer-progress > div { display:grid; gap:.4rem; grid-template-columns:1fr 1fr; }.composer-progress i { background:#dce8fb; border-radius:999px; height:.38rem; }.composer-progress i.done,.composer-progress i.active { background:#0968d8; }.composer-card { background:#fff; border:1px solid #e3eafd; border-radius:1rem; display:grid; gap:1rem; padding:1rem; }.composer-card h1 { font-size:1.18rem; }.color-picker,.icon-picker { display:grid; gap:.55rem; }.color-picker > span,.icon-picker > span { color:#64718a; font-size:.75rem; font-weight:750; }.color-picker > div { display:flex; flex-wrap:wrap; gap:.55rem; }.color-picker button { align-items:center; border:3px solid transparent; border-radius:.65rem; color:#fff; display:inline-flex; height:2.6rem; justify-content:center; width:2.6rem; }.color-picker button.selected { border-color:#10213f; }.color-picker button:not(.selected) i { display:none; }.icon-picker > div { display:grid; gap:.5rem; grid-template-columns:repeat(4, minmax(0, 1fr)); }.icon-picker button { align-items:center; background:#fff; border:1px solid #dfe8f8; border-radius:.72rem; color:#62718a; display:grid; font-size:1rem; gap:.26rem; justify-content:center; min-height:4rem; padding:.35rem .1rem; }.icon-picker button i { color:#317be0; }.icon-picker button small { font-size:.56rem; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; width:100%; }.icon-picker button.selected { background:#edf4ff; border-color:#0968d8; box-shadow:0 0 0 2px rgb(9 104 216 / .12); color:#0968d8; }.icon-picker button.selected i { color:#0968d8; }.category-preview { align-items:center; background:#eef4ff; border-radius:.85rem; display:flex; gap:.7rem; padding:.85rem; }.category-preview b { font-size:.88rem; }.category-preview p { color:#64718a; font-size:.72rem; margin:.12rem 0 0; }.budget-input-hero { background:#eef4ff; border:1px solid #d8e5fc; border-radius:.9rem; display:grid; gap:.72rem; padding:1rem; text-align:center; }.budget-input-hero header { align-items:center; display:flex; justify-content:space-between; gap:.6rem; }.budget-input-hero header > span:first-child { color:#4c5362; font-size:.73rem; font-weight:850; letter-spacing:.035em; }.budget-currency { align-items:center; background:#cef6f1; border-radius:999px; color:#147f79; display:inline-flex; font-size:.62rem; font-weight:800; gap:.3rem; padding:.32rem .52rem; white-space:nowrap; }.budget-currency i { font-size:.36rem; }.budget-input-hero p,.composer-copy { color:#64718a; font-size:.74rem; margin:0; }.budget-shortcuts { display:grid; gap:.45rem; grid-template-columns:repeat(3,1fr); }.budget-shortcuts button { background:#e8f1ff; border:0; border-radius:.65rem; color:#0968d8; font-size:.68rem; font-weight:800; min-height:2.55rem; }.composer-actions { display:grid; gap:.65rem; grid-template-columns:auto 1fr; padding:.15rem 0 calc(.65rem + env(safe-area-inset-bottom)); }.composer-actions button { border-radius:.85rem; font-weight:800; min-height:3.1rem; padding:0 1rem; }.composer-actions .secondary { background:#fff; border:1px solid #cbd8f2; color:#4d5d76; }.composer-actions .primary { background:#0968d8; border:0; color:#fff; }.composer-actions .primary[disabled] { opacity:.55; }
    @media (max-width:340px) { .icon-picker > div { grid-template-columns:repeat(3, minmax(0, 1fr)); } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPage {
  private readonly database = inject(LocalDatabaseService);
  private readonly feedbackToast = inject(FeedbackToastService);
  private readonly fb = inject(FormBuilder);

  readonly colors = COLORS;
  readonly categoryIcons = CATEGORY_ICON_OPTIONS;
  readonly iconClass = categoryIconClass;
  readonly categories = signal<LocalCategory[]>([]);
  readonly transactions = signal<ListedTransaction[]>([]);
  readonly query = signal('');
  readonly composerOpen = signal(false);
  readonly composerStep = signal<1 | 2>(1);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly categoryForm = this.fb.nonNullable.group({
    type: this.fb.nonNullable.control<CategoryKind>('outcome'),
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(35)]),
    budgetAmount: this.fb.control<number | null>(null),
    color: this.fb.nonNullable.control(COLORS[0]),
    icon: this.fb.nonNullable.control(DEFAULT_CATEGORY_ICON),
  });
  readonly filteredCategories = computed(() => {
    const value = this.query().trim().toLocaleLowerCase('fr-FR');
    return this.categories().filter((category) => !value || category.name.toLocaleLowerCase('fr-FR').includes(value));
  });

  ionViewWillEnter(): void { void this.load(); }

  changeType(value: unknown): void {
    if (value !== 'income' && value !== 'outcome') return;
    this.categoryForm.controls.type.setValue(value);
    this.query.set('');
    if (!this.composerOpen()) void this.load();
  }

  openCreate(): void {
    this.editingId.set(null);
    this.composerStep.set(1);
    this.categoryForm.reset({ type: this.categoryForm.controls.type.value, name: '', budgetAmount: null, color: COLORS[0], icon: DEFAULT_CATEGORY_ICON });
    this.composerOpen.set(true);
  }

  openEdit(category: LocalCategory): void {
    this.editingId.set(category.localId);
    this.composerStep.set(1);
    this.categoryForm.reset({ type: category.type, name: category.name, budgetAmount: category.budgetAmount, color: category.color, icon: category.icon });
    this.composerOpen.set(true);
  }

  continueComposer(): void { if (this.categoryForm.controls.name.valid) this.composerStep.set(2); }

  backOrCancel(): void {
    if (this.composerStep() === 2) { this.composerStep.set(1); return; }
    this.composerOpen.set(false);
  }

  addBudget(value: number): void { this.categoryForm.controls.budgetAmount.setValue((Number(this.categoryForm.controls.budgetAmount.value) || 0) + value); }
  formattedBudgetAmount(): string {
    const value = this.categoryForm.controls.budgetAmount.value;
    return value ? formatAriary(value) : '';
  }
  setBudgetFromText(value: string): void {
    const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    this.categoryForm.controls.budgetAmount.setValue(digits ? Number(digits) : null);
  }

  async save(): Promise<void> {
    if (this.categoryForm.controls.name.invalid || this.saving()) return;
    const raw = this.categoryForm.getRawValue();
    const isEditing = Boolean(this.editingId());
    const budgetAmount = raw.type === 'outcome' ? Number(raw.budgetAmount) : null;
    if (raw.type === 'outcome' && (!budgetAmount || budgetAmount < 100)) { alert('Saisissez un plafond mensuel d’au moins 100 MGA.'); return; }
    this.saving.set(true);
    try {
      const input = { name: raw.name, type: raw.type, color: raw.color, icon: raw.icon, budgetAmount } as const;
      if (isEditing) await this.database.updateCategory(this.editingId()!, input);
      else await this.database.createCategory(input);
      this.composerOpen.set(false);
      this.editingId.set(null);
      await this.load();
      await this.feedbackToast.show(isEditing ? 'update' : 'create', isEditing ? 'Catégorie mise à jour.' : 'Catégorie ajoutée.');
    } finally { this.saving.set(false); }
  }

  async remove(localId: string): Promise<void> {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
      await this.database.deleteCategory(localId);
      await this.load();
      await this.feedbackToast.show('delete', 'Catégorie supprimée.');
    } catch (error) {
      await this.feedbackToast.show('error', error instanceof Error ? error.message : 'Impossible de supprimer cette catégorie.');
    }
  }

  spentFor(localId: string): number { return this.transactions().filter((item) => !item.isIncome && item.categoryLocalId === localId && this.isThisMonth(item.occurredAt)).reduce((sum, item) => sum + item.amount, 0); }
  usage(category: LocalCategory): number { return category.budgetAmount ? Math.min(100, Math.round((this.spentFor(category.localId) / category.budgetAmount) * 100)) : 0; }
  remainingFor(category: LocalCategory): number { return Math.max(0, (category.budgetAmount ?? 0) - this.spentFor(category.localId)); }
  totalBudget(): number { return this.categories().reduce((sum, category) => sum + (category.budgetAmount ?? 0), 0); }
  totalSpent(): number { return this.categories().reduce((sum, category) => sum + this.spentFor(category.localId), 0); }
  remainingBudget(): number { return Math.max(0, this.totalBudget() - this.totalSpent()); }
  mga(value: number): string { return formatAriary(value) + ' MGA'; }
  monthLabel(): string { return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date()); }
  statusLabel(category: LocalCategory): string { const value = this.usage(category); return value >= 100 ? 'Plafond atteint' : value >= 80 ? 'Vigilance sur ce budget' : 'Sous contrôle'; }
  statusIcon(category: LocalCategory): string { const value = this.usage(category); return value >= 100 ? 'pi pi-exclamation-circle' : value >= 80 ? 'pi pi-bell' : 'pi pi-check-circle'; }

  private async load(): Promise<void> {
    const [categories, transactions] = await Promise.all([this.database.listCategories(this.categoryForm.controls.type.value), this.database.listTransactions()]);
    this.categories.set(categories);
    this.transactions.set(transactions);
  }

  private isThisMonth(value: string): boolean { const date = new Date(value); const now = new Date(); return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth(); }
}
