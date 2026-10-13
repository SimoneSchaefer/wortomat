import type { MapStroke } from '@wortomat/shared';

/** Punkte abwechselnd als x und y: `[x0, y0, x1, y1, …]` – wie in `MapStroke.points`. */
type Points = readonly number[];

/**
 * SVG-Pfad durch die Punkte, mit quadratischen Kurven über die Mittelpunkte geglättet –
 * so wirkt ein mit der Maus gezogener Strich weniger zittrig. Ein einzelner Punkt wird
 * zu einem winzigen Strich, damit er (mit runden Enden) als Punkt sichtbar ist.
 */
export function strokePath(points: Points, closed = false): string {
  const count = points.length / 2;
  if (count === 0) return '';
  const x = (i: number) => round(points[2 * i]!);
  const y = (i: number) => round(points[2 * i + 1]!);
  if (count === 1) return `M${x(0)} ${y(0)}h0.1`;
  if (count === 2) return `M${x(0)} ${y(0)}L${x(1)} ${y(1)}${closed ? 'Z' : ''}`;

  let path = `M${x(0)} ${y(0)}`;
  for (let i = 1; i < count - 1; i++) {
    const midX = round((points[2 * i]! + points[2 * i + 2]!) / 2);
    const midY = round((points[2 * i + 1]! + points[2 * i + 3]!) / 2);
    path += `Q${x(i)} ${y(i)} ${midX} ${midY}`;
  }
  path += `L${x(count - 1)} ${y(count - 1)}`;
  return closed ? path + 'Z' : path;
}

/**
 * Lässt Punkte weg, die kaum von der Linie abweichen (Douglas-Peucker), damit die
 * Projektdatei nicht mit jedem Mauszucken wächst. `tolerance` in Karteneinheiten.
 */
export function simplify(points: Points, tolerance: number): number[] {
  const count = points.length / 2;
  if (count <= 2) return [...points];
  const keep = new Uint8Array(count);
  keep[0] = keep[count - 1] = 1;
  const stack: Array<[number, number]> = [[0, count - 1]];
  while (stack.length) {
    const [first, last] = stack.pop()!;
    let maxDistance = 0;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const distance = segmentDistance(
        points[2 * i]!,
        points[2 * i + 1]!,
        points[2 * first]!,
        points[2 * first + 1]!,
        points[2 * last]!,
        points[2 * last + 1]!,
      );
      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }
    if (index >= 0 && maxDistance > tolerance) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  const result: number[] = [];
  keep.forEach((kept, i) => {
    if (kept) result.push(points[2 * i]!, points[2 * i + 1]!);
  });
  return result;
}

/**
 * Trifft der Radierer (Kreis um x/y) den Strich? Linien zählen samt ihrer Breite,
 * Flächen auch, wenn der Punkt mitten in ihnen liegt.
 */
export function hitsStroke(stroke: MapStroke, x: number, y: number, radius: number): boolean {
  const { points } = stroke;
  const reach = radius + stroke.width / 2;
  const count = points.length / 2;
  if (count === 1) return Math.hypot(points[0]! - x, points[1]! - y) <= reach;
  for (let i = 0; i < count - 1; i++) {
    const distance = segmentDistance(
      x,
      y,
      points[2 * i]!,
      points[2 * i + 1]!,
      points[2 * i + 2]!,
      points[2 * i + 3]!,
    );
    if (distance <= reach) return true;
  }
  return stroke.tool === 'area' && insidePolygon(points, x, y);
}

/** Abstand des Punkts p von der Strecke a–b. */
function segmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Strahlverfahren: Wie oft schneidet ein Strahl nach rechts den Rand? Ungerade = innen. */
function insidePolygon(points: Points, x: number, y: number): boolean {
  const count = points.length / 2;
  let inside = false;
  for (let i = 0, j = count - 1; i < count; j = i++) {
    const xi = points[2 * i]!;
    const yi = points[2 * i + 1]!;
    const xj = points[2 * j]!;
    const yj = points[2 * j + 1]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
