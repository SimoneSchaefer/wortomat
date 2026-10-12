import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DESKTOP_BRIDGE } from './core/desktop-bridge';
import { PendingSaves } from './core/pending-saves';

@Component({
  selector: 'wm-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {
  constructor() {
    const pendingSaves = inject(PendingSaves);
    // Electron fragt vor dem Schließen des Fensters nach – dann alles speichern.
    inject(DESKTOP_BRIDGE)?.onBeforeClose(() => pendingSaves.flushAll());
  }
}
