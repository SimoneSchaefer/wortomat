import type { Provider, Type } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, type Routes } from '@angular/router';
import { AppSettingsStore } from '../core/app-settings';
import { ProjectStore } from '../core/project-store';
import { FakeApi, provideFakeApi, TEST_SETTINGS } from './fake-api';

export interface Rendered<T> {
  fixture: ComponentFixture<T>;
  element: HTMLElement;
  api: FakeApi;
  router: Router;
  /** Runs change detection and waits for pending async work, like the browser would. */
  settle(): Promise<void>;
}

/**
 * Renders a component the way the app does: German UI, the fake backend, a real router and the
 * project's manuscript already loaded into the store.
 */
export async function render<T>(
  component: Type<T>,
  options: {
    inputs?: Record<string, unknown>;
    providers?: Provider[];
    routes?: Routes;
    api?: FakeApi;
    /** Runs after configuring and before creating, e.g. to prepare a service via TestBed.inject. */
    before?: () => unknown;
  } = {},
): Promise<Rendered<T>> {
  const api = options.api ?? new FakeApi();
  TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideRouter(options.routes ?? []),
      provideFakeApi(api),
      ...(options.providers ?? []),
    ],
  });
  TestBed.inject(AppSettingsStore).settings.set(TEST_SETTINGS);
  await TestBed.inject(ProjectStore).reloadNodes();
  await options.before?.();

  const fixture = TestBed.createComponent(component);
  for (const [name, value] of Object.entries(options.inputs ?? {})) {
    fixture.componentRef.setInput(name, value);
  }
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  await settle();
  return {
    fixture,
    element: fixture.nativeElement as HTMLElement,
    api,
    router: TestBed.inject(Router),
    settle,
  };
}

/** By accessible name: `aria-label` if set, otherwise the visible text. */
export function button(root: ParentNode, name: string | RegExp): HTMLButtonElement {
  const found = findButton(root, name);
  if (!found) {
    const names = [...root.querySelectorAll('button')].map(accessibleName);
    throw new Error(`No button "${String(name)}" – found: ${JSON.stringify(names)}`);
  }
  return found;
}

export function findButton(root: ParentNode, name: string | RegExp): HTMLButtonElement | null {
  const matches = (text: string) => (typeof name === 'string' ? text === name : name.test(text));
  return [...root.querySelectorAll('button')].find((b) => matches(accessibleName(b))) ?? null;
}

function accessibleName(element: Element): string {
  return (element.getAttribute('aria-label') ?? element.textContent ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function text(element: Element | null | undefined): string {
  return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function key(target: EventTarget, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

export function type(input: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** For flows that chain several backend answers: settle until `check` holds (or give up). */
export async function until(settle: () => Promise<void>, check: () => boolean): Promise<void> {
  for (let round = 0; round < 20 && !check(); round++) {
    await settle();
    await wait(0);
  }
  if (!check()) throw new Error('until(): condition never became true');
}

/**
 * jsdom has neither DragEvent nor DataTransfer. One shared transfer object per drag, as in a
 * browser, so `dragstart` data is visible in `dragover` and `drop`.
 */
export function startDrag(options: { files?: File[] } = {}): {
  fire: (target: Element, type: 'dragstart' | 'dragover' | 'drop' | 'dragend') => Event;
} {
  const data = new Map<string, string>();
  const files = options.files ?? [];
  const transfer = {
    get types() {
      return [...data.keys(), ...(files.length ? ['Files'] : [])];
    },
    setData: (format: string, value: string) => void data.set(format, value),
    getData: (format: string) => data.get(format) ?? '',
    effectAllowed: 'all',
    dropEffect: 'none',
    files,
  };
  return {
    fire(target, type) {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperties(event, {
        dataTransfer: { value: transfer },
        clientY: { value: 0 },
      });
      target.dispatchEvent(event);
      return event;
    },
  };
}
