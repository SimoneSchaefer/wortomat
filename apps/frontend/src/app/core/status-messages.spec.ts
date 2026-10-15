import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { de } from './i18n/de';
import { I18n } from './i18n/i18n';
import { StatusMessages } from './status-messages';

describe('StatusMessages', () => {
  let status: StatusMessages;
  const texts = () => status.messages().map((message) => [message.text, message.count]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: I18n, useValue: { t: signal(de) } }],
    });
    status = TestBed.inject(StatusMessages);
  });

  it('counts the same message up instead of repeating it', () => {
    status.error('Speichern fehlgeschlagen');
    status.error('Anderes');
    status.error('Speichern fehlgeschlagen');
    expect(texts()).toEqual([
      ['Anderes', 1],
      ['Speichern fehlgeschlagen', 2],
    ]);
  });

  it('replaces the previous message per channel and withdraws it with null', () => {
    const editor = status.channel();
    const tree = status.channel();
    editor.set('Szene nicht gespeichert');
    tree.set('Kapitel nicht verschoben');
    editor.set('Szene nicht geladen');
    expect(texts()).toEqual([
      ['Kapitel nicht verschoben', 1],
      ['Szene nicht geladen', 1],
    ]);
    editor.set(null);
    expect(texts()).toEqual([['Kapitel nicht verschoben', 1]]);
  });

  it('keeps at most five messages, the newest', () => {
    for (let i = 1; i <= 7; i++) status.error(`Fehler ${i}`);
    expect(texts().map(([text]) => text)).toEqual([
      'Fehler 3',
      'Fehler 4',
      'Fehler 5',
      'Fehler 6',
      'Fehler 7',
    ]);
    status.dismiss(status.messages()[0]!.id);
    expect(status.messages()).toHaveLength(4);
    status.dismissAll();
    expect(status.messages()).toEqual([]);
  });
});
