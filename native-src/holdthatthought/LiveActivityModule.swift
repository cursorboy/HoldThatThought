import Foundation
import React
import ActivityKit

@objc(LiveActivityModule)
class LiveActivityModule: RCTEventEmitter {

    private var currentActivity: Any?
    private var observationTask: Task<Void, Never>?

    override init() {
        super.init()
    }

    @objc override static func requiresMainQueueSetup() -> Bool {
        return false
    }

    override func supportedEvents() -> [String]! {
        return ["onLiveActivityDismissed"]
    }

    @objc func startActivity(_ sessionId: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        guard #available(iOS 16.1, *) else {
            rejecter("UNSUPPORTED", "Live Activities require iOS 16.1+", nil)
            return
        }

        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            rejecter("LIVE_ACTIVITY_DISABLED", "Live Activities are disabled", nil)
            return
        }

        // End existing activity first
        if let existing = currentActivity as? Activity<HoldThatThoughtAttributes> {
            Task {
                await existing.end(nil, dismissalPolicy: .immediate)
            }
        }

        let attributes = HoldThatThoughtAttributes(
            sessionId: sessionId,
            startTime: Date()
        )

        let initialState = HoldThatThoughtAttributes.ContentState(
            isListening: true,
            currentClaim: nil,
            claimCount: 0
        )

        do {
            let activityContent = ActivityContent(
                state: initialState,
                staleDate: nil
            )

            let activity = try Activity.request(
                attributes: attributes,
                content: activityContent,
                pushType: nil
            )

            currentActivity = activity

            // Observe activity state for dismissal
            observationTask?.cancel()
            observationTask = Task {
                for await state in activity.activityStateUpdates {
                    if state == .dismissed || state == .ended {
                        self.sendEvent(withName: "onLiveActivityDismissed", body: nil)
                        break
                    }
                }
            }

            resolver(activity.id)
        } catch {
            rejecter("START_FAILED", "Failed to start Live Activity: \(error.localizedDescription)", error)
        }
    }

    @objc func updateActivity(_ claimText: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        guard #available(iOS 16.1, *) else {
            rejecter("UNSUPPORTED", "Live Activities require iOS 16.1+", nil)
            return
        }

        guard let activity = currentActivity as? Activity<HoldThatThoughtAttributes> else {
            rejecter("NO_ACTIVITY", "No active Live Activity", nil)
            return
        }

        let currentCount = activity.content.state.claimCount
        let newState = HoldThatThoughtAttributes.ContentState(
            isListening: true,
            currentClaim: claimText,
            claimCount: currentCount + 1
        )

        Task {
            await activity.update(
                ActivityContent(state: newState, staleDate: nil)
            )
            resolver(true)
        }
    }

    @objc func endActivity(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        observationTask?.cancel()
        observationTask = nil

        guard #available(iOS 16.1, *) else {
            resolver(true)
            return
        }

        guard let activity = currentActivity as? Activity<HoldThatThoughtAttributes> else {
            resolver(true)
            return
        }

        Task {
            await activity.end(nil, dismissalPolicy: .immediate)
            currentActivity = nil
            resolver(true)
        }
    }
}
