package com.codingtechnyks.docscan;

import android.app.Activity;
import android.content.Intent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DocumentScanner")
public class DocumentScannerPlugin extends Plugin {
    private static final int SCAN_REQUEST = 7421;
    private PluginCall pendingCall;

    @PluginMethod
    public void isAvailable(PluginCall call) {
        call.resolve(new JSObject().put("available", true));
    }

    @PluginMethod
    public void scanDocument(PluginCall call) {
        if (getActivity() == null) {
            call.reject("Scanner activity is unavailable");
            return;
        }
        pendingCall = call;
        Intent intent = new Intent(getActivity(), DocumentScannerActivity.class);
        intent.putExtra("pageLimit", Math.max(1, call.getInt("pageLimit", 20)));
        intent.putExtra("generatePdf", call.getBoolean("generatePdf", true));
        intent.putExtra("galleryImportAllowed", call.getBoolean("androidGalleryImportAllowed", true));
        startActivityForResult(call, intent, SCAN_REQUEST);
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode != SCAN_REQUEST || pendingCall == null) return;
        PluginCall call = pendingCall;
        pendingCall = null;
        if (resultCode != Activity.RESULT_OK || data == null) {
            call.reject("Scan canceled", "SCAN_CANCELED");
            return;
        }
        java.util.ArrayList<String> images = data.getStringArrayListExtra("images");
        JSObject result = new JSObject();
        result.put("scannedImages", images == null ? new java.util.ArrayList<>() : images);
        result.put("pdf", data.getStringExtra("pdf"));
        call.resolve(result);
    }
}
