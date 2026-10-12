import { Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { QuoteStyle } from '@wortomat/shared';
import { AppSettingsStore } from '../../core/app-settings';
import { errorMessage } from '../../core/errors';
import { ProjectStore } from '../../core/project-store';
import { QUOTE_STYLES, type QuoteStyleInfo } from '../../core/quotes';

/** Einstellungen der App: Route `settings`, mit und ohne geöffnetes Projekt erreichbar. */
@Component({
  selector: 'wm-settings-page',
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly project = inject(ProjectStore);
  protected readonly settings = inject(AppSettingsStore);

  protected readonly quoteStyles = QUOTE_STYLES;
  protected readonly error = signal<string | null>(null);

  protected async chooseQuoteStyle(style: QuoteStyle): Promise<void> {
    this.error.set(null);
    try {
      await this.settings.setQuoteStyle(style);
    } catch (error) {
      this.error.set(errorMessage(error));
    }
  }

  /** Beispiel mit doppelten und einfachen Anführungszeichen und einem Apostroph. */
  protected example(info: QuoteStyleInfo): string {
    if (!info.marks) return `"Sag 'bitte'", flüstert's.`;
    const { double, single } = info.marks;
    return `${double[0]}Sag ${single[0]}bitte${single[1]}${double[1]}, flüstert’s.`;
  }

  /** Dorthin zurück, woher man kam – beim direkten Aufruf zum Buch bzw. zur Startseite. */
  protected back(): void {
    if (this.router.lastSuccessfulNavigation()?.previousNavigation) {
      this.location.back();
    } else {
      void this.router.navigate([this.project.project() ? '/write' : '/']);
    }
  }
}
