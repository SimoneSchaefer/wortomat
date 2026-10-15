import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { countAnnotations } from './annotations.js';

const text = (value: string, ...marks: Array<string | { type: string; attrs?: object }>) => ({
  type: 'text',
  text: value,
  marks: marks.map((mark) =>
    typeof mark === 'string' ? { type: 'annotation', attrs: { kind: mark } } : mark,
  ),
});
const bold = { type: 'bold' };
const paragraph = (...content: object[]) => ({ type: 'paragraph', content });
const doc = (...content: object[]) => ({ type: 'doc', content });

describe('countAnnotations', () => {
  it('counts contiguously marked text once, even when interrupted by bold', () => {
    const counts = countAnnotations(
      doc(
        paragraph(
          text('Hier '),
          text('fehlt ', 'todo'),
          text('noch', 'todo', bold),
          text(' was', 'todo'),
        ),
      ),
    );
    assert.deepEqual(counts, { todo: 1, idea: 0, fixme: 0 });
  });

  it('counts separate passages and different kinds individually', () => {
    const counts = countAnnotations(
      doc(
        paragraph(text('a', 'todo'), text(' – '), text('b', 'todo'), text('c', 'idea')),
        paragraph(text('d', 'todo')),
        { type: 'blockquote', content: [paragraph(text('e', 'fixme'))] },
      ),
    );
    assert.deepEqual(counts, { todo: 3, idea: 1, fixme: 1 });
  });

  it('ends a mark at the end of the paragraph', () => {
    const counts = countAnnotations(
      doc(paragraph(text('Ende', 'idea')), paragraph(text('Anfang', 'idea'))),
    );
    assert.deepEqual(counts, { todo: 0, idea: 2, fixme: 0 });
  });

  it('ignores unknown kinds, other marks and broken documents', () => {
    assert.deepEqual(
      countAnnotations(
        doc(
          paragraph(text('x', { type: 'annotation', attrs: { kind: 'quatsch' } }), text('y', bold)),
        ),
      ),
      { todo: 0, idea: 0, fixme: 0 },
    );
    assert.deepEqual(countAnnotations(null), { todo: 0, idea: 0, fixme: 0 });
    assert.deepEqual(countAnnotations({ type: 'doc', content: 'kaputt' }), {
      todo: 0,
      idea: 0,
      fixme: 0,
    });
  });
});
