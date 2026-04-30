// myterminal/src/ui/sidebar.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { search } from '../search';
import { loadCommands, getCommands, getCommandById } from '../data';
import { WebViewMessage, Command } from '../types';

export class SidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'myterminal.search';
  private _view?: vscode.WebviewView;
  private _context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this._context.extensionPath, 'webview')),
      ],
    };

    webviewView.webview.html = this.getHtmlContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(
      (msg: WebViewMessage) => this.handleMessage(msg),
      undefined,
      this._context.subscriptions
    );

    webviewView.webview.postMessage({
      type: 'commandCount',
      count: getCommands().length,
    });
  }

  public focus() {
    if (this._view) {
      this._view.show(true);
      this._view.webview.postMessage({ type: 'focus' });
    }
  }

  private async handleMessage(msg: WebViewMessage) {
    switch (msg.type) {
      case 'search': {
        const results = await search(msg.query, getCommands(), msg.category);
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
        const cmd = getCommandById(msg.id);
        if (cmd) {
          const related = cmd.related
            .map(id => getCommandById(id))
            .filter((c): c is Command => !!c);
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

  private getHtmlContent(webview: vscode.Webview): string {
    const webviewDir = path.join(this._context.extensionPath, 'webview');

    const html = fs.readFileSync(path.join(webviewDir, 'index.html'), 'utf-8');
    const css = fs.readFileSync(path.join(webviewDir, 'style.css'), 'utf-8');
    const js = fs.readFileSync(path.join(webviewDir, 'app.js'), 'utf-8');

    return html
      .replace('<link rel="stylesheet" href="style.css">', `<style>${css}</style>`)
      .replace('<script src="app.js"></script>', `<script>${js}</script>`);
  }
}
