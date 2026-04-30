import * as vscode from 'vscode';
import { Command, CommandCategory } from '../types';
/** 加载所有内置指令 + 用户自定义指令 + 远程缓存 */
export declare function loadCommands(context: vscode.ExtensionContext): Command[];
/** 重新加载指令（联网更新后调用） */
export declare function reloadCommands(): Command[];
export declare function getCommands(): Command[];
export declare function getCommandById(id: string): Command | undefined;
export declare function getCommandsByCategory(category: CommandCategory): Command[];
