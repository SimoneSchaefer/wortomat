import { TestBed } from '@angular/core/testing';
import { SearchRequest } from './search-request';

describe('SearchRequest', () => {
  it('liefert eine Anfrage nur einmal aus', () => {
    const requests = TestBed.inject(SearchRequest);
    requests.search('eigentlich');
    expect(requests.take()).toEqual({ query: 'eigentlich' });
    // Eine neu entstehende Suchleiste darf die alte Anfrage nicht noch einmal ausführen
    expect(requests.take()).toBeNull();
  });
});
