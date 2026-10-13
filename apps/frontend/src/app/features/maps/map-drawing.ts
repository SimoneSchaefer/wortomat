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
 * Glättet einen von Hand gezogenen Strich, damit das Zittern der Maus verschwindet: Die Punkte
 * werden in gleichen Abständen (`spacing`) neu verteilt und dann mit ihren Nachbarn gemittelt
 * (Dreiecksgewichte über `radius` Punkte je Seite). Offene Striche behalten Anfang und Ende,
 * geschlossene (Flächen) werden auch über die Naht hinweg geglättet.
 */
export function smooth(points: Points, spacing: number, radius: number, closed = false): number[] {
  const even = resample(points, spacing);
  const count = even.length / 2;
  if (count < 3 || radius < 1) return even;
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    if (!closed && (i === 0 || i === count - 1)) {
      result.push(even[2 * i]!, even[2 * i + 1]!);
      continue;
    }
    // Am Rand offener Striche schrumpft das Fenster, damit die Enden nicht wegrutschen
    const reach = closed
      ? Math.min(radius, Math.floor((count - 1) / 2))
      : Math.min(radius, i, count - 1 - i);
    let x = 0;
    let y = 0;
    let total = 0;
    for (let j = -reach; j <= reach; j++) {
      const index = (i + j + count) % count;
      const weight = reach + 1 - Math.abs(j);
      x += even[2 * index]! * weight;
      y += even[2 * index + 1]! * weight;
      total += weight;
    }
    result.push(x / total, y / total);
  }
  return result;
}

/** Verteilt die Punkte im Abstand `spacing` entlang des Strichs; der letzte bleibt erhalten. */
function resample(points: Points, spacing: number): number[] {
  const count = points.length / 2;
  if (count < 2 || spacing <= 0) return [...points];
  const result = [points[0]!, points[1]!];
  let carry = 0; // Wegstück seit dem letzten gesetzten Punkt
  for (let i = 1; i < count; i++) {
    const ax = points[2 * i - 2]!;
    const ay = points[2 * i - 1]!;
    const bx = points[2 * i]!;
    const by = points[2 * i + 1]!;
    const length = Math.hypot(bx - ax, by - ay);
    let at = spacing - carry;
    while (at <= length) {
      result.push(ax + ((bx - ax) * at) / length, ay + ((by - ay) * at) / length);
      at += spacing;
    }
    carry = length - (at - spacing);
  }
  const lastX = points[2 * count - 2]!;
  const lastY = points[2 * count - 1]!;
  if (result.at(-2) !== lastX || result.at(-1) !== lastY) result.push(lastX, lastY);
  return result;
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
