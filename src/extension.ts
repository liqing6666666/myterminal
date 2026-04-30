import * as vscode from 'vscode';
import { SidebarViewProvider } from './ui/sidebar';
import { loadCommands } from './data';
import { initEmbedding } from './search';

export function activate(context: vscode.ExtensionContext) {
  console.log('myterminal: activating...');

  const commands = loadCommands(context);
  console.log(`myterminal: loaded ${commands.length} commands`);

  const sidebarProvider = new SidebarViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarViewProvider.viewType, sidebarProvider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('myterminal.focus', () => {
      sidebarProvider.focus();
    })
  );

  initEmbedding().then(success => {
    if (success) {
      console.log('myterminal: embedding engine ready');
    }
  });

  console.log('myterminal: activated');
}

export function deactivate() {
  console.log('myterminal: deactivated');
}
