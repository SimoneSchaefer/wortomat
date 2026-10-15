import { Component, signal } from '@angular/core';
import { button, findButton, key, render } from '../../testing/render';
import { ToolbarMenu } from './toolbar-menu';

@Component({
  imports: [ToolbarMenu],
  template: `
    <wm-toolbar-menu label="Ausrichtung">
      <span toggle>≡</span>
      <button type="button" role="menuitemradio" (click)="chosen.set('links')">Links</button>
      <button type="button" role="menuitemradio" (click)="chosen.set('mitte')">Mitte</button>
      <span role="separator"></span>
      <button type="button" role="menuitem" (click)="chosen.set('rechts')">Rechts</button>
    </wm-toolbar-menu>
    <p id="outside">Text</p>
  `,
})
class Host {
  readonly chosen = signal<string | null>(null);
}

async function setup() {
  const view = await render(Host);
  const toggle = () => button(view.element, 'Ausrichtung');
  const open = async () => {
    toggle().click();
    await view.settle();
  };
  const isOpen = () => !!view.element.querySelector('[role=menu]');
  return { ...view, toggle, open, isOpen };
}

describe('ToolbarMenu', () => {
  it('opens on the first entry and closes after a choice', async () => {
    const { element, fixture, toggle, open, isOpen, settle } = await setup();
    expect(findButton(element, 'Links')).toBeNull();

    await open();
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(button(element, 'Links'));

    button(element, 'Mitte').click();
    await settle();
    expect(fixture.componentInstance.chosen()).toBe('mitte');
    expect(isOpen()).toBe(false);
  });

  it('moves between the entries with the arrow keys, skipping separators', async () => {
    const { element, open } = await setup();
    await open();
    const menu = element.querySelector('[role=menu]')!;
    key(menu, 'ArrowDown');
    key(menu, 'ArrowDown');
    expect(document.activeElement).toBe(button(element, 'Rechts'));
    key(menu, 'ArrowDown');
    expect(document.activeElement).toBe(button(element, 'Links'));
    key(menu, 'ArrowUp');
    expect(document.activeElement).toBe(button(element, 'Rechts'));
  });

  it('closes with Escape and returns to the toggle', async () => {
    const { element, toggle, open, isOpen, settle } = await setup();
    await open();
    key(element.querySelector('[role=menu]')!, 'Escape');
    await settle();
    expect(isOpen()).toBe(false);
    expect(document.activeElement).toBe(toggle());
  });

  it('closes on a click outside, not on one inside', async () => {
    const { element, open, isOpen, settle } = await setup();
    await open();
    element
      .querySelector('[role=separator]')!
      .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await settle();
    expect(isOpen()).toBe(true);

    element
      .querySelector('#outside')!
      .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await settle();
    expect(isOpen()).toBe(false);
  });
});
