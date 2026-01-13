// background.js

// 插件核心状态
let isExtensionEnabled = true;
// 白名单（初始空，从 storage 读取）
let whitelist = [];

// 初始化：读取插件状态和白名单
chrome.storage.sync.get(['isEnabled', 'whitelist'], function(data) {
    if (data.isEnabled !== undefined) {
        isExtensionEnabled = data.isEnabled;
    }
    if (data.whitelist !== undefined) {
        whitelist = data.whitelist;
    }
});

// 监听消息（状态切换/白名单更新）
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "toggleExtension") {
        isExtensionEnabled = message.enabled;
    }
    if (message.action === "updateWhitelist") {
        whitelist = message.whitelist; // 即时更新白名单
    }
});

// 核心：蜜罐检测（拦截跨域JSONP）
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if (!isExtensionEnabled) return; // 插件暂停时不拦截
        
        const requestUrl = new URL(details.url);
        const requestHost = requestUrl.hostname;

        // 【新增】白名单判断：如果请求域名在白名单，直接放行
        if (whitelist.includes(requestHost)) return;
        
        // 获取当前标签页域名，判断是否跨域
        chrome.tabs.get(details.tabId, function(tab) {
            if (tab && tab.url) {
                const pageHost = new URL(tab.url).hostname;
                // 跨域+脚本类型请求 → 判定蜜罐并拦截
                if (requestHost !== pageHost && details.type === "script") {
                    chrome.notifications.create({
                        type: "basic",
                        iconUrl: "img/logo.png",
                        title: "蜜罐预警",
                        message: `检测到跨域JSONP请求：\n${requestHost}\n疑似蜜罐，已拦截！`
                    });
                    // 统计拦截数量
                    chrome.storage.sync.get('blockCount', function(data) {
                        const count = (data.blockCount || 0) + 1;
                        chrome.storage.sync.set({blockCount: count});
                    });
                    return { cancel: true };
                }
            }
        });
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
);
