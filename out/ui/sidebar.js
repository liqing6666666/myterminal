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
exports.SidebarViewProvider = void 0;
// myterminal/src/ui/sidebar.ts
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const search_1 = require("../search");
const data_1 = require("../data");
class SidebarViewProvider {
    static viewType = 'myterminal.search';
    _view;
    _context;
    constructor(context) {
        this._context = context;
    }
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this._context.extensionPath, 'webview')),
            ],
        };
        webviewView.webview.html = this.getHtmlContent(webviewView.webview);
        webviewView.webview.onDidReceiveMessage((msg) => this.handleMessage(msg), undefined, this._context.subscriptions);
        webviewView.webview.postMessage({
            type: 'commandCount',
            count: (0, data_1.getCommands)().length,
        });
    }
    focus() {
        if (this._view) {
            this._view.show(true);
            this._view.webview.postMessage({ type: 'focus' });
        }
    }
    async handleMessage(msg) {
        switch (msg.type) {
            case 'search': {
                const results = await (0, search_1.search)(msg.query, (0, data_1.getCommands)(), msg.category);
                this._view?.webview.postMessage({
                    type: 'searchResults',
                    results,
                    query: msg.query,
                    took: 0,
                });
                break;
            }
            case 'copy': {
                await vscode.env.clipboard.writeText(msg.text);
                vscode.window.showInformationMessage(`已复制: ${msg.text.substring(0, 50)}`);
                break;
            }
            case 'getDetail': {
                const cmd = (0, data_1.getCommandById)(msg.id);
                if (cmd) {
                    const related = cmd.related
                        .map(id => (0, data_1.getCommandById)(id))
                        .filter((c) => !!c);
                    this._view?.webview.postMessage({
                        type: 'commandDetail',
                        command: cmd,
                        relatedCommands: related,
                    });
                }
                break;
            }
        }
    }
    getHtmlContent(webview) {
        const webviewDir = path.join(this._context.extensionPath, 'webview');
        const html = fs.readFileSync(path.join(webviewDir, 'index.html'), 'utf-8');
        const css = fs.readFileSync(path.join(webviewDir, 'style.css'), 'utf-8');
        const js = fs.readFileSync(path.join(webviewDir, 'app.js'), 'utf-8');
        return html
            .replace('<link rel="stylesheet" href="style.css">', `<style>${css}</style>`)
            .replace('<script src="app.js"></script>', `<script>${js}</script>`);
    }
}
exports.SidebarViewProvider = SidebarViewProvider;
//# sourceMappingURL=sidebar.js.map