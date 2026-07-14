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

    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let sceneConfig = UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
        sceneConfig.delegateClass = SceneDelegate.self
        return sceneConfig
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

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let _ = (scene as? UIWindowScene) else { return }
    }

    func sceneWillResignActive(_ scene: UIScene) {
        if let windowScene = scene as? UIWindowScene, let window = windowScene.windows.first {
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

    func sceneDidBecomeActive(_ scene: UIScene) {
        if let windowScene = scene as? UIWindowScene, let window = windowScene.windows.first {
            window.viewWithTag(9999)?.removeFromSuperview()
        }
    }
}
