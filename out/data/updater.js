"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedRemote = getCachedRemote;
exports.updateRemoteCommands = updateRemoteCommands;
// myterminal/src/data/updater.ts
const vscode = __importStar(require("vscode"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const CACHE_KEY = 'myterminal.remoteCache';
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
/** 用 Node 原生 http/https 模块拉取 JSON（兼容 Electron < 21 无 fetch） */
function httpGetJson(url, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https://') ? https : http;
        const options = { timeout: timeoutMs };
        if (url.startsWith('https://')) {
            options.agent = httpsAgent;
        }
        const req = client.get(url, options, (res) => {
            // 处理重定向
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                httpGetJson(res.headers.location, timeoutMs).then(resolve, reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch (e) {
                    reject(new Error('Invalid JSON'));
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });
    });
}
/** 从远程 URL 拉取指令数据 */
async function fetchUrl(url) {
    const data = await httpGetJson(url);
    const cmds = Array.isArray(data) ? data : [data];
    return cmds.filter(isValidCommand);
}
function isValidCommand(obj) {
    return (typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        Array.isArray(obj.aliases) &&
        typeof obj.description === 'string' &&
        typeof obj.syntax === 'string');
}
/** 从 extension 全局存储读取缓存的远程指令 */
function getCachedRemote(context) {
    return context.globalState.get(CACHE_KEY, []);
}
/** 缓存远程指令到 extension 全局存储 */
async function saveRemoteCache(context, commands) {
    await context.globalState.update(CACHE_KEY, commands);
}
/** 执行联网更新，返回新增指令数量，失败返回 -1 */
async function updateRemoteCommands(context) {
    const config = vscode.workspace.getConfiguration('myterminal');
    const urls = config.get('remoteSources', []);
    const errors = [];
    const allCommands = [];
    if (urls.length === 0) {
        errors.push('未配置远程源，请在设置中配置 myterminal.remoteSources');
        return { added: 0, total: 0, errors };
    }
    console.log(`myterminal: fetching ${urls.length} remote sources...`);
    // 并行拉取所有远程源
    const results = await Promise.allSettled(urls.map(fetchUrl));
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled') {
            console.log(`myterminal: OK [${result.value.length}] ${urls[i]}`);
            allCommands.push(...result.value);
        }
        else {
            console.log(`myterminal: FAIL ${urls[i]}: ${result.reason?.message || result.reason}`);
            errors.push(`${urls[i]}: ${result.reason?.message || '未知错误'}`);
        }
    }
    // 去重（同 id 最后一条生效）
    const merged = new Map();
    for (const cmd of allCommands) {
        merged.set(cmd.id, cmd);
    }
    const unique = Array.from(merged.values());
    // 对比上次缓存
    const previous = getCachedRemote(context);
    const added = unique.length - previous.length;
    // 保存缓存
    await saveRemoteCache(context, unique);
    return { added: Math.max(added, 0), total: unique.length, errors };
}
//# sourceMappingURL=updater.js.map