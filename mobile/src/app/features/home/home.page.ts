import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { LocalDatabaseService } from '../../core/data/local-database.service';
import { categoryIconClass, DEFAULT_CATEGORY_ICON } from '../../core/models/category-icons';

type ListedTransaction = Awaited<ReturnType<LocalDatabaseService['listTransactions']>>[number];

interface CategorySlice {
  amount: number;
  budget: number;
  color: string;
  icon: string;
  name: string;
  percent: number;
}

const CATEGORY_COLORS = ['#ed9d24', '#2d80e6', '#16a394', '#7c68d9', '#e35e6b'];

@Component({
  selector: 'app-home',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar class="app-toolbar">
        <ion-title>
          <div class="page-title">
            <span class="brand-mark" aria-hidden="true"><i class="pi pi-wallet"></i></span>
            <span class="page-title__copy"><span class="brand">Kajy Vola</span><span class="page-title__label">Accueil</span></span>
          </div>
        </ion-title>
        <button slot="end" class="header-action" type="button" aria-label="Ouvrir mon profil" (click)="openAccount()">
          <i class="pi pi-user"></i>
        </button>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main class="new-home">
        <section class="new-balance-card" aria-label="Solde disponible">
          <div class="new-balance-card__topline">
            <span>Solde disponible</span>
            <button type="button" (click)="toggleBalance()" [attr.aria-label]="balanceVisible() ? 'Masquer le solde' : 'Afficher le solde'">
              <i [class]="balanceVisible() ? 'pi pi-eye' : 'pi pi-eye-slash'"></i>
            </button>
          </div>
          <div class="new-balance-card__amount">
            <strong>{{ balanceVisible() ? balanceAmount(summary().balance) : '••••••' }}</strong><span>Ar</span>
          </div>
          <div class="new-balance-card__bottomline">
            <span class="new-balance-card__status"><i class="pi pi-shield"></i>{{ syncLabel() }}</span>
            <span>{{ transactionCount() }} opération{{ transactionCount() > 1 ? 's' : '' }}</span>
          </div>
        </section>

        <section class="new-budget-card" aria-label="Budget">
          <div class="new-section-title">
            <span class="new-section-icon"><i class="pi pi-wallet"></i></span>
            <span><h1>Budget du mois</h1><p>{{ budgetSubtitle() }}</p></span>
            <button type="button" class="new-link-button" (click)="openCategories()">Gérer</button>
          </div>
          @if (totalBudget()) {
            <div class="new-budget-card__amounts">
              <span><small>DÉPENSÉ</small><strong>{{ amount(monthlyExpenses()) }} Ar</strong></span>
              <span><small>PLAFOND</small><strong>{{ amount(totalBudget()) }} Ar</strong></span>
            </div>
            <div class="new-progress" [attr.aria-label]="budgetProgress() + ' pour cent du budget utilisé'">
              <i [style.width.%]="budgetProgress()"></i>
            </div>
            <div class="new-budget-card__status">
              <span><i class="pi pi-check-circle"></i>{{ budgetProgress() }} % utilisé</span>
              <span>{{ amount(remainingBudget()) }} Ar disponibles</span>
            </div>
          } @else {
            <div class="new-budget-empty">
              <p>Ajoutez un plafond à une catégorie pour suivre votre budget.</p>
              <button type="button" (click)="openCategories()">Créer un budget <i class="pi pi-arrow-right"></i></button>
            </div>
          }
        </section>

        <section class="new-spending-card" aria-label="Dépenses par catégorie">
          <div class="new-card-heading">
            <div><h2>Dépenses par catégorie</h2><p>{{ spendingSubtitle() }}</p></div>
            <button type="button" aria-label="Gérer les catégories" (click)="openCategories()"><i class="pi pi-chart-pie"></i></button>
          </div>
          @if (categories().length) {
            <div class="new-category-list">
              @for (category of categories(); track category.name) {
                <button type="button" class="new-category-row" (click)="openCategories()">
                  <span class="new-category-row__icon" [style.color]="category.color" [style.border-color]="category.color"><i [class]="iconClass(category.icon)"></i></span>
                  <span class="new-category-row__content">
                    <span class="new-category-row__copy"><b>{{ category.name }}</b><em>{{ categoryAmountLabel(category) }}</em></span>
                    <span class="new-category-progress"><i [style.width.%]="categoryProgress(category)" [style.background]="category.color"></i></span>
                  </span>
                </button>
              }
            </div>
          } @else {
            <div class="new-spending-empty"><i class="pi pi-chart-pie"></i><p>Vos dépenses par catégorie apparaîtront ici.</p></div>
          }
        </section>

        <section class="new-recent-section">
          <div class="new-recent-section__heading">
            <h2>Transactions récentes</h2>
            @if (recent().length) { <button type="button" (click)="openTransactions()">Voir tout</button> }
          </div>
          @if (!recent().length) {
            <section class="new-home-empty">
              <i class="pi pi-receipt"></i>
              <h2>Votre suivi commence ici</h2>
              <p>Ajoutez une transaction depuis le bouton central pour découvrir vos tendances.</p>
            </section>
          } @else {
            <div class="new-recent-list">
              @for (item of recent(); track item.localId) {
                <button type="button" class="new-recent-row" (click)="edit(item.localId)">
                  <span class="new-recent-row__icon" [style.color]="item.categoryColor || (item.isIncome ? '#008d79' : '#2878e4')" [style.border-color]="item.categoryColor || (item.isIncome ? '#008d79' : '#2878e4')">
                    <i [class]="iconForTransaction(item)"></i>
                  </span>
                  <span class="new-recent-row__copy"><b>{{ item.reason || item.categoryName || (item.isIncome ? 'Revenu' : 'Dépense') }}</b><small>{{ date(item.occurredAt) }} · {{ item.categoryName || 'Sans catégorie' }}</small></span>
                  <span class="new-recent-row__amount"><strong [class.income]="item.isIncome" [class.expense]="!item.isIncome">{{ item.isIncome ? '+' : '−' }} {{ amount(item.amount) }} Ar</strong><small [class.pending]="item.syncState === 'pending'">{{ transactionState(item) }}</small></span>
                </button>
              }
            </div>
          }
        </section>
      </main>
    </ion-content>
  `,
  styles: [`
    :host { display: block; }
    .new-toolbar { --background: #f7f8ff; --color: #14233e; --min-height: 4.45rem; --padding-end: 1rem; --padding-start: 1rem; }
    .new-app-heading { align-items: center; display: flex; gap: .62rem; line-height: 1.05; }
    .new-app-heading > span:last-child { display: grid; gap: .18rem; }
    .new-app-heading small { color: #1768d7; font-size: .61rem; font-weight: 800; letter-spacing: .075em; }
    .new-app-heading strong { color: #14233e; font-size: 1.1rem; font-weight: 800; letter-spacing: -.035em; }
    .new-app-mark { align-items: center; background: linear-gradient(145deg, #e8f0ff, #cbdcff); border-radius: .65rem; color: #146fe3; display: inline-flex; font-size: 1rem; height: 2.05rem; justify-content: center; width: 2.05rem; }
    .new-profile-trigger { align-items: center; appearance: none; background: #eef3ff; border: 1px solid #dce7fb; border-radius: 50%; color: #1b67cb; display: inline-flex; font-size: 1rem; height: 2.55rem; justify-content: center; min-height: 2.55rem; min-width: 2.55rem; padding: 0; width: 2.55rem; }
    .new-profile-trigger:active { transform: scale(.95); }

    .new-home { color: #14233e; margin: 0 auto; max-width: 42rem; padding: .45rem 1rem 1.5rem; }
    .new-home h1, .new-home h2, .new-home p { color: inherit; }
    .new-balance-card { background: radial-gradient(circle at 87% 31%, rgb(121 194 255 / .62), transparent 22%), linear-gradient(135deg, #0873e9 0%, #197ff0 55%, #1168ce 100%); border-radius: 1rem; box-shadow: 0 15px 27px -14px rgb(14 104 218 / .62); color: #fff; display: grid; gap: .7rem; overflow: hidden; padding: 1.25rem; position: relative; }
    .new-balance-card::after { border: 1px solid rgb(255 255 255 / .15); border-radius: 50%; content: ''; height: 11rem; pointer-events: none; position: absolute; right: -5.8rem; top: -4.6rem; width: 11rem; }
    .new-balance-card > * { position: relative; z-index: 1; }
    .new-balance-card__topline { align-items: center; display: flex; justify-content: space-between; }
    .new-balance-card__topline > span { font-size: .79rem; font-weight: 650; }
    .new-balance-card__topline button { align-items: center; appearance: none; background: transparent; border: 0; color: #fff; display: inline-flex; font-size: 1rem; height: 2rem; justify-content: center; min-height: 2rem; min-width: 2rem; padding: 0; }
    .new-balance-card__amount { align-items: baseline; display: flex; gap: .44rem; }
    .new-balance-card__amount strong { color: #fff; font-size: clamp(2rem, 9.2vw, 2.55rem); font-weight: 800; letter-spacing: -.058em; line-height: 1; }
    .new-balance-card__amount span { color: rgb(255 255 255 / .92); font-size: 1.05rem; font-weight: 750; }
    .new-balance-card__bottomline { align-items: center; color: rgb(255 255 255 / .86); display: flex; font-size: .69rem; gap: .6rem; justify-content: space-between; }
    .new-balance-card__status { align-items: center; background: rgb(1 72 164 / .2); border-radius: 999px; display: inline-flex; gap: .28rem; padding: .31rem .52rem; }
    .new-balance-card__status i { font-size: .67rem; }

    .new-budget-card, .new-spending-card, .new-home-empty { background: #fff; border: 1px solid #e9eef8; border-radius: 1rem; box-shadow: 0 7px 18px -15px rgb(24 56 103 / .34); }
    .new-budget-card { display: grid; gap: 1rem; margin-top: 1.15rem; padding: 1.05rem; }
    .new-section-title { align-items: center; display: grid; gap: .65rem; grid-template-columns: auto minmax(0, 1fr) auto; }
    .new-section-icon { align-items: center; background: #e9f1ff; border-radius: .72rem; color: #2279e9; display: inline-flex; font-size: 1rem; height: 2.25rem; justify-content: center; width: 2.25rem; }
    .new-section-title h1 { font-size: 1.04rem; font-weight: 800; letter-spacing: -.035em; margin: 0; }
    .new-section-title p { color: #6b7890; font-size: .72rem; margin: .14rem 0 0; }
    .new-link-button, .new-recent-section__heading button { appearance: none; background: transparent; border: 0; color: #1373e8; font-size: .76rem; font-weight: 780; min-height: 2.25rem; padding: .35rem 0 .35rem .4rem; }
    .new-budget-card__amounts { display: flex; gap: 1rem; justify-content: space-between; }
    .new-budget-card__amounts span { display: grid; gap: .25rem; }
    .new-budget-card__amounts span:last-child { justify-items: end; text-align: right; }
    .new-budget-card__amounts small { color: #718099; font-size: .62rem; font-weight: 750; letter-spacing: .045em; }
    .new-budget-card__amounts strong { color: #182846; font-size: .96rem; letter-spacing: -.035em; }
    .new-progress { background: #e4ecfb; border-radius: 999px; height: .58rem; overflow: hidden; }
    .new-progress i, .new-category-progress i { background: #1c78eb; border-radius: inherit; display: block; height: 100%; transition: width .22s ease; }
    .new-budget-card__status { align-items: center; color: #5d6d83; display: flex; font-size: .71rem; gap: .75rem; justify-content: space-between; }
    .new-budget-card__status span:first-child { align-items: center; color: #107a6c; display: inline-flex; font-weight: 700; gap: .25rem; }
    .new-budget-card__status i { font-size: .72rem; }
    .new-budget-empty { display: grid; gap: .62rem; }
    .new-budget-empty p { color: #63728a; font-size: .77rem; line-height: 1.45; margin: 0; }
    .new-budget-empty button { align-items: center; appearance: none; background: #eaf2ff; border: 0; border-radius: .65rem; color: #146fdf; display: inline-flex; font-size: .76rem; font-weight: 750; gap: .35rem; justify-self: start; min-height: 2.3rem; padding: .48rem .7rem; }

    .new-spending-card { margin-top: 1rem; padding: 1.05rem; }
    .new-card-heading { align-items: start; display: flex; gap: .75rem; justify-content: space-between; }
    .new-card-heading h2, .new-recent-section__heading h2 { font-size: 1.08rem; font-weight: 800; letter-spacing: -.04em; margin: 0; }
    .new-card-heading p { color: #778399; font-size: .71rem; margin: .2rem 0 0; }
    .new-card-heading button { align-items: center; appearance: none; background: #eff5ff; border: 0; border-radius: 50%; color: #1672e9; display: inline-flex; font-size: .95rem; height: 2.15rem; justify-content: center; min-height: 2.15rem; min-width: 2.15rem; padding: 0; width: 2.15rem; }
    .new-category-list { display: grid; gap: .54rem; margin-top: .9rem; }
    .new-category-row { align-items: center; appearance: none; background: #fff; border: 1px solid #ecf0f8; border-radius: .9rem; box-shadow: 0 5px 14px -14px rgb(24 56 103 / .4); color: #14233e; display: grid; gap: .68rem; grid-template-columns: auto minmax(0, 1fr); min-height: 4.1rem; padding: .66rem .72rem; text-align: left; width: 100%; }
    .new-category-row:active { background: #f4f8ff; transform: scale(.995); }
    .new-category-row__icon { align-items: center; background: #f5f8ff; border: 1px solid; border-radius: .66rem; display: inline-flex; font-size: .9rem; height: 2.1rem; justify-content: center; width: 2.1rem; }
    .new-category-row__content { display: grid; gap: .38rem; min-width: 0; }
    .new-category-row__copy { align-items: baseline; display: flex; gap: .5rem; justify-content: space-between; min-width: 0; }
    .new-category-row__copy b { font-size: .78rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .new-category-row__copy em { color: #3f506a; flex: 0 0 auto; font-size: .68rem; font-style: normal; font-weight: 700; }
    .new-category-progress { background: #e8eef8; border-radius: 99px; display: block; height: .32rem; overflow: hidden; }
    .new-spending-empty { align-items: center; color: #748197; display: flex; flex-direction: column; gap: .35rem; justify-content: center; min-height: 8.6rem; text-align: center; }
    .new-spending-empty i { color: #77a8ed; font-size: 1.55rem; }
    .new-spending-empty p { color: #748197; font-size: .76rem; margin: 0; }

    .new-recent-section { margin-top: 1.35rem; }
    .new-recent-section__heading { align-items: center; display: flex; justify-content: space-between; margin-bottom: .7rem; }
    .new-recent-list { display: grid; gap: .54rem; }
    .new-recent-row { align-items: center; appearance: none; background: #fff; border: 1px solid #ecf0f8; border-radius: .9rem; box-shadow: 0 5px 14px -14px rgb(24 56 103 / .4); color: #14233e; display: grid; gap: .68rem; grid-template-columns: auto minmax(0, 1fr) auto; min-height: 4.1rem; padding: .66rem .72rem; text-align: left; width: 100%; }
    .new-recent-row:active { background: #f4f8ff; transform: scale(.995); }
    .new-recent-row__icon { align-items: center; background: #f1f6ff; border: 1px solid; border-radius: 50%; display: inline-flex; font-size: .96rem; height: 2.45rem; justify-content: center; width: 2.45rem; }
    .new-recent-row__copy { display: grid; gap: .16rem; min-width: 0; }
    .new-recent-row__copy b { color: #17253e; font-size: .8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .new-recent-row__copy small, .new-recent-row__amount small { color: #718099; font-size: .66rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .new-recent-row__amount { display: grid; gap: .14rem; justify-items: end; }
    .new-recent-row__amount strong { font-size: .75rem; letter-spacing: -.025em; white-space: nowrap; }
    .new-recent-row__amount small { color: #008572; font-weight: 700; }
    .new-recent-row__amount small.pending { color: #a66a10; }
    .new-home-empty { padding: 1.3rem; text-align: center; }
    .new-home-empty > i { color: #2b7fe7; font-size: 1.7rem; }
    .new-home-empty h2 { font-size: 1rem; margin: .65rem 0 .25rem; }
    .new-home-empty p { color: #718099; font-size: .78rem; line-height: 1.45; margin: 0; }
    .income { color: #00836f !important; }
    .expense { color: #c73f4c !important; }

    @media (max-width: 350px) {
      .new-home { padding-left: .82rem; padding-right: .82rem; }
      .new-balance-card { padding: 1.08rem; }
      .new-balance-card__amount strong { font-size: 1.88rem; }
      .new-category-row__copy em { font-size: .61rem; }
      .new-recent-row { gap: .5rem; padding-left: .58rem; padding-right: .58rem; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly database = inject(LocalDatabaseService);
  private readonly router = inject(Router);

  readonly summary = signal({ income: 0, expenses: 0, balance: 0, pendingChanges: 0 });
  readonly recent = signal<ListedTransaction[]>([]);
  readonly categories = signal<CategorySlice[]>([]);
  readonly budget = signal(0);
  readonly monthlyExpenses = signal(0);
  readonly transactionCount = signal(0);
  readonly balanceVisible = signal(true);
  readonly iconClass = categoryIconClass;

  ionViewWillEnter(): void { void this.load(); }

  toggleBalance(): void { this.balanceVisible.update((visible) => !visible); }
  openTransactions(): void { void this.router.navigateByUrl('/tabs/transactions'); }
  openCategories(): void { void this.router.navigateByUrl('/tabs/categories'); }
  openAccount(): void { void this.router.navigateByUrl('/account'); }
  edit(localId: string): void { void this.router.navigate(['/tabs/add'], { queryParams: { edit: localId } }); }

  totalBudget(): number { return this.budget(); }
  budgetProgress(): number { return this.totalBudget() ? Math.min(100, Math.round((this.monthlyExpenses() / this.totalBudget()) * 100)) : 0; }
  remainingBudget(): number { return Math.max(0, this.totalBudget() - this.monthlyExpenses()); }
  amount(value: number): string { return new Intl.NumberFormat('fr-FR').format(Math.abs(value)); }
  balanceAmount(value: number): string { return `${value < 0 ? '−' : ''}${this.amount(value)}`; }
  date(value: string): string { return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
  budgetSubtitle(): string { return this.totalBudget() ? `${this.amount(this.remainingBudget())} Ar disponibles` : 'Aucun plafond défini'; }
  spendingSubtitle(): string { const count = this.categories().length; return count ? `Sur ${count} catégorie${count > 1 ? 's' : ''}` : 'Aucune dépense catégorisée'; }
  syncLabel(): string { return this.summary().pendingChanges ? `${this.summary().pendingChanges} à synchroniser` : 'Enregistré localement'; }
  transactionState(item: ListedTransaction): string { return item.syncState === 'synced' ? 'Synchronisé' : 'Enregistré'; }

  categoryProgress(category: CategorySlice): number {
    return category.budget > 0 ? Math.min(100, Math.round((category.amount / category.budget) * 100)) : Math.max(4, category.percent);
  }

  categoryAmountLabel(category: CategorySlice): string {
    return category.budget > 0
      ? `${this.amount(category.amount)} Ar / ${this.amount(category.budget)} Ar`
      : `${this.amount(category.amount)} Ar`;
  }

  iconForCategory(name: string): string {
    const normalized = name.toLocaleLowerCase('fr-FR');
    if (normalized.includes('aliment') || normalized.includes('sakafo') || normalized.includes('marché')) return 'pi pi-shopping-bag';
    if (normalized.includes('transport')) return 'pi pi-car';
    if (normalized.includes('électric') || normalized.includes('electric') || normalized.includes('eau') || normalized.includes('facture')) return 'pi pi-bolt';
    if (normalized.includes('loisir') || normalized.includes('sortie')) return 'pi pi-star';
    if (normalized.includes('santé') || normalized.includes('sante')) return 'pi pi-heart';
    return 'pi pi-tag';
  }

  iconForTransaction(item: ListedTransaction): string {
    return item.isIncome ? 'pi pi-arrow-down-left' : item.categoryIcon ? categoryIconClass(item.categoryIcon) : this.iconForCategory(item.categoryName || '');
  }

  private async load(): Promise<void> {
    const [summary, transactions, categoryModels] = await Promise.all([
      this.database.dashboard(),
      this.database.listTransactions(),
      this.database.listCategories('outcome'),
    ]);
    this.summary.set(summary);
    this.transactionCount.set(transactions.length);
    this.budget.set(categoryModels.reduce((total, category) => total + (category.budgetAmount ?? 0), 0));
    this.recent.set(transactions.slice(0, 4));

    const categoryDetails = new Map(categoryModels.map((category) => [category.name, { budget: category.budgetAmount ?? 0, icon: category.icon }]));
    const totals = new Map<string, { amount: number; color: string; icon: string }>();
    const monthTransactions = transactions.filter((transaction) => this.isInCurrentMonth(transaction.occurredAt));
    const monthExpenses = monthTransactions.filter((transaction) => !transaction.isIncome);
    this.monthlyExpenses.set(monthExpenses.reduce((total, transaction) => total + transaction.amount, 0));
    for (const item of monthExpenses) {
      const name = item.categoryName || 'Sans catégorie';
      const previous = totals.get(name) ?? { amount: 0, color: item.categoryColor || CATEGORY_COLORS[totals.size % CATEGORY_COLORS.length], icon: item.categoryIcon || categoryDetails.get(name)?.icon || DEFAULT_CATEGORY_ICON };
      totals.set(name, { ...previous, amount: previous.amount + item.amount });
    }
    this.categories.set([...totals.entries()]
      .map(([name, value]) => ({ name, ...value, budget: categoryDetails.get(name)?.budget ?? 0, percent: this.monthlyExpenses() ? Math.round((value.amount / this.monthlyExpenses()) * 100) : 0 }))
      .sort((first, second) => second.amount - first.amount)
      .slice(0, 4));
  }

  private isInCurrentMonth(value: string): boolean {
    const date = new Date(value);
    const today = new Date();
    return !Number.isNaN(date.getTime()) && date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
  }
}
