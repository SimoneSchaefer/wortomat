import { DecimalPipe } from '@angular/common';
import { Component, inject, linkedSignal, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { ProjectListEntry } from '@wortomat/shared';
import { DESKTOP_BRIDGE } from '../../core/desktop-bridge';
import { errorMessage } from '../../core/errors';
import { ProjectStore } from '../../core/project-store';
import { relativeTime } from '../../core/relative-time';
import { WortomatApi } from '../../core/wortomat-api';

@Component({
  selector: 'wm-start-page',
  imports: [FormsModule, DecimalPipe, RouterLink],
  templateUrl: './start-page.html',
  styleUrl: './start-page.scss',
})
export class StartPage {
  private readonly api = inject(WortomatApi);
  private readonly store = inject(ProjectStore);
  private readonly router = inject(Router);
  protected readonly desktop = inject(DESKTOP_BRIDGE);
  protected readonly relativeTime = relativeTime;

  protected readonly appInfo = resource({ loader: () => this.api.appInfo() });
  protected readonly projects = resource({ loader: () => this.api.listProjects() });
  protected readonly title = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Nur im Browser-Modus: Pfade werden von Hand eingegeben (es gibt keinen nativen Dialog). */
  protected readonly newPath = linkedSignal(() => {
    const dir = this.appInfo.value()?.defaultProjectDir ?? '';
    return dir ? `${dir}/${this.title().trim() || 'Neues Buch'}.wortomat` : '';
  });
  protected readonly openPath = signal('');

  protected async createProject(): Promise<void> {
    const title = this.title().trim();
    if (!title) {
      this.error.set('Bitte gib deinem Buch einen Titel.');
      return;
    }
    const filePath = this.desktop
      ? await this.desktop.showCreateProjectDialog(title)
      : this.newPath().trim();
    if (filePath) {
      await this.run(() => this.store.create(filePath, title));
    }
  }

  protected async openProject(): Promise<void> {
    const filePath = this.desktop
      ? await this.desktop.showOpenProjectDialog()
      : this.openPath().trim();
    if (filePath) {
      await this.run(() => this.store.open(filePath));
    }
  }

  protected async openFromList(entry: ProjectListEntry): Promise<void> {
    if (entry.available) {
      await this.run(() => this.store.open(entry.filePath));
    }
  }

  protected async forget(entry: ProjectListEntry): Promise<void> {
    this.error.set(null);
    try {
      await this.api.forgetProject(entry.filePath);
      this.projects.reload();
    } catch (error) {
      this.error.set(errorMessage(error));
    }
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await action();
      await this.router.navigate(['/write']);
    } catch (error) {
      this.error.set(errorMessage(error));
      // z. B. Datei zwischenzeitlich gelöscht → Liste neu einlesen
      this.projects.reload();
    } finally {
      this.busy.set(false);
    }
  }
}
