// myterminal/src/types.ts

/** 指令条目 */
export interface Command {
  id: string;
  name: string;
  aliases: string[];
  category: CommandCategory;
  description: string;
  syntax: string;
  examples: CommandExample[];
  tags: string[];
  platform: Platform[];
  related: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export type CommandCategory = 'linux' | 'cmd' | 'claude-code' | 'openclaw';
export type Platform = 'linux' | 'macos' | 'windows';

export interface CommandExample {
  desc: string;
  cmd: string;
}

/** 搜索结果 */
export interface SearchResult {
  command: Command;
  score: number;
  matchType: 'exact' | 'keyword' | 'semantic';
}

/** 搜索请求 (WebView → Extension) */
export interface SearchRequest {
  type: 'search';
  query: string;
  category?: CommandCategory;
}

/** 搜索响应 (Extension → WebView) */
export interface SearchResponse {
  type: 'searchResults';
  results: SearchResult[];
  query: string;
  took: number;
}

/** 复制指令 (WebView → Extension) */
export interface CopyRequest {
  type: 'copy';
  text: string;
}

/** 获取详情 (WebView → Extension) */
export interface DetailRequest {
  type: 'getDetail';
  id: string;
}

/** 详情响应 (Extension → WebView) */
export interface DetailResponse {
  type: 'commandDetail';
  command: Command;
  relatedCommands: Command[];
}

/** 配置变更 (Extension → WebView) */
export interface ConfigUpdate {
  type: 'configUpdate';
  maxResults: number;
}

/** 触发更新 (WebView → Extension) */
export interface RefreshRequest {
  type: 'refresh';
}

/** 更新状态 (Extension → WebView) */
export interface UpdateStatus {
  type: 'updateStatus';
  text: string;
  updating: boolean;
}

/** 指令总数 (Extension → WebView) */
export interface CommandCount {
  type: 'commandCount';
  count: number;
}

/** WebView → Extension 消息联合类型 */
export type WebViewMessage = SearchRequest | CopyRequest | DetailRequest | RefreshRequest;

/** Extension → WebView 消息联合类型 */
export type ExtensionMessage = SearchResponse | DetailResponse | ConfigUpdate | UpdateStatus | CommandCount;
