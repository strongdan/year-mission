# Year Mission native Brain Dump recorder

This module is the native fallback for iOS Home Screen/PWA microphone failures. It records with `AVAudioRecorder`, sends the audio to Year Mission for transcription, leaves the transcript editable, then saves the exact transcript as the original idea.

## Add to the existing Year Mission iPhone target

1. Add `BrainDumpRecorderFeature.swift` to the existing Year Mission native target.
2. In the target's Info settings add:
   - `Privacy - Microphone Usage Description` (`NSMicrophoneUsageDescription`): `Year Mission records your narration so it can turn thoughts into editable text.`
   - URL Type / URL Scheme: `yearmission`
3. Keep the existing HealthKit capabilities unchanged. This feature needs microphone permission only; it does not require a new entitlement.
4. Add a coordinator to the app root and route incoming `yearmission://brain-dump?...` URLs into it.

Example SwiftUI wiring:

```swift
@main
struct YearMissionApp: App {
    @StateObject private var brainDump = BrainDumpCaptureCoordinator()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(brainDump)
                .onOpenURL { url in
                    _ = brainDump.handle(url: url)
                }
                .sheet(item: $brainDump.request) { request in
                    BrainDumpRecorderView(request: request)
                }
        }
    }
}
```

If the current app root already owns a HealthKit coordinator/model, keep it and add this coordinator alongside it rather than replacing anything.

## Server flow

The authenticated PWA requests a short-lived signed ticket from `/api/ideas/native-ticket` and opens:

`yearmission://brain-dump?ticket=...&base=https%3A%2F%2Fyear-mission.dangaston.workers.dev`

The native app then:

1. records an AAC `.m4a` locally;
2. POSTs it to `/api/ideas/native-transcribe` with the short-lived ticket;
3. displays the transcript for editing;
4. POSTs the final text to `/api/ideas/native-save` with the same ticket.

The server uses a client-generated UUID as the idea id, so retrying Save is idempotent instead of creating duplicate ideas.

## Security

No long-lived API or sync secret is bundled into the iOS app for this feature. The native ticket is HMAC-signed by the server, scoped to the authenticated Year Mission user, and expires after ten minutes. The ticket is only handed to the installed app through the custom URL scheme.

Native transcription intentionally uses deployment-level `GEMINI_API_KEY` or `OPENAI_API_KEY`; browser cookie-stored API keys are not copied into the native app.

## Physical-device acceptance test

- Install a build containing this module on the iPhone.
- Open the installed Year Mission PWA → Brain Dump → Narrate.
- If WebKit microphone capture is unavailable, confirm diagnostics identify the missing API and show **Native recorder**.
- Tap **Native recorder** and confirm the native app opens directly to Brain Dump.
- Allow microphone access.
- Record 10–20 seconds, stop, and confirm an editable transcript appears.
- Edit one word and tap **Save thought**.
- Return to the PWA and confirm the new idea exists and preserves the edited transcript.
- Retry Save once and confirm it does not create a duplicate idea.


## Native Google authentication: full-screen handoff

Add `NativeGoogleAuthCoordinator.swift` to the same native target. The system authentication browser is temporary; it must never become the normal Year Mission UI.

Use the coordinator with the existing Supabase Google OAuth authorization URL and the window that owns the app:

```swift
@StateObject private var authModel = NativeAuthModel()

// When the user taps Google:
authModel.google.start(
    authURL: authorizationURL,
    presentationWindow: window,
    onHandoff: { callbackURL in
        // Load this URL in the *existing primary full-screen web view*.
        // Do not present SFSafariViewController or another auth sheet.
        webView.load(URLRequest(url: callbackURL))
    },
    onFailure: { message in
        authModel.message = message
    }
)
```

The coordinator uses the modern HTTPS callback matcher:

```swift
.https(
    host: "year-mission.dangaston.workers.dev",
    path: "/native-callback"
)
```

A matching callback completes `ASWebAuthenticationSession`, so the system browser dismisses automatically. The coordinator then adds `handoff=native-shell` to the same callback URL and hands it to the primary web view. The web callback establishes the Supabase session in that full-screen web context and navigates to Today.

Required native invariants:

- associated domain includes the production Year Mission domain required by the HTTPS callback;
- the auth browser is never reused as the app surface;
- the main web view uses a persistent website data store so the Supabase session survives navigation and relaunch;
- cancellation returns to the native login state without opening another browser;
- no OAuth code, access token, refresh token, or cookie is written to logs.

Physical-device acceptance:

1. Launch Year Mission full-screen.
2. Tap Google sign-in.
3. Complete Google authentication in the temporary system browser.
4. Verify the browser dismisses automatically.
5. Verify authenticated Today fills the normal app window with no browser Close/Done chrome.
6. Force-quit and reopen; verify the authenticated session is still present.
