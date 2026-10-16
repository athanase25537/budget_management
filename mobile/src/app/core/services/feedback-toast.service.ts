import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

export type FeedbackToastAction = 'create' | 'update' | 'delete' | 'export' | 'error';

@Injectable({ providedIn: 'root' })
export class FeedbackToastService {
  private readonly toastController = inject(ToastController);
  private activeToast?: HTMLIonToastElement;

  async show(action: FeedbackToastAction, message: string): Promise<void> {
    if (this.activeToast) await this.activeToast.dismiss().catch(() => undefined);

    const tabBar = document.getElementById('main-tab-bar');
    const positionAnchor = tabBar?.offsetParent ? 'main-tab-bar' : undefined;
    const toast = await this.toastController.create({
      message,
      duration: 4500,
      layout: 'baseline',
      mode: 'md',
      position: 'bottom',
      positionAnchor,
      swipeGesture: 'vertical',
      cssClass: ['kv-feedback-toast', `kv-feedback-toast--${action}`],
      buttons: [{ text: 'Fermer', role: 'cancel', htmlAttributes: { 'aria-label': 'Fermer la notification' } }],
    });

    this.activeToast = toast;
    void toast.onDidDismiss().then(() => {
      if (this.activeToast === toast) this.activeToast = undefined;
    });
    await toast.present();
  }
}
