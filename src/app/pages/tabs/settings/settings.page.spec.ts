import { TestBed } from '@angular/core/testing';
import { SettingsPage } from './settings.page';

describe('SettingsPage', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({ imports: [SettingsPage] }).compileComponents();
    const fixture = TestBed.createComponent(SettingsPage);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
