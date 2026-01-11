import ActivityKit
import SwiftUI
import WidgetKit

@available(iOS 16.2, *)
struct HoldThatThoughtLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: HoldThatThoughtAttributes.self) { context in
            // Lock Screen / Notification Banner
            LockScreenView(context: context)
                .widgetURL(URL(string: "holdthatthought://")!)
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
                    Text(context.attributes.startTime, style: .timer)
                        .font(.caption)
                        .foregroundColor(.mint)
                        .monospacedDigit()
                }

                DynamicIslandExpandedRegion(.center) {
                    LogoView(size: 24)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    if let claim = context.state.currentClaim {
                        Text(claim)
                            .font(.subheadline)
                            .foregroundColor(.white)
                            .lineLimit(4)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 12)
                            .padding(.top, 4)
                    } else {
                        PulsingMicView()
                            .padding(.top, 8)
                    }
                }
            } compactLeading: {
                Image(systemName: "mic.fill")
                    .foregroundColor(.mint)
            } compactTrailing: {
                if context.state.claimCount > 0 {
                    Text("\(context.state.claimCount)")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(.mint)
                } else {
                    Text(context.attributes.startTime, style: .timer)
                        .font(.caption2)
                        .foregroundColor(.mint)
                        .monospacedDigit()
                }
            } minimal: {
                Image(systemName: "mic.fill")
                    .foregroundColor(.mint)
            }
        }
    }
}

// MARK: - Lock Screen View
@available(iOS 16.2, *)
struct LockScreenView: View {
    let context: ActivityViewContext<HoldThatThoughtAttributes>

    var body: some View {
        VStack(spacing: 0) {
            // Header bar
            HStack {
                // Left: Logo
                LogoView(size: 24)

                Spacer()

                // Center: Timer + count
                HStack(spacing: 10) {
                    if context.state.claimCount > 0 {
                        Text("\(context.state.claimCount)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.darkBg)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(Color.mint)
                            .clipShape(Capsule())
                    }

                    Text(context.attributes.startTime, style: .timer)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.mint)
                        .monospacedDigit()
                }

                Spacer()

                // Right: Tap hint
                Text("Tap for more →")
                    .font(.caption2)
                    .foregroundColor(.textSecondary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)

            // Divider
            Rectangle()
                .fill(Color.mint.opacity(0.3))
                .frame(height: 1)
                .padding(.horizontal, 12)

            // Main content
            if let claim = context.state.currentClaim {
                Text(claim)
                    .font(.body)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .lineLimit(6)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 18)
                    .frame(maxWidth: .infinity)
            } else {
                VStack(spacing: 14) {
                    PulsingMicView()

                    Text("Listening for claims...")
                        .font(.subheadline)
                        .foregroundColor(.textSecondary)
                }
                .padding(.vertical, 20)
                .frame(maxWidth: .infinity)
            }
        }
    }
}

// MARK: - Static Dots (animations don't work in widgets)
struct StaticDotsView: View {
    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3, id: \.self) { i in
                Circle()
                    .fill(Color.mint)
                    .frame(width: 6, height: 6)
                    .opacity(i == 1 ? 1.0 : 0.4)
            }
        }
    }
}

// App Logo drawn in SwiftUI (widgets can't load image assets reliably)
struct LogoView: View {
    var size: CGFloat = 28

    var body: some View {
        ZStack(alignment: .topTrailing) {
            // Main circle
            Circle()
                .fill(Color.mint)
                .frame(width: size, height: size)
                .overlay(
                    // Three vertical bars (sound waves)
                    HStack(spacing: size * 0.1) {
                        RoundedRectangle(cornerRadius: size * 0.04)
                            .fill(Color.white)
                            .frame(width: size * 0.09, height: size * 0.32)
                        RoundedRectangle(cornerRadius: size * 0.04)
                            .fill(Color.white)
                            .frame(width: size * 0.09, height: size * 0.48)
                        RoundedRectangle(cornerRadius: size * 0.04)
                            .fill(Color.white)
                            .frame(width: size * 0.09, height: size * 0.32)
                    }
                )
                .padding(.top, size * 0.2)
                .padding(.trailing, size * 0.2)

            // Arc (thought bubble) - top right
            Circle()
                .trim(from: 0.0, to: 0.22)
                .stroke(Color.mint, style: StrokeStyle(lineWidth: size * 0.14, lineCap: .round))
                .frame(width: size * 0.7, height: size * 0.7)
                .rotationEffect(.degrees(-50))
                .offset(x: size * 0.08, y: size * 0.02)
        }
        .frame(width: size * 1.2, height: size * 1.2)
    }
}

// Pulsing mic indicator
struct PulsingMicView: View {
    var body: some View {
        ZStack {
            // Outer pulse rings
            Circle()
                .stroke(Color.mint.opacity(0.2), lineWidth: 2)
                .frame(width: 60, height: 60)

            Circle()
                .stroke(Color.mint.opacity(0.4), lineWidth: 2)
                .frame(width: 44, height: 44)

            // Inner circle with mic
            Circle()
                .fill(Color.mint.opacity(0.2))
                .frame(width: 32, height: 32)

            Image(systemName: "mic.fill")
                .font(.body)
                .foregroundColor(.mint)
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
