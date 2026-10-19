import type { APIRequestContext } from '@playwright/test';

/**
 * A small sample novel for the screenshots on the project page: every area of the app gets
 * enough content to look like a book in progress, not like an empty form.
 */

type Annotation = 'todo' | 'idea' | 'fixme';
/** A paragraph; `[todo:passage]` or `[todo:passage|note]` marks a passage. */
type Paragraph = string;

interface DemoScene {
  title: string;
  status: 'idea' | 'outline' | 'draft' | 'revised' | 'final';
  turningPoint?: boolean;
  strands: string[];
  characters: string[];
  places: string[];
  tags?: string[];
  text: Paragraph[];
}

const strands = [
  { name: 'Mara', color: 'violet' },
  { name: 'Jonas', color: 'teal' },
  { name: 'Ellas Geheimnis', color: 'rose' },
] as const;

const characters = [
  {
    title: 'Mara Lindqvist',
    summary: 'Leuchtturmwärterin, 38, spricht lieber mit dem Meer als mit Menschen',
    group: 'Hauptfiguren',
    text: [
      'Aussehen',
      'Hochgewachsen, wettergegerbte Hände, trägt die Ölzeugjacke ihres Vaters.',
      'Ziel',
      'Den Turm halten – solange das Licht brennt, ist Ella nicht verloren.',
    ],
    arc: 'Von der Einzelgängerin, die jede Hilfe ablehnt, zu jemandem, der Vertrauen wagt.',
    steps: [
      { label: 'Weist Jonas an der Fähre ab', scenes: ['Die Fähre'] },
      { label: 'Lässt Jonas zum ersten Mal in den Turm', scenes: ['Der Turm'] },
      { label: 'Liest Ellas Brief und zweifelt', scenes: ['Ellas Brief'] },
      { label: 'Bittet im Sturm um Hilfe', scenes: ['Das Licht erlischt', 'Im Anker'] },
    ],
  },
  {
    title: 'Jonas Brandt',
    summary: 'Journalist aus Hamburg, 41, sucht eine Geschichte und findet eine Insel',
    group: 'Hauptfiguren',
    text: ['Aussehen', 'Zu dünner Mantel, Notizbuch in der Brusttasche.'],
  },
  {
    title: 'Ella Lindqvist',
    summary: 'Maras jüngere Schwester, seit sieben Jahren verschwunden',
    group: 'Hauptfiguren',
    text: ['Hintergrund', 'Ging an einem Novemberabend mit dem Postboot und kam nie an.'],
  },
  {
    title: 'Hinnerk Feddersen',
    summary: 'Wirt im „Anker“, weiß alles, sagt wenig',
    group: 'Nebenfiguren',
    text: ['Eigenheiten', 'Poliert Gläser, die längst sauber sind.'],
  },
  {
    title: 'Frau Petersen',
    summary: 'Postbotin der Insel, kennt jeden Brief',
    group: 'Nebenfiguren',
    text: [],
  },
];

const places = [
  {
    title: 'Leuchtturm Kaltenhafen',
    summary: 'Rot-weiß, 42 Meter, 211 Stufen',
    text: ['Atmosphäre', 'Das Brummen der Linse, der Geruch nach Petroleum und Salz.'],
  },
  {
    title: 'Gasthaus „Zum Anker“',
    summary: 'Die einzige Kneipe der Insel, direkt am Hafen',
    text: ['Atmosphäre', 'Niedrige Decke, Netze an den Wänden, ein Ofen, der immer brennt.'],
  },
  { title: 'Fähranleger', summary: 'Zweimal am Tag, bei Sturm nie', text: [] },
  { title: 'Die Salzwiesen', summary: 'Weites, flaches Land im Osten der Insel', text: [] },
];

const research = [
  {
    title: 'Kennung von Leuchtfeuern',
    summary: 'Wie Seeleute einen Leuchtturm am Takt erkennen',
    text: [
      'Jedes Leuchtfeuer hat eine eigene Kennung, etwa „Blz. 3 15s“: drei Blitze, alle 15 Sekunden.',
    ],
  },
  { title: 'Gezeiten an der Nordsee', summary: 'Tidenhub, Springflut, Nipptide', text: [] },
  { title: 'Seefunk', summary: 'Kanal 16, Mayday, Pan-Pan', text: [] },
];

