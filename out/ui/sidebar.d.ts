import * as vscode from 'vscode';
export declare class SidebarViewProvider implements vscode.WebviewViewProvider {
    static readonly viewType = "myterminal.search";
    private _view?;
    private _context;
    constructor(context: vscode.ExtensionContext);
    resolveWebviewView(webviewView: vscode.WebviewView, _context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken): void;
    focus(): void;
    private handleMessage;
    private getHtmlContent;
}
