import Foundation
import HealthKit

struct YearMissionHealthSummary: Codable {
    let date: String
    let steps: Int?
    let activeEnergyKcal: Double?
    let exerciseMinutes: Int?
    let standHours: Int?
    let hrvSdnnMs: Double?
    let restingHeartRateBpm: Double?
    let sleepMinutes: Int?
    let observedAt: String
}

private struct NativeHealthSyncRequest: Codable {
    let ticket: String
    let summaries: [YearMissionHealthSummary]
}

@MainActor
final class HealthKitSyncCoordinator: ObservableObject {
    @Published var isSyncing = false
    @Published var lastMessage: String?

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.autoupdatingCurrent

    func handle(url: URL) -> Bool {
        guard url.scheme == "yearmission", url.host == "health-sync" else { return false }
        guard
            let parts = URLComponents(url: url, resolvingAgainstBaseURL: false),
            let ticket = parts.queryItems?.first(where: { $0.name == "ticket" })?.value,
            let baseString = parts.queryItems?.first(where: { $0.name == "base" })?.value,
            let baseURL = URL(string: baseString)
        else {
            lastMessage = "Year Mission could not read the Health sync request."
            return true
        }

        Task { await sync(ticket: ticket, baseURL: baseURL) }
        return true
    }

    func sync(ticket: String, baseURL: URL) async {
        guard HKHealthStore.isHealthDataAvailable() else {
            lastMessage = "Apple Health is not available on this device."
            return
        }

        isSyncing = true
        defer { isSyncing = false }

        do {
            try await requestAuthorization()
            let summaries = try await loadRecentSummaries(days: 15)
            guard !summaries.isEmpty else {
                lastMessage = "No Apple Health data was available to sync yet."
                return
            }
            try await upload(summaries: summaries, ticket: ticket, baseURL: baseURL)
            lastMessage = "Apple Health synced to Year Mission."
        } catch {
            lastMessage = error.localizedDescription
        }
    }

    private func requestAuthorization() async throws {
        var readTypes = Set<HKObjectType>()
        let identifiers: [HKQuantityTypeIdentifier] = [
            .stepCount,
            .activeEnergyBurned,
            .appleExerciseTime,
            .appleStandTime,
            .heartRateVariabilitySDNN,
            .restingHeartRate,
        ]
        for identifier in identifiers {
            if let type = HKObjectType.quantityType(forIdentifier: identifier) { readTypes.insert(type) }
        }
        if let sleep = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) { readTypes.insert(sleep) }

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            healthStore.requestAuthorization(toShare: [], read: readTypes) { success, error in
                if let error { continuation.resume(throwing: error) }
                else if success { continuation.resume() }
                else { continuation.resume(throwing: NSError(domain: "YearMissionHealth", code: 1, userInfo: [NSLocalizedDescriptionKey: "Apple Health permission was not granted."])) }
            }
        }
    }

    private func loadRecentSummaries(days: Int) async throws -> [YearMissionHealthSummary] {
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        let iso = ISO8601DateFormatter()

        let startOfToday = calendar.startOfDay(for: Date())
        var summaries: [YearMissionHealthSummary] = []

        for offset in 0..<days {
            guard let start = calendar.date(byAdding: .day, value: -offset, to: startOfToday),
                  let end = calendar.date(byAdding: .day, value: 1, to: start) else { continue }

            async let steps = cumulative(.stepCount, unit: .count(), start: start, end: end)
            async let move = cumulative(.activeEnergyBurned, unit: .kilocalorie(), start: start, end: end)
            async let exercise = cumulative(.appleExerciseTime, unit: .minute(), start: start, end: end)
            async let standMinutes = cumulative(.appleStandTime, unit: .minute(), start: start, end: end)
            async let hrv = average(.heartRateVariabilitySDNN, unit: .secondUnit(with: .milli), start: start, end: end)
            async let restingHeartRate = average(.restingHeartRate, unit: HKUnit.count().unitDivided(by: .minute()), start: start, end: end)
            async let sleep = sleepMinutes(start: start, end: end)

            let stand = try await standMinutes
            let summary = YearMissionHealthSummary(
                date: formatter.string(from: start),
                steps: try await steps.map { Int($0.rounded()) },
                activeEnergyKcal: try await move,
                exerciseMinutes: try await exercise.map { Int($0.rounded()) },
                standHours: stand.map { Int(($0 / 60.0).rounded()) },
                hrvSdnnMs: try await hrv,
                restingHeartRateBpm: try await restingHeartRate,
                sleepMinutes: try await sleep,
                observedAt: iso.string(from: Date())
            )

            if [summary.steps.map(Double.init), summary.activeEnergyKcal, summary.exerciseMinutes.map(Double.init), summary.hrvSdnnMs, summary.restingHeartRateBpm, summary.sleepMinutes.map(Double.init)].contains(where: { $0 != nil }) {
                summaries.append(summary)
            }
        }
        return summaries
    }

    private func cumulative(_ identifier: HKQuantityTypeIdentifier, unit: HKUnit, start: Date, end: Date) async throws -> Double? {
        guard let type = HKObjectType.quantityType(forIdentifier: identifier) else { return nil }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, statistics, error in
                if let error { continuation.resume(throwing: error); return }
                continuation.resume(returning: statistics?.sumQuantity()?.doubleValue(for: unit))
            }
            healthStore.execute(query)
        }
    }

    private func average(_ identifier: HKQuantityTypeIdentifier, unit: HKUnit, start: Date, end: Date) async throws -> Double? {
        guard let type = HKObjectType.quantityType(forIdentifier: identifier) else { return nil }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .discreteAverage) { _, statistics, error in
                if let error { continuation.resume(throwing: error); return }
                continuation.resume(returning: statistics?.averageQuantity()?.doubleValue(for: unit))
            }
            healthStore.execute(query)
        }
    }

    private func sleepMinutes(start: Date, end: Date) async throws -> Int? {
        guard let type = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else { return nil }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: [])
        let samples: [HKCategorySample] = try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, objects, error in
                if let error { continuation.resume(throwing: error); return }
                continuation.resume(returning: (objects as? [HKCategorySample]) ?? [])
            }
            healthStore.execute(query)
        }

        let asleepValues: Set<Int> = [
            HKCategoryValueSleepAnalysis.asleep.rawValue,
            HKCategoryValueSleepAnalysis.asleepCore.rawValue,
            HKCategoryValueSleepAnalysis.asleepDeep.rawValue,
            HKCategoryValueSleepAnalysis.asleepREM.rawValue,
            HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue,
        ]
        let seconds = samples.filter { asleepValues.contains($0.value) }.reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) }
        return seconds > 0 ? Int((seconds / 60.0).rounded()) : nil
    }

    private func upload(summaries: [YearMissionHealthSummary], ticket: String, baseURL: URL) async throws {
        let endpoint = baseURL.appending(path: "/api/health/apple/native-sync")
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(NativeHealthSyncRequest(ticket: ticket, summaries: summaries))

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "Apple Health sync failed."
            throw NSError(domain: "YearMissionHealth", code: 2, userInfo: [NSLocalizedDescriptionKey: message])
        }
    }
}
