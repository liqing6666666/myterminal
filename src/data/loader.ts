// myterminal/src/data/loader.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Command, CommandCategory } from '../types';
import { getCachedRemote } from './updater';

import toolsCommands from './commands/tools.json';

let commands: Command[] = [];
let commandIndex: Map<string, Command> = new Map();
let contextRef: vscode.ExtensionContext | null = null;

/** 加载所有内置指令 + 用户自定义指令 + 远程缓存 */
export function loadCommands(context: vscode.ExtensionContext): Command[] {
  contextRef = context;
  commands = [];

  // 内置指令
  const builtin = [
    ...(toolsCommands as Command[]),
  ];

  // 用户自定义指令：从 workspace 根目录的 myterminal/ 加载 *.json
  const userCommands = loadUserCommands();

  // 远程缓存指令（上次联网更新拉取的）
  const remoteCommands = getCachedRemote(context);

  // 合并：优先级 远程 > 用户 > 内置
  const merged = new Map<string, Command>();
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
export function reloadCommands(): Command[] {
  if (contextRef) {
    return loadCommands(contextRef);
  }
  return commands;
}

function loadUserCommands(): Command[] {
  const result: Command[] = [];
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) return result;

  for (const folder of workspaceFolders) {
    const myterminalDir = path.join(folder.uri.fsPath, 'myterminal');
    if (!fs.existsSync(myterminalDir)) continue;

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
      } catch (e) {
        console.warn(`myterminal: failed to load user commands from ${file}:`, e);
      }
    }
  }
  return result;
}

function isValidCommand(obj: any): obj is Command {
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.aliases) &&
    typeof obj.description === 'string' &&
    typeof obj.syntax === 'string'
  );
}

export function getCommands(): Command[] {
  return commands;
}

export function getCommandById(id: string): Command | undefined {
  return commandIndex.get(id);
}

export function getCommandsByCategory(category: CommandCategory): Command[] {
  return commands.filter(c => c.category === category);
}
