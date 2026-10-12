import { ErrorHandler, inject, Injectable, Injector, signal } from '@angular/core';
import { errorMessage } from './errors';
import { I18n } from './i18n/i18n';

export interface StatusMessage {
  id: number;
  text: string;
  /** Wie oft dieselbe Meldung kam (z. B. bei jedem fehlgeschlagenen Speichern). */
  count: number;
}

/** Was eine Komponente zum Melden braucht – wie früher ihr eigenes `error`-Signal. */
export interface StatusChannel {
  /** Zeigt eine Meldung in der Statusleiste; `null` nimmt die vorige dieses Kanals zurück. */
  set(text: string | null): void;
}

/** Höchstens so viele Meldungen gleichzeitig; ältere fallen weg. */
const MAX_MESSAGES = 5;

/**
 * Sammelt Fehlermeldungen für die Statusleiste am unteren Fensterrand. Meldungen bleiben
 * stehen, bis sie weggeklickt oder von ihrer Quelle zurückgenommen werden (z. B. weil
 * ein neuer Versuch geklappt hat) – sie verschwinden also nicht unbemerkt.
 */
@Injectable({ providedIn: 'root' })
export class StatusMessages {
  private readonly t = inject(I18n).t;
  private nextId = 1;
  private nextChannel = 1;
  /** Welche Meldung zu welchem Kanal gehört. */
  private readonly channels = new Map<number, number>();

  readonly messages = signal<readonly StatusMessage[]>([]);

  /** Eigener Kanal für eine Komponente: Jede neue Meldung ersetzt die vorige des Kanals. */
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

  /** Zeigt eine Fehlermeldung; dieselbe Meldung noch einmal zählt nur hoch. */
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

  /** Wie {@link error}, aber für einen gefangenen Fehler (z. B. eine Antwort des Backends). */
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
 * Unerwartete Fehler (nicht gefangene Ausnahmen, abgelehnte Promises) landen nicht nur in
 * der Konsole, sondern auch in der Statusleiste – sonst bliebe ein Fehlschlag unbemerkt.
 */
@Injectable()
export class StatusErrorHandler extends ErrorHandler {
  // Erst beim ersten Fehler holen: Der ErrorHandler entsteht sehr früh beim Start.
  private readonly injector = inject(Injector);

  override handleError(error: unknown): void {
    super.handleError(error);
    if (isHarmless(error)) return;
    try {
      const t = this.injector.get(I18n).t();
      this.injector.get(StatusMessages).error(t.errors.unexpected(errorMessage(error, t)));
    } catch {
      // Die Statusleiste selbst ist kaputt – dann bleibt es bei der Konsole.
    }
  }
}

/** Meldungen des Browsers, die nichts kaputt machen. */
function isHarmless(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.startsWith('ResizeObserver loop');
}
