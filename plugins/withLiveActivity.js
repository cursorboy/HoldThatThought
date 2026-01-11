const { withInfoPlist, withXcodeProject, withEntitlementsPlist } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const WIDGET_NAME = 'HoldThatThoughtWidget';
const APP_GROUP = 'group.com.holdthatthought.app';

function withLiveActivityInfoPlist(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.NSSupportsLiveActivities = true;
    return config;
  });
}

function withAppGroupEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.security.application-groups'] = [APP_GROUP];
    return config;
  });
}

function withLiveActivityWidget(config) {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const iosPath = path.join(projectRoot, 'ios');
    const widgetPath = path.join(iosPath, WIDGET_NAME);

    // Create widget directory if it doesn't exist
    if (!fs.existsSync(widgetPath)) {
      fs.mkdirSync(widgetPath, { recursive: true });
    }

    // Widget source files will be created separately
    // This plugin just sets up the Xcode project structure

    return config;
  });
}

module.exports = function withLiveActivity(config) {
  config = withLiveActivityInfoPlist(config);
  config = withAppGroupEntitlement(config);
  config = withLiveActivityWidget(config);
  return config;
};
