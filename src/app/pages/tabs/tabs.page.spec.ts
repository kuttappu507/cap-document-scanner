import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TabsPage } from './tabs.page';

describe('TabsPage', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({ imports: [TabsPage], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(TabsPage);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
