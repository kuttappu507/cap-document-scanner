import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ScanPage } from './scan.page';

describe('ScanPage', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({ imports: [ScanPage], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(ScanPage);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
