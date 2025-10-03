const { ipcRenderer } = require('electron');

// 获取打印机列表
ipcRenderer.send('get-printer-component-version');
ipcRenderer.on('printer-component-version', (event, version) => {
    console.log('打印机组件版本:', version);
    document.getElementById('printer-version').textContent = version;
});


ipcRenderer.send('get-printers');
ipcRenderer.on('printers-list', (event, printers) => {
    console.log('打印机列表printers-list:', printers);
    const printerSelect = document.getElementById('printer-select');
    printerSelect.innerHTML = ''; // 清空之前的选项
    //创建一个空的option元素
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Please select a printer';
    printerSelect.appendChild(defaultOption);
    printers.forEach(printer => {
        const option = document.createElement('option');
        option.value = printer.name;
        option.textContent = printer.name;
        printerSelect.appendChild(option);
    });
});

ipcRenderer.on('printers-list-macos', (event, printers) => {
   /* if (result.success) {
        alert(result.message);
    } else {
        alert(result.message);
    }*/
    console.log('macOS 打印机列表:', printers);
});

// 打印按钮点击事件
document.getElementById('print-button').addEventListener('click', () => {
    const printerName = document.getElementById('printer-select').value;
    const pdfUrl = document.getElementById('pdf-url').value;
    if (!printerName) {
        alert('Please select a printer');
        return;
    }
    if (!pdfUrl) {
        alert('Currently no print jobs pending');
        return;
    }
    ipcRenderer.send('print-network-pdf',pdfUrl,{printer:printerName});
});
// 接收打印结果
ipcRenderer.on('print-result', (event, result) => {
    if (result.success) {
        alert(result.message);
    } else {
        alert(result.message);
    }
});




// 确保页面加载完成后发送打印准备信号
window.addEventListener('DOMContentLoaded', (event) => {
    //ipcRenderer.send('print-ready');
});

// 在渲染进程中，我们可以通过暴露的API监听协议链接
/*window.electronAPI.onProtocolUrl((url) => {
    // 处理接收到的url，例如解析参数并更新界面
    console.log('Received URL:', url);
    // 你可以解析url并执行相应的操作

    // 更新页面上的内容
   // alert(url+"===============");
    const urlElement = document.getElementById('url-display');
    if (urlElement) {
        urlElement.innerHTML = `Received URL: ${url}`;
    }
});*/
ipcRenderer.on('protocol-url', (event, sn,pdfUrl) => {
  //  alert(sn+"==============="+pdfUrl+"===============");
    const urlElement = document.getElementById('order-id');
    if (urlElement) {
        urlElement.innerHTML = `${sn}`;
    }
    const pdfUrlElement = document.getElementById('pdf-url');
    if (pdfUrlElement) {
        pdfUrlElement.value = `${pdfUrl}`;
       // pdfUrlElement.value = "test";
    }
    /*const printerSelectElement = document.getElementById('printer-name');
    if (printerSelectElement) {
        printerSelectElement.innerHTML = `${printerSelect}`;
    }*/
});
