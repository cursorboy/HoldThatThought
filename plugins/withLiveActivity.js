const { withInfoPlist, withXcodeProject, withEntitlementsPlist } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const WIDGET_NAME = 'HoldThatThoughtWidget';
const WIDGET_BUNDLE_ID = 'com.holdthatthought.app.piam.widget';
const APP_GROUP = 'group.com.holdthatthought.app.piam';
const DEPLOYMENT_TARGET = '16.2';

// Recursively copy directory
function copyDirRecursive(src, dst) {
  if (!fs.existsSync(dst)) {
    fs.mkdirSync(dst, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

// Copy native source files to ios directory
function copyNativeSourceFiles(projectRoot) {
  const nativeSrcPath = path.join(projectRoot, 'native-src');
  const iosPath = path.join(projectRoot, 'ios');

  // Copy main app files
  const mainAppSrc = path.join(nativeSrcPath, 'holdthatthought');
  const mainAppDst = path.join(iosPath, 'holdthatthought');

  if (fs.existsSync(mainAppSrc)) {
    const entries = fs.readdirSync(mainAppSrc, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(mainAppSrc, entry.name);
      const dstPath = path.join(mainAppDst, entry.name);
      if (entry.isDirectory()) {
        copyDirRecursive(srcPath, dstPath);
        console.log(`[withLiveActivity] Copied ${entry.name}/ to main app`);
      } else {
        fs.copyFileSync(srcPath, dstPath);
        console.log(`[withLiveActivity] Copied ${entry.name} to main app`);
      }
    }
  }

  // Copy shared intent file to BOTH main app AND widget (required for openAppWhenRun)
  const sharedIntentSrc = path.join(nativeSrcPath, 'SharedIntent', 'StartListeningIntent.swift');
  if (fs.existsSync(sharedIntentSrc)) {
    // Copy to main app
    const mainAppIntentDst = path.join(mainAppDst, 'StartListeningIntent.swift');
    fs.copyFileSync(sharedIntentSrc, mainAppIntentDst);
    console.log('[withLiveActivity] Copied StartListeningIntent.swift to main app');

    // Copy to widget
    const widgetDst = path.join(iosPath, WIDGET_NAME);
    if (!fs.existsSync(widgetDst)) {
      fs.mkdirSync(widgetDst, { recursive: true });
    }
    const widgetIntentDst = path.join(widgetDst, 'StartListeningIntent.swift');
    fs.copyFileSync(sharedIntentSrc, widgetIntentDst);
    console.log('[withLiveActivity] Copied StartListeningIntent.swift to widget');
  }

  // Copy widget files
  const widgetSrc = path.join(nativeSrcPath, WIDGET_NAME);
  const widgetDst = path.join(iosPath, WIDGET_NAME);

  if (fs.existsSync(widgetSrc)) {
    if (!fs.existsSync(widgetDst)) {
      fs.mkdirSync(widgetDst, { recursive: true });
    }
    const entries = fs.readdirSync(widgetSrc, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(widgetSrc, entry.name);
      const dstPath = path.join(widgetDst, entry.name);
      if (entry.isDirectory()) {
        copyDirRecursive(srcPath, dstPath);
        console.log(`[withLiveActivity] Copied ${entry.name}/ to widget`);
      } else {
        fs.copyFileSync(srcPath, dstPath);
        console.log(`[withLiveActivity] Copied ${entry.name} to widget`);
      }
    }
  }
}

function withLiveActivityInfoPlist(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.NSSupportsLiveActivities = true;
    return config;
  });
}

// App Group entitlement removed - requires paid developer account
// Using OpenURLIntent instead which doesn't need App Groups

function withLiveActivityWidget(config) {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const projectName = config.modRequest.projectName;
    const iosPath = path.join(projectRoot, 'ios');
    const widgetPath = path.join(iosPath, WIDGET_NAME);
    const mainAppPath = path.join(iosPath, 'holdthatthought');

    // Copy native source files first
    copyNativeSourceFiles(projectRoot);

    // Get main target
    const mainTarget = xcodeProject.getFirstTarget();
    const mainTargetUuid = mainTarget.uuid;

    // Add LiveActivity native module files to main app target (including shared intent)
    const mainAppNativeFiles = [
      { name: 'LiveActivityModule.swift', type: 'sourcecode.swift' },
      { name: 'LiveActivityModule.m', type: 'sourcecode.c.objc' },
      { name: 'LiveActivityAttributes.swift', type: 'sourcecode.swift' },
      { name: 'StartListeningIntent.swift', type: 'sourcecode.swift' },
    ];

    // Find main app's source build phase
    const nativeTargets = xcodeProject.hash.project.objects['PBXNativeTarget'];
    let mainSourcesBuildPhaseUuid = null;

    for (const targetUuid in nativeTargets) {
      const target = nativeTargets[targetUuid];
      if (target && (target.name === projectName || target.productType === '"com.apple.product-type.application"')) {
        if (target.buildPhases) {
          for (const phase of target.buildPhases) {
            const phaseUuid = phase.value || phase;
            const sourcesPhases = xcodeProject.hash.project.objects['PBXSourcesBuildPhase'];
            if (sourcesPhases && sourcesPhases[phaseUuid]) {
              mainSourcesBuildPhaseUuid = phaseUuid;
              break;
            }
          }
        }
        break;
      }
    }

    // Find main app group
    const mainGroupKey = xcodeProject.getFirstProject().firstProject.mainGroup;
    const groups = xcodeProject.hash.project.objects['PBXGroup'];
    let mainAppGroupKey = null;

    if (groups && groups[mainGroupKey] && groups[mainGroupKey].children) {
      for (const child of groups[mainGroupKey].children) {
        const childUuid = child.value || child;
        if (groups[childUuid] && groups[childUuid].name === projectName) {
          mainAppGroupKey = childUuid;
          break;
        }
      }
    }

    // Add native module files to main app
    for (const fileInfo of mainAppNativeFiles) {
      const filePath = path.join(mainAppPath, fileInfo.name);
      if (!fs.existsSync(filePath)) {
        console.log(`[withLiveActivity] File not found: ${filePath}`);
        continue;
      }

      // Check if file already exists in project
      const fileRefs = xcodeProject.hash.project.objects['PBXFileReference'];
      let existingRef = null;
      for (const refUuid in fileRefs) {
        if (fileRefs[refUuid] && fileRefs[refUuid].path === fileInfo.name) {
          existingRef = refUuid;
          break;
        }
      }

      if (existingRef) {
        console.log(`[withLiveActivity] ${fileInfo.name} already in project`);
        continue;
      }

      // Create file reference
      const fileRefUuid = xcodeProject.generateUuid();
      xcodeProject.hash.project.objects['PBXFileReference'] =
        xcodeProject.hash.project.objects['PBXFileReference'] || {};
      xcodeProject.hash.project.objects['PBXFileReference'][fileRefUuid] = {
        isa: 'PBXFileReference',
        fileEncoding: 4,
        lastKnownFileType: fileInfo.type,
        name: fileInfo.name,
        path: `holdthatthought/${fileInfo.name}`,
        sourceTree: '"<group>"',
      };
      xcodeProject.hash.project.objects['PBXFileReference'][`${fileRefUuid}_comment`] = fileInfo.name;

      // Add to main app group
      if (mainAppGroupKey && groups[mainAppGroupKey] && groups[mainAppGroupKey].children) {
        groups[mainAppGroupKey].children.push({
          value: fileRefUuid,
          comment: fileInfo.name,
        });
      }

      // Create build file
      const buildFileUuid = xcodeProject.generateUuid();
      xcodeProject.hash.project.objects['PBXBuildFile'] =
        xcodeProject.hash.project.objects['PBXBuildFile'] || {};
      xcodeProject.hash.project.objects['PBXBuildFile'][buildFileUuid] = {
        isa: 'PBXBuildFile',
        fileRef: fileRefUuid,
        fileRef_comment: fileInfo.name,
      };
      xcodeProject.hash.project.objects['PBXBuildFile'][`${buildFileUuid}_comment`] =
        `${fileInfo.name} in Sources`;

      // Add to main app's Sources build phase
      if (mainSourcesBuildPhaseUuid) {
        const sourcesPhases = xcodeProject.hash.project.objects['PBXSourcesBuildPhase'];
        if (sourcesPhases && sourcesPhases[mainSourcesBuildPhaseUuid]) {
          sourcesPhases[mainSourcesBuildPhaseUuid].files =
            sourcesPhases[mainSourcesBuildPhaseUuid].files || [];
          sourcesPhases[mainSourcesBuildPhaseUuid].files.push({
            value: buildFileUuid,
            comment: `${fileInfo.name} in Sources`,
          });
        }
      }

      console.log(`[withLiveActivity] Added ${fileInfo.name} to main app target`);
    }

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

    // Add widget group to main group (mainGroupKey already defined above)
    xcodeProject.addToPbxGroup(widgetGroupKey, mainGroupKey);

    // Widget source files (including shared intent)
    const widgetSwiftFiles = [
      'HoldThatThoughtWidgetBundle.swift',
      'HoldThatThoughtAttributes.swift',
      'HoldThatThoughtLiveActivity.swift',
      'HoldThatThoughtControl.swift',
      'StartListeningIntent.swift',
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

    // Add Sources build phase to widget target (nativeTargets already defined above)
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

    // Add Assets.xcassets to widget target
    const assetsPath = path.join(widgetPath, 'Assets.xcassets');
    if (fs.existsSync(assetsPath)) {
      // Create Resources build phase for widget
      const widgetResourcesBuildPhaseUuid = xcodeProject.generateUuid();
      xcodeProject.hash.project.objects['PBXResourcesBuildPhase'] =
        xcodeProject.hash.project.objects['PBXResourcesBuildPhase'] || {};
      xcodeProject.hash.project.objects['PBXResourcesBuildPhase'][widgetResourcesBuildPhaseUuid] = {
        isa: 'PBXResourcesBuildPhase',
        buildActionMask: 2147483647,
        files: [],
        runOnlyForDeploymentPostprocessing: 0,
      };
      xcodeProject.hash.project.objects['PBXResourcesBuildPhase'][`${widgetResourcesBuildPhaseUuid}_comment`] = 'Resources';

      // Add Resources build phase to widget target
      if (nativeTargets[widgetTargetUuid]) {
        nativeTargets[widgetTargetUuid].buildPhases = nativeTargets[widgetTargetUuid].buildPhases || [];
        nativeTargets[widgetTargetUuid].buildPhases.push({
          value: widgetResourcesBuildPhaseUuid,
          comment: 'Resources',
        });
      }

      // Create file reference for Assets.xcassets
      const assetsRefUuid = xcodeProject.generateUuid();
      xcodeProject.hash.project.objects['PBXFileReference'][assetsRefUuid] = {
        isa: 'PBXFileReference',
        lastKnownFileType: 'folder.assetcatalog',
        path: 'Assets.xcassets',
        sourceTree: '"<group>"',
      };
      xcodeProject.hash.project.objects['PBXFileReference'][`${assetsRefUuid}_comment`] = 'Assets.xcassets';

      // Add to widget group
      const groups = xcodeProject.hash.project.objects['PBXGroup'];
      if (groups && groups[widgetGroupKey] && groups[widgetGroupKey].children) {
        groups[widgetGroupKey].children.push({
          value: assetsRefUuid,
          comment: 'Assets.xcassets',
        });
      }

      // Create build file for assets
      const assetsBuildFileUuid = xcodeProject.generateUuid();
      xcodeProject.hash.project.objects['PBXBuildFile'][assetsBuildFileUuid] = {
        isa: 'PBXBuildFile',
        fileRef: assetsRefUuid,
        fileRef_comment: 'Assets.xcassets',
      };
      xcodeProject.hash.project.objects['PBXBuildFile'][`${assetsBuildFileUuid}_comment`] = 'Assets.xcassets in Resources';

      // Add to Resources build phase
      const resourcesPhases = xcodeProject.hash.project.objects['PBXResourcesBuildPhase'];
      if (resourcesPhases && resourcesPhases[widgetResourcesBuildPhaseUuid]) {
        resourcesPhases[widgetResourcesBuildPhaseUuid].files.push({
          value: assetsBuildFileUuid,
          comment: 'Assets.xcassets in Resources',
        });
      }

      console.log('[withLiveActivity] Added Assets.xcassets to widget target');
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
  // withAppGroupEntitlement removed - requires paid developer account
  config = withLiveActivityWidget(config);
  return config;
};
