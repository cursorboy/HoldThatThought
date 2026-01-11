# Live Activity & Lock Screen Widget Implementation Plan

## Overview
- Lock screen bottom control (replaces flashlight/camera) to start listening
- Live Activity shows "Listening..." with animated dots until first claim
- Clearing notification stops listening
- Mint green theme matching app
- iOS 16.2+ required (18+ for lock screen controls)

---

## Phase 1: Swift Native Module

### 1.1 LiveActivityAttributes.swift
```swift
struct HoldThatThoughtAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var isListening: Bool
        var currentClaim: String?  // nil = show "Listening..."
        var claimCount: Int
    }
    var sessionId: String
    var startTime: Date
}
```

### 1.2 LiveActivityModule.swift
- `startLiveActivity(sessionId:)` → starts with isListening=true, currentClaim=nil
- `updateLiveActivity(claimText:)` → updates currentClaim + increments count
- `endLiveActivity()` → ends session
- Listen for `.dismissed` event → notify JS to stop listening

---

## Phase 2: Live Activity UI

### 2.1 Dynamic Island - Compact (pill)
```
[🎙 mint] ••• (animated dots when listening, no claim)
[🎙 mint] 3   (claim count when claims exist)
```

### 2.2 Dynamic Island - Expanded
```
┌─────────────────────────────────┐
│ 🎙  Listening...               │  (when no claim yet)
│     ● ● ●  (animated)          │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🎙  "The earth is flat"        │  (when claim exists)
│     Claim 3                     │
└─────────────────────────────────┘
```

### 2.3 Lock Screen Banner
```
┌─────────────────────────────────────┐
│ 🎙 Hold That Thought                │
│                                     │
│ Listening...  ● ● ●                 │  (animated dots)
│ ─────────────────────               │
│ OR                                  │
│ "The earth is actually flat"        │  (latest claim)
│ 3 claims detected                   │
└─────────────────────────────────────┘
```

Colors: Mint green (#00D09C) accent, dark bg

---

## Phase 3: Lock Screen Control Widget (iOS 18+)

### 3.1 Control Widget
- Replaces flashlight/camera slot at bottom of lock screen
- Icon: Mic icon with mint green tint
- Tap → deep link `holdthatthought://toggle-listening`
- Shows filled mic when active, outline when inactive

### 3.2 ControlWidgetToggle Implementation
```swift
struct HoldThatThoughtControl: ControlWidget {
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: "com.holdthatthought.control") {
            ControlWidgetToggle(
                "Listen",
                isOn: isListening,
                action: ToggleListeningIntent()
            ) { isOn in
                Label(isOn ? "Listening" : "Listen",
                      systemImage: isOn ? "mic.fill" : "mic")
            }
            .tint(.mint)
        }
    }
}
```

### 3.3 Fallback for iOS 16.2-17.x
- Use accessoryCircular widget in widget tray
- Same tap-to-start functionality

---

## Phase 4: Deep Link Handling

### 4.1 URL Schemes
- `holdthatthought://start-listening` - start recording
- `holdthatthought://stop-listening` - stop recording
- `holdthatthought://toggle-listening` - toggle state

### 4.2 App Handler (app/_layout.tsx)
```typescript
useEffect(() => {
  const handleUrl = ({ url }) => {
    if (url.includes('start-listening')) startListening()
    if (url.includes('stop-listening')) stopListening()
    if (url.includes('toggle-listening')) toggleListening()
  }
  Linking.addEventListener('url', handleUrl)
  // Check initial URL on cold start
  Linking.getInitialURL().then(url => url && handleUrl({ url }))
}, [])
```

---

## Phase 5: Dismissal = Stop Listening

### 5.1 ActivityKit Observation
```swift
Task {
    for await state in activity.activityStateUpdates {
        if state == .dismissed {
            // User swiped away notification
            sendEventToJS("liveActivityDismissed")
        }
    }
}
```

### 5.2 JS Event Handler
- Listen for `liveActivityDismissed` event
- Call `stopListening()` in useFactChecker

---

## Phase 6: App Group Shared State

### 6.1 Shared UserDefaults
Suite: `group.com.holdthatthought.app`
```
isListening: Bool
currentClaim: String?
claimCount: Int
sessionId: String?
```

### 6.2 Sync from React Native
Update App Group on every state change in useFactChecker

---

## File Structure

```
/ios/holdthatthought/
├── LiveActivityModule.swift      (native bridge)
├── LiveActivityAttributes.swift  (ActivityKit model)
├── AppIntent.swift               (toggle intent for control)
└── holdthatthought-Bridging-Header.h

/ios/HoldThatThoughtWidget/
├── HoldThatThoughtWidgetBundle.swift
├── HoldThatThoughtLiveActivity.swift  (Dynamic Island + Lock Screen)
├── HoldThatThoughtControl.swift       (iOS 18 lock screen control)
├── Assets.xcassets/
│   └── AccentColor (mint green)
└── Info.plist
```

---

## Implementation Order

1. **LiveActivityAttributes.swift** - data model
2. **LiveActivityModule.swift** - native bridge with dismissal detection
3. **HoldThatThoughtLiveActivity.swift** - UI with animated dots
4. **Deep link handling** - in _layout.tsx
5. **HoldThatThoughtControl.swift** - iOS 18 lock screen control
6. **Update withLiveActivity.js** - add widget target to Xcode
7. **App Group sync** - from useFactChecker
8. **Test flow** end-to-end

---

## Animated Dots Effect

### SwiftUI Animation
```swift
struct ListeningDots: View {
    @State private var animating = false

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { i in
                Circle()
                    .fill(Color.mint)
                    .frame(width: 6, height: 6)
                    .opacity(animating ? 1 : 0.3)
                    .animation(
                        .easeInOut(duration: 0.6)
                        .repeatForever()
                        .delay(Double(i) * 0.2),
                        value: animating
                    )
            }
        }
        .onAppear { animating = true }
    }
}
```

---

## Theme Colors

```swift
extension Color {
    static let mintGreen = Color(hex: "#00D09C")
    static let darkBg = Color(hex: "#1A1A2E")
    static let cardBg = Color(hex: "#252542")
}
```

---

## Notes
- iOS 18+ required for lock screen control widget (flashlight/camera replacement)
- iOS 16.2+ for Live Activity
- Graceful degradation: iOS 16.2-17.x users get Live Activity but use app to start
