import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfirmDialog } from '../../core/confirm-dialog';
import { de } from '../../core/i18n/de';
import { FakeApi, testMap } from '../../testing/fake-api';
import { button, render, text, until } from '../../testing/render';
import { MapList } from './map-list';
import { MapsStore } from './maps-store';

@Component({ template: '' })
class Blank {}

async function setup(maps = [testMap('kueste', { name: 'Küste' })]) {
  const api = new FakeApi();
  for (const map of maps) api.maps.set(map.id, map);
  const view = await render(MapList, {
    api,
    providers: [MapsStore],
    routes: [
      { path: 'write/places', component: Blank },
      { path: 'write/places/maps/:id', component: Blank },
    ],
    before: () => TestBed.inject(MapsStore).load(),
  });
  return { ...view, confirm: TestBed.inject(ConfirmDialog) };
}

describe('MapList', () => {
  it('lists the maps with links to them', async () => {
    const { element } = await setup();
    expect([...element.querySelectorAll('.name')].map(text)).toEqual(['Küste']);
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/write/places/maps/kueste');
  });

  it('invites to draw the first map', async () => {
    const { api, element, router, settle } = await setup([]);
    button(element, de.maps.addFirst).click();
    await until(settle, () => router.url.startsWith('/write/places/maps/'));
    expect(api.createMap).toHaveBeenCalledWith({ name: de.maps.newName });
  });

  it('creates another map via its "+"', async () => {
    const { api, element, settle } = await setup();
    button(element, de.maps.add).click();
    await until(settle, () => api.createMap.mock.calls.length > 0);
  });

  it('deletes a map after confirmation and leaves it if it was open', async () => {
    const { api, element, confirm, router, settle } = await setup();
    await router.navigateByUrl('/write/places/maps/kueste');
    button(element, de.maps.deleteLabel('Küste')).click();
    await settle();
    expect(confirm.pending()?.message).toBe(de.maps.deleteMessage('Küste'));
    confirm.answer(true);
    await until(settle, () => router.url === '/write/places');
    expect(api.deleteMap).toHaveBeenCalledWith('kueste');
  });
});
