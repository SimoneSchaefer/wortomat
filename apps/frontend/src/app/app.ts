import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DESKTOP_BRIDGE } from './core/desktop-bridge';
import { ConfirmDialogHost } from './core/confirm-dialog';
import { PendingSaves } from './core/pending-saves';
import { StatusBar } from './core/status-bar';
import { Tooltip } from './core/tooltip';

@Component({
  selector: 'wm-root',
  imports: [RouterOutlet, StatusBar, ConfirmDialogHost, Tooltip],
  template: '<router-outlet /><wm-status-bar /><wm-confirm-dialog /><wm-tooltip />',
})
export class App {
  constructor() {
    const pendingSaves = inject(PendingSaves);
    // Electron asks before closing the window – save everything then.
    inject(DESKTOP_BRIDGE)?.onBeforeClose(() => pendingSaves.flushAll());
  }
}
