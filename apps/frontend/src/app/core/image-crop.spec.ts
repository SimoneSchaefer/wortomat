import { centeredCrop, coverCrop, cropStyle } from './image-crop';

describe('image-crop', () => {
  it('wählt den größten mittigen Ausschnitt im gewünschten Format', () => {
    // 1600 × 900 (16:9) to 4:3: full height, width 1200 of 1600
    expect(centeredCrop(4 / 3, 1600, 900)).toEqual({ x: 0.125, y: 0, width: 0.75, height: 1 });
    // portrait 900 × 1200 to 4:3: full width, height 675 of 1200
    const portrait = centeredCrop(4 / 3, 900, 1200);
    expect(portrait.width).toBe(1);
    expect(portrait.height).toBeCloseTo(0.5625);
    expect(portrait.y).toBeCloseTo(0.21875);
  });

  it('passt einen Ausschnitt mittig an ein anderes Format an (wie object-fit: cover)', () => {
    // 4:3 crop of a 1600 × 1200 image in the round (1:1) profile picture
    const square = coverCrop({ x: 0.5, y: 0.5, width: 0.5, height: 0.5 }, 1600, 1200, 1);
    expect(square.height).toBeCloseTo(0.5);
    expect(square.width).toBeCloseTo(0.375); // 600 px of 1600
    expect(square.x).toBeCloseTo(0.5625);
    expect(square.y).toBeCloseTo(0.5);
    // without a crop: the whole image
    expect(coverCrop(null, 1600, 1200, 4 / 3)).toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });

  it('positioniert das Bild so, dass der Ausschnitt den Rahmen füllt', () => {
    expect(cropStyle({ x: 0.25, y: 0.5, width: 0.5, height: 0.25 })).toEqual({
      width: '200%',
      height: '400%',
      left: '-50%',
      top: '-200%',
    });
  });
});