const book: Array<{ part: string; chapters: Array<{ title: string; scenes: DemoScene[] }> }> = [
  {
    part: 'Erster Teil: Ebbe',
    chapters: [
      {
        title: 'Ankunft',
        scenes: [
          {
            title: 'Die Fähre',
            status: 'final',
            turningPoint: true,
            strands: ['Jonas'],
            characters: ['Jonas Brandt', 'Mara Lindqvist'],
            places: ['Fähranleger'],
            tags: ['Nebel'],
            text: [
              'Die Fähre legte an, als der Nebel gerade so dicht war, dass man den Leuchtturm nur noch ahnen konnte. Jonas Brandt stand an der Reling, den Kragen hochgeschlagen, und fragte sich zum dritten Mal an diesem Morgen, warum er sich auf diese Geschichte eingelassen hatte.',
              'Am Anleger wartete niemand. Nur eine Frau in einer viel zu großen Ölzeugjacke, die Taue aufschoss, als hätte sie nie etwas anderes getan.',
              '„Sie sind der Journalist“, sagte sie, ohne aufzusehen. Es war keine Frage.',
              '„Und Sie müssen Mara Lindqvist sein.“',
              '„Die Fähre geht um vier zurück. Ich würde sie nehmen.“',
            ],
          },
          {
            title: 'Der Turm',
            status: 'revised',
            strands: ['Mara', 'Jonas'],
            characters: ['Mara Lindqvist', 'Jonas Brandt'],
            places: ['Leuchtturm Kaltenhafen'],
            text: [
              'Zweihundertelf Stufen. Mara zählte sie nicht mehr, ihre Beine taten es für sie. Hinter ihr keuchte Jonas, und sie verlangsamte ihre Schritte nicht.',
              'Oben roch es nach Petroleum und Salz. [idea:Das Licht drehte sich, gleichmäßig, geduldig|Die Linse als Auge beschreiben, das nie schläft?], so wie es sich seit hundertzwanzig Jahren drehte.',
              '„Warum machen Sie das noch?“, fragte Jonas. „Das Feuer läuft doch längst automatisch.“',
              'Mara sah hinaus auf das graue Wasser. „Weil jemand hinsehen muss.“',
            ],
          },
        ],
      },
      {
        title: 'Nebel',
        scenes: [
          {
            title: 'Stimmen im Funk',
            status: 'draft',
            strands: ['Mara'],
            characters: ['Mara Lindqvist'],
            places: ['Leuchtturm Kaltenhafen'],
            tags: ['Nebel', 'Nacht'],
            text: [
              'Um kurz nach drei knackte das Funkgerät. Mara war sofort wach, wie immer, wenn Kanal 16 sich meldete.',
              'Rauschen. [todo:Dann eine Stimme, so leise, dass sie sie fast überhört hätte.|Was genau sagt die Stimme? Mit Recherche Seefunk abgleichen]',
              'Sie kannte diese Stimme. Sie hatte sie sieben Jahre lang nicht gehört.',
            ],
          },
          {
            title: 'Ellas Brief',
            status: 'draft',
            turningPoint: true,
            strands: ['Mara', 'Ellas Geheimnis'],
            characters: ['Mara Lindqvist', 'Ella Lindqvist', 'Frau Petersen'],
            places: ['Die Salzwiesen'],
            tags: ['Brief'],
            text: [
              'Frau Petersen brachte den Brief persönlich, obwohl die Post sonst im Kasten am Anleger landete. Sie hielt ihn eine Sekunde zu lang fest, bevor sie ihn Mara gab.',
              'Die Handschrift erkannte Mara, bevor sie den Umschlag umgedreht hatte. [fixme:Die runden a, das zu lange g.|Poststempel prüfen – Widerspruch zu Kapitel 1?]',
              'Sie ging hinaus in die Salzwiesen, bis der Turm nur noch ein Strich am Horizont war, und erst dort öffnete sie ihn.',
            ],
          },
        ],
      },
    ],
  },
  {
    part: 'Zweiter Teil: Flut',
    chapters: [
      {
        title: 'Sturm',
        scenes: [
          {
            title: 'Das Licht erlischt',
            status: 'outline',
            turningPoint: true,
            strands: ['Mara', 'Jonas', 'Ellas Geheimnis'],
            characters: ['Mara Lindqvist', 'Jonas Brandt'],
            places: ['Leuchtturm Kaltenhafen'],
            tags: ['Sturm', 'Nacht'],
            text: [
              'Der Sturm kam früher als angekündigt. Gegen Mitternacht flackerte das Licht – einmal, zweimal – und erlosch.',
              '[todo:Ablauf klären: Wer hat die Leitung gekappt?]',
            ],
          },
          {
            title: 'Im Anker',
            status: 'idea',
            strands: ['Jonas', 'Ellas Geheimnis'],
            characters: ['Jonas Brandt', 'Hinnerk Feddersen'],
            places: ['Gasthaus „Zum Anker“'],
            tags: ['Sturm'],
            text: [
              'Hinnerk stellte ihm ungefragt einen Grog hin. „Sie stellen die falschen Fragen“, sagte er. „Fragen Sie lieber, wer an dem Abend nicht hier war.“',
              'Jonas wärmte die Hände am Glas. Eigentlich hatte er nur eine Nacht bleiben wollen, irgendwie war daraus eine ganze Woche geworden, und plötzlich kam ihm die Insel ziemlich klein vor, kleiner jedenfalls, als sie vom Deck der Fähre aus gewirkt hatte, als der Nebel noch über dem Wasser lag und der Leuchtturm nur ein Schatten war, den man eher ahnte als sah.',
              'Draußen schlug der Wind gegen die Fenster. Der Wind heulte um die Ecken, und der Wind riss an den Fensterläden, bis Hinnerk sie schließlich schloss.',
              '„Wer war denn nicht hier?“, fragte Jonas. Hinnerk polierte ein Glas, das längst sauber war, und und schwieg.',
            ],
          },
        ],
      },
      {
        title: 'Heimkehr',
        scenes: [
          {
            title: 'Morgengrauen',
            status: 'idea',
            strands: ['Mara', 'Jonas'],
            characters: ['Mara Lindqvist', 'Jonas Brandt'],
            places: ['Fähranleger'],
            text: ['[idea:Offenes Ende? Die Fähre legt an – und jemand steigt aus.]'],
          },
        ],
      },
    ],
  },
];

