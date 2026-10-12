import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import type { FontSize, Language, QuoteStyle, Theme } from '@wortomat/shared';
import { AppSettingsStore } from '../../core/app-settings';
import { FONT_SCALE } from '../../core/appearance';
import { errorMessage } from '../../core/errors';
import { I18n, LANGUAGES } from '../../core/i18n/i18n';
import { ProjectStore } from '../../core/project-store';
import { APOSTROPHE, QUOTE_STYLES, type QuoteStyleInfo } from '../../core/quotes';
import { StatusMessages } from '../../core/status-messages';

/** Einstellungen der App: Route `settings`, mit und ohne geöffnetes Projekt erreichbar. */
@Component({
  selector: 'wm-settings-page',
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage {
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  private readonly location = inject(Location);
  private readonly project = inject(ProjectStore);
  protected readonly settings = inject(AppSettingsStore);

  protected readonly languages = LANGUAGES;
  protected readonly quoteStyles = QUOTE_STYLES;
  protected readonly themes: readonly Theme[] = ['system', 'light', 'dark'];
  protected readonly fontSizes: readonly FontSize[] = ['small', 'medium', 'large'];
  protected readonly fontScale = FONT_SCALE;
  private readonly error = inject(StatusMessages).channel();

  protected chooseLanguage(language: Language): Promise<void> {
    return this.save(() => this.settings.setLanguage(language));
  }

  protected chooseTheme(theme: Theme): Promise<void> {
    return this.save(() => this.settings.setTheme(theme));
  }

  protected chooseFontSize(fontSize: FontSize): Promise<void> {
    return this.save(() => this.settings.setFontSize(fontSize));
  }

  protected chooseQuoteStyle(style: QuoteStyle): Promise<void> {
    return this.save(() => this.settings.setQuoteStyle(style));
  }

  /** Beispiel mit doppelten und einfachen Anführungszeichen und einem Apostroph. */
  protected example(info: QuoteStyleInfo): string {
    const { quoteExample } = this.t().settings;
    return info.marks
      ? quoteExample(info.marks.double, info.marks.single, APOSTROPHE)
      : quoteExample(['"', '"'], ["'", "'"], "'");
  }

  private async save(action: () => Promise<void>): Promise<void> {
    this.error.set(null);
    try {
      await action();
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    }
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
