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

`yearmission://brain-dump?ticket=...&base=https%3A%2F%2Fyear-mission.vercel.app`

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
