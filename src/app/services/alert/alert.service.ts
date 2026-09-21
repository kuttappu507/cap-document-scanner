import { Injectable, signal } from '@angular/core';
import { AlertButton, AlertInput } from '@ionic/angular';

export interface ConfirmOptions {
  header?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export interface PromptOptions {
  header: string;
  value?: string;
  placeholder?: string;
  confirmText?: string;
}

/**
 * Drives the single declarative <app-alert> mounted in the app root.
 * Pages call `confirm()` / `prompt()` and await the answer — no AlertController.
 */
@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly _isOpen = signal(false);
  private readonly _header = signal('');
  private readonly _message = signal<string | undefined>(undefined);
  private readonly _buttons = signal<AlertButton[]>([]);
  private readonly _inputs = signal<AlertInput[]>([]);
  private settle: (() => void) | null = null;

  readonly isOpen = this._isOpen.asReadonly();
  readonly header = this._header.asReadonly();
  readonly message = this._message.asReadonly();
  readonly buttons = this._buttons.asReadonly();
  readonly inputs = this._inputs.asReadonly();

  confirm(message: string, options: ConfirmOptions = {}): Promise<boolean> {
    return new Promise((resolve) => {
      this.open(options.header ?? 'Are you sure?', message, [], () => resolve(false));
      this._buttons.set([
        { text: options.cancelText ?? 'Cancel', role: 'cancel' },
        {
          text: options.confirmText ?? 'Confirm',
          role: options.destructive ? 'destructive' : 'confirm',
          handler: () => this.close(() => resolve(true)),
        },
      ]);
    });
  }

  /** One-button message, e.g. to explain why something failed. */
  notify(message: string, header: string): Promise<void> {
    return new Promise((resolve) => {
      this.open(header, message, [], () => resolve());
      this._buttons.set([{ text: 'OK', role: 'cancel' }]);
    });
  }

  /** Resolves the entered text, or `null` when cancelled. */
  prompt(options: PromptOptions): Promise<string | null> {
    return new Promise((resolve) => {
      this.open(options.header, undefined, [
        { name: 'value', type: 'text', value: options.value ?? '', placeholder: options.placeholder, attributes: { maxlength: 80 } },
      ], () => resolve(null));
      this._buttons.set([
        { text: 'Cancel', role: 'cancel' },
        {
          text: options.confirmText ?? 'Save',
          role: 'confirm',
          handler: (data: { value: string }) => this.close(() => resolve(data.value)),
        },
      ]);
    });
  }

  /** Called by <app-alert> when the overlay is dismissed any other way (backdrop, cancel). */
  dismissed(): void {
    this.close(this.settle);
  }

  private open(header: string, message: string | undefined, inputs: AlertInput[], onDismiss: () => void): void {
    this.settle?.();
    this.settle = onDismiss;
    this._header.set(header);
    this._message.set(message);
    this._inputs.set(inputs);
    this._isOpen.set(true);
  }

  private close(resolve: (() => void) | null): true {
    this.settle = null;
    this._isOpen.set(false);
    resolve?.();
    return true;
  }
}
