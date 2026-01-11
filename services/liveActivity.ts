import { NativeModules, Platform } from 'react-native';

const { LiveActivityModule } = NativeModules;

const isIOS = Platform.OS === 'ios';

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
    if (!isIOS || !LiveActivityModule) {
      return false;
    }
    try {
      await LiveActivityModule.updateActivity(claimText);
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
};
