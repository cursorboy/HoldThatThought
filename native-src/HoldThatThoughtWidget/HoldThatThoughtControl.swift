import SwiftUI
import WidgetKit
import AppIntents

// StartListeningIntent is defined in StartListeningIntent.swift (shared between targets)

// MARK: - Control Widget (iOS 18+)
@available(iOS 18.0, *)
struct HoldThatThoughtControl: ControlWidget {
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: "com.holdthatthought.app.piam.control") {
            ControlWidgetButton(action: StartListeningIntent()) {
                Label("Listen", systemImage: "mic.fill")
            }
        }
        .displayName("Hold That Thought")
        .description("Start live fact-checking")
    }
}
