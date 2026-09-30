package com.codingtechnyks.docscan;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;

import com.google.mlkit.vision.documentscanner.GmsDocumentScanning;
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult;
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.ArrayList;

public class DocumentScannerActivity extends AppCompatActivity {
    private ActivityResultLauncher<IntentSenderRequest> launcher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        launcher = registerForActivityResult(
            new ActivityResultContracts.StartIntentSenderForResult(),
            result -> {
                if (result.getResultCode() != Activity.RESULT_OK) {
                    setResult(Activity.RESULT_CANCELED);
                    finish();
                    return;
                }
                GmsDocumentScanningResult scan =
                    GmsDocumentScanningResult.fromActivityResultIntent(result.getData());
                if (scan == null) {
                    setResult(Activity.RESULT_CANCELED);
                    finish();
                    return;
                }
                try {
                    ArrayList<String> images = new ArrayList<>();
                    if (scan.getPages() != null) {
                        for (GmsDocumentScanningResult.Page page : scan.getPages()) {
                            images.add(copyToCache(page.getImageUri(), "scan-page-", ".jpg"));
                        }
                    }
                    String pdf = null;
                    if (scan.getPdf() != null) {
                        pdf = copyToCache(scan.getPdf().getUri(), "scan-", ".pdf");
                    }
                    Intent out = new Intent();
                    out.putStringArrayListExtra("images", images);
                    out.putExtra("pdf", pdf);
                    setResult(Activity.RESULT_OK, out);
                } catch (Exception e) {
                    setResult(Activity.RESULT_CANCELED);
                }
                finish();
            }
        );

        int pageLimit = Math.max(1, getIntent().getIntExtra("pageLimit", 20));
        boolean pdf = getIntent().getBooleanExtra("generatePdf", true);
        boolean gallery = getIntent().getBooleanExtra("galleryImportAllowed", true);

        int formats = GmsDocumentScannerOptions.RESULT_FORMAT_JPEG;
        if (pdf) formats |= GmsDocumentScannerOptions.RESULT_FORMAT_PDF;

        GmsDocumentScannerOptions options = new GmsDocumentScannerOptions.Builder()
            .setGalleryImportAllowed(gallery)
            .setPageLimit(pageLimit)
            .setResultFormats(formats)
            .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL)
            .build();

        GmsDocumentScanning.getClient(options).getStartScanIntent(this)
            .addOnSuccessListener(sender ->
                launcher.launch(new IntentSenderRequest.Builder(sender).build()))
            .addOnFailureListener(error -> {
                setResult(Activity.RESULT_CANCELED);
                finish();
            });
    }

    private String copyToCache(Uri uri, String prefix, String suffix) throws Exception {
        File file = File.createTempFile(prefix, suffix, getCacheDir());
        try (InputStream in = getContentResolver().openInputStream(uri);
             FileOutputStream out = new FileOutputStream(file)) {
            if (in == null) throw new IllegalStateException("Unable to open scan result");
            byte[] buffer = new byte[8192];
            int read;
            while ((read = in.read(buffer)) != -1) out.write(buffer, 0, read);
        }
        return Uri.fromFile(file).toString();
    }
}
