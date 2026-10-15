import { Component, computed, inject, input, signal } from '@angular/core';
import { COVER_HEIGHT, COVER_PALETTES, COVER_WIDTH, designCover } from '../../core/cover-design';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { isSupportedImage, prepareImage } from '../../core/image-resize';
import { ProjectStore } from '../../core/project-store';
import { WortomatApi } from '../../core/wortomat-api';

/** Used in the export dialog and in the cover dialog of the top bar. */
@Component({
  selector: 'wm-cover-picker',
  templateUrl: './cover-picker.html',
  styleUrl: './cover-picker.scss',
})
export class CoverPicker {
  private readonly api = inject(WortomatApi);
  protected readonly t = inject(I18n).t;
  private readonly project = inject(ProjectStore);

  /** Explains where the cover appears – depending on where the picker sits. */
  readonly hint = input<string>('');

  protected readonly coverUrl = computed(() => {
    const id = this.project.project()?.coverImageId;
    return id ? `/api/images/${id}` : null;
  });
  protected readonly busy = signal(false);
  protected readonly dropActive = signal(false);
  protected readonly error = signal<string | null>(null);
  private nextPalette = 0;
  protected readonly designedOnce = signal(false);

  protected async pick(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = '';
    if (file) await this.upload(file);
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
    const file = event.dataTransfer?.files[0];
    if (file) {
      event.preventDefault();
      void this.upload(file);
    }
  }

  private async upload(file: File): Promise<void> {
    if (this.busy()) return;
    if (!isSupportedImage(file)) {
      this.error.set(this.t().export.unsupportedImage);
      return;
    }
    await this.change(async () => {
      const image = await prepareImage(file);
      return this.api.uploadImage(image.blob, image.fileName, image.width, image.height);
    });
    this.designedOnce.set(false);
  }

  /** Each further click picks other colours. */
  protected async design(): Promise<void> {
    const project = this.project.project();
    if (!project) return;
    const palette = COVER_PALETTES[this.nextPalette % COVER_PALETTES.length]!;
    this.nextPalette++;
    await this.change(async () => {
      const blob = await designCover(project.title, project.author, palette);
      return this.api.uploadImage(blob, 'titelbild.jpg', COVER_WIDTH, COVER_HEIGHT);
    });
    this.designedOnce.set(true);
  }

  protected async remove(): Promise<void> {
    await this.change(async () => null);
  }

  private async change(upload: () => Promise<{ id: string } | null>): Promise<void> {
    this.error.set(null);
    this.busy.set(true);
    try {
      const image = await upload();
      await this.project.setCover(image?.id ?? null);
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    } finally {
      this.busy.set(false);
    }
  }
}
