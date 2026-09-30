package com.codingtechnyks.docscan;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    public MainActivity() {
        registerPlugin(DocumentScannerPlugin.class);
    }
}
