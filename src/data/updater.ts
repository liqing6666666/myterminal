// myterminal/src/data/updater.ts
import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import { Command } from '../types';

const CACHE_KEY = 'myterminal.remoteCache';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

/** 用 Node 原生 http/https 模块拉取 JSON（兼容 Electron < 21 无 fetch） */
function httpGetJson(url: string, timeoutMs: number = 15000): Promise<any> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http;
    const options: any = { timeout: timeoutMs };
    if (url.startsWith('https://')) {
      options.agent = httpsAgent;
    }
    const req = client.get(url, options, (res: http.IncomingMessage) => {
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
      res.on('data', (chunk: string) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
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
async function fetchUrl(url: string): Promise<Command[]> {
  const data = await httpGetJson(url);
  const cmds = Array.isArray(data) ? data : [data];
  return cmds.filter(isValidCommand);
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

/** 从 extension 全局存储读取缓存的远程指令 */
export function getCachedRemote(context: vscode.ExtensionContext): Command[] {
  return context.globalState.get<Command[]>(CACHE_KEY, []);
}

/** 缓存远程指令到 extension 全局存储 */
async function saveRemoteCache(context: vscode.ExtensionContext, commands: Command[]): Promise<void> {
  await context.globalState.update(CACHE_KEY, commands);
}

/** 执行联网更新，返回新增指令数量，失败返回 -1 */
export async function updateRemoteCommands(context: vscode.ExtensionContext): Promise<{
  added: number;
  total: number;
  errors: string[];
}> {
  const config = vscode.workspace.getConfiguration('myterminal');
  const urls: string[] = config.get<string[]>('remoteSources', []);

  const errors: string[] = [];
  const allCommands: Command[] = [];

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
    } else {
      console.log(`myterminal: FAIL ${urls[i]}: ${result.reason?.message || result.reason}`);
      errors.push(`${urls[i]}: ${result.reason?.message || '未知错误'}`);
    }
  }

  // 去重（同 id 最后一条生效）
  const merged = new Map<string, Command>();
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
