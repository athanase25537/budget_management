import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly _data = signal<{ type: string, message: string } | null>(null);

  readonly data = this._data.asReadonly();

  show(data: { type: string, message: string }) {
    this._data.set({ type: data.type, message: data.message });

    setTimeout(() => {
      this._data.set(null);
    }, 3000);
  }
}
