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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCommands = loadCommands;
exports.reloadCommands = reloadCommands;
exports.getCommands = getCommands;
exports.getCommandById = getCommandById;
exports.getCommandsByCategory = getCommandsByCategory;
// myterminal/src/data/loader.ts
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const updater_1 = require("./updater");
const tools_json_1 = __importDefault(require("./commands/tools.json"));
let commands = [];
let commandIndex = new Map();
let contextRef = null;
/** 加载所有内置指令 + 用户自定义指令 + 远程缓存 */
function loadCommands(context) {
    contextRef = context;
    commands = [];
    // 内置指令
    const builtin = [
        ...tools_json_1.default,
    ];
    // 用户自定义指令：从 workspace 根目录的 myterminal/ 加载 *.json
    const userCommands = loadUserCommands();
    // 远程缓存指令（上次联网更新拉取的）
    const remoteCommands = (0, updater_1.getCachedRemote)(context);
    // 合并：优先级 远程 > 用户 > 内置
    const merged = new Map();
    for (const cmd of builtin) {
        merged.set(cmd.id, cmd);
    }
    for (const cmd of userCommands) {
        merged.set(cmd.id, cmd);
    }
    for (const cmd of remoteCommands) {
        merged.set(cmd.id, cmd);
    }
    commands = Array.from(merged.values());
    commandIndex = new Map(commands.map(c => [c.id, c]));
    return commands;
}
/** 重新加载指令（联网更新后调用） */
function reloadCommands() {
    if (contextRef) {
        return loadCommands(contextRef);
    }
    return commands;
}
function loadUserCommands() {
    const result = [];
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders)
        return result;
    for (const folder of workspaceFolders) {
        const myterminalDir = path.join(folder.uri.fsPath, 'myterminal');
        if (!fs.existsSync(myterminalDir))
            continue;
        const files = fs.readdirSync(myterminalDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(myterminalDir, file), 'utf-8');
                const parsed = JSON.parse(content);
                const cmds = Array.isArray(parsed) ? parsed : [parsed];
                for (const cmd of cmds) {
                    if (isValidCommand(cmd)) {
                        result.push(cmd);
                    }
                }
            }
            catch (e) {
                console.warn(`myterminal: failed to load user commands from ${file}:`, e);
            }
        }
    }
    return result;
}
function isValidCommand(obj) {
    return (typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        Array.isArray(obj.aliases) &&
        typeof obj.description === 'string' &&
        typeof obj.syntax === 'string');
}
function getCommands() {
    return commands;
}
function getCommandById(id) {
    return commandIndex.get(id);
}
function getCommandsByCategory(category) {
    return commands.filter(c => c.category === category);
}
//# sourceMappingURL=loader.js.map