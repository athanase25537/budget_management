import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { LocalDatabaseService } from '../../core/data/local-database.service';
import { categoryIconClass } from '../../core/models/category-icons';
import { ReportPeriod, createReportRange, filterTransactionsForRange } from '../../core/reports/report-data';
import { FeedbackToastService } from '../../core/services/feedback-toast.service';

type ListedTransaction = Awaited<ReturnType<LocalDatabaseService['listTransactions']>>[number];
type TransactionFilter = 'all' | 'income' | 'outcome';
type TransactionPeriod = Exclude<ReportPeriod, 'custom'>;

interface TransactionGroup {
  items: ListedTransaction[];
  key: string;
  label: string;
  net: number;
}

interface PeriodSummary {
  expenses: number;
  income: number;
  net: number;
}

@Component({
  selector: 'app-transactions',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar class="app-toolbar">
        <ion-title>
          <div class="page-title">
            <span class="brand-mark" aria-hidden="true"><i class="pi pi-wallet"></i></span>
            <span class="page-title__copy"><span class="brand">Kajy Vola</span><span class="page-title__label">Transactions</span></span>
          </div>
        </ion-title>
        <button slot="end" class="header-action" type="button" aria-label="Ajouter une transaction" (click)="add()"><i class="pi pi-plus"></i></button>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main class="transactions-screen">
        @if (!transactions().length) {
          <section class="tx-empty-state">
            <span class="tx-empty-state__icon"><i class="pi pi-receipt"></i></span>
            <h1>Aucune transaction</h1>
            <p>Votre historique apparaîtra ici dès votre première opération.</p>
            <button type="button" (click)="add()"><i class="pi pi-plus"></i> Ajouter une transaction</button>
          </section>
        } @else {
          <label class="tx-search-control">
            <i class="pi pi-search" aria-hidden="true"></i>
            <input type="search" inputmode="search" [value]="search()" (input)="search.set($any($event.target).value)" placeholder="Rechercher une transaction…" aria-label="Rechercher une transaction">
          </label>

          <section class="tx-filter-toolbar" aria-label="Filtrer les transactions">
            <label class="tx-period-select">
              <i class="pi pi-calendar" aria-hidden="true"></i>
              <span>{{ periodControlLabel() }}</span>
              <i class="pi pi-chevron-down" aria-hidden="true"></i>
              <select [value]="period()" (change)="setPeriod($any($event.target).value)" aria-label="Période des transactions">
                <option value="week">Semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Année</option>
              </select>
            </label>
            <button type="button" class="tx-filter-type" [class.active]="filter() === 'all'" [attr.aria-pressed]="filter() === 'all'" (click)="setFilter('all')">Toutes</button>
            <button type="button" class="tx-filter-type" [class.active]="filter() === 'outcome'" [attr.aria-pressed]="filter() === 'outcome'" (click)="setFilter('outcome')">Dépenses</button>
            <button type="button" class="tx-filter-type" [class.active]="filter() === 'income'" [attr.aria-pressed]="filter() === 'income'" (click)="setFilter('income')">Revenus</button>
          </section>

          <section class="tx-period-summary" [attr.aria-label]="'Synthèse ' + periodLabel()">
            <div class="tx-period-summary__top">
              <span><i class="pi pi-calendar" aria-hidden="true"></i>{{ periodLabel() }}</span>
              <small>Ar</small>
            </div>
            <p>Résultat net de la période</p>
            <strong [class.tx-income]="periodSummary().net >= 0" [class.tx-expense]="periodSummary().net < 0">{{ signedAmount(periodSummary().net) }} <em>Ar</em></strong>
            <div class="tx-period-summary__metrics">
              <div class="tx-income-metric"><span><i class="pi pi-arrow-down-left" aria-hidden="true"></i> Revenus</span><b>+ {{ amount(periodSummary().income) }} Ar</b></div>
              <div class="tx-expense-metric"><span><i class="pi pi-arrow-up-right" aria-hidden="true"></i> Dépenses</span><b>− {{ amount(periodSummary().expenses) }} Ar</b></div>
            </div>
          </section>

          @if (!groups().length) {
            <section class="tx-no-results">
              <i class="pi pi-search"></i>
              <h2>Aucun résultat</h2>
              <p>Modifiez votre recherche ou vos filtres pour retrouver une opération.</p>
            </section>
          } @else {
            <div class="tx-groups">
              @for (group of groups(); track group.key) {
                <section class="tx-group">
                  <div class="tx-group__heading">
                    <span>{{ group.label }}</span>
                    <small>{{ group.items.length }} opération{{ group.items.length > 1 ? 's' : '' }}</small>
                  </div>
                  <div class="tx-list-card">
                    @for (item of group.items; track item.localId; let last = $last) {
                      <article class="tx-row" [class.tx-row--last]="last">
                        <button type="button" class="tx-row__main" (click)="edit(item.localId)" [attr.aria-label]="'Modifier ' + (item.reason || item.categoryName || 'la transaction')">
                          <span class="tx-row__icon" [style.color]="item.categoryColor || (item.isIncome ? '#008d79' : '#2478e8')" [style.border-color]="item.categoryColor || (item.isIncome ? '#008d79' : '#2478e8')">
                            <i [class]="iconFor(item)"></i>
                          </span>
                          <span class="tx-row__copy"><b>{{ item.reason || item.categoryName || (item.isIncome ? 'Revenu' : 'Dépense') }}</b><small>{{ item.categoryName || 'Sans catégorie' }} · {{ time(item.occurredAt) }}</small></span>
                          <span class="tx-row__amount"><strong [class.tx-income]="item.isIncome" [class.tx-expense]="!item.isIncome">{{ item.isIncome ? '+' : '−' }} {{ amount(item.amount) }} Ar</strong><small [class.pending]="item.syncState === 'pending'">{{ transactionState(item) }}</small></span>
                        </button>
                        <button type="button" class="tx-row__delete" (click)="remove(item.localId)" [attr.aria-label]="'Supprimer ' + (item.reason || item.categoryName || 'la transaction')"><i class="pi pi-trash"></i></button>
                      </article>
                    }
                  </div>
                </section>
              }
            </div>
          }

          <p class="tx-screen-foot"><i class="pi pi-shield"></i>{{ filtered().length }} opération{{ filtered().length > 1 ? 's' : '' }} affichée{{ filtered().length > 1 ? 's' : '' }}</p>
        }
      </main>
    </ion-content>
  `,
  styles: [`
    :host { display: block; }
    .tx-toolbar { --background: #f7f8ff; --color: #14233e; --min-height: 4.45rem; --padding-end: 1rem; --padding-start: 1rem; }
    .tx-app-heading { align-items: center; display: flex; gap: .62rem; line-height: 1.05; }
    .tx-app-heading > span:last-child { display: grid; gap: .18rem; }
    .tx-app-heading small { color: #1768d7; font-size: .61rem; font-weight: 800; letter-spacing: .075em; }
    .tx-app-heading strong { color: #14233e; font-size: 1.1rem; font-weight: 800; letter-spacing: -.035em; }
    .tx-app-mark { align-items: center; background: linear-gradient(145deg, #e8f0ff, #cbdcff); border-radius: .65rem; color: #146fe3; display: inline-flex; font-size: 1rem; height: 2.05rem; justify-content: center; width: 2.05rem; }
    .tx-add-trigger { align-items: center; appearance: none; background: #e7f0ff; border: 1px solid #d8e5fb; border-radius: 50%; color: #126edd; display: inline-flex; font-size: 1rem; height: 2.55rem; justify-content: center; min-height: 2.55rem; min-width: 2.55rem; padding: 0; width: 2.55rem; }
    .tx-add-trigger:active { transform: scale(.95); }

    .transactions-screen { color: #14233e; margin: 0 auto; max-width: 42rem; padding: .45rem 1rem 1.5rem; }
    .transactions-screen h1, .transactions-screen h2, .transactions-screen p { color: inherit; }
    .tx-search-control { align-items: center; background: #fff; border: 1px solid #e8eef8; border-radius: 999px; box-shadow: 0 6px 16px -14px rgb(24 56 103 / .35); display: flex; gap: .64rem; min-height: 3rem; padding: 0 .95rem; }
    .tx-search-control > i { color: #62728b; font-size: .94rem; }
    .tx-search-control input { background: transparent; border: 0; color: #17253e; flex: 1; font-size: .83rem; min-width: 0; outline: 0; }
    .tx-search-control input::placeholder { color: #8793a7; }
    .tx-filter-toolbar { align-items: center; display: grid; gap: .45rem; grid-template-columns: minmax(6.65rem, 1.62fr) minmax(3.25rem, .83fr) minmax(3.8rem, 1fr) minmax(3.45rem, .9fr); margin: .85rem 0 1.05rem; }
    .tx-period-select, .tx-filter-type { -webkit-tap-highlight-color: transparent; min-height: 2.42rem; }
    .tx-period-select { align-items: center; background: #fff; border: 1px solid #e1e9f5; border-radius: .82rem; color: #1b2a48; cursor: pointer; display: grid; font-size: .75rem; font-weight: 760; gap: .42rem; grid-template-columns: auto minmax(0, 1fr) auto; min-width: 0; padding: 0 .62rem; position: relative; }
    .tx-period-select > i:first-child { color: #1b2a48; font-size: .91rem; }.tx-period-select > i:last-of-type { color: #253753; font-size: .66rem; }.tx-period-select > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.tx-period-select select { appearance: none; cursor: pointer; height: 100%; inset: 0; opacity: 0; position: absolute; width: 100%; z-index: 1; }.tx-period-select:focus-within { border-color: #1d78ea; box-shadow: 0 0 0 3px rgb(29 120 234 / .14); }
    .tx-filter-type { appearance: none; background: #fff; border: 1px solid #e1e9f5; border-radius: .82rem; color: #1b2a48; font-size: .69rem; font-weight: 760; min-width: 0; overflow: hidden; padding: 0 .3rem; text-overflow: ellipsis; white-space: nowrap; }.tx-filter-type.active { background: #0968d8; border-color: #0968d8; box-shadow: 0 6px 13px -9px rgb(9 104 216 / .76); color: #fff; }.tx-filter-type:active { transform: scale(.97); }.tx-filter-type:focus-visible { outline: 3px solid rgb(9 104 216 / .28); outline-offset: 2px; }

    .tx-period-summary { background: radial-gradient(circle at 87% 31%, rgb(121 194 255 / .62), transparent 22%), linear-gradient(135deg, #0873e9 0%, #197ff0 55%, #1168ce 100%); border: 0; border-radius: 1rem; box-shadow: 0 15px 27px -14px rgb(14 104 218 / .62); color: #fff; display: grid; gap: .72rem; overflow: hidden; padding: 1.05rem; position: relative; }
    .tx-period-summary::after { border: 1px solid rgb(255 255 255 / .15); border-radius: 50%; content: ''; height: 11rem; pointer-events: none; position: absolute; right: -5.8rem; top: -4.6rem; width: 11rem; }
    .tx-period-summary > * { position: relative; z-index: 1; }
    .tx-period-summary__top { align-items: center; display: flex; justify-content: space-between; }
    .tx-period-summary__top > span { align-items: center; color: rgb(255 255 255 / .9); display: inline-flex; font-size: .69rem; font-weight: 790; gap: .42rem; letter-spacing: .06em; text-transform: uppercase; }
    .tx-period-summary__top > span i { align-items: center; background: rgb(255 255 255 / .16); border-radius: 50%; color: #fff; display: inline-flex; font-size: .68rem; height: 1.36rem; justify-content: center; letter-spacing: 0; width: 1.36rem; }
    .tx-period-summary__top small { background: rgb(1 72 164 / .2); border-radius: 999px; color: rgb(255 255 255 / .92); font-size: .67rem; font-weight: 750; padding: .28rem .56rem; }
    .tx-period-summary > p { color: rgb(255 255 255 / .78); font-size: .74rem; margin: .05rem 0 -.45rem; }
    .tx-period-summary > strong { color: #fff; font-size: 1.78rem; font-weight: 810; letter-spacing: -.057em; line-height: 1.1; }
    .tx-period-summary > strong em { font-size: .91rem; font-style: normal; font-weight: 760; margin-left: .26rem; }
    .tx-income { color: #008472 !important; }
    .tx-expense { color: #c93543 !important; }
    .tx-period-summary > strong.tx-income, .tx-period-summary > strong.tx-expense { color: #fff !important; }
    .tx-period-summary__metrics { display: grid; gap: .58rem; grid-template-columns: 1fr 1fr; margin-top: .25rem; }
    .tx-period-summary__metrics div { background: rgb(255 255 255 / .15); border: 1px solid rgb(255 255 255 / .13); border-radius: .7rem; color: #fff; display: grid; gap: .38rem; min-height: 4.5rem; padding: .65rem; }
    .tx-period-summary__metrics span { align-items: center; color: rgb(255 255 255 / .88); display: inline-flex; font-size: .66rem; font-weight: 740; gap: .34rem; }
    .tx-period-summary__metrics span i { align-items: center; background: rgb(255 255 255 / .92); border-radius: 50%; color: #0968d8; display: inline-flex; font-size: .7rem; height: 1.38rem; justify-content: center; width: 1.38rem; }
    .tx-income-metric span i { color: #007e70; }
    .tx-expense-metric span i { color: #c83845; }
    .tx-period-summary__metrics b { color: #fff; font-size: .78rem; letter-spacing: -.03em; white-space: nowrap; }

    .tx-groups { display: grid; gap: 1.1rem; margin-top: 1.35rem; }
    .tx-group { display: grid; gap: .48rem; }
    .tx-group__heading { align-items: center; color: #536077; display: flex; font-size: .68rem; font-weight: 800; justify-content: space-between; letter-spacing: .055em; text-transform: uppercase; }
    .tx-group__heading small { color: #7d899d; font-size: .67rem; font-weight: 600; letter-spacing: 0; text-transform: none; }
    .tx-list-card { display: grid; gap: .54rem; }
    .tx-row { align-items: stretch; background: #fff; border: 1px solid #ecf0f8; border-radius: .9rem; box-shadow: 0 5px 14px -14px rgb(24 56 103 / .4); display: grid; grid-template-columns: minmax(0, 1fr) auto; overflow: hidden; }
    .tx-row__main { align-items: center; appearance: none; background: #fff; border: 0; color: #14233e; display: grid; gap: .65rem; grid-template-columns: auto minmax(0, 1fr) auto; min-height: 4.75rem; padding: .68rem .15rem .68rem .75rem; text-align: left; width: 100%; }
    .tx-row__main:active { background: #f5f8ff; }
    .tx-row__icon { align-items: center; background: #f0f6ff; border: 1px solid; border-radius: 50%; display: inline-flex; font-size: .94rem; height: 2.35rem; justify-content: center; width: 2.35rem; }
    .tx-row__copy { display: grid; gap: .18rem; min-width: 0; }
    .tx-row__copy b { color: #17253e; font-size: .8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tx-row__copy small, .tx-row__amount small { color: #6e7b91; font-size: .67rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tx-row__amount { display: grid; gap: .15rem; justify-items: end; }
    .tx-row__amount strong { font-size: .75rem; letter-spacing: -.027em; white-space: nowrap; }
    .tx-row__amount small { color: #008270; font-weight: 700; }
    .tx-row__amount small.pending { color: #a56b16; }
    .tx-row__delete { align-self: center; appearance: none; background: transparent; border: 0; border-radius: 50%; color: #8d99aa; font-size: .82rem; height: 2.55rem; margin: 0 .38rem 0 .12rem; min-height: 2.55rem; min-width: 2.55rem; padding: 0; width: 2.55rem; }
    .tx-row__delete:active { background: #fff0f1; color: #c93543; }
    .tx-no-results { align-items: center; background: #fff; border: 1px solid #e9eef8; border-radius: 1rem; color: #718099; display: flex; flex-direction: column; margin-top: 1.1rem; padding: 1.5rem 1rem; text-align: center; }
    .tx-no-results > i { color: #438ae9; font-size: 1.65rem; }
    .tx-no-results h2 { color: #1a2944; font-size: 1rem; margin: .7rem 0 .25rem; }
    .tx-no-results p { font-size: .78rem; line-height: 1.45; margin: 0; }
    .tx-screen-foot { align-items: center; color: #64728a; display: flex; font-size: .68rem; gap: .35rem; justify-content: center; margin: 1.35rem 0 .3rem; text-align: center; }
    .tx-screen-foot i { color: #1d79e9; }

    .tx-empty-state { align-items: center; display: flex; flex-direction: column; justify-content: center; min-height: 61vh; padding: 1rem; text-align: center; }
    .tx-empty-state__icon { align-items: center; background: #eaf2ff; border-radius: 50%; color: #277ce8; display: inline-flex; font-size: 1.7rem; height: 4.35rem; justify-content: center; width: 4.35rem; }
    .tx-empty-state h1 { font-size: 1.24rem; font-weight: 800; letter-spacing: -.04em; margin: 1.05rem 0 .36rem; }
    .tx-empty-state p { color: #718099; font-size: .81rem; line-height: 1.5; margin: 0; max-width: 16rem; }
    .tx-empty-state button { align-items: center; appearance: none; background: #1d78ea; border: 0; border-radius: .75rem; box-shadow: 0 9px 17px -11px rgb(21 105 220 / .65); color: #fff; display: inline-flex; font-size: .78rem; font-weight: 760; gap: .45rem; margin-top: 1.2rem; min-height: 2.8rem; padding: .58rem .9rem; }
    .tx-empty-state button:active { transform: scale(.97); }

    @media (max-width: 375px) {
      .tx-filter-toolbar { gap: .28rem; grid-template-columns: minmax(0, 1.42fr) repeat(3, minmax(0, 1fr)); }
      .tx-period-select, .tx-filter-type { min-height: 2.42rem; }
      .tx-period-select { font-size: .64rem; gap: .25rem; padding: 0 .36rem; }.tx-period-select > i:first-child { font-size: .81rem; }.tx-period-select > i:last-of-type { font-size: .56rem; }.tx-filter-type { font-size: .61rem; letter-spacing: -.02em; padding: 0 .08rem; }
    }

    @media (max-width: 350px) {
      .transactions-screen { padding-left: .82rem; padding-right: .82rem; }
      .tx-period-summary { padding: .92rem; }
      .tx-period-summary__metrics { gap: .42rem; }
      .tx-period-summary__metrics div { padding: .54rem; }
      .tx-period-summary__metrics b { font-size: .69rem; }
      .tx-row__main { gap: .46rem; padding-left: .58rem; }
      .tx-row__delete { margin-left: 0; margin-right: .17rem; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsPage {
  private readonly database = inject(LocalDatabaseService);
  private readonly feedbackToast = inject(FeedbackToastService);
  private readonly router = inject(Router);

  readonly transactions = signal<ListedTransaction[]>([]);
  readonly filter = signal<TransactionFilter>('all');
  readonly period = signal<TransactionPeriod>('month');
  readonly search = signal('');
  readonly monthStartDay = signal(1);
  readonly economy = signal(10);
  readonly activeRange = computed(() => createReportRange(this.period(), undefined, new Date(), this.monthStartDay()));
  readonly periodTransactions = computed(() => filterTransactionsForRange(this.transactions(), this.activeRange()));
  readonly filtered = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('fr-FR');
    return this.periodTransactions().filter((item) => {
      const matchingType = this.filter() === 'all' || (this.filter() === 'income' ? item.isIncome : !item.isIncome);
      const matchingQuery = !query || [item.reason, item.categoryName].filter(Boolean).some((value) => value!.toLocaleLowerCase('fr-FR').includes(query));
      return matchingType && matchingQuery;
    });
  });
  readonly periodSummary = computed<PeriodSummary>(() => {
    const incomeAndExpenses = this.periodTransactions()
      .reduce((totals, item) => ({
        income: totals.income + (item.isIncome ? item.amount : 0),
        expenses: totals.expenses + (item.isIncome ? 0 : item.amount),
      }), { income: 0, expenses: 0 });
    const savings = incomeAndExpenses.income * this.economy() / 100;
    return { ...incomeAndExpenses, net: incomeAndExpenses.income - savings - incomeAndExpenses.expenses };
  });
  readonly groups = computed<TransactionGroup[]>(() => this.groupTransactions(this.filtered()));

  ionViewWillEnter(): void { void this.load(); }

  add(): void { void this.router.navigateByUrl('/tabs/add'); }
  setFilter(value: TransactionFilter): void { this.filter.set(value); }
  setPeriod(value: unknown): void {
    if (value === 'week' || value === 'month' || value === 'year') {
      this.period.set(value);
    }
  }
  edit(localId: string): void { void this.router.navigate(['/tabs/add'], { queryParams: { edit: localId } }); }

  async remove(localId: string): Promise<void> {
    if (!confirm('Supprimer cette transaction ?')) return;
    try {
      await this.database.deleteTransaction(localId);
      await this.load();
      await this.feedbackToast.show('delete', 'Transaction supprimée.');
    } catch {
      await this.feedbackToast.show('error', 'Impossible de supprimer cette transaction.');
    }
  }

  amount(value: number): string { return new Intl.NumberFormat('fr-FR').format(Math.abs(value)); }
  signedAmount(value: number): string { return (value > 0 ? '+' : value < 0 ? '−' : '') + this.amount(value); }
  time(value: string): string { return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
  periodControlLabel(): string { return this.period() === 'week' ? 'Semaine' : this.period() === 'year' ? 'Année' : 'Ce mois'; }
  periodLabel(): string { return this.activeRange().label; }
  transactionState(item: ListedTransaction): string { return item.syncState === 'synced' ? 'Synchronisé' : 'Enregistré'; }

  iconFor(item: ListedTransaction): string {
    const name = (item.categoryName || '').toLocaleLowerCase('fr-FR');
    if (item.isIncome) return 'pi pi-arrow-down-left';
    if (item.categoryIcon) return categoryIconClass(item.categoryIcon);
    if (name.includes('transport')) return 'pi pi-car';
    if (name.includes('santé') || name.includes('sante')) return 'pi pi-heart';
    if (name.includes('facture') || name.includes('eau') || name.includes('électric') || name.includes('electric')) return 'pi pi-bolt';
    if (name.includes('aliment') || name.includes('sakafo') || name.includes('marché')) return 'pi pi-shopping-bag';
    if (name.includes('loisir') || name.includes('sortie')) return 'pi pi-star';
    return 'pi pi-tag';
  }

  private groupTransactions(items: ListedTransaction[]): TransactionGroup[] {
    const today = this.startOfDay(new Date());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const todayItems: ListedTransaction[] = [];
    const weekItems: ListedTransaction[] = [];
    const monthItems: ListedTransaction[] = [];
    const olderGroups = new Map<string, ListedTransaction[]>();

    for (const item of items) {
      const date = new Date(item.occurredAt);
      if (Number.isNaN(date.getTime())) {
        olderGroups.set('Sans date', [...(olderGroups.get('Sans date') ?? []), item]);
      } else if (date >= today) {
        todayItems.push(item);
      } else if (date >= weekStart) {
        weekItems.push(item);
      } else if (date >= monthStart) {
        monthItems.push(item);
      } else {
        const key = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date);
        olderGroups.set(key, [...(olderGroups.get(key) ?? []), item]);
      }
    }

    const createGroup = (key: string, label: string, values: ListedTransaction[]): TransactionGroup => ({
      key,
      label,
      items: values,
      net: values.reduce((total, item) => total + (item.isIncome ? item.amount : -item.amount), 0),
    });
    const groups: TransactionGroup[] = [];
    if (todayItems.length) groups.push(createGroup('today', 'Aujourd’hui', todayItems));
    if (weekItems.length) groups.push(createGroup('week', 'Cette semaine', weekItems));
    if (monthItems.length) groups.push(createGroup('month', 'Ce mois-ci', monthItems));
    for (const [label, values] of olderGroups) groups.push(createGroup(label, label, values));
    return groups;
  }

  private startOfDay(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  private async load(): Promise<void> {
    const [transactions, preferences] = await Promise.all([this.database.listTransactions(), this.database.getPreferences()]);
    this.transactions.set(transactions);
    this.monthStartDay.set(preferences.monthStartDay);
    this.economy.set(preferences.economy);
  }
}
