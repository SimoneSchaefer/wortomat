import {
  afterNextRender,
  Component,
  effect,
  type ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import type { GalleryImage, ImageCrop } from '@wortomat/shared';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { isSupportedImage, prepareImage } from '../../core/image-resize';
import { WortomatApi } from '../../core/wortomat-api';
import { StatusMessages } from '../../core/status-messages';
import { ConfirmDialog } from '../../core/confirm-dialog';
import { coverCrop, cropStyle, GALLERY_ASPECT } from '../../core/image-crop';
import { ImageCropDialog } from './image-crop-dialog';

/** Ab dieser Zugstrecke (px) wechselt ein Maus-Drag zum nächsten Bild. */
const DRAG_THRESHOLD = 40;

/**
 * Bildergalerie einer Notiz, z. B. Profilbilder eines Charakters.
 *
 * Wischen: Die Bilder liegen in einem horizontal scrollenden Streifen mit CSS-Scroll-Snapping.
 * Touch und Trackpad wischen damit nativ (inkl. Schwung); für die Maus gibt es Ziehen,
 * außerdem Pfeiltasten, Pfeil-Buttons und Punkte.
 */
@Component({
  selector: 'wm-image-gallery',
  imports: [ImageCropDialog],
  templateUrl: './image-gallery.html',
  styleUrl: './image-gallery.scss',
})
export class ImageGallery {
  readonly noteId = input.required<string>();
  readonly label = input.required<string>();
  /** Symbol, solange die Galerie leer ist. */
  readonly placeholderIcon = input<'person' | 'picture'>('picture');
  /** Neue Bilderliste nach jeder Änderung (das erste ist das Profilbild). */
  readonly changed = output<GalleryImage[]>();

  protected readonly t = inject(I18n).t;
  private readonly api = inject(WortomatApi);
  private readonly injector = inject(Injector);
  private readonly track = viewChild<ElementRef<HTMLElement>>('track');

  protected readonly images = signal<GalleryImage[]>([]);
  /** Bild, dessen Ausschnitt gerade gewählt wird (Dialog offen). */
  protected readonly cropping = signal<GalleryImage | null>(null);
  protected readonly aspect = GALLERY_ASPECT;
  protected readonly index = signal(0);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly dropActive = signal(false);
  protected readonly dragging = signal(false);
  private readonly error = inject(StatusMessages).channel();
  private readonly confirm = inject(ConfirmDialog);

  private drag: { pointerId: number; startX: number; startScroll: number } | null = null;
  private loadCounter = 0;

  constructor() {
    effect(() => {
      const id = this.noteId();
      untracked(() => void this.load(id));
    });
  }

  private async load(noteId: string): Promise<void> {
    const loadId = ++this.loadCounter;
    this.loading.set(true);
    this.error.set(null);
    try {
      const images = await this.api.noteImages(noteId);
      if (loadId !== this.loadCounter) return;
      this.images.set(images);
      this.goTo(0, false, true);
    } catch (error) {
      if (loadId === this.loadCounter) this.error.set(errorMessage(error, this.t()));
    } finally {
      if (loadId === this.loadCounter) this.loading.set(false);
    }
  }

  // Navigation ----------------------------------------------------------------

  /**
   * @param afterRender nach Änderungen an der Bilderliste: erst scrollen, wenn die neue
   *   Reihenfolge im DOM ist. Sonst rastet der Browser am alten Bild ein und folgt ihm
   *   beim Umsortieren an seine neue Position (CSS-Scroll-Snapping „re-snap“).
   */
  protected goTo(index: number, smooth = true, afterRender = false): void {
    const target = Math.max(0, Math.min(index, this.images().length - 1));
    this.index.set(target);
    const track = this.track()?.nativeElement;
    if (track && !afterRender) {
      void this.scrollTrack(track, target, smooth);
    } else {
      afterNextRender(
        () => {
          const rendered = this.track()?.nativeElement;
          if (rendered) this.scrollTrack(rendered, target, smooth);
        },
        { injector: this.injector },
      );
    }
  }

  /** Scrollt zum Bild; liefert ein Promise, das nach Ende der Animation erfüllt ist. */
  private scrollTrack(track: HTMLElement, index: number, smooth: boolean): Promise<void> {
    const animate = smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const left = index * track.clientWidth;
    if (!animate || Math.abs(track.scrollLeft - left) < 1) {
      track.scrollTo({ left, behavior: 'instant' });
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const done = () => {
        clearTimeout(fallback);
        track.removeEventListener('scrollend', done);
        resolve();
      };
      // Sicherheitsnetz, falls `scrollend` ausbleibt (z. B. unterbrochene Animation).
      const fallback = setTimeout(done, 800);
      track.addEventListener('scrollend', done);
      track.scrollTo({ left, behavior: 'smooth' });
    });
  }

  protected onScroll(): void {
    const track = this.track()?.nativeElement;
    if (track && track.clientWidth > 0 && !this.dragging()) {
      this.index.set(Math.round(track.scrollLeft / track.clientWidth));
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') this.goTo(this.index() - 1);
    else if (event.key === 'ArrowRight') this.goTo(this.index() + 1);
    else return;
    event.preventDefault();
  }

  // Mit der Maus ziehen (Touch/Trackpad scrollen nativ) -------------------------

  protected onPointerDown(event: PointerEvent): void {
    const track = this.track()?.nativeElement;
    if (event.pointerType !== 'mouse' || event.button !== 0 || !track) return;
    this.drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: track.scrollLeft,
    };
    track.setPointerCapture(event.pointerId);
    this.dragging.set(true); // schaltet Scroll-Snapping ab, solange gezogen wird
  }

  protected onPointerMove(event: PointerEvent): void {
    const track = this.track()?.nativeElement;
    if (!this.drag || event.pointerId !== this.drag.pointerId || !track) return;
    track.scrollLeft = this.drag.startScroll - (event.clientX - this.drag.startX);
  }

  protected onPointerUp(event: PointerEvent): void {
    const track = this.track()?.nativeElement;
    if (!this.drag || event.pointerId !== this.drag.pointerId || !track) return;
    const distance = event.clientX - this.drag.startX;
    this.drag = null;
    const step = distance <= -DRAG_THRESHOLD ? 1 : distance >= DRAG_THRESHOLD ? -1 : 0;
    const target = Math.max(0, Math.min(this.index() + step, this.images().length - 1));
    this.index.set(target);
    // Snapping erst nach der Animation wieder einschalten – sonst rastet der Streifen
    // sofort am nächstgelegenen Bild ein und springt kurz zurück.
    void this.scrollTrack(track, target, true).then(() => this.dragging.set(false));
  }

  // Bilder verwalten ------------------------------------------------------------

  protected onPicked(input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []).filter(isSupportedImage);
    input.value = '';
    void this.add(files);
  }

  protected onDragOver(event: DragEvent): void {
    if (event.dataTransfer?.types.includes('Files')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      this.dropActive.set(true);
    }
  }

  protected onDrop(event: DragEvent): void {
    this.dropActive.set(false);
    const files = Array.from(event.dataTransfer?.files ?? []).filter(isSupportedImage);
    if (files.length) {
      event.preventDefault();
      void this.add(files);
    }
  }

  private async add(files: File[]): Promise<void> {
    if (!files.length) return;
    const noteId = this.noteId();
    await this.run(async () => {
      for (const file of files) {
        const image = await prepareImage(file);
        const images = await this.api.addNoteImage(
          noteId,
          image.blob,
          image.fileName,
          image.width,
          image.height,
        );
        if (noteId !== this.noteId()) return;
        this.update(images);
      }
      this.goTo(this.images().length - 1, true, true); // zum zuletzt hinzugefügten Bild
    });
  }

  protected async removeCurrent(): Promise<void> {
    const image = this.images()[this.index()];
    if (!image) return;
    const confirmed = await this.confirm.ask({
      title: this.t().gallery.removeTitle,
      message: this.t().gallery.removeMessage,
      confirmLabel: this.t().confirm.remove,
    });
    if (!confirmed) return;
    await this.run(async () => {
      this.update(await this.api.removeNoteImage(this.noteId(), image.id));
      this.goTo(this.index(), false, true);
    });
  }

  /** Aktuelles Bild an die erste Stelle = Profilbild. */
  protected async makeCover(): Promise<void> {
    const current = this.images()[this.index()];
    if (!current) return;
    const order = [
      current.id,
      ...this.images()
        .filter((i) => i.id !== current.id)
        .map((i) => i.id),
    ];
    await this.run(async () => {
      this.update(await this.api.reorderNoteImages(this.noteId(), order));
      this.goTo(0, false, true);
    });
  }

  // Zuschneiden ------------------------------------------------------------------

  /**
   * Lage des Bilds, wenn ein Ausschnitt gewählt ist; sonst `null` (ganzes Bild, eingepasst).
   * Ohne bekannte Bildmaße lässt sich der Ausschnitt nicht umrechnen – dann ganzes Bild.
   */
  protected slideStyle(image: GalleryImage): Record<string, string> | null {
    if (!image.crop || !image.width || !image.height) return null;
    return cropStyle(coverCrop(image.crop, image.width, image.height, GALLERY_ASPECT));
  }

  protected openCrop(): void {
    this.cropping.set(this.images()[this.index()] ?? null);
  }

  protected async applyCrop(image: GalleryImage, crop: ImageCrop | null): Promise<void> {
    this.cropping.set(null);
    await this.run(async () => {
      this.update(await this.api.setNoteImageCrop(this.noteId(), image.id, crop));
    });
  }

  private update(images: GalleryImage[]): void {
    this.images.set(images);
    this.changed.emit(images);
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await action();
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    } finally {
      this.busy.set(false);
    }
  }
}
