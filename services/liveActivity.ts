import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { LiveActivityModule } = NativeModules;

const isIOS = Platform.OS === 'ios';

// Event emitter for Live Activity events
let eventEmitter: NativeEventEmitter | null = null;
let dismissalCallback: (() => void) | null = null;

if (isIOS && LiveActivityModule) {
  eventEmitter = new NativeEventEmitter(LiveActivityModule);
  eventEmitter.addListener('onLiveActivityDismissed', () => {
    console.log('[LiveActivity] Activity dismissed by user');
    if (dismissalCallback) {
      dismissalCallback();
    }
  });
}

export const liveActivity = {
  start: async (sessionId: string): Promise<string | null> => {
    if (!isIOS || !LiveActivityModule) {
      console.log('Live Activities only available on iOS');
      return null;
    }
    try {
      const activityId = await LiveActivityModule.startActivity(sessionId);
      return activityId;
    } catch (error) {
      console.error('Failed to start Live Activity:', error);
      return null;
    }
  },

  update: async (claimText: string): Promise<boolean> => {
    const startTime = Date.now();
    console.log(`[LiveActivity] ⏱️ update called at ${startTime}`);
    if (!isIOS || !LiveActivityModule) {
      return false;
    }
    try {
      await LiveActivityModule.updateActivity(claimText);
      console.log(`[LiveActivity] ⏱️ update completed in ${Date.now() - startTime}ms`);
      return true;
    } catch (error) {
      console.error('Failed to update Live Activity:', error);
      return false;
    }
  },

  end: async (): Promise<boolean> => {
    if (!isIOS || !LiveActivityModule) {
      return true;
    }
    try {
      await LiveActivityModule.endActivity();
      return true;
    } catch (error) {
      console.error('Failed to end Live Activity:', error);
      return false;
    }
  },

  onDismissed: (callback: () => void) => {
    dismissalCallback = callback;
  },

  removeOnDismissed: () => {
    dismissalCallback = null;
  },

  checkPendingWidgetAction: async (): Promise<string | null> => {
    console.log('[LiveActivity] checkPendingWidgetAction called, isIOS:', isIOS, 'hasModule:', !!LiveActivityModule);
    if (!isIOS || !LiveActivityModule) {
      console.log('[LiveActivity] Skipping - not iOS or no module');
      return null;
    }
    try {
      console.log('[LiveActivity] Calling native checkPendingWidgetAction...');
      const action = await LiveActivityModule.checkPendingWidgetAction();
      console.log('[LiveActivity] Native returned:', action);
      return action;
    } catch (error) {
      console.error('[LiveActivity] Failed to check pending widget action:', error);
      return null;
    }
  },
};
