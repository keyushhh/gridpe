import UIKit
import Capacitor

class GridPeViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        super.viewDidLoad()

        // Enable iOS edge-swipe back/forward navigation gestures on the WKWebView.
        // This is set here in native code because capacitor.config.ts flags
        // are not applied reliably on sideloaded / unsigned builds.
        webView?.allowsBackForwardNavigationGestures = true
    }
}
