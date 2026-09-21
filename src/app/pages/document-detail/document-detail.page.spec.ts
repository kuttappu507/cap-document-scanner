import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DocumentDetailPage } from './document-detail.page';

describe('DocumentDetailPage', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({ imports: [DocumentDetailPage], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(DocumentDetailPage);
    fixture.componentRef.setInput('id', 'missing');
    expect(fixture.componentInstance).toBeTruthy();
  });
});
