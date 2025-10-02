const { app, BrowserWindow,Menu, ipcMain, ipcRenderer} = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { print } = require('pdf-to-printer');
const fs = require('fs');
const https = require('https');
const http = require('http');


const iconv = require('iconv-lite'); // 需要先安装iconv-lite

// 处理Windows平台的快捷方式
if (require('electron-squirrel-startup')) {
  app.quit();
}
// 设置 SumatraPDF 的路径
//process.env.SUMATRA_PDF_PATH = 'D:\\order-printer\\resources\\pdf\\SumatraPDF-3.4.6-32.exe';

// 设置 Node.js 默认字符编码为 UTF-8
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.LANG = 'zh_CN.UTF-8';

let mainWindow;


function createWindow() {

  mainWindow = new BrowserWindow({
    width: 800,
    height: 400,
    icon: path.join(__dirname, 'assets', 'icon.ico'), // 添加窗口图标
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
     // preload: path.join(__dirname, 'preload.js'), // 预加载脚本
    },
    /* titleBarStyle: 'hidden',
    // expose window controls in Windows/Linux
    ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {})*/
  });
  // 加载你的应用
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('print-ready');
  });
  // 注册自定义 URL 协议
  app.setAsDefaultProtocolClient('ponygorxorderprinter', process.execPath);
  // 打开开发者工具
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  // 创建自定义菜单
  const template = [];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})






ipcMain.on('get-printers', (event) => {
  console.log('Getting printers...获取打印机=====');
  let command;
  if (process.platform === 'win32') {
    // Windows 平台
    command = 'powershell -NoProfile -Command "$OutputEncoding = [System.Text.Encoding]::UTF8; Get-Printer | Select-Object -ExpandProperty Name"';
  } else if (process.platform === 'darwin') {
    // macOS 平台
    command = 'system_profiler SPPrintersDataType -xml | grep -A 1 "_name" | grep string | sed "s/.*<string>\\(.*\\)<\\/string>.*/\\1/"';
  } else {
    // Linux 平台
    command = 'lpstat -p';
  }
  exec(command, {encoding: 'buffer' }, (error, stdout, stderr) => {
    if (error) {
      console.error(`执行命令出错: ${error}`);
      event.reply('printers-list', []);
      return;
    }

    let printers = [];
    if (process.platform === 'win32') {

      // 使用iconv-lite将输出从GBK（中文系统默认）转换为UTF-8
      const decodedOutput = iconv.decode(stdout, 'gbk');
      // 解析 PowerShell 命令输出
      const lines = decodedOutput.trim().split('\n');
    //  console.log('Windows 打印机列表:', lines); // 确保这里输出的是正确的编码

      for (const line of lines) {
        const printerName = line.trim();
        if (printerName) {
          printers.push({ name: printerName });
        }
      }
    } else {
     /* // 解析 Linux/macOS 命令输出
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const match = line.match(/printer (.+?) is/);
        if (match) {
          printers.push({ name: match[1] });
        }
      }*/
          // 将Buffer转换为字符串
          const output = stdout.toString();  // 添加这行来转换Buffer到字符串
          // 解析 Linux/macOS 命令输出
          const lines = output.trim().split('\n');
          for (const line of lines) {
            const printerName = line.trim();
            if (printerName) {
              printers.push({ name: printerName });
            }
          }
    }
    event.reply('printers-list', printers);
  });
});
// 下载网络PDF文件
async function downloadPDF(url) {
  return new Promise((resolve, reject) => {
    const tempDir = app.getPath('temp')
    const filename = `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`
    const filePath = path.join(tempDir, filename)

    const fileStream = fs.createWriteStream(filePath)
    const protocol = url.startsWith('https') ? https : http

    protocol.get(url, (response) => {
      // 检查响应状态
      if (response.statusCode !== 200) {
        reject(new Error(`下载失败，状态码: ${response.statusCode}`))
        return
      }

      // 检查内容类型
      const contentType = response.headers['content-type']
      if (!contentType || !contentType.includes('application/pdf')) {
        reject(new Error('URL指向的不是PDF文件'))
        return
      }

      response.pipe(fileStream)

      fileStream.on('finish', () => {
        fileStream.close()
        resolve(filePath)
      })

      fileStream.on('error', (err) => {
        fs.unlinkSync(filePath) // 删除损坏的文件
        reject(err)
      })
    }).on('error', (err) => {
      reject(err)
    })
  })
}
function getSumatraPath() {
  let sumatraPath;

  ///判断平台系统 如果是苹果电脑直接返回 null
  if (process.platform === 'darwin') {
    return null;
  }

  //SumatraPDF-3.4.6-32.exe
  console.log('app.isPackaged:', app.isPackaged);
 // alert(app.isPackaged); //alert
  if (app.isPackaged) {
    // 生产环境：假设我们使用 asarUnpack 将 pdf-to-print 解压到了 app.asar.unpacked
    sumatraPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'pdf-to-printer','dist', 'SumatraPDF-3.4.6-32.exe');
   // sumatraPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'assets', 'SumatraPDF-3.4.6-32.exe');

    console.log('SumatraPDF 路径:', sumatraPath); // 确保这里输出的是正确的编码
    // 或者如果使用 extraResource 复制到了 resources 目录下
    // sumatraPath = path.join(process.resourcesPath, 'SumatraPDF-3.4.6-32.exe');
    // 检查文件是否存在
    if (!fs.existsSync(sumatraPath)) {
      // 如果不在上述路径，可能被打包到了其他位置，需要根据实际调整
      // 可以尝试多个路径
     // sumatraPath = path.join(__dirname, 'assets', 'SumatraPDF-3.4.6-32.exe');
      sumatraPath = path.join(__dirname,  'node_modules', 'pdf-to-printer','dist','SumatraPDF-3.4.6-32.exe');
    }
  } else {
    // 开发环境 node_modules\pdf-to-printer\dist
    //D:\order-printer\node_modules\pdf-to-printer\dist
   // sumatraPath = path.join(__dirname,  'assets','SumatraPDF-3.4.6-32.exe');
    sumatraPath = path.join(__dirname,  'node_modules', 'pdf-to-printer','dist','SumatraPDF-3.4.6-32.exe');
    console.log('SumatraPDF 路径开发环境===:', sumatraPath);
  }

  if (!fs.existsSync(sumatraPath)) {
    throw new Error(`SumatraPDF not found at path: ${sumatraPath}`);
  }

  return sumatraPath;
}

