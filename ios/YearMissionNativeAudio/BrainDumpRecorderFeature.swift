import SwiftUI
import AVFoundation

struct NativeBrainDumpRequest: Identifiable, Equatable {
    let id = UUID()
    let ticket: String
    let baseURL: URL
}

@MainActor
final class BrainDumpCaptureCoordinator: ObservableObject {
    @Published var request: NativeBrainDumpRequest?

    @discardableResult
    func handle(url: URL) -> Bool {
        guard url.scheme == "yearmission", url.host == "brain-dump" else { return false }
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return false }
        let items = Dictionary(uniqueKeysWithValues: (components.queryItems ?? []).compactMap { item in
            item.value.map { (item.name, $0) }
        })
        guard let ticket = items["ticket"], !ticket.isEmpty,
              let base = items["base"], let baseURL = URL(string: base) else { return false }
        request = NativeBrainDumpRequest(ticket: ticket, baseURL: baseURL)
        return true
    }
}

@MainActor
final class BrainDumpRecorderModel: NSObject, ObservableObject, AVAudioRecorderDelegate {
    @Published var transcript = ""
    @Published var isRecording = false
    @Published var isBusy = false
    @Published var status = "Ready to record"
    @Published var error: String?
    @Published var saved = false

    private let request: NativeBrainDumpRequest
    private let captureId = UUID()
    private var recorder: AVAudioRecorder?
    private var recordingURL: URL?

    init(request: NativeBrainDumpRequest) {
        self.request = request
    }

    func toggleRecording() {
        if isRecording {
            stopAndTranscribe()
        } else {
            Task { await startRecording() }
        }
    }

    private func requestMicrophonePermission() async -> Bool {
        await withCheckedContinuation { continuation in
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
    }

    private func startRecording() async {
        error = nil
        saved = false
        guard await requestMicrophonePermission() else {
            error = "Microphone permission is off. Enable it in Settings for Year Mission."
            return
        }

        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .spokenAudio, options: [.defaultToSpeaker, .allowBluetooth])
            try session.setActive(true, options: .notifyOthersOnDeactivation)

            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("brain-dump-\(UUID().uuidString).m4a")
            let settings: [String: Any] = [
                AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
                AVSampleRateKey: 44_100,
                AVNumberOfChannelsKey: 1,
                AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
            ]
            let recorder = try AVAudioRecorder(url: url, settings: settings)
            recorder.delegate = self
            recorder.prepareToRecord()
            guard recorder.record() else {
                throw NSError(domain: "YearMissionAudio", code: 1, userInfo: [NSLocalizedDescriptionKey: "The recorder could not start."])
            }
            self.recorder = recorder
            self.recordingURL = url
            isRecording = true
            status = "Recording… tap Stop & transcribe when finished"
        } catch {
            self.error = error.localizedDescription
            status = "Ready to record"
        }
    }

    private func stopAndTranscribe() {
        guard let recorder else { return }
        recorder.stop()
        isRecording = false
        status = "Transcribing…"
        Task { await transcribeRecording() }
    }

    private func transcribeRecording() async {
        guard let recordingURL else {
            error = "No recording was captured."
            status = "Ready to record"
            return
        }
        isBusy = true
        defer { isBusy = false }

        do {
            var request = URLRequest(url: self.request.baseURL.appending(path: "/api/ideas/native-transcribe"))
            request.httpMethod = "POST"
            request.setValue("Bearer \(self.request.ticket)", forHTTPHeaderField: "Authorization")
            let boundary = "Boundary-\(UUID().uuidString)"
            request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
            request.httpBody = try multipartBody(fileURL: recordingURL, boundary: boundary)

            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
            let payload = try parseJSON(data)
            guard http.statusCode == 200, payload["ok"] as? Bool == true,
                  let responseData = payload["data"] as? [String: Any],
                  let text = responseData["text"] as? String, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                throw NSError(domain: "YearMissionAudio", code: http.statusCode, userInfo: [NSLocalizedDescriptionKey: payload["error"] as? String ?? "Could not transcribe the recording."])
            }
            transcript = text.trimmingCharacters(in: .whitespacesAndNewlines)
            status = "Transcript ready — edit anything before saving"
        } catch {
            self.error = error.localizedDescription
            status = "Ready to record"
        }
    }

    func save() {
        Task { await saveTranscript() }
    }

    private func saveTranscript() async {
        let cleaned = transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleaned.isEmpty else { return }
        isBusy = true
        error = nil
        status = "Saving…"
        defer { isBusy = false }

        do {
            var request = URLRequest(url: self.request.baseURL.appending(path: "/api/ideas/native-save"))
            request.httpMethod = "POST"
            request.setValue("Bearer \(self.request.ticket)", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: [
                "captureId": captureId.uuidString.lowercased(),
                "originalText": cleaned,
            ])

            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
            let payload = try parseJSON(data)
            guard (200..<300).contains(http.statusCode), payload["ok"] as? Bool == true else {
                throw NSError(domain: "YearMissionAudio", code: http.statusCode, userInfo: [NSLocalizedDescriptionKey: payload["error"] as? String ?? "Could not save the thought."])
            }
            saved = true
            status = "Saved to Year Mission"
        } catch {
            self.error = error.localizedDescription
            status = "Transcript ready"
        }
    }

    func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
        isRecording = false
        self.error = error?.localizedDescription ?? "Recording failed."
        status = "Ready to record"
    }

    private func multipartBody(fileURL: URL, boundary: String) throws -> Data {
        var body = Data()
        func append(_ string: String) { body.append(Data(string.utf8)) }
        append("--\(boundary)\r\n")
        append("Content-Disposition: form-data; name=\"audio\"; filename=\"brain-dump.m4a\"\r\n")
        append("Content-Type: audio/mp4\r\n\r\n")
        body.append(try Data(contentsOf: fileURL))
        append("\r\n--\(boundary)--\r\n")
        return body
    }

    private func parseJSON(_ data: Data) throws -> [String: Any] {
        guard let payload = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw URLError(.cannotParseResponse)
        }
        return payload
    }
}

struct BrainDumpRecorderView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var model: BrainDumpRecorderModel

    init(request: NativeBrainDumpRequest) {
        _model = StateObject(wrappedValue: BrainDumpRecorderModel(request: request))
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Narration") {
                    Text(model.status)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    Button(model.isRecording ? "Stop & transcribe" : "Start recording") {
                        model.toggleRecording()
                    }
                    .disabled(model.isBusy)
                }

                if !model.transcript.isEmpty {
                    Section("Original thought") {
                        TextEditor(text: $model.transcript)
                            .frame(minHeight: 180)
                        Button(model.saved ? "Saved" : "Save thought") {
                            model.save()
                        }
                        .disabled(model.isBusy || model.saved)
                    }
                }

                if let error = model.error {
                    Section {
                        Text(error).foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle("Brain Dump")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
