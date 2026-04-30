import * as vscode from 'vscode';
import { Command } from '../types';
/** 从 extension 全局存储读取缓存的远程指令 */
export declare function getCachedRemote(context: vscode.ExtensionContext): Command[];
/** 执行联网更新，返回新增指令数量，失败返回 -1 */
export declare function updateRemoteCommands(context: vscode.ExtensionContext): Promise<{
    added: number;
    total: number;
    errors: string[];
}>;
