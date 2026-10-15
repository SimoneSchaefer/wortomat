import { render, text } from '../testing/render';
import { AnnotationBadges } from './annotation-badges';
import { ANNOTATION_KINDS } from './annotations';

describe('AnnotationBadges', () => {
  it('shows only kinds that occur, with a tooltip in singular or plural', async () => {
    const { element } = await render(AnnotationBadges, {
      inputs: { counts: { todo: 1, idea: 0, fixme: 3 } },
    });
    const badges = [...element.querySelectorAll('.badge')];
    expect(badges.map(text)).toEqual(['1', '3']);
    expect(badges.map((badge) => badge.getAttribute('title'))).toEqual(['1 Todo', '3 Fixmes']);
  });

  it('reserves a slot per kind so counts line up in a list', async () => {
    const { element } = await render(AnnotationBadges, {
      inputs: { counts: { todo: 0, idea: 0, fixme: 0 }, kinds: ANNOTATION_KINDS.slice(1) },
    });
    expect(element.style.getPropertyValue('--slots')).toBe('2');
    expect(element.querySelector('.badge')).toBeNull();
  });
});
