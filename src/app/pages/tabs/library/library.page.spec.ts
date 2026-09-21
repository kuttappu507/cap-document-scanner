import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LibraryPage } from './library.page';

describe('LibraryPage', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({ imports: [LibraryPage], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(LibraryPage);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
