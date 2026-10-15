// Browser APIs the app relies on but jsdom does not implement. Kept minimal: just enough for the
// components to run, never a simulation of layout or animation.

if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.show = HTMLDialogElement.prototype.showModal;
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement, returnValue?: string) {
    if (!this.open) return;
    this.removeAttribute('open');
    if (returnValue !== undefined) this.returnValue = returnValue;
    this.dispatchEvent(new Event('close'));
  };
}

// Reduced motion on: fireworks and smooth scrolling are skipped, as for users who ask for it.
window.matchMedia ??= (query: string) =>
  ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }) as MediaQueryList;

Element.prototype.scrollIntoView ??= () => undefined;
Element.prototype.scrollTo ??= () => undefined;

Element.prototype.setPointerCapture ??= () => undefined;
Element.prototype.releasePointerCapture ??= () => undefined;
Element.prototype.hasPointerCapture ??= () => false;

// Uploads read the image size first. Small enough that no resizing (OffscreenCanvas) is needed.
globalThis.createImageBitmap ??= (async () =>
  ({ width: 800, height: 600, close: () => undefined }) as ImageBitmap) as typeof createImageBitmap;

// Without layout nothing ever resizes, so observing is a no-op.
globalThis.ResizeObserver ??= class {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
} as unknown as typeof ResizeObserver;

// Font files never load here; the export preview then falls back to system fonts.
globalThis.FontFace ??= class {
  readonly status = 'unloaded';
  constructor(
    readonly family: string,
    readonly source: string,
  ) {}
} as unknown as typeof FontFace;
if (!('fonts' in document)) {
  Object.defineProperty(document, 'fonts', {
    value: { add: () => undefined, load: async () => [] },
  });
}

// jsdom has no 2D canvas and would log "not implemented" for every call; callers handle `null`.
HTMLCanvasElement.prototype.getContext = (() =>
  null) as typeof HTMLCanvasElement.prototype.getContext;

// Popovers (the tooltip): an attribute stands in for the top layer so tests can see the state.
HTMLElement.prototype.showPopover ??= function (this: HTMLElement) {
  this.setAttribute('data-popover-open', '');
};
HTMLElement.prototype.hidePopover ??= function (this: HTMLElement) {
  this.removeAttribute('data-popover-open');
};

URL.createObjectURL ??= () => 'blob:test';
URL.revokeObjectURL ??= () => undefined;
