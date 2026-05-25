import UIKit
import Capacitor

// Custom CAPBridgeViewController that force-enables swipe-back gestures.
// Defined here (rather than a separate file) so it's guaranteed to be
// compiled without needing to register a new file in the .xcodeproj.
class GridPeViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        webView?.allowsBackForwardNavigationGestures = true
    }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        if let window = window {
            // Remove any existing privacy view first
            window.viewWithTag(9999)?.removeFromSuperview()
            
            let privacyView = UIView(frame: window.bounds)
            privacyView.backgroundColor = UIColor(
                red: 0.039, green: 0.039, blue: 0.071, alpha: 1.0
            ) // #0A0A12
            privacyView.tag = 9999
            privacyView.autoresizingMask = [
                .flexibleWidth, .flexibleHeight
            ]
            
            // Grid.Pe wordmark centered
            let label = UILabel()
            label.text = "grid.pe"
            label.textColor = UIColor.white.withAlphaComponent(0.9)
            label.font = UIFont.systemFont(ofSize: 28, weight: .bold)
            label.translatesAutoresizingMaskIntoConstraints = false
            privacyView.addSubview(label)
            NSLayoutConstraint.activate([
                label.centerXAnchor.constraint(
                    equalTo: privacyView.centerXAnchor
                ),
                label.centerYAnchor.constraint(
                    equalTo: privacyView.centerYAnchor
                )
            ])
            
            window.addSubview(privacyView)
            window.bringSubviewToFront(privacyView)
        }
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Remove privacy overlay when returning to foreground
        window?.viewWithTag(9999)?.removeFromSuperview()
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
