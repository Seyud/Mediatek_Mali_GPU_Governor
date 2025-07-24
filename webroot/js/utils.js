// 工具函数模块
export function exec(command, options = {}) {
    return new Promise((resolve, reject) => {
        try {
            const callbackName = `exec_callback_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
            window[callbackName] = (errno, stdout, stderr) => {
                resolve({ errno, stdout, stderr });
                delete window[callbackName];
            };
            ksu.exec(command, JSON.stringify(options), callbackName);
        } catch (error) {
            reject(error);
        }
    });
}

export function toast(message) {
    try {
        ksu.toast(message);
    } catch (error) {
        console.error('Toast失败:', error);
    }
}