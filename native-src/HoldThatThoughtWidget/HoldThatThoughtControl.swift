import SwiftUI
import WidgetKit
import AppIntents

// MARK: - Intent to start listening
@available(iOS 18.0, *)
struct StartListeningIntent: AppIntent {
    static var title: LocalizedStringResource = "Start Listening"
    static var description = IntentDescription("Start live fact-checking")
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult {
        return .result()
    }
}

// MARK: - Control Widget (iOS 18+)
@available(iOS 18.0, *)
struct HoldThatThoughtControl: ControlWidget {
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: "com.holdthatthought.control") {
            ControlWidgetButton(action: StartListeningIntent()) {
                Label("Listen", systemImage: "mic.fill")
            }
        }
        .displayName("Hold That Thought")
        .description("Start live fact-checking")
    }
}
