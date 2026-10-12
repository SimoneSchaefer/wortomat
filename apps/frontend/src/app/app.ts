import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DESKTOP_BRIDGE } from './core/desktop-bridge';
import { PendingSaves } from './core/pending-saves';
import { StatusBar } from './core/status-bar';

@Component({
  selector: 'wm-root',
  imports: [RouterOutlet, StatusBar],
  template: '<router-outlet /><wm-status-bar />',
})
export class App {
  constructor() {
    const pendingSaves = inject(PendingSaves);
    // Electron fragt vor dem Schließen des Fensters nach – dann alles speichern.
    inject(DESKTOP_BRIDGE)?.onBeforeClose(() => pendingSaves.flushAll());
  }
}
