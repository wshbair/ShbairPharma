const fs = require('fs');
const path = require('path');
const glob = require('glob');
const pkg = require("./package.json");

module.exports = {
  packagerConfig: {
    icon: 'assets/images/icon.ico', // Windows icon
    asar: true,
    ignore: [
      'gulpfile\\.js',
      '\\.git.*',
      'TODO',
      'notes\\.txt',
      'forge\\.config\\.js',
      'tests',
      'jest\\.config\\.js',
    ],
  },
  rebuildConfig: {},
  makers: [
    // All platforms — zip archive
    { name: '@electron-forge/maker-zip', platforms: ['darwin', 'win32', 'linux'] },

    // Windows — Squirrel installer (.exe setup)
    // maker-wix removed: requires WiX 4.x which is not on GitHub Actions windows-latest
    { name: '@electron-forge/maker-squirrel', config: {}, platforms: ['win32'] },

    // Linux
    { name: '@electron-forge/maker-deb', config: {}, platforms: ['linux'] },
    { name: '@electron-forge/maker-rpm', config: {}, platforms: ['linux'] },

    // macOS
    { name: '@electron-forge/maker-dmg', config: { format: 'ULFO' }, platforms: ['darwin'] },
  ],

  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'wshbair',
          name: 'ShbairPharma',
        },
        draft: true,
        authToken: process.env.GITHUB_TOKEN,
      },
    },
  ],

  // Fix issue with packaging Linux apps (node_gyp_bins)
  hooks: {
    packageAfterPrune(config, buildPath) {
      if (process.platform === 'linux') {
        const dirs = glob.sync(
          path.join(buildPath, 'node_modules/**/node_gyp_bins'),
          {
            onlyDirectories: true,
          }
        );

        for (const directory of dirs) {
          fs.rmdirSync(directory, { recursive: true, force: true });
        }
      }
    },
  },
};
