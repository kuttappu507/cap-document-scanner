import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'danger' | 'medium';

/** Drives the single declarative <app-toast> mounted in the app root. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _isOpen = signal(false);
  private readonly _message = signal('');
  private readonly _tone = signal<ToastTone>('medium');

  readonly isOpen = this._isOpen.asReadonly();
  readonly message = this._message.asReadonly();
  readonly tone = this._tone.asReadonly();

  show(message: string, tone: ToastTone = 'medium'): void {
    this._message.set(message);
    this._tone.set(tone);
    this._isOpen.set(true);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'danger');
  }

  dismissed(): void {
    this._isOpen.set(false);
  }
}
