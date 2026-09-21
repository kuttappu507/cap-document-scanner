import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScannedDocument } from '../../interfaces/scanned-document.interface';
import { DeviceExportService } from '../device-export/device-export.service';
import { DocumentLibraryService } from '../document-library/document-library.service';
import { DocumentScannerService } from '../document-scanner/document-scanner.service';
import { ScanRecoveryService } from '../scan-recovery/scan-recovery.service';
import { DEFAULT_SCAN_SETTINGS, ScanSettingsService } from '../scan-settings/scan-settings.service';
import { ScanWorkflowService } from './scan-workflow.service';

describe('ScanWorkflowService', () => {
  const document: ScannedDocument = { id: 'd1', title: 'Scan', createdAt: 0, pages: ['scans/d1/page-1.jpg'], pdf: 'scans/d1/document.pdf' };
  const scanResult = { images: ['file:///cache/page.jpg'], pdf: 'file:///cache/doc.pdf' };

  let scanner: { scan: ReturnType<typeof vi.fn> };
  let library: { add: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  let exporter: { saveToFiles: ReturnType<typeof vi.fn>; saveToPhotos: ReturnType<typeof vi.fn> };
  let recovery: Record<string, ReturnType<typeof vi.fn>>;
  const settings = signal({ ...DEFAULT_SCAN_SETTINGS, saveToFiles: true, saveToPhotos: true });

  beforeEach(() => {
    scanner = { scan: vi.fn().mockResolvedValue(scanResult) };
    recovery = {
      markStarted: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      getPending: vi.fn().mockResolvedValue(null),
      waitForFiles: vi.fn().mockResolvedValue(scanResult),
      deleteSources: vi.fn().mockResolvedValue(undefined),
    };
    let stored = document; // Mirrors the real library: updates merge into the stored copy.
    library = {
      add: vi.fn().mockResolvedValue(document),
      update: vi.fn((_id: string, patch: Partial<ScannedDocument>) => Promise.resolve((stored = { ...stored, ...patch }))),
    };
    exporter = { saveToFiles: vi.fn().mockResolvedValue('DocScan/Scan.pdf'), saveToPhotos: vi.fn().mockResolvedValue(undefined) };
    TestBed.configureTestingModule({
      providers: [
        { provide: DocumentScannerService, useValue: scanner },
        { provide: DocumentLibraryService, useValue: library },
        { provide: DeviceExportService, useValue: exporter },
        { provide: ScanSettingsService, useValue: { settings } },
        { provide: ScanRecoveryService, useValue: recovery },
      ],
    });
  });

  it('returns null and saves nothing when the user cancels', async () => {
    scanner.scan.mockResolvedValue(null);
    expect(await TestBed.inject(ScanWorkflowService).scanAndSave()).toBeNull();
    expect(library.add).not.toHaveBeenCalled();
  });

  it('saves the scan to the library, Files and Photos', async () => {
    const outcome = await TestBed.inject(ScanWorkflowService).scanAndSave();
    expect(library.add).toHaveBeenCalledWith(scanResult);
    expect(outcome?.document.savedToFiles).toBe('DocScan/Scan.pdf');
    expect(outcome?.document.savedToPhotos).toBe(true);
    expect(outcome?.warnings).toEqual([]);
  });

  it('keeps the scan in the library when an export fails', async () => {
    exporter.saveToFiles.mockRejectedValue({ message: 'Disk full' });
    const outcome = await TestBed.inject(ScanWorkflowService).scanAndSave();
    expect(outcome?.document.id).toBe('d1');
    expect(outcome?.warnings).toEqual(['Files: Disk full']);
  });

  it('clears the pending marker when the scan completes normally', async () => {
    await TestBed.inject(ScanWorkflowService).scanAndSave();
    expect(recovery['markStarted']).toHaveBeenCalled();
    expect(recovery['clear']).toHaveBeenCalled();
    expect(recovery['deleteSources']).toHaveBeenCalledWith(scanResult);
  });

  it('imports a scan whose WebView was restarted while the scanner was open', async () => {
    recovery['getPending'].mockResolvedValue({ startedAt: 1, settings: settings() });
    const outcome = await TestBed.inject(ScanWorkflowService).resumeInterruptedScan();
    expect(library.add).toHaveBeenCalledWith(scanResult);
    expect(outcome?.document.savedToFiles).toBe('DocScan/Scan.pdf');
  });

  it('does nothing on start when no scan was interrupted', async () => {
    expect(await TestBed.inject(ScanWorkflowService).resumeInterruptedScan()).toBeNull();
    expect(library.add).not.toHaveBeenCalled();
  });
});
