import { TestBed } from '@angular/core/testing';
import { button, findButton, render, text } from '../testing/render';
import { de } from './i18n/de';
import { StatusBar } from './status-bar';
import { StatusMessages } from './status-messages';

async function setup() {
  const view = await render(StatusBar);
  return { ...view, messages: TestBed.inject(StatusMessages) };
}

describe('StatusBar', () => {
  it('stays hidden while there is nothing to report', async () => {
    const { element } = await setup();
    expect(element.querySelector('[role=alert]')).toBeNull();
  });

  it('shows each message, how often it came, and lets it be dismissed', async () => {
    const { element, messages, settle } = await setup();
    messages.error('Speichern fehlgeschlagen');
    messages.error('Speichern fehlgeschlagen');
    await settle();
    expect(text(element.querySelector('.text'))).toBe('Speichern fehlgeschlagen');
    expect(text(element.querySelector('.count'))).toBe(de.status.times(2));
    expect(findButton(element, de.status.dismissAll)).toBeNull();

    button(element, de.status.dismiss).click();
    await settle();
    expect(element.querySelector('[role=alert]')).toBeNull();
  });

  it('dismisses several messages at once', async () => {
    const { element, messages, settle } = await setup();
    messages.error('Eins');
    messages.error('Zwei');
    await settle();
    button(element, de.status.dismissAll).click();
    await settle();
    expect(messages.messages()).toEqual([]);
  });
});
