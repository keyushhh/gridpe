package com.gridpe.customer;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Handle splash screen transition
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        
        androidx.core.view.WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        
        // Mute the SystemBars plugin's automatic padding which causes the grey box bug.
        // Capacitor 8's SystemBars plugin adds a listener that forces paddingBottom 
        // to match the keyboard height, even if disabled in config.
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setTextZoom(100);
            androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(
                (android.view.View) getBridge().getWebView().getParent(),
                (v, insets) -> {
                    // Do nothing and return insets to prevent the grey padding gap.
                    return insets;
                }
            );
        }
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        // Wire hardware/gesture back button to WebView history navigation
        if (getBridge() != null && getBridge().getWebView() != null && getBridge().getWebView().canGoBack()) {
            getBridge().getWebView().goBack();
        } else {
            super.onBackPressed();
        }
    }
}
