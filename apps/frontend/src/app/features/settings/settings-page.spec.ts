import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppSettingsStore } from '../../core/app-settings';
import { de } from '../../core/i18n/de';
import { ProjectStore } from '../../core/project-store';
import { StatusMessages } from '../../core/status-messages';
import { testProject } from '../../testing/fake-api';
import { button, render, text, until } from '../../testing/render';
import { SettingsPage } from './settings-page';

@Component({ template: '' })
class Blank {}

async function setup() {
  const view = await render(SettingsPage, {
    routes: [
      { path: '', component: Blank },
      { path: 'write', component: Blank },
    ],
  });
  const radio = (name: string, value: string) =>
    view.element.querySelector<HTMLInputElement>(`input[name=${name}][value="${value}"]`)!;
  const choose = async (name: string, value: string) => {
    radio(name, value).click();
    await view.settle();
  };
  return { ...view, radio, choose, settings: TestBed.inject(AppSettingsStore) };
}

describe('SettingsPage', () => {
  it('shows the current settings as selected choices', async () => {
    const { radio } = await setup();
    expect(radio('language', 'de').checked).toBe(true);
    expect(radio('theme', 'system').checked).toBe(true);
    expect(radio('fontSize', 'medium').checked).toBe(true);
    expect(radio('quoteStyle', 'de').checked).toBe(true);
  });

  it('shows the release number', async () => {
    const { element, settle } = await setup();
    await until(settle, () => !!element.querySelector('.version'));
    expect(text(element.querySelector('.version'))).toBe(de.start.version('2.0.0'));
  });

  it('saves a choice right away', async () => {
    const { api, choose, settings } = await setup();
    await choose('theme', 'dark');
    await choose('fontSize', 'large');
    await choose('quoteStyle', 'fr');
    expect(api.updateSettings.mock.calls.map(([request]) => request)).toEqual([
      { theme: 'dark' },
      { fontSize: 'large' },
      { quoteStyle: 'fr' },
    ]);
    expect(settings.settings()).toMatchObject({
      theme: 'dark',
      fontSize: 'large',
      quoteStyle: 'fr',
    });
  });

  it('switches the whole UI language at once', async () => {
    const { element, choose } = await setup();
    await choose('language', 'en');
    expect(text(element.querySelector('h1'))).toBe('Settings');
  });

  it('shows each quote style with an example sentence', async () => {
    const { radio } = await setup();
    const example = (style: string) =>
      text(radio('quoteStyle', style).closest('label')!.querySelector('.example'));
    expect(example('de')).toBe('„Sag ‚bitte‘“, flüstert’s.');
    expect(example('off')).toBe("\"Sag 'bitte'\", flüstert's.");
  });

  it('keeps the old value and reports when saving fails', async () => {
    const { api, choose, radio, settle } = await setup();
    api.updateSettings.mockRejectedValueOnce(new Error('Datenordner schreibgeschützt'));
    await choose('theme', 'light');
    await until(settle, () => radio('theme', 'system').checked);
    expect(TestBed.inject(StatusMessages).messages()[0]?.text).toBe('Datenordner schreibgeschützt');
  });

  it('goes back to the book or, without one, to the start page', async () => {
    const { element, router, settle } = await setup();
    button(element, de.common.back).click();
    await until(settle, () => router.url === '/');

    TestBed.inject(ProjectStore).project.set(testProject());
    button(element, de.common.back).click();
    await until(settle, () => router.url === '/write');
  });
});
