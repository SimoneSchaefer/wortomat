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
  it('reads paragraphs as plain text – empty ones, nested ones and with line breaks too', () => {
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

  it('finds the passage by the text before and after it', () => {
    const anchor = findAnchor(blocks, note({ quote: 'Haus', prefix: 'Das ', suffix: ' brannte' }));
    assert.deepEqual([anchor?.block.index, anchor?.start, anchor?.end], [1, 20, 24]);
    const second = findAnchor(blocks, note({ quote: 'Haus', prefix: 'alt. Das ', suffix: ' war' }));
    assert.equal(second?.start, 23);
  });

  it('with the same surroundings takes the paragraph closest to the old number', () => {
    const anchor = findAnchor(blocks, note({ quote: 'Das Haus', paragraph: 1 }));
    assert.equal(anchor?.block.index, 1);
  });

  it('finds nothing when the text no longer occurs', () => {
    assert.equal(findAnchor(blocks, note({ quote: 'Scheune' })), null);
    assert.equal(findAnchor(blocks, note({ quote: '' })), null);
  });
});

describe('addMark', () => {
  it('splits text nodes at the edges and keeps other marks', () => {
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

  it('replaces an existing mark of the same kind', () => {
    const old = { type: 'annotation', attrs: { kind: 'todo' } };
    const document = doc(paragraph(text('abc', [old])));
    const mark = { type: 'annotation', attrs: { kind: 'fixme', note: 'x', suggestion: 'y' } };
    addMark({ block: textBlocks(document)[0]!, start: 0, end: 3 }, mark);
    assert.deepEqual(document.content[0]!.content, [text('abc', [mark])]);
  });

  it('skips line breaks', () => {
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
