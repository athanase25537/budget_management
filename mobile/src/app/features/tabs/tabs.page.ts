import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';
import { filter } from 'rxjs';

@Component({
  selector: 'app-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar id="main-tab-bar" slot="bottom" [class.tab-bar-hidden]="isAddFlow()">
        <ion-tab-button tab="home" href="/tabs/home"><i class="pi pi-home"></i><ion-label>Accueil</ion-label></ion-tab-button>
        <ion-tab-button tab="transactions" href="/tabs/transactions"><i class="pi pi-receipt"></i><ion-label>Transactions</ion-label></ion-tab-button>
        <ion-tab-button tab="add" href="/tabs/add" class="add-tab" aria-label="Ajouter une transaction" (ionTabButtonClick)="startNewTransaction($event)"><i class="pi pi-plus"></i></ion-tab-button>
        <ion-tab-button tab="categories" href="/tabs/categories"><i class="pi pi-th-large"></i><ion-label>Catégories</ion-label></ion-tab-button>
        <ion-tab-button tab="profile" href="/tabs/profile"><i class="pi pi-user"></i><ion-label>Profil</ion-label></ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: [`ion-tab-bar.tab-bar-hidden { display: none; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsPage {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly isAddFlow = signal(this.router.url.includes('/tabs/add'));

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((event) => this.isAddFlow.set(event.urlAfterRedirects.includes('/tabs/add')));
  }

  startNewTransaction(event: Event): void {
    event.stopPropagation();
    void this.router.navigateByUrl('/tabs/add');
  }
}
