import { TestBed } from '@angular/core/testing';
import type { SearchHit } from '@wortomat/shared';
import { de } from '../../core/i18n/de';
import { SearchRequest } from '../../core/search-request';
import { FakeApi } from '../../testing/fake-api';
import { button, key, render, text, type, wait } from '../../testing/render';
import { GlobalSearch } from './global-search';

// A little longer than the component's search delay.
const DEBOUNCE = 300;

const HITS: SearchHit[] = [
  { kind: 'character', id: 'anna', title: 'Anna Berger', snippetHtml: '' },
  { kind: 'scene', id: 's1', title: 'Ankunft', snippetHtml: 'Am <mark>Hafen</mark> wartet' },
  { kind: 'scene', id: 's2', title: 'Abschied', snippetHtml: '' },
];

async function setup() {
  const api = new FakeApi();
  api.hits = HITS;
  const view = await render(GlobalSearch, { api });
  const navigate = vi.spyOn(view.router, 'navigate').mockResolvedValue(true);
  const input = view.element.querySelector('input')!;
  const search = async (query: string) => {
    input.focus();
    type(input, query);
    await wait(DEBOUNCE);
    await view.settle();
  };
  const options = () => [...view.element.querySelectorAll('[role=option]')];
  return { ...view, navigate, input, search, options };
}

describe('GlobalSearch', () => {
  it('sucht erst nach einer Tipp-Pause, und nur nach der letzten Eingabe', async () => {
    const { api, input, settle } = await setup();
    type(input, 'Ha');
    type(input, 'Haf');
    type(input, 'Hafen');
    await wait(DEBOUNCE);
    await settle();
    expect(api.search.mock.calls).toEqual([['Hafen']]);
  });

  it('zeigt die Treffer nach Bereich gruppiert, Szenen zuerst, mit Ausschnitt', async () => {
    const { element, search, options } = await setup();
    await search('Hafen');

    const labels = [...element.querySelectorAll('.group-label')].map(text);
    expect(labels).toEqual(['Szenen2', 'Charaktere1']);
    expect(options().map((o) => text(o.querySelector('strong')))).toEqual([
      'Ankunft',
      'Abschied',
      'Anna Berger',
    ]);
    expect(options()[0]!.querySelector('mark')?.textContent).toBe('Hafen');
  });

  it('springt mit Pfeiltasten durch die Treffer und öffnet mit Enter', async () => {
    const { input, search, options, navigate, settle } = await setup();
    await search('Hafen');

    key(input, 'ArrowDown');
    key(input, 'ArrowDown');
    await settle();
    expect(options()[2]!.getAttribute('aria-selected')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe('hit-2');

    key(input, 'ArrowDown');
    await settle();
    expect(options()[0]!.getAttribute('aria-selected')).toBe('true');

    key(input, 'ArrowUp');
    key(input, 'Enter');
    await settle();
    expect(navigate).toHaveBeenCalledWith(['/write', 'characters', 'anna']);
    expect(options()).toEqual([]);
  });

  it('öffnet einen angeklickten Treffer', async () => {
    const { search, options, navigate } = await setup();
    await search('Hafen');
    (options()[1] as HTMLElement).click();
    expect(navigate).toHaveBeenCalledWith(['/write/scene', 's2']);
  });

  it('meldet, wenn nichts gefunden wurde', async () => {
    const { api, element, search } = await setup();
    api.hits = [];
    await search('  Zeppelin ');
    expect(text(element.querySelector('.empty'))).toBe(de.search.noHits('Zeppelin'));
  });

  it('übernimmt keine Antwort, die zu einer älteren Eingabe gehört', async () => {
    const { api, input, options, settle } = await setup();
    let answerOld!: (hits: SearchHit[]) => void;
    api.search.mockImplementationOnce(() => new Promise((resolve) => (answerOld = resolve)));
    input.focus();
    type(input, 'Alt');
    await wait(DEBOUNCE);
    type(input, 'Neu');
    await wait(DEBOUNCE);
    await settle();
    answerOld([{ kind: 'scene', id: 'x', title: 'Veraltet', snippetHtml: '' }]);
    await settle();
    expect(options().map(text)).not.toContain('Veraltet');
  });

  it('schließt mit Escape erst die Liste und leert dann die Eingabe', async () => {
    const { input, search, options, settle } = await setup();
    await search('Hafen');

    key(input, 'Escape');
    await settle();
    expect(options()).toEqual([]);
    expect(input.value).toBe('Hafen');

    key(input, 'Escape');
    await settle();
    expect(input.value).toBe('');
    expect(document.activeElement).not.toBe(input);
  });

  it('leert die Eingabe über das ×, und Strg+K springt von überall hinein', async () => {
    const { element, input, search, settle } = await setup();
    await search('Hafen');
    button(element, de.search.clear).click();
    await settle();
    expect(input.value).toBe('');

    input.blur();
    key(document, 'k', { ctrlKey: true });
    expect(document.activeElement).toBe(input);
  });

  it('schließt die Liste beim Klick daneben', async () => {
    const { search, options, settle } = await setup();
    await search('Hafen');
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await settle();
    expect(options()).toEqual([]);
  });

  it('führt eine Suche aus, die von anderswo angestoßen wurde (z. B. ein Füllwort)', async () => {
    const api = new FakeApi();
    api.hits = HITS;
    const { element, settle } = await render(GlobalSearch, {
      api,
      before: () => TestBed.inject(SearchRequest).search('eigentlich'),
    });
    const input = element.querySelector('input')!;
    await wait(DEBOUNCE);
    await settle();
    expect(input.value).toBe('eigentlich');
    expect(document.activeElement).toBe(input);
    expect(api.search).toHaveBeenCalledWith('eigentlich');
  });
});
