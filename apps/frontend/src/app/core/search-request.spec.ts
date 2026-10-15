import { TestBed } from '@angular/core/testing';
import { SearchRequest } from './search-request';

describe('SearchRequest', () => {
  it('liefert eine Anfrage nur einmal aus', () => {
    const requests = TestBed.inject(SearchRequest);
    requests.search('eigentlich');
    expect(requests.take()).toEqual({ query: 'eigentlich' });
    // A newly created search bar must not run the old request again
    expect(requests.take()).toBeNull();
  });
});
