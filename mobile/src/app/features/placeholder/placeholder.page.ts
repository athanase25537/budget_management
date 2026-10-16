import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-placeholder',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
  template: `<ion-header class="ion-no-border"><ion-toolbar class="app-toolbar"><ion-title><div class="page-title"><span class="brand-mark" aria-hidden="true"><i class="pi pi-wallet"></i></span><span class="page-title__copy"><span class="brand">Kajy Vola</span><span class="page-title__label">{{ title }}</span></span></div></ion-title></ion-toolbar></ion-header><ion-content class="ion-padding"><h1>{{ title }}</h1><p>Écran en préparation.</p></ion-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceholderPage {
  private readonly route = inject(ActivatedRoute);
  readonly title = this.route.snapshot.data['title'] as string;
}