/** The words of the writing log, so that the statistics page has a history. */
export function writingHistory(
  today: Date,
): Array<{ day: string; added: number; removed: number }> {
  const days: Array<{ day: string; added: number; removed: number }> = [];
  // Deterministic, so the screenshots only change when the app does.
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let back = 340; back >= 1; back--) {
    const date = new Date(today);
    date.setDate(date.getDate() - back);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    if (random() < (weekend ? 0.25 : 0.4)) continue;
    const added = Math.round((weekend ? 1400 : 600) * (0.3 + random()));
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    days.push({ day, added, removed: Math.round(added * 0.2 * random()) });
  }
  return days;
}

function toDoc(paragraphs: Paragraph[], headings = false) {
  const content = paragraphs.map((paragraph, index) => {
    if (headings && index % 2 === 0)
      return { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: paragraph }] };
    const parts: unknown[] = [];
    for (const piece of paragraph.split(/(\[(?:todo|idea|fixme):[^\]]+\])/)) {
      if (!piece) continue;
      const mark = /^\[(todo|idea|fixme):([^|\]]+)(?:\|([^\]]+))?\]$/.exec(piece);
      if (mark)
        parts.push({
          type: 'text',
          text: mark[2],
          marks: [
            {
              type: 'annotation',
              attrs: { kind: mark[1] as Annotation, note: mark[3] ?? null, suggestion: null },
            },
          ],
        });
      else parts.push({ type: 'text', text: piece });
    }
    return { type: 'paragraph', content: parts };
  });
  const text = paragraphs.map((p) =>
    p.replace(/\[(?:todo|idea|fixme):([^|\]]+)(?:\|[^\]]+)?\]/g, '$1'),
  );
  return {
    doc: { type: 'doc', content },
    text: text.join('\n'),
    wordCount: text
      .join(' ')
      .split(/\s+/)
      .filter((word) => /\p{L}/u.test(word)).length,
  };
}

export interface DemoIds {
  scenes: Record<string, string>;
  notes: Record<string, string>;
  map: string;
}

