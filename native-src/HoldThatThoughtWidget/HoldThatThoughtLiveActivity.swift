import ActivityKit
import SwiftUI
import WidgetKit

@available(iOS 16.1, *)
struct HoldThatThoughtLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: HoldThatThoughtAttributes.self) { context in
            // Lock Screen / Notification Banner - MAXIMIZED
            LockScreenView(context: context)
                .widgetURL(URL(string: "holdthatthought://open")!)
                .activityBackgroundTint(Color.darkBg)
                .activitySystemActionForegroundColor(Color.mint)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded Dynamic Island
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 8) {
                        Image(systemName: "mic.fill")
                            .font(.title2)
                            .foregroundColor(.mint)

                        if context.state.claimCount > 0 {
                            Text("\(context.state.claimCount)")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.darkBg)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.mint)
                                .clipShape(Capsule())
                        }
                    }
                }

                DynamicIslandExpandedRegion(.trailing) {
                    Text(formatDuration(from: context.attributes.startTime))
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                        .monospacedDigit()
                }

                DynamicIslandExpandedRegion(.center) {
                    Text("HoldThatThought")
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 12) {
                        if let claim = context.state.currentClaim {
                            Text(claim)
                                .font(.subheadline)
                                .foregroundColor(.white)
                                .lineLimit(3)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 16)
                        } else {
                            ListeningDotsView()
                        }
                    }
                    .padding(.top, 8)
                }
            } compactLeading: {
                Image(systemName: "mic.fill")
                    .foregroundColor(.mint)
            } compactTrailing: {
                if context.state.currentClaim != nil {
                    Text("\(context.state.claimCount)")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(.mint)
                } else {
                    CompactDotsView()
                }
            } minimal: {
                Image(systemName: "mic.fill")
                    .foregroundColor(.mint)
            }
        }
    }

    private func formatDuration(from startTime: Date) -> String {
        let elapsed = Int(Date().timeIntervalSince(startTime))
        let minutes = elapsed / 60
        let seconds = elapsed % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}

// MARK: - Lock Screen View (MAXIMIZED)
@available(iOS 16.1, *)
struct LockScreenView: View {
    let context: ActivityViewContext<HoldThatThoughtAttributes>

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                HStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .fill(Color.mint.opacity(0.2))
                            .frame(width: 44, height: 44)

                        Image(systemName: "mic.fill")
                            .font(.title3)
                            .foregroundColor(.mint)
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text("HoldThatThought")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.white)

                        Text("Live Fact-Checking")
                            .font(.caption)
                            .foregroundColor(.textSecondary)
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text(formatDuration(from: context.attributes.startTime))
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                        .monospacedDigit()

                    if context.state.claimCount > 0 {
                        Text("\(context.state.claimCount) claim\(context.state.claimCount == 1 ? "" : "s")")
                            .font(.caption)
                            .foregroundColor(.mint)
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 12)

            // Divider
            Rectangle()
                .fill(Color.border)
                .frame(height: 1)
                .padding(.horizontal, 16)

            // Main Content Area - MAXIMIZED
            VStack(spacing: 16) {
                if let claim = context.state.currentClaim {
                    // Show claim
                    VStack(spacing: 12) {
                        Text("Latest Claim Detected")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.textSecondary)
                            .textCase(.uppercase)
                            .tracking(0.5)

                        Text("\"\(claim)\"")
                            .font(.body)
                            .fontWeight(.medium)
                            .foregroundColor(.white)
                            .multilineTextAlignment(.center)
                            .lineLimit(4)
                            .padding(.horizontal, 8)
                    }
                } else {
                    // Listening state
                    VStack(spacing: 16) {
                        Text("Listening")
                            .font(.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)

                        LockScreenDotsView()

                        Text("Speak naturally, claims will appear here")
                            .font(.caption)
                            .foregroundColor(.textSecondary)
                            .multilineTextAlignment(.center)
                    }
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 20)
            .padding(.vertical, 20)

            // Bottom bar with stop hint
            HStack {
                Image(systemName: "hand.tap.fill")
                    .font(.caption)
                    .foregroundColor(.textSecondary)

                Text("Swipe to dismiss and stop listening")
                    .font(.caption)
                    .foregroundColor(.textSecondary)
            }
            .padding(.bottom, 12)
        }
        .frame(maxWidth: .infinity)
    }

    private func formatDuration(from startTime: Date) -> String {
        let elapsed = Int(Date().timeIntervalSince(startTime))
        let minutes = elapsed / 60
        let seconds = elapsed % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}

// MARK: - Animated Dots Views
struct ListeningDotsView: View {
    @State private var dotIndex = 0
    let timer = Timer.publish(every: 0.4, on: .main, in: .common).autoconnect()

    var body: some View {
        HStack(spacing: 6) {
            Text("Listening")
                .font(.subheadline)
                .foregroundColor(.white)

            HStack(spacing: 4) {
                ForEach(0..<3) { i in
                    Circle()
                        .fill(Color.mint)
                        .frame(width: 6, height: 6)
                        .opacity(dotIndex == i ? 1.0 : 0.3)
                }
            }
        }
        .onReceive(timer) { _ in
            dotIndex = (dotIndex + 1) % 3
        }
    }
}

struct LockScreenDotsView: View {
    @State private var dotIndex = 0
    let timer = Timer.publish(every: 0.5, on: .main, in: .common).autoconnect()

    var body: some View {
        HStack(spacing: 8) {
            ForEach(0..<3) { i in
                Circle()
                    .fill(Color.mint)
                    .frame(width: 10, height: 10)
                    .opacity(dotIndex == i ? 1.0 : 0.3)
                    .scaleEffect(dotIndex == i ? 1.2 : 1.0)
                    .animation(.easeInOut(duration: 0.3), value: dotIndex)
            }
        }
        .onReceive(timer) { _ in
            dotIndex = (dotIndex + 1) % 3
        }
    }
}

struct CompactDotsView: View {
    @State private var dotIndex = 0
    let timer = Timer.publish(every: 0.4, on: .main, in: .common).autoconnect()

    var body: some View {
        HStack(spacing: 2) {
            ForEach(0..<3) { i in
                Circle()
                    .fill(Color.mint)
                    .frame(width: 4, height: 4)
                    .opacity(dotIndex == i ? 1.0 : 0.3)
            }
        }
        .onReceive(timer) { _ in
            dotIndex = (dotIndex + 1) % 3
        }
    }
}

// MARK: - Theme Colors
extension Color {
    static let mint = Color(red: 0, green: 0.851, blue: 0.643) // #00D9A4
    static let darkBg = Color(red: 0.039, green: 0.047, blue: 0.063) // #0A0C10
    static let surface = Color(red: 0.071, green: 0.082, blue: 0.110) // #12151C
    static let border = Color(red: 0.165, green: 0.192, blue: 0.251) // #2A3140
    static let textSecondary = Color(red: 0.722, green: 0.753, blue: 0.800) // #B8C0CC
}

// Preview removed - requires iOS 17+ macros
