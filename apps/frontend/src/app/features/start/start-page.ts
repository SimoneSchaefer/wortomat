import { Component, computed, inject, linkedSignal, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { ProjectListEntry } from '@wortomat/shared';
import { DESKTOP_BRIDGE } from '../../core/desktop-bridge';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { ProjectStore } from '../../core/project-store';
import { relativeTime } from '../../core/relative-time';
import { WortomatApi } from '../../core/wortomat-api';
import { BookCover } from '../cover/book-cover';
import { FilePickerDialog } from './file-picker-dialog';

@Component({
  selector: 'wm-start-page',
  imports: [FormsModule, RouterLink, BookCover, FilePickerDialog],
  templateUrl: './start-page.html',
  styleUrl: './start-page.scss',
})
export class StartPage {
  private readonly api = inject(WortomatApi);
  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  private readonly store = inject(ProjectStore);
  private readonly router = inject(Router);
  protected readonly desktop = inject(DESKTOP_BRIDGE);
  protected relativeTime(iso: string): string {
    return relativeTime(iso, this.i18n.language());
  }

  protected readonly appInfo = resource({ loader: () => this.api.appInfo() });
  protected readonly projects = resource({ loader: () => this.api.listProjects() });
  /** Das Buch in der Mitte des Karussells; nach dem Neuladen der Liste bleibt die Stelle. */
  protected readonly selected = linkedSignal<ProjectListEntry[] | undefined, number>({
    source: () => this.projects.value(),
    computation: (list, previous) =>
      Math.min(previous?.value ?? 0, Math.max(0, (list?.length ?? 0) - 1)),
  });
  protected readonly current = computed(() => this.projects.value()?.[this.selected()] ?? null);
  protected readonly title = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Im Dialog gewählter Speicherort für neue Bücher; `null` = Standardordner. */
  private readonly newDir = signal<string | null>(null);
  /**
   * Nur im Browser-Modus (es gibt keinen nativen Dialog): Ordner + Titel als Dateiname.
   * Lässt sich von Hand ändern oder per „Durchsuchen …“ in einen anderen Ordner legen.
   */
  protected readonly newPath = linkedSignal(() => {
    const dir = this.newDir() ?? this.appInfo.value()?.defaultProjectDir ?? '';
    const name = this.title().trim() || this.t().start.defaultFileName;
    return dir ? `${dir}/${name}.wortomat` : '';
  });
  protected readonly openPath = signal('');

  protected async createProject(): Promise<void> {
    const title = this.title().trim();
    if (!title) {
      this.error.set(this.t().start.titleRequired);
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

  /** Adresse des Titelbilds; die ID macht sie bei jedem neuen Bild eindeutig (Cache). */
  protected coverUrl(entry: ProjectListEntry): string | null {
    if (!entry.coverImageId) return null;
    const filePath = encodeURIComponent(entry.filePath);
    return `/api/projects/cover?filePath=${filePath}&id=${entry.coverImageId}`;
  }

  protected select(index: number): void {
    const count = this.projects.value()?.length ?? 0;
    this.selected.set(Math.max(0, Math.min(count - 1, index)));
  }

  protected onCarouselKey(event: KeyboardEvent): void {
    const count = this.projects.value()?.length ?? 0;
    const target = {
      ArrowLeft: this.selected() - 1,
      ArrowRight: this.selected() + 1,
      Home: 0,
      End: count - 1,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    this.select(target);
  }

  /** Mausrad und Touchpad blättern – gesammelt, damit ein Wisch nicht durch alle Bücher rast. */
  private wheelDelta = 0;
  private wheelReset: ReturnType<typeof setTimeout> | undefined;
  protected onCarouselWheel(event: WheelEvent): void {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    event.preventDefault();
    this.wheelDelta += delta;
    clearTimeout(this.wheelReset);
    this.wheelReset = setTimeout(() => (this.wheelDelta = 0), 200);
    if (Math.abs(this.wheelDelta) >= 60) {
      this.select(this.selected() + Math.sign(this.wheelDelta));
      this.wheelDelta = 0;
    }
  }

  /** Wischen auf Touchscreens. */
  private swipeStart: number | null = null;
  protected onPointerDown(event: PointerEvent): void {
    this.swipeStart = event.pointerType === 'mouse' ? null : event.clientX;
  }
  protected onPointerUp(event: PointerEvent): void {
    if (this.swipeStart === null) return;
    const distance = event.clientX - this.swipeStart;
    this.swipeStart = null;
    if (Math.abs(distance) > 40) this.select(this.selected() - Math.sign(distance));
  }

  /** Klick auf ein Cover: das mittlere öffnet das Buch, die anderen holen es in die Mitte. */
  protected async clickCover(entry: ProjectListEntry, index: number): Promise<void> {
    if (index === this.selected()) {
      await this.openFromList(entry);
    } else {
      this.select(index);
    }
  }

  /** Speicherort wählen – startet im Ordner des aktuellen Pfads. */
  protected browseLocation(picker: FilePickerDialog): void {
    picker.open(this.newPath().trim() || undefined);
  }

  protected chooseLocation(dir: string): void {
    this.newDir.set(dir.replace(/[\\/]+$/, '') || dir);
  }

  /** Startet beim eingetippten Pfad (bzw. dessen Ordner), sonst im Standardordner. */
  protected browse(picker: FilePickerDialog): void {
    picker.open(this.openPath().trim() || undefined);
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
      this.error.set(errorMessage(error, this.t()));
    }
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await action();
      await this.router.navigate(['/write']);
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
      // z. B. Datei zwischenzeitlich gelöscht → Liste neu einlesen
      this.projects.reload();
    } finally {
      this.busy.set(false);
    }
  }
}