async function printNetworkPDF(pdfUrl, options = {}) {
  console.log("printNetworkPDF===pdfUrl:", pdfUrl);
  // 下载PDF到临时文件
  const tempFilePath = await downloadPDF(pdfUrl);
  const sumatraPath = getSumatraPath();
  // 设置打印选项
  const printOptions = {
    printer: options.printer || '',
    paperSize: {
      width: 102, // 单位：毫米
      height: 51 // 单位：毫米
    },
    scale:'noscale',
    orientation: 'landscape',
    sumatraPdfPath: sumatraPath ///如果是苹果电脑还需要这个吗？？？？
  }
  console.log("临时文件",tempFilePath);
  print(tempFilePath,printOptions).then(
      (res)=>{
        console.log("打印结果：",res);

        ///发送打印结果
        // 打印完成后删除临时文件（延迟删除确保打印完成）
        setTimeout(() => {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath)
            console.log('临时文件已删除')
          }
        }, 10000) // 10秒后删除

      }
  ).catch((error) => {
    console.error('打印错误:', error);
  });
}

// 打印网络PDF
ipcMain.on('print-network-pdf', async (event, pdfUrl, options = {}) => {
  try {
    // 下载PDF到临时文件
    const tempFilePath = await downloadPDF(pdfUrl);
    // 设置打印选项
    const printOptions = {
      printer: options.printer || '',
      paperSize: {
        width: 102, // 单位：毫米
        height: 51 // 单位：毫米
      },
      scale:'noscale',
      orientation: 'landscape'
     // sumatraPdfPath: sumatraPath
    }
    //如果不是苹果系统 则需要添加 sumatraPdfPath
    if (process.platform !== 'darwin') {
      const sumatraPath = getSumatraPath();
      printOptions.sumatraPdfPath = sumatraPath;
    }



    console.log("临时文件",tempFilePath);
    print(tempFilePath,printOptions).then(
        (res)=>{
          console.log("打印结果：",res);
          event.reply('print-result', { success: true, message: '打印成功' });
          ///发送打印结果
          // 打印完成后删除临时文件（延迟删除确保打印完成）
          setTimeout(() => {
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath)
              console.log('临时文件已删除')
            }
          }, 10000) // 10秒后删除
        }
    ).catch((error) => {
      console.error('打印错误:', error);
      event.reply('print-result', { success: false, message: '打印失败: ' + error.message });
    });

   // printNetworkPDF(pdfUrl,options);

    // 打印PDF
   // await pdfToPrinter(printOptions);
   /* pdfToPrinter.print(printOptions,).then((success) => {
      if (success) {
        event.reply('print-result', { success: true, message: '打印成功' });
      } else {
        event.reply('print-result', { success: false, message: '打印失败' });
      }
    }).catch((error) => {
      console.error('打印错误:', error);
      event.reply('print-result', { success: false, message: '打印失败: ' + error.message });
    });*/
   // console.log('打印任务已发送')


  } catch (error) {
 //  console.error('打印网络PDF失败:', error)
   // return { success: false, error: error.message }
    event.reply('print-result', { success: false, message: '打印网络PDF失败: ' + error.message });
  }


});