/** Fills the open book through the REST API. */
export async function seedDemoBook(api: APIRequestContext): Promise<DemoIds> {
  const post = async (url: string, data: unknown) => {
    const response = await api.post(url, { data });
    if (!response.ok())
      throw new Error(`POST ${url}: ${response.status()} ${await response.text()}`);
    return response.json();
  };
  const send = async (method: 'put' | 'patch', url: string, data: unknown) => {
    const response = await api[method](url, { data });
    if (!response.ok()) throw new Error(`${method} ${url}: ${response.status()}`);
    return response.json();
  };

  const strandIds: Record<string, string> = {};
  for (const strand of strands) strandIds[strand.name] = (await post('/api/strands', strand)).id;

  const notes: Record<string, string> = {};
  const groups: Record<string, string> = {};
  const kinds = [
    ['character', characters],
    ['place', places],
    ['research', research],
  ] as const;
  for (const [kind, entries] of kinds) {
    for (const entry of entries) {
      const note = await post('/api/notes', { kind, title: entry.title });
      notes[entry.title] = note.id;
      const group = 'group' in entry ? entry.group : undefined;
      if (group && !groups[group])
        groups[group] = (await post('/api/note-groups', { kind, name: group })).id;
      await send('patch', `/api/notes/${note.id}`, {
        summary: entry.summary,
        groupId: group ? groups[group] : null,
      });
      if (entry.text.length)
        await send('put', `/api/notes/${note.id}/content`, toDoc(entry.text, kind !== 'research'));
    }
  }

  const scenes: Record<string, string> = {};
  for (const { part, chapters } of book) {
    const partId = (await post('/api/nodes', { parentId: null, kind: 'part', title: part })).id;
    for (const chapter of chapters) {
      const chapterId = (
        await post('/api/nodes', { parentId: partId, kind: 'chapter', title: chapter.title })
      ).id;
      for (const scene of chapter.scenes) {
        const id = (
          await post('/api/nodes', { parentId: chapterId, kind: 'scene', title: scene.title })
        ).id;
        scenes[scene.title] = id;
        await send('patch', `/api/nodes/${id}`, {
          status: scene.status,
          turningPoint: !!scene.turningPoint,
        });
        await send('put', `/api/scenes/${id}/content`, toDoc(scene.text));
        for (const strand of scene.strands)
          await post(`/api/scenes/${id}/strands`, { strandId: strandIds[strand] });
        for (const note of [...scene.characters, ...scene.places])
          await post(`/api/scenes/${id}/links`, { noteId: notes[note] });
        for (const tag of scene.tags ?? []) await post(`/api/scenes/${id}/tags`, { name: tag });
      }
    }
  }

  for (const character of characters) {
    if (!('arc' in character) || !character.arc) continue;
    const noteId = notes[character.title];
    await send('put', `/api/notes/${noteId}/arc`, { summary: character.arc });
    for (const step of character.steps)
      await post(`/api/notes/${noteId}/arc/steps`, {
        label: step.label,
        sceneIds: step.scenes.map((title) => scenes[title]),
      });
  }

  // The story starts with the letter, years before the ferry arrives.
  await send('put', '/api/story', {
    columns: [
      [scenes['Ellas Brief']],
      [scenes['Die Fähre']],
      [scenes['Der Turm']],
      [scenes['Stimmen im Funk']],
      [scenes['Das Licht erlischt'], scenes['Im Anker']],
      [scenes['Morgengrauen']],
    ],
    marks: [
      { label: 'Vor sieben Jahren', beforeColumn: 0 },
      { label: 'Tag 1', beforeColumn: 1 },
      { label: 'Die Sturmnacht', beforeColumn: 4 },
    ],
  });

  const map = await post('/api/maps', { name: 'Insel Kaltenhafen' });
  await send('patch', `/api/maps/${map.id}`, {
    width: 1600,
    height: 1000,
    strokes: [
      {
        tool: 'area',
        color: '#d9c99a',
        width: 6,
        points: [
          260, 520, 340, 330, 560, 220, 820, 190, 1080, 240, 1300, 360, 1360, 560, 1240, 760, 980,
          830, 700, 820, 440, 760, 300, 660,
        ],
      },
      {
        tool: 'area',
        color: '#8fbf7a',
        width: 4,
        points: [900, 330, 1120, 320, 1240, 440, 1220, 600, 1060, 640, 940, 520],
      },
      {
        tool: 'pen',
        color: '#4a7fb5',
        width: 8,
        points: [700, 260, 680, 380, 720, 480, 660, 600, 690, 780],
      },
      {
        tool: 'pen',
        color: '#7a5c3c',
        width: 5,
        points: [380, 640, 520, 600, 640, 560, 800, 520, 980, 470],
      },
    ],
    pins: [
      { noteId: notes['Leuchtturm Kaltenhafen'], x: 350, y: 380 },
      { noteId: notes['Fähranleger'], x: 380, y: 620 },
      { noteId: notes['Gasthaus „Zum Anker“'], x: 600, y: 760 },
      { noteId: notes['Die Salzwiesen'], x: 1080, y: 470 },
    ],
  });

  return { scenes, notes, map: map.id };
}
