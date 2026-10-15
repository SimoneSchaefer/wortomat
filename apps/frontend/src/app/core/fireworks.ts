const COLORS = ['#84cc16', '#facc15', '#fb923c', '#f472b6', '#38bdf8', '#a78bfa'];
const BURSTS = 3;
const SPARKS_PER_BURST = 18;

/**
 * Small fireworks above an element, e.g. when a scene is finished. Plain DOM sparks with the Web
 * Animations API; they clean up after themselves. Nobody with reduced motion gets any.
 */
export function celebrate(origin: Element): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rect = origin.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const top = rect.top;

  for (let burst = 0; burst < BURSTS; burst++) {
    // Slightly offset above the element, fired one after another
    const x = centerX + (burst - 1) * 70 + random(-20, 20);
    const y = top - random(40, 90);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]!;
    setTimeout(() => explode(x, y, color), burst * 220);
  }
}

function explode(x: number, y: number, color: string): void {
  for (let i = 0; i < SPARKS_PER_BURST; i++) {
    const angle = (i / SPARKS_PER_BURST) * Math.PI * 2 + random(-0.15, 0.15);
    const distance = random(35, 65);
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    const spark = document.createElement('span');
    spark.setAttribute('aria-hidden', 'true');
    Object.assign(spark.style, {
      position: 'fixed',
      left: `${x - 2.5}px`,
      top: `${y - 2.5}px`,
      width: '5px',
      height: '5px',
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 6px ${color}`,
      pointerEvents: 'none',
      zIndex: '1000',
    });
    document.body.append(spark);
    const animation = spark.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx * 1.1}px, ${dy * 1.1 + 25}px) scale(0.4)`, opacity: 0 },
      ],
      { duration: random(800, 1100), easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' },
    );
    animation.onfinish = () => spark.remove();
  }
}

function random(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