app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});




// 在macOS上，我们使用`open-url`事件
app.on('open-url', (event, url) => {
    event.preventDefault();
  const parsedUrl = new URL(url);
  const pdfUrl = parsedUrl.searchParams.get('pdfUrl');
  const sn = parsedUrl.searchParams.get('sn');
    // 确保我们有一个窗口来显示内容
    if (mainWindow) {
      // 如果窗口已经存在，我们可以将url发送给渲染进程进行处理
      mainWindow.webContents.send('protocol-url', sn,pdfUrl);
    } else {
      // 如果窗口不存在，我们可以先存储url，等窗口创建后再发送
      // 这里我们简单处理，直接发送给渲染进程，但要注意渲染进程可能还未准备好
      // 更好的做法是存储url，在渲染进程加载完成后发送
      createWindow();
      // 等待窗口加载完成后再发送
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('protocol-url',  sn,pdfUrl);
      });
    }
});

// 在Windows和Linux上，当应用已经运行并尝试再次启动时，会触发`second-instance`事件
app.on('second-instance', (event, commandLine, workingDirectory) => {
  // 命令参数中可能包含协议链接
  console.log('second-instance', commandLine, workingDirectory);


  // 在Windows上，协议链接可能是命令行的一个参数
  const url = commandLine.find(arg => arg.startsWith('ponygorxorderprinter://'));
  if (url) {
    const parsedUrl = new URL(url);
    const pdfUrl = parsedUrl.searchParams.get('pdfUrl');
    const sn = parsedUrl.searchParams.get('sn');
    const printerSelect=parsedUrl.searchParams.get('printer');
   // printNetworkPDF(pdfUrl,{printer:printerSelect});
    // 我们可以存储这个url，等窗口创建后发送
    // 这里我们等待窗口创建后发送
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.webContents.send('protocol-url',  sn,pdfUrl);
    }
  /*  if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.webContents.send('protocol-url', url);
    }*/
  }



});

// 对于Windows和Linux，当应用首次启动时，也可能通过命令行参数传递协议链接
// 注意：在Windows上，如果应用未运行，通过协议链接启动时，会启动应用并传递链接作为参数
// 但是，在应用启动后，我们通过`second-instance`事件处理已经运行的情况，所以这里我们只处理首次启动
if (process.platform !== 'darwin') {
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    // 如果获取锁失败，说明已经有一个实例在运行，我们退出这个实例
    app.quit();
    return;
  } else {
    // 当应用首次启动时，我们检查命令行参数 //获取url参数
    const url = process.argv.find(arg => arg.startsWith('ponygorxorderprinter://'));
    if(url) {
      const parsedUrl = new URL(url);
      const pdfUrl = parsedUrl.searchParams.get('pdfUrl');
      const sn = parsedUrl.searchParams.get('sn');
      const printerSelect=parsedUrl.searchParams.get('printer');
      console.log("pdfUrl:", pdfUrl);
     // printNetworkPDF(pdfUrl,{printer:printerSelect});
      // 我们可以存储这个url，等窗口创建后发送
      // 这里我们等待窗口创建后发送
      app.whenReady().then(() => {
        if (mainWindow) {
            mainWindow.webContents.once('did-finish-load', () => {
            console.log("protocol-url=======设置打印机的值");
            mainWindow.webContents.send('protocol-url', sn,pdfUrl);
          });
        }
      });
    }
  }
}
