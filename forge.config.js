const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: 'assets/icon',
    /*name: 'ponygorx-order-printer',
    executableName: 'ponygorx-order-printer',
    icon: 'assets/icons', // 通用图标路径（无扩展名）
    // 可以指定特定平台的图标
    win32metadata: {
      'requested-execution-level': 'asInvoker',
      'file-description': 'ponygorx order printer',
      'product-version': '1.0.2',
      'company-name': 'PonyGo',
      'original-filename': 'ponygorx-order-printer.exe',
      'internal-name': 'ponygorx-order-printer'
    }*/
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        iconUrl: 'https://www.insdoor.com/favicon.ico',
        setupIcon: 'assets/icon.ico', // 指定安装程序的图标路径
       /* name: 'ponygorx-order-printer',
        authors: 'ponygo',
        exe: 'ponygorx-order-printer.exe',
        description: 'ponygorx order printer',
        version: '1.0.2',
        loadingGif: '', // 可选：安装时的加载动画
        setupExe: 'ponygorx-order-printer-1.0.2.exe',
        noMsi: true,
        // 创建快捷方式设置
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        // 手动设置桌面快捷方式图标
        shortcutFolderName: 'ponygorx-order-printer',
        shortcutName: 'ponygorx-order-printer',*/
      }
    },


    {
      name: '@electron-forge/maker-zip',
      config: {
        iconUrl: 'https://www.insdoor.com/favicon.ico',
        setupIcon: 'assets/icon.ico', // 指定安装程序的图标路径
        }
    }
    /*,
    {
      name: '@electron-forge/maker-wix',
      config: {
        icon: 'assets/icon.ico',
      }
    }*/
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
