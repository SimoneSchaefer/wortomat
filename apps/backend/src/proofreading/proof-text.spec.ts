import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ProofNote } from '@wortomat/shared';
import { addMark, findAnchor, textBlocks } from './proof-text.js';

interface Node {
  type: string;
  text?: string;
  marks?: object[];
  attrs?: object;
  content?: Node[];
}

const text = (value: string, marks?: object[]): Node => ({
  type: 'text',
  text: value,
  ...(marks ? { marks } : {}),
});
const paragraph = (...content: Node[]): Node => ({ type: 'paragraph', content });
const doc = (...content: Node[]): Node & { content: Node[] } => ({ type: 'doc', content });

const note = (patch: Partial<ProofNote>): ProofNote => ({
  id: 'n1',
  sceneId: 's1',
  paragraph: 0,
  quote: '',
  prefix: '',
  suffix: '',
  note: '',
  suggestion: null,
  createdAt: '',
  ...patch,
});

describe('textBlocks', () => {
  it('liest Absätze als reinen Text – auch leere, verschachtelte und mit Zeilenumbruch', () => {
    const blocks = textBlocks(
      doc(
        paragraph(text('Erster '), text('Satz', [{ type: 'bold' }]), text('.')),
        { type: 'paragraph' },
        { type: 'image', attrs: { src: 'x' } },
        { type: 'blockquote', content: [paragraph(text('Zitat'))] },
        paragraph(text('Zeile 1'), { type: 'hardBreak' }, text('Zeile 2')),
      ),
    );
    assert.deepEqual(
      blocks.map((b) => [b.index, b.text]),
      [
        [0, 'Erster Satz.'],
        [1, ''],
        [2, 'Zitat'],
        [3, 'Zeile 1\nZeile 2'],
      ],
    );
  });
});

describe('findAnchor', () => {
  const blocks = textBlocks(
    doc(
      paragraph(text('Lena sah das Haus. Das Haus war alt.')),
      paragraph(text('Später kam Tom. Das Haus brannte.')),
    ),
  );

  it('findet die Stelle anhand des Texts davor und danach', () => {
    const anchor = findAnchor(blocks, note({ quote: 'Haus', prefix: 'Das ', suffix: ' brannte' }));
    assert.deepEqual([anchor?.block.index, anchor?.start, anchor?.end], [1, 20, 24]);
    const second = findAnchor(blocks, note({ quote: 'Haus', prefix: 'alt. Das ', suffix: ' war' }));
    assert.equal(second?.start, 23);
  });

  it('nimmt bei gleicher Umgebung den Absatz, der der alten Nummer am nächsten liegt', () => {
    const anchor = findAnchor(blocks, note({ quote: 'Das Haus', paragraph: 1 }));
    assert.equal(anchor?.block.index, 1);
  });

  it('findet nichts, wenn der Text nicht mehr vorkommt', () => {
    assert.equal(findAnchor(blocks, note({ quote: 'Scheune' })), null);
    assert.equal(findAnchor(blocks, note({ quote: '' })), null);
  });
});

describe('addMark', () => {
  it('teilt Textknoten an den Rändern und behält andere Marken', () => {
    const document = doc(
      paragraph(text('Ein '), text('fettes', [{ type: 'bold' }]), text(' Wort')),
    );
    const blocks = textBlocks(document);
    const mark = { type: 'annotation', attrs: { kind: 'fixme', note: 'Hm', suggestion: null } };
    addMark({ block: blocks[0]!, start: 2, end: 7 }, mark);
    assert.deepEqual(document.content[0]!.content, [
      text('Ei'),
      text('n ', [mark]),
      text('fet', [{ type: 'bold' }, mark]),
      text('tes', [{ type: 'bold' }]),
      text(' Wort'),
    ]);
  });

  it('ersetzt eine vorhandene Markierung derselben Art', () => {
    const old = { type: 'annotation', attrs: { kind: 'todo' } };
    const document = doc(paragraph(text('abc', [old])));
    const mark = { type: 'annotation', attrs: { kind: 'fixme', note: 'x', suggestion: 'y' } };
    addMark({ block: textBlocks(document)[0]!, start: 0, end: 3 }, mark);
    assert.deepEqual(document.content[0]!.content, [text('abc', [mark])]);
  });

  it('überspringt Zeilenumbrüche', () => {
    const document = doc(paragraph(text('ab'), { type: 'hardBreak' }, text('cd')));
    const mark = { type: 'annotation', attrs: { kind: 'fixme' } };
    addMark({ block: textBlocks(document)[0]!, start: 1, end: 4 }, mark);
    assert.deepEqual(document.content[0]!.content, [
      text('a'),
      text('b', [mark]),
      { type: 'hardBreak' },
      text('c', [mark]),
      text('d'),
    ]);
  });
});
