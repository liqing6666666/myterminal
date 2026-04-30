// myterminal/src/config.ts
import * as vscode from 'vscode';

export interface MyterminalConfig {
  enableEmbedding: boolean;
  deepseekApiKey: string;
  maxResults: number;
}

export function getConfig(): MyterminalConfig {
  const c = vscode.workspace.getConfiguration('myterminal');
  return {
    enableEmbedding: c.get<boolean>('enableEmbedding', true),
    deepseekApiKey: c.get<string>('deepseekApiKey', ''),
    maxResults: c.get<number>('maxResults', 50),
  };
}
