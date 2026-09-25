import AuthenticationServices
import Foundation
import UIKit

/// Owns the temporary browser used for Google authentication.
///
/// The important invariant is that ASWebAuthenticationSession is *auth-only*.
/// A matching HTTPS callback completes the session, which dismisses the system
/// browser. The callback URL is then loaded by the app's primary full-screen
/// Year Mission web container with `handoff=native-shell`.
@available(iOS 17.4, *)
@MainActor
final class NativeGoogleAuthCoordinator: NSObject, ASWebAuthenticationPresentationContextProviding {
    static let productionHost = "year-mission.dangaston.workers.dev"
    static let callbackPath = "/native-callback"

    private var session: ASWebAuthenticationSession?
    private weak var presentationWindow: UIWindow?

    /// Starts Google authentication using an already prepared Supabase OAuth URL.
    ///
    /// - Parameters:
    ///   - authURL: HTTPS Supabase/Google authorization URL.
    ///   - presentationWindow: Window that owns the native Year Mission shell.
    ///   - onHandoff: Load the returned URL in the app's main full-screen web
    ///     container. Do not present it in another browser sheet.
    ///   - onFailure: Receives a sanitized error for native UI/diagnostics.
    func start(
        authURL: URL,
        presentationWindow: UIWindow,
        onHandoff: @escaping @MainActor (URL) -> Void,
        onFailure: @escaping @MainActor (String) -> Void
    ) {
        cancel()
        self.presentationWindow = presentationWindow

        let callback = ASWebAuthenticationSession.Callback.https(
            host: Self.productionHost,
            path: Self.callbackPath
        )

        let session = ASWebAuthenticationSession(
            url: authURL,
            callback: callback
        ) { [weak self] callbackURL, error in
            Task { @MainActor in
                self?.session = nil

                if let authError = error as? ASWebAuthenticationSessionError,
                   authError.code == .canceledLogin {
                    onFailure("Sign-in was cancelled.")
                    return
                }

                if let error {
                    let nsError = error as NSError
                    onFailure("Sign-in could not be completed (\(nsError.domain):\(nsError.code)).")
                    return
                }

                guard let callbackURL,
                      callbackURL.scheme == "https",
                      callbackURL.host == Self.productionHost,
                      callbackURL.path == Self.callbackPath else {
                    onFailure("Sign-in returned an unexpected callback.")
                    return
                }

                guard let handoffURL = Self.fullScreenHandoffURL(from: callbackURL) else {
                    onFailure("Sign-in callback could not be handed back to Year Mission.")
                    return
                }

                // A matching callback has already completed/dismissed the system
                // auth browser. The host app must now load handoffURL in its
                // existing full-screen Year Mission web container.
                onHandoff(handoffURL)
            }
        }

        session.presentationContextProvider = self
        session.prefersEphemeralWebBrowserSession = false
        self.session = session

        if !session.start() {
            self.session = nil
            onFailure("Sign-in browser could not be started.")
        }
    }

    func cancel() {
        session?.cancel()
        session = nil
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        presentationWindow ?? ASPresentationAnchor()
    }

    static func fullScreenHandoffURL(from callbackURL: URL) -> URL? {
        guard var components = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false) else {
            return nil
        }

        var items = components.queryItems ?? []
        items.removeAll { $0.name == "handoff" }
        items.append(URLQueryItem(name: "handoff", value: "native-shell"))
        components.queryItems = items

        // URLComponents preserves the OAuth fragment (including Supabase
        // access/refresh tokens) so the web callback can establish the session
        // inside the primary web container, not inside ASWebAuthenticationSession.
        return components.url
    }
}
