import SwiftUI
import WidgetKit

@main
@available(iOS 16.1, *)
struct HoldThatThoughtWidgetBundle: WidgetBundle {
    var body: some Widget {
        HoldThatThoughtLiveActivity()
        if #available(iOS 18.0, *) {
            HoldThatThoughtControl()
        }
    }
}
