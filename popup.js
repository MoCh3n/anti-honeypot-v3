// popup.js

// 初始化插件状态为已启动
let isEnabled = true;

// 初始化白名单
let whitelist = [];

// 从 storage 中读取插件状态和白名单
chrome.storage.sync.get(['isEnabled', 'whitelist'], function(data) {
    // 读取插件状态
    isEnabled = data.isEnabled !== undefined ? data.isEnabled : true;
    updateButtonAndStatus();

    // 读取白名单（默认空数组）
    whitelist = data.whitelist !== undefined ? data.whitelist : [];
    updateWhitelistDisplay();
});

// 更新按钮文本和状态显示
function updateButtonAndStatus() {
    const toggleButton = document.getElementById('toggleButton');
    const statusElement = document.getElementById('status');
    if (isEnabled) {
        toggleButton.textContent = '暂停插件';
        statusElement.textContent = '当前状态: 运行中';
    } else {
        toggleButton.textContent = '启动插件';
        statusElement.textContent = '当前状态: 已暂停';
    }
}

// 切换插件状态
function toggleExtension() {
    isEnabled = !isEnabled;
    updateButtonAndStatus();
    // 存储新的插件状态
    chrome.storage.sync.set({isEnabled: isEnabled}, function() {
        // 发送消息给 background.js 更新插件状态
        chrome.runtime.sendMessage({action: "toggleExtension", enabled: isEnabled});
    });
}

// 【新增】更新白名单展示
function updateWhitelistDisplay() {
    const displayElement = document.getElementById('currentWhitelist');
    if (whitelist.length === 0) {
        displayElement.textContent = '当前白名单：无';
    } else {
        displayElement.textContent = `当前白名单：${whitelist.join(', ')}`;
    }
    // 同步输入框值
    document.getElementById('whitelistInput').value = whitelist.join(',');
}

// 【新增】保存白名单
function saveWhitelist() {
    const inputValue = document.getElementById('whitelistInput').value.trim();
    // 处理输入：去重、过滤空值、去除首尾空格
    whitelist = inputValue.split(',')
        .map(item => item.trim())
        .filter(item => item !== '')
        .filter((item, index, arr) => arr.indexOf(item) === index);
    // 保存到 storage
    chrome.storage.sync.set({whitelist: whitelist}, function() {
        updateWhitelistDisplay();
        // 通知 background.js 白名单已更新（可选，即时生效）
        chrome.runtime.sendMessage({action: "updateWhitelist", whitelist: whitelist});
    });
}

// 为按钮添加点击事件监听器
document.getElementById('toggleButton').addEventListener('click', toggleExtension);
// 【新增】绑定白名单保存按钮事件
document.getElementById('saveWhitelist').addEventListener('click', saveWhitelist);

// 【新增】监听回车保存（可选优化）
document.getElementById('whitelistInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') saveWhitelist();
});
