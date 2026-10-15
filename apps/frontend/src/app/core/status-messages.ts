import { ErrorHandler, inject, Injectable, Injector, signal } from '@angular/core';
import { errorMessage } from './errors';
import { I18n } from './i18n/i18n';

export interface StatusMessage {
  id: number;
  text: string;
  /** How often the same message came (e.g. on every failed save). */
  count: number;
}

export interface StatusChannel {
  /** `null` withdraws this channel's previous message. */
  set(text: string | null): void;
}

/** At most this many messages at a time; older ones drop out. */
const MAX_MESSAGES = 5;

/**
 * Messages stay until they are dismissed or withdrawn by their source (e.g. because a retry worked)
 * – so they never disappear unnoticed.
 */
@Injectable({ providedIn: 'root' })
export class StatusMessages {
  private readonly t = inject(I18n).t;
  private nextId = 1;
  private nextChannel = 1;
  private readonly channels = new Map<number, number>();

  readonly messages = signal<readonly StatusMessage[]>([]);

  /** Each new message replaces the channel's previous one. */
  channel(): StatusChannel {
    const channel = this.nextChannel++;
    return {
      set: (text) => {
        const previous = this.channels.get(channel);
        if (previous !== undefined) this.dismiss(previous);
        this.channels.delete(channel);
        if (text) this.channels.set(channel, this.error(text));
      },
    };
  }

  /** The same message again only counts up. */
  error(text: string): number {
    const existing = this.messages().find((message) => message.text === text);
    if (existing) {
      this.messages.update((messages) => [
        ...messages.filter((message) => message !== existing),
        { ...existing, count: existing.count + 1 },
      ]);
      return existing.id;
    }
    const id = this.nextId++;
    this.messages.update((messages) => [...messages, { id, text, count: 1 }].slice(-MAX_MESSAGES));
    return id;
  }

  report(error: unknown): number {
    return this.error(errorMessage(error, this.t()));
  }

  dismiss(id: number): void {
    this.messages.update((messages) => messages.filter((message) => message.id !== id));
  }

  dismissAll(): void {
    this.messages.set([]);
  }
}

/**
 * Uncaught exceptions and rejected promises end up in the status bar too, not only in the console –
 * otherwise a failure would go unnoticed.
 */
@Injectable()
export class StatusErrorHandler extends ErrorHandler {
  // Resolve lazily on the first error: the ErrorHandler is created very early during startup.
  private readonly injector = inject(Injector);

  override handleError(error: unknown): void {
    super.handleError(error);
    if (isHarmless(error)) return;
    try {
      const t = this.injector.get(I18n).t();
      this.injector.get(StatusMessages).error(t.errors.unexpected(errorMessage(error, t)));
    } catch {
      // the status bar itself is broken – the console has to do then
    }
  }
}

/** Browser messages that break nothing. */
function isHarmless(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.startsWith('ResizeObserver loop');
}
