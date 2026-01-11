import AppIntents

// This intent MUST be in both the main app target AND the widget extension target
// for openAppWhenRun to work properly
@available(iOS 16.0, *)
struct StartListeningIntent: AppIntent {
    static let title: LocalizedStringResource = "Start Listening"
    static var description = IntentDescription("Start live fact-checking")
    static var openAppWhenRun: Bool = true
    static var isDiscoverable: Bool = true

    func perform() async throws -> some IntentResult {
        // Set flag for app to start listening - this runs in main app context
        UserDefaults.standard.set("start-listening", forKey: "pendingWidgetAction")
        UserDefaults.standard.synchronize()
        return .result()
    }
}
