import { TestBed } from '@angular/core/testing';
import { de } from '../../core/i18n/de';
import { SearchRequest } from '../../core/search-request';
import { FakeApi, testNode, testNote } from '../../testing/fake-api';
import { render, text, until } from '../../testing/render';
import { NotesStore } from '../notes/notes-store';
import { TextStats } from './text-stats';

const S = de.stats;

async function setup(texts = true) {
  const api = new FakeApi();
  api.nodes = [
    testNode('k1', 'chapter', null, { title: 'Ankunft', sortOrder: 1 }),
    testNode('a', 'scene', 'k1', { sortOrder: 1 }),
    testNode('k2', 'chapter', null, { title: 'Flucht', sortOrder: 2 }),
    testNode('b', 'scene', 'k2', { sortOrder: 1 }),
  ];
  api.notes = [testNote('anna', 'character', { title: 'Anna' })];
  if (texts) {
    api.texts = [
      {
        sceneId: 'a',
        text: '„Komm eigentlich mit“, sagte Anna. Anna ging. Der Hafen lag still. Der Hafen schlief.',
      },
      { sceneId: 'b', text: 'Es regnete eigentlich den ganzen Tag.' },
    ];
  }
  const view = await render(TextStats, {
    api,
    providers: [NotesStore],
    before: () => TestBed.inject(NotesStore).load(),
  });
  await until(view.settle, () => api.sceneTexts.mock.calls.length > 0);
  await view.settle();
  const words = (index: number) =>
    [...view.element.querySelectorAll('ul.words')[index]!.querySelectorAll('.word')].map(text);
  return { ...view, words };
}

describe('TextStats', () => {
  it('shows dialogue share and sentence length per chapter', async () => {
    const { element } = await setup();
    const rows = [...element.querySelectorAll('.table .row:not(.head)')].map((row) =>
      [...row.querySelectorAll('.value')].map(text),
    );
    expect(rows).toEqual([
      // 3 of 14 words in quotes; 14 words in 4 sentences
      ['21 %', '3,5'],
      ['0 %', '6'],
    ]);
  });

  it('lists filler words and favourite words, without names', async () => {
    const { words } = await setup();
    expect(words(0)).toEqual(['eigentlich 2']);
    expect(words(1)).toEqual(['Hafen 2']);
  });

  it('searches the book for a word on click', async () => {
    const { element } = await setup();
    element.querySelector<HTMLButtonElement>('ul.words .word')!.click();
    expect(TestBed.inject(SearchRequest).take()).toEqual({ query: 'eigentlich' });
  });

  it('waits for text before showing anything', async () => {
    const { element } = await setup(false);
    expect(text(element.querySelector('.empty'))).toBe(S.textEmpty);
  });
});
