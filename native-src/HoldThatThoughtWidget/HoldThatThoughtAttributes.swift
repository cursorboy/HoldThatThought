import ActivityKit
import Foundation

@available(iOS 16.2, *)
struct HoldThatThoughtAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var isListening: Bool
        var currentClaim: String?
        var claimCount: Int
    }

    var sessionId: String
    var startTime: Date
}
