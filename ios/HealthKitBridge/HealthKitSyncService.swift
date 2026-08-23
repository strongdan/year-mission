import Foundation
import HealthKit

struct HealthKitDailyMetric: Codable {
    let date: String
    var steps: Int?
    var sleepHours: Double?
    var weightLb: Double?
}

struct HealthKitWorkoutPayload: Codable {
    let id: String
    let date: String
    let type: String
    let durationMinutes: Double
    let energyKcal: Double?
    let distanceMiles: Double?
}

struct HealthKitSyncPayload: Codable {
    let source = "healthkit"
    let generatedAt: String
    let daily: [HealthKitDailyMetric]
    let workouts: [HealthKitWorkoutPayload]
}

final class HealthKitSyncService {
    private let store = HKHealthStore()
    private let calendar = Calendar.current

    func requestAuthorization() async throws {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        let readTypes: Set<HKObjectType> = [
            HKQuantityType(.stepCount),
            HKQuantityType(.bodyMass),
            HKCategoryType(.sleepAnalysis),
            HKObjectType.workoutType()
        ]
        try await store.requestAuthorization(toShare: [], read: readTypes)
    }

    func sync(days: Int = 14, endpoint: URL, bearerToken: String) async throws {
        let clampedDays = min(max(days, 1), 31)
        let today = calendar.startOfDay(for: Date())
        var metricsByDate: [String: HealthKitDailyMetric] = [:]

        for offset in 0..<clampedDays {
            guard let day = calendar.date(byAdding: .day, value: -offset, to: today),
                  let next = calendar.date(byAdding: .day, value: 1, to: day) else { continue }
            let key = Self.dateFormatter.string(from: day)
            let steps = try await cumulativeQuantity(.stepCount, unit: .count(), start: day, end: next)
            let sleep = try await sleepHours(start: day, end: next)
            let weight = try await latestQuantity(.bodyMass, unit: .pound(), start: day, end: next)
            metricsByDate[key] = HealthKitDailyMetric(
                date: key,
                steps: steps.map { Int($0.rounded()) },
                sleepHours: sleep,
                weightLb: weight
            )
        }

        guard let start = calendar.date(byAdding: .day, value: -(clampedDays - 1), to: today),
              let end = calendar.date(byAdding: .day, value: 1, to: today) else { return }
        let workouts = try await workoutPayloads(start: start, end: end)
        let payload = HealthKitSyncPayload(
            generatedAt: ISO8601DateFormatter().string(from: Date()),
            daily: metricsByDate.values.sorted { $0.date < $1.date },
            workouts: workouts
        )

        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONEncoder().encode(payload)
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }

    private func cumulativeQuantity(
        _ identifier: HKQuantityTypeIdentifier,
        unit: HKUnit,
        start: Date,
        end: Date
    ) async throws -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: identifier) else { return nil }
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: type,
                quantitySamplePredicate: HKQuery.predicateForSamples(withStart: start, end: end),
                options: .cumulativeSum
            ) { _, statistics, error in
                if let error { continuation.resume(throwing: error); return }
                continuation.resume(returning: statistics?.sumQuantity()?.doubleValue(for: unit))
            }
            store.execute(query)
        }
    }

    private func latestQuantity(
        _ identifier: HKQuantityTypeIdentifier,
        unit: HKUnit,
        start: Date,
        end: Date
    ) async throws -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: identifier) else { return nil }
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: type,
                predicate: HKQuery.predicateForSamples(withStart: start, end: end),
                limit: 1,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
            ) { _, samples, error in
                if let error { continuation.resume(throwing: error); return }
                let sample = samples?.first as? HKQuantitySample
                continuation.resume(returning: sample?.quantity.doubleValue(for: unit))
            }
            store.execute(query)
        }
    }

    private func sleepHours(start: Date, end: Date) async throws -> Double? {
        guard let type = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else { return nil }
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: type,
                predicate: HKQuery.predicateForSamples(withStart: start, end: end),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: nil
            ) { _, samples, error in
                if let error { continuation.resume(throwing: error); return }
                let asleepValues: Set<Int> = [
                    HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue,
                    HKCategoryValueSleepAnalysis.asleepCore.rawValue,
                    HKCategoryValueSleepAnalysis.asleepDeep.rawValue,
                    HKCategoryValueSleepAnalysis.asleepREM.rawValue
                ]
                let seconds = (samples as? [HKCategorySample] ?? [])
                    .filter { asleepValues.contains($0.value) }
                    .reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) }
                continuation.resume(returning: seconds > 0 ? seconds / 3600 : nil)
            }
            store.execute(query)
        }
    }

    private func workoutPayloads(start: Date, end: Date) async throws -> [HealthKitWorkoutPayload] {
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: HKObjectType.workoutType(),
                predicate: HKQuery.predicateForSamples(withStart: start, end: end),
                limit: 200,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, samples, error in
                if let error { continuation.resume(throwing: error); return }
                let payloads = (samples as? [HKWorkout] ?? []).map { workout in
                    HealthKitWorkoutPayload(
                        id: workout.uuid.uuidString,
                        date: Self.dateFormatter.string(from: workout.startDate),
                        type: Self.workoutType(workout.workoutActivityType),
                        durationMinutes: workout.duration / 60,
                        energyKcal: workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()),
                        distanceMiles: workout.totalDistance?.doubleValue(for: .mile())
                    )
                }
                continuation.resume(returning: payloads)
            }
            store.execute(query)
        }
    }

    private static func workoutType(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .traditionalStrengthTraining, .functionalStrengthTraining: return "lifting"
        case .walking, .hiking: return "walking"
        case .running: return "running"
        case .cycling: return "cycling"
        case .swimming: return "swimming"
        case .flexibility, .mindAndBody, .yoga: return "mobility"
        default: return "other"
        }
    }

    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
}
