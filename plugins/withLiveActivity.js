const { withInfoPlist, withXcodeProject, withEntitlementsPlist } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const WIDGET_NAME = 'HoldThatThoughtWidget';
const WIDGET_BUNDLE_ID = 'com.holdthatthought.app.widget';
const APP_GROUP = 'group.com.holdthatthought.app';
const DEPLOYMENT_TARGET = '16.2';

// Copy native source files to ios directory
function copyNativeSourceFiles(projectRoot) {
  const nativeSrcPath = path.join(projectRoot, 'native-src');
  const iosPath = path.join(projectRoot, 'ios');

  // Copy main app files
  const mainAppSrc = path.join(nativeSrcPath, 'holdthatthought');
  const mainAppDst = path.join(iosPath, 'holdthatthought');

  if (fs.existsSync(mainAppSrc)) {
    const files = fs.readdirSync(mainAppSrc);
    for (const file of files) {
      const srcFile = path.join(mainAppSrc, file);
      const dstFile = path.join(mainAppDst, file);
      fs.copyFileSync(srcFile, dstFile);
      console.log(`[withLiveActivity] Copied ${file} to main app`);
    }
  }

  // Copy widget files
  const widgetSrc = path.join(nativeSrcPath, WIDGET_NAME);
  const widgetDst = path.join(iosPath, WIDGET_NAME);

  if (fs.existsSync(widgetSrc)) {
    if (!fs.existsSync(widgetDst)) {
      fs.mkdirSync(widgetDst, { recursive: true });
    }
    const files = fs.readdirSync(widgetSrc);
    for (const file of files) {
      const srcFile = path.join(widgetSrc, file);
      const dstFile = path.join(widgetDst, file);
      fs.copyFileSync(srcFile, dstFile);
      console.log(`[withLiveActivity] Copied ${file} to widget`);
    }
  }
}

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
    const projectName = config.modRequest.projectName;
    const iosPath = path.join(projectRoot, 'ios');
    const widgetPath = path.join(iosPath, WIDGET_NAME);

    // Copy native source files first
    copyNativeSourceFiles(projectRoot);

    // Get main target
    const mainTarget = xcodeProject.getFirstTarget();
    const mainTargetUuid = mainTarget.uuid;

    // Check if widget target already exists
    const existingTarget = xcodeProject.pbxTargetByName(WIDGET_NAME);
    if (existingTarget) {
      console.log(`[withLiveActivity] Widget target ${WIDGET_NAME} already exists`);
      return config;
    }

    // Create widget extension target
    const widgetTarget = xcodeProject.addTarget(
      WIDGET_NAME,
      'app_extension',
      WIDGET_NAME,
      WIDGET_BUNDLE_ID
    );

    const widgetTargetUuid = widgetTarget.uuid;

    // Add widget to main target dependencies
    xcodeProject.addTargetDependency(mainTargetUuid, [widgetTargetUuid]);

    // Create PBXGroup for widget files
    const widgetGroupKey = xcodeProject.pbxCreateGroup(WIDGET_NAME, WIDGET_NAME);

    // Get main group and add widget group
    const mainGroupKey = xcodeProject.getFirstProject().firstProject.mainGroup;
    xcodeProject.addToPbxGroup(widgetGroupKey, mainGroupKey);

    // Widget source files
    const widgetSwiftFiles = [
      'HoldThatThoughtWidgetBundle.swift',
      'HoldThatThoughtAttributes.swift',
      'HoldThatThoughtLiveActivity.swift',
      'HoldThatThoughtControl.swift',
    ];

    // Create Sources build phase for widget target
    const widgetSourcesBuildPhaseUuid = xcodeProject.generateUuid();
    xcodeProject.hash.project.objects['PBXSourcesBuildPhase'] =
      xcodeProject.hash.project.objects['PBXSourcesBuildPhase'] || {};
    xcodeProject.hash.project.objects['PBXSourcesBuildPhase'][widgetSourcesBuildPhaseUuid] = {
      isa: 'PBXSourcesBuildPhase',
      buildActionMask: 2147483647,
      files: [],
      runOnlyForDeploymentPostprocessing: 0,
    };
    xcodeProject.hash.project.objects['PBXSourcesBuildPhase'][`${widgetSourcesBuildPhaseUuid}_comment`] = 'Sources';

    // Add Sources build phase to widget target
    const nativeTargets = xcodeProject.hash.project.objects['PBXNativeTarget'];
    if (nativeTargets[widgetTargetUuid]) {
      nativeTargets[widgetTargetUuid].buildPhases = nativeTargets[widgetTargetUuid].buildPhases || [];
      nativeTargets[widgetTargetUuid].buildPhases.unshift({
        value: widgetSourcesBuildPhaseUuid,
        comment: 'Sources',
      });
    }
    console.log('[withLiveActivity] Created Sources build phase for widget');

    // Add Swift files to widget group and build phase
    for (const fileName of widgetSwiftFiles) {
      const filePath = path.join(widgetPath, fileName);
      if (fs.existsSync(filePath)) {
        // Create file reference
        const fileRefUuid = xcodeProject.generateUuid();
        xcodeProject.hash.project.objects['PBXFileReference'] =
          xcodeProject.hash.project.objects['PBXFileReference'] || {};
        xcodeProject.hash.project.objects['PBXFileReference'][fileRefUuid] = {
          isa: 'PBXFileReference',
          explicitFileType: undefined,
          fileEncoding: 4,
          includeInIndex: 0,
          lastKnownFileType: 'sourcecode.swift',
          path: fileName,
          sourceTree: '"<group>"',
        };
        xcodeProject.hash.project.objects['PBXFileReference'][`${fileRefUuid}_comment`] = fileName;

        // Add to widget group
        const groups = xcodeProject.hash.project.objects['PBXGroup'];
        if (groups && groups[widgetGroupKey] && groups[widgetGroupKey].children) {
          groups[widgetGroupKey].children.push({
            value: fileRefUuid,
            comment: fileName,
          });
        }

        // Create build file
        const buildFileUuid = xcodeProject.generateUuid();
        xcodeProject.hash.project.objects['PBXBuildFile'] =
          xcodeProject.hash.project.objects['PBXBuildFile'] || {};
        xcodeProject.hash.project.objects['PBXBuildFile'][buildFileUuid] = {
          isa: 'PBXBuildFile',
          fileRef: fileRefUuid,
          fileRef_comment: fileName,
        };
        xcodeProject.hash.project.objects['PBXBuildFile'][`${buildFileUuid}_comment`] =
          `${fileName} in Sources`;

        // Add build file to widget's Sources build phase
        const sourcePhases = xcodeProject.hash.project.objects['PBXSourcesBuildPhase'];
        if (sourcePhases && sourcePhases[widgetSourcesBuildPhaseUuid]) {
          sourcePhases[widgetSourcesBuildPhaseUuid].files =
            sourcePhases[widgetSourcesBuildPhaseUuid].files || [];
          sourcePhases[widgetSourcesBuildPhaseUuid].files.push({
            value: buildFileUuid,
            comment: `${fileName} in Sources`,
          });
        }

        console.log(`[withLiveActivity] Added ${fileName} to widget target`);
      }
    }

    // Add Info.plist to group (not to build phase)
    const plistFileName = 'HoldThatThoughtWidget-Info.plist';
    const plistPath = path.join(widgetPath, plistFileName);
    if (fs.existsSync(plistPath)) {
      const plistRefUuid = xcodeProject.generateUuid();
      xcodeProject.hash.project.objects['PBXFileReference'][plistRefUuid] = {
        isa: 'PBXFileReference',
        explicitFileType: undefined,
        fileEncoding: 4,
        includeInIndex: 0,
        lastKnownFileType: 'text.plist.xml',
        path: plistFileName,
        sourceTree: '"<group>"',
      };
      xcodeProject.hash.project.objects['PBXFileReference'][`${plistRefUuid}_comment`] = plistFileName;

      const groups = xcodeProject.hash.project.objects['PBXGroup'];
      if (groups && groups[widgetGroupKey] && groups[widgetGroupKey].children) {
        groups[widgetGroupKey].children.push({
          value: plistRefUuid,
          comment: plistFileName,
        });
      }
    }

    // Configure build settings for widget target
    // Find widget target's build configuration list
    const widgetTargetObj = nativeTargets[widgetTargetUuid];
    if (widgetTargetObj && widgetTargetObj.buildConfigurationList) {
      const configListUuid = widgetTargetObj.buildConfigurationList.value || widgetTargetObj.buildConfigurationList;
      const configLists = xcodeProject.hash.project.objects['XCConfigurationList'];
      const widgetConfigList = configLists ? configLists[configListUuid] : null;

      if (widgetConfigList && widgetConfigList.buildConfigurations) {
        const buildConfigSection = xcodeProject.hash.project.objects['XCBuildConfiguration'];

        for (const configRef of widgetConfigList.buildConfigurations) {
          const configUuid = configRef.value || configRef;
          if (buildConfigSection && buildConfigSection[configUuid]) {
            const buildSettings = buildConfigSection[configUuid].buildSettings || {};
            buildConfigSection[configUuid].buildSettings = buildSettings;

            // Swift settings
            buildSettings.SWIFT_VERSION = '5.0';
            buildSettings.IPHONEOS_DEPLOYMENT_TARGET = DEPLOYMENT_TARGET;
            buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
            buildSettings.CODE_SIGN_ENTITLEMENTS = `${WIDGET_NAME}/${WIDGET_NAME}.entitlements`;
            buildSettings.INFOPLIST_FILE = `${WIDGET_NAME}/${WIDGET_NAME}-Info.plist`;
            buildSettings.LD_RUNPATH_SEARCH_PATHS = '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"';
            buildSettings.PRODUCT_BUNDLE_IDENTIFIER = WIDGET_BUNDLE_ID;
            buildSettings.SKIP_INSTALL = 'YES';
            buildSettings.GENERATE_INFOPLIST_FILE = 'NO';
            buildSettings.ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES = 'YES';
            buildSettings.MARKETING_VERSION = '1.0.0';
            buildSettings.CURRENT_PROJECT_VERSION = '1';

            console.log(`[withLiveActivity] Configured build settings for ${buildConfigSection[configUuid].name}`);
          }
        }
      }
    }

    // Add frameworks to widget target
    const frameworksToAdd = ['WidgetKit.framework', 'SwiftUI.framework', 'ActivityKit.framework'];
    for (const framework of frameworksToAdd) {
      xcodeProject.addFramework(framework, {
        target: widgetTarget.uuid,
        link: true,
      });
    }

    // Add embed extension build phase to main target
    const buildPhases = xcodeProject.hash.project.objects['PBXCopyFilesBuildPhase'] || {};
    let embedPhaseUuid = null;

    for (const uuid in buildPhases) {
      if (buildPhases[uuid].name === '"Embed App Extensions"' ||
          buildPhases[uuid].name === 'Embed App Extensions') {
        embedPhaseUuid = uuid;
        break;
      }
    }

    if (!embedPhaseUuid) {
      embedPhaseUuid = xcodeProject.generateUuid();
      xcodeProject.hash.project.objects['PBXCopyFilesBuildPhase'] =
        xcodeProject.hash.project.objects['PBXCopyFilesBuildPhase'] || {};
      xcodeProject.hash.project.objects['PBXCopyFilesBuildPhase'][embedPhaseUuid] = {
        isa: 'PBXCopyFilesBuildPhase',
        buildActionMask: 2147483647,
        dstPath: '""',
        dstSubfolderSpec: 13,
        files: [],
        name: '"Embed App Extensions"',
        runOnlyForDeploymentPostprocessing: 0,
      };
      xcodeProject.hash.project.objects['PBXCopyFilesBuildPhase'][`${embedPhaseUuid}_comment`] =
        'Embed App Extensions';

      for (const targetUuid in nativeTargets) {
        if (nativeTargets[targetUuid].name === projectName ||
            nativeTargets[targetUuid].productType === '"com.apple.product-type.application"') {
          if (nativeTargets[targetUuid].buildPhases) {
            nativeTargets[targetUuid].buildPhases.push({
              value: embedPhaseUuid,
              comment: 'Embed App Extensions',
            });
          }
          break;
        }
      }
    }

    console.log(`[withLiveActivity] Added widget target: ${WIDGET_NAME}`);

    return config;
  });
}

module.exports = function withLiveActivity(config) {
  config = withLiveActivityInfoPlist(config);
  config = withAppGroupEntitlement(config);
  config = withLiveActivityWidget(config);
  return config;
};
