import type { SceneStatus } from '@wortomat/shared';
import { render } from '../testing/render';
import { StatusIcon } from './status-icon';

async function shape(status: SceneStatus) {
  const { element } = await render(StatusIcon, { inputs: { status } });
  return element.querySelector('svg')!;
}

describe('StatusIcon', () => {
  it('shows progress as a shape, not only as a colour', async () => {
    expect((await shape('idea')).querySelector('circle')?.getAttribute('stroke-dasharray')).toBe(
      '2.5 2.4',
    );
  });

  it('fills a pie slice for the steps in between', async () => {
    const half = (await shape('draft')).querySelector('path')!.getAttribute('d');
    expect(half).toBe('M8 8V4A4 4 0 0 1 8.00 12.00Z');
  });

  it('shows a full circle with a check mark when final', async () => {
    const svg = await shape('final');
    expect(svg.querySelector('circle')?.getAttribute('fill')).toBe('currentColor');
    expect(svg.querySelector('path.check')).not.toBeNull();
  });
});
