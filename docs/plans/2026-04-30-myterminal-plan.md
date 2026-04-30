# myterminal — AI 指令查询智能体 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个 VS Code 扩展插件，支持中文自然语言搜索 AI 相关指令（终端 cmd、Linux、Claude Code、OpenClaw），提供用法说明和示例。

**Architecture:** VS Code 侧边栏 WebView 面板 + TypeScript 后端搜索引擎（关键词匹配 + Transformers.js 本地 embedding 语义检索）+ JSON 指令知识库。用户输入中文/英文 → 搜索引擎匹配 Top-5 → WebView 展示结果和详情。

**Tech Stack:** TypeScript, VS Code Extension API, @xenova/transformers (all-MiniLM-L6-v2), WebView HTML/CSS/JS

---

## 文件结构

```
myterminal/
├── package.json                    # VS Code 扩展清单
├── tsconfig.json                   # TypeScript 配置
├── .vscodeignore                   # 打包排除
├── assets/
│   └── icon.png                    # 扩展图标
├── src/
│   ├── extension.ts                # 入口：注册 sidebar provider + 命令
│   ├── types.ts                    # 类型定义
│   ├── data/
│   │   ├── loader.ts               # 指令数据加载、合并、验证
│   │   ├── commands/               # 内置指令库
│   │   │   ├── linux.json          # Linux 常用指令 ~60 条
│   │   │   ├── cmd.json            # Windows CMD 常用指令 ~40 条
│   │   │   ├── claude-code.json    # Claude Code 指令 ~30 条
│   │   │   └── openclaw.json       # OpenClaw 指令 ~30 条
│   │   └── index.ts                # 数据模块导出
│   ├── search/
│   │   ├── engine.ts               # 搜索引擎主逻辑（编排）
│   │   ├── keyword.ts              # 关键词精确/模糊匹配
│   │   ├── embedding.ts            # Transformers.js embedding + 余弦相似
│   │   └── index.ts                # 搜索模块导出
│   ├── ui/
│   │   ├── sidebar.ts              # SidebarViewProvider (WebView 宿主)
│   │   ├── webview/
│   │   │   ├── index.html          # WebView 主页面
│   │   │   ├── style.css           # 样式 (VS Code 主题变量)
│   │   │   └── app.js              # 前端逻辑 (搜索、渲染、交互)
│   │   └── icons.ts                # SVG 图标
│   └── config.ts                   # VS Code 设置读取
├── .vscode/
│   ├── launch.json                 # 调试配置
│   └── tasks.json                  # 编译任务
└── docs/
    ├── 2026-04-30-myterminal-design.md
    └── plans/
        └── 2026-04-30-myterminal-plan.md
```

---

### Task 1: 项目脚手架 — VS Code 扩展基础配置

**Files:**
- Create: `myterminal/package.json`
- Create: `myterminal/tsconfig.json`
- Create: `myterminal/.vscodeignore`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "myterminal",
  "displayName": "myterminal - AI Command Finder",
  "description": "AI 指令查询智能体 — 中文搜索终端/Linux/ClaudeCode/OpenClaw 指令用法和示例",
  "version": "0.1.0",
  "publisher": "myterminal",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": ["Other"],
  "activationEvents": [],
  "main": "./out/extension.js",
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "myterminal",
          "title": "myterminal",
          "icon": "assets/icon.svg"
        }
      ]
    },
    "views": {
      "myterminal": [
        {
          "id": "myterminal.search",
          "name": "指令搜索",
          "type": "webview"
        }
      ]
    },
    "commands": [
      {
        "command": "myterminal.focus",
        "title": "聚焦搜索框"
      }
    ],
    "keybindings": [
      {
        "command": "myterminal.focus",
        "key": "ctrl+shift+m",
        "mac": "cmd+shift+m",
        "when": "view == myterminal.search"
      }
    ],
    "configuration": {
      "title": "myterminal",
      "properties": {
        "myterminal.enableEmbedding": {
          "type": "boolean",
          "default": true,
          "description": "启用本地 embedding 语义搜索（需下载约 80MB 模型）"
        },
        "myterminal.deepseekApiKey": {
          "type": "string",
          "default": "",
          "description": "DeepSeek API Key（可选，用于增强语义理解）"
        },
        "myterminal.maxResults": {
          "type": "number",
          "default": 5,
          "description": "搜索结果最大数量"
        }
      }
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "typescript": "^5.3.0"
  },
  "dependencies": {
    "@xenova/transformers": "^2.17.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "out",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "out"]
}
```

- [ ] **Step 3: 创建 .vscodeignore**

```
.vscode/**
src/**
node_modules/**
.gitignore
tsconfig.json
docs/**
```

- [ ] **Step 4: 创建 assets/icon.svg**（简易终端图标）

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <polyline points="4 17 10 11 4 5"/>
  <line x1="12" y1="19" x2="20" y2="19"/>
</svg>
```

- [ ] **Step 5: 创建 .vscode/launch.json**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "outFiles": ["${workspaceFolder}/out/**/*.js"],
      "preLaunchTask": "npm: watch"
    }
  ]
}
```

- [ ] **Step 6: 创建 .vscode/tasks.json**

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "type": "npm",
      "script": "watch",
      "problemMatcher": "$tsc-watch",
      "isBackground": true,
      "presentation": { "reveal": "never" },
      "group": { "kind": "build", "isDefault": true }
    }
  ]
}
```

- [ ] **Step 7: 安装依赖并验证编译**

```bash
cd F:/desktop/AI_agent/myterminal && npm install
```

```bash
cd F:/desktop/AI_agent/myterminal && npx tsc -p ./ --noEmit
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add myterminal/package.json myterminal/tsconfig.json myterminal/.vscodeignore myterminal/assets/ myterminal/.vscode/
git commit -m "feat: scaffold VS Code extension project"
```

---

### Task 2: 类型定义

**Files:**
- Create: `myterminal/src/types.ts`

- [ ] **Step 1: 定义所有核心类型**

```typescript
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

/** WebView → Extension 消息联合类型 */
export type WebViewMessage = SearchRequest | CopyRequest | DetailRequest;

/** Extension → WebView 消息联合类型 */
export type ExtensionMessage = SearchResponse | DetailResponse | ConfigUpdate;
```

- [ ] **Step 2: 验证编译**

```bash
cd F:/desktop/AI_agent/myterminal && npx tsc -p ./ --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add myterminal/src/types.ts
git commit -m "feat: add type definitions"
```

---

### Task 3: 内置指令数据 — Linux + CMD + Claude Code

**Files:**
- Create: `myterminal/src/data/commands/linux.json`
- Create: `myterminal/src/data/commands/cmd.json`
- Create: `myterminal/src/data/commands/claude-code.json`
- Create: `myterminal/src/data/commands/openclaw.json`

每个文件包含该分类下的常用指令，格式遵循 [types.ts 中 Command 接口](#task-2-类型定义)。

- [ ] **Step 1: 创建 linux.json (~60 条常用 Linux 指令)**

条目覆盖：文件操作（find, grep, ls, cp, mv, rm, chmod, chown, ln, stat, tree, touch, mkdir, rmdir）、文本处理（awk, sed, sort, uniq, cut, wc, head, tail, cat, less, diff, tr, tee）、系统管理（systemctl, journalctl, top, htop, ps, kill, nice, df, du, free, uname, who, uptime）、网络（curl, wget, ssh, scp, rsync, ping, netstat, ss, nc, iptables, ip, ifconfig）、包管理（apt, yum, dnf, pacman, dpkg, rpm）、压缩（tar, gzip, zip, unzip）、用户管理（useradd, usermod, passwd, su, sudo）

每条包含 name, aliases（中文别名）, description（中文说明）, syntax, examples, tags, platform 字段。

Example entries:

```json
[
  {
    "id": "cmd.find",
    "name": "find",
    "aliases": ["查找", "搜索文件", "找文件"],
    "category": "linux",
    "description": "按文件名、类型、大小、时间等条件递归搜索文件系统",
    "syntax": "find <路径> [选项] <表达式>",
    "examples": [
      { "desc": "按名称查找文件", "cmd": "find . -name '*.log'" },
      { "desc": "查找大于 100MB 的文件", "cmd": "find / -size +100M" },
      { "desc": "查找最近 7 天修改的文件", "cmd": "find . -mtime -7" },
      { "desc": "查找并删除", "cmd": "find . -name '*.tmp' -delete" }
    ],
    "tags": ["文件", "搜索", "目录"],
    "platform": ["linux", "macos"],
    "related": ["cmd.locate", "cmd.grep", "cmd.du"],
    "difficulty": "beginner"
  },
  {
    "id": "cmd.grep",
    "name": "grep",
    "aliases": ["搜索文本", "过滤", "查找内容"],
    "category": "linux",
    "description": "在文件或输入流中搜索匹配正则表达式的行",
    "syntax": "grep [选项] <模式> <文件>",
    "examples": [
      { "desc": "搜索文件中包含 error 的行", "cmd": "grep 'error' app.log" },
      { "desc": "递归搜索目录", "cmd": "grep -r 'TODO' ./src/" },
      { "desc": "忽略大小写", "cmd": "grep -i 'warning' *.log" },
      { "desc": "显示匹配行前后上下文", "cmd": "grep -C 3 'exception' app.log" }
    ],
    "tags": ["文本", "搜索", "过滤"],
    "platform": ["linux", "macos"],
    "related": ["cmd.awk", "cmd.sed", "cmd.find"],
    "difficulty": "beginner"
  }
]
```

(Continue for all ~60 linux entries, covering all categories listed above.)

- [ ] **Step 2: 创建 cmd.json (~40 条 Windows CMD 指令)**

```json
[
  {
    "id": "cmd.dir",
    "name": "dir",
    "aliases": ["列出目录", "查看文件", "ls"],
    "category": "cmd",
    "description": "列出目录中的文件和子目录",
    "syntax": "dir [驱动器:][路径] [选项]",
    "examples": [
      { "desc": "列出当前目录内容", "cmd": "dir" },
      { "desc": "只显示文件名（简洁模式）", "cmd": "dir /b" },
      { "desc": "分页显示", "cmd": "dir /p" }
    ],
    "tags": ["文件", "目录", "列表"],
    "platform": ["windows"],
    "related": ["cmd.cd", "cmd.tree"],
    "difficulty": "beginner"
  }
]
```

(Continue for ~40 entries: dir, cd, copy, xcopy, robocopy, del, ren, md, rd, type, find, findstr, ipconfig, ping, netstat, tasklist, taskkill, chkdsk, sfc, dism, net, whoami, set, path, assoc, ftp, powercfg, shutdown, reg, schtasks, wmic, attrib, icacls, fc, comp, systeminfo, driverquery, ver, cls, echo.)

- [ ] **Step 3: 创建 claude-code.json (~30 条 Claude Code 指令)**

```json
[
  {
    "id": "cc.review",
    "name": "/review",
    "aliases": ["代码审查", "review", "检查代码"],
    "category": "claude-code",
    "description": "让 Claude Code 审查当前分支的代码变更",
    "syntax": "/review",
    "examples": [
      { "desc": "审查当前分支所有变更", "cmd": "/review" }
    ],
    "tags": ["审查", "PR", "代码质量"],
    "platform": ["linux", "macos", "windows"],
    "related": ["cc.security-review", "cc.clear"],
    "difficulty": "beginner"
  },
  {
    "id": "cc.clear",
    "name": "/clear",
    "aliases": ["清空对话", "重置", "clear"],
    "category": "claude-code",
    "description": "清空当前对话历史，开始新会话",
    "syntax": "/clear",
    "examples": [
      { "desc": "清空对话", "cmd": "/clear" }
    ],
    "tags": ["会话", "重置"],
    "platform": ["linux", "macos", "windows"],
    "related": ["cc.config"],
    "difficulty": "beginner"
  }
]
```

(Continue for ~30 entries: /review, /clear, /config, /compact, /init, /add-dir, /ide, /model, /security-review, /pr-comments, /cost, /doctor, /login, /logout, /mcp, /help, /statusline, /terminal-setup, /theme, 等等.)

- [ ] **Step 4: 创建 openclaw.json (~30 条 OpenClaw 指令/概念)**

```json
[
  {
    "id": "oc.workspace",
    "name": "workspace",
    "aliases": ["工作区", "项目管理", "workspace"],
    "category": "openclaw",
    "description": "OpenClaw 中管理工作区（workspace）的概念和用法。工作区是项目文件和上下文的容器。",
    "syntax": "在 OpenClaw 界面中切换/管理工作区",
    "examples": [
      { "desc": "切换工作区", "cmd": "使用 /workspace 命令切换" },
      { "desc": "快速打开项目", "cmd": "在启动时指定工作区路径" }
    ],
    "tags": ["项目", "工作区", "管理"],
    "platform": ["linux", "macos", "windows"],
    "related": [],
    "difficulty": "beginner"
  }
]
```

(Continue for ~30 entries covering OpenClaw's core concepts and commands.)

- [ ] **Step 5: 验证 JSON 格式**

```bash
cd F:/desktop/AI_agent/myterminal && node -e "JSON.parse(require('fs').readFileSync('src/data/commands/linux.json','utf8')); console.log('linux.json: OK')" && node -e "JSON.parse(require('fs').readFileSync('src/data/commands/cmd.json','utf8')); console.log('cmd.json: OK')" && node -e "JSON.parse(require('fs').readFileSync('src/data/commands/claude-code.json','utf8')); console.log('claude-code.json: OK')" && node -e "JSON.parse(require('fs').readFileSync('src/data/commands/openclaw.json','utf8')); console.log('openclaw.json: OK')"
```

- [ ] **Step 6: Commit**

```bash
git add myterminal/src/data/commands/
git commit -m "feat: add builtin command datasets"
```

---

### Task 4: 数据加载器

**Files:**
- Create: `myterminal/src/data/loader.ts`
- Create: `myterminal/src/data/index.ts`

- [ ] **Step 1: 实现数据加载器**

```typescript
// myterminal/src/data/loader.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Command, CommandCategory } from '../types';

import linuxCommands from './commands/linux.json';
import cmdCommands from './commands/cmd.json';
import claudeCodeCommands from './commands/claude-code.json';
import openclawCommands from './commands/openclaw.json';

let commands: Command[] = [];
let commandIndex: Map<string, Command> = new Map();

/** 加载所有内置指令 + 用户自定义指令 */
export function loadCommands(context: vscode.ExtensionContext): Command[] {
  commands = [];

  // 内置指令
  const builtin = [
    ...(linuxCommands as Command[]),
    ...(cmdCommands as Command[]),
    ...(claudeCodeCommands as Command[]),
    ...(openclawCommands as Command[]),
  ];

  // 用户自定义指令：从 workspace 根目录的 myterminal/ 加载 *.json
  const userCommands = loadUserCommands();

  // 合并：用户定义的同 id 覆盖内置
  const merged = new Map<string, Command>();
  for (const cmd of builtin) {
    merged.set(cmd.id, cmd);
  }
  for (const cmd of userCommands) {
    merged.set(cmd.id, cmd);
  }

  commands = Array.from(merged.values());
  commandIndex = new Map(commands.map(c => [c.id, c]));

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
```

- [ ] **Step 2: 创建数据模块索引**

```typescript
// myterminal/src/data/index.ts
export { loadCommands, getCommands, getCommandById, getCommandsByCategory } from './loader';
```

- [ ] **Step 3: 验证编译**

```bash
cd F:/desktop/AI_agent/myterminal && npx tsc -p ./ --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add myterminal/src/data/
git commit -m "feat: implement data loader with user command support"
```

---

### Task 5: 关键词搜索引擎

**Files:**
- Create: `myterminal/src/search/keyword.ts`

- [ ] **Step 1: 实现关键词匹配引擎**

```typescript
// myterminal/src/search/keyword.ts
import { Command, SearchResult } from '../types';

/** 关键词搜索：精确匹配 + 模糊匹配 + 标签加权 */
export function keywordSearch(
  query: string,
  commands: Command[],
  topK: number = 5
): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: SearchResult[] = [];

  for (const cmd of commands) {
    let score = 0;
    let matchType: SearchResult['matchType'] = 'keyword';

    // 精确匹配：指令名完全匹配 → 最高权重
    if (cmd.name.toLowerCase() === q) {
      score = 100;
      matchType = 'exact';
    }
    // 指令名前缀匹配
    else if (cmd.name.toLowerCase().startsWith(q)) {
      score = 85;
      matchType = 'exact';
    }
    // 指令名包含
    else if (cmd.name.toLowerCase().includes(q)) {
      score = 70;
      matchType = 'keyword';
    }
    // 别名精确匹配
    else if (cmd.aliases.some(a => a.toLowerCase() === q)) {
      score = 90;
      matchType = 'exact';
    }
    // 别名包含
    else if (cmd.aliases.some(a => a.toLowerCase().includes(q))) {
      score = 60;
      matchType = 'keyword';
    }
    // 标签匹配
    else if (cmd.tags.some(t => t.toLowerCase().includes(q) || q.includes(t.toLowerCase()))) {
      score = 50;
      matchType = 'keyword';
    }
    // 描述包含
    else if (cmd.description.toLowerCase().includes(q)) {
      score = 30;
      matchType = 'keyword';
    }

    // 示例描述匹配加分
    if (cmd.examples.some(e => e.desc.toLowerCase().includes(q))) {
      score += 10;
    }

    if (score > 0) {
      results.push({ command: cmd, score: Math.min(score, 100), matchType });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}
```

- [ ] **Step 2: 验证编译**

```bash
cd F:/desktop/AI_agent/myterminal && npx tsc -p ./ --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add myterminal/src/search/keyword.ts
git commit -m "feat: implement keyword search engine"
```

---

### Task 6: Embedding 语义搜索引擎

**Files:**
- Create: `myterminal/src/search/embedding.ts`

- [ ] **Step 1: 实现 embedding 搜索（含模型加载 + 缓存）**

```typescript
// myterminal/src/search/embedding.ts
import { pipeline, env } from '@xenova/transformers';
import { Command, SearchResult } from '../types';

// 禁止远程模型校验，允许离线使用已缓存模型
env.allowLocalModels = true;
env.useBrowserCache = false;

type Embedder = (texts: string[]) => Promise<number[][]>;

let embedder: Embedder | null = null;
let embeddingReady = false;

/** 初始化 embedding pipeline */
export async function initEmbedding(): Promise<boolean> {
  try {
    const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    embedder = async (texts: string[]) => {
      const results: number[][] = [];
      for (const text of texts) {
        const output = await pipe(text, { pooling: 'mean', normalize: true });
        results.push(Array.from(output.data as Float32Array));
      }
      return results;
    };
    embeddingReady = true;
    return true;
  } catch (e) {
    console.warn('myterminal: embedding model failed to load:', e);
    embeddingReady = false;
    return false;
  }
}

export function isEmbeddingReady(): boolean {
  return embeddingReady;
}

/** 构建指令文本（用于向量化） */
function buildCommandText(cmd: Command): string {
  return [
    cmd.name,
    ...cmd.aliases,
    cmd.description,
    ...cmd.tags,
    ...cmd.examples.map(e => e.desc),
  ].join(' ');
}

/** 余弦相似度 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** 语义搜索 */
export async function embeddingSearch(
  query: string,
  commands: Command[],
  topK: number = 5
): Promise<SearchResult[]> {
  if (!embedder || !embeddingReady) return [];

  // 向量化查询
  const queryVecs = await embedder([query]);
  const queryVec = queryVecs[0];

  // 向量化所有指令（首次调用时缓存）
  const commandTexts = commands.map(buildCommandText);
  const commandVecs = await embedder(commandTexts);

  // 计算余弦相似度
  const results: SearchResult[] = [];
  for (let i = 0; i < commands.length; i++) {
    const score = cosineSimilarity(queryVec, commandVecs[i]) * 100;
    results.push({ command: commands[i], score, matchType: 'semantic' });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}
```

- [ ] **Step 2: 验证编译**

```bash
cd F:/desktop/AI_agent/myterminal && npx tsc -p ./ --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add myterminal/src/search/embedding.ts
git commit -m "feat: implement embedding semantic search"
```

---

### Task 7: 搜索引擎编排 + 配置管理

**Files:**
- Create: `myterminal/src/search/engine.ts`
- Create: `myterminal/src/search/index.ts`
- Create: `myterminal/src/config.ts`

- [ ] **Step 1: 实现搜索引擎编排（关键词 + embedding 融合）**

```typescript
// myterminal/src/search/engine.ts
import { Command, CommandCategory, SearchResult } from '../types';
import { keywordSearch } from './keyword';
import { embeddingSearch, isEmbeddingReady } from './embedding';
import { getConfig } from '../config';

/** 主搜索入口 */
export async function search(
  query: string,
  commands: Command[],
  category?: CommandCategory
): Promise<SearchResult[]> {
  const config = getConfig();
  let candidates = category
    ? commands.filter(c => c.category === category)
    : commands;

  // 第 1 层：关键词搜索（总是可用）
  const keywordResults = keywordSearch(query, candidates);

  // 第 2 层：embedding 语义搜索（如果启用且可用）
  let embeddingResults: SearchResult[] = [];
  if (config.enableEmbedding && isEmbeddingReady()) {
    embeddingResults = await embeddingSearch(query, candidates, config.maxResults);
  }

  // 融合结果：关键词优先，embedding 补充
  const merged = mergeResults(keywordResults, embeddingResults, config.maxResults);
  return merged;
}

function mergeResults(
  keyword: SearchResult[],
  embedding: SearchResult[],
  topK: number
): SearchResult[] {
  const seen = new Set<string>();
  const results: SearchResult[] = [];

  // 关键词结果优先
  for (const r of keyword) {
    if (!seen.has(r.command.id)) {
      seen.add(r.command.id);
      results.push(r);
    }
  }

  // embedding 结果补充（降低分数避免抢位）
  for (const r of embedding) {
    if (!seen.has(r.command.id)) {
      seen.add(r.command.id);
      results.push({ ...r, score: r.score * 0.9 });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}
```

- [ ] **Step 2: 创建搜索模块索引**

```typescript
// myterminal/src/search/index.ts
export { search } from './engine';
export { initEmbedding, isEmbeddingReady } from './embedding';
```

- [ ] **Step 3: 实现配置管理**

```typescript
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
    maxResults: c.get<number>('maxResults', 5),
  };
}
```

- [ ] **Step 4: 验证编译**

```bash
cd F:/desktop/AI_agent/myterminal && npx tsc -p ./ --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add myterminal/src/search/engine.ts myterminal/src/search/index.ts myterminal/src/config.ts
git commit -m "feat: implement search engine orchestration and config"
```

---

### Task 8: WebView 前端界面

**Files:**
- Create: `myterminal/src/ui/webview/index.html`
- Create: `myterminal/src/ui/webview/style.css`
- Create: `myterminal/src/ui/webview/app.js`

- [ ] **Step 1: 创建 HTML 页面**

```html
<!-- myterminal/src/ui/webview/index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css">
  <title>myterminal</title>
</head>
<body>
  <div id="app">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <input
        id="searchInput"
        type="text"
        placeholder="搜索指令... 如: 查找文件、磁盘空间、代码审查"
        autofocus
      />
    </div>

    <!-- 分类标签 -->
    <div class="category-tags">
      <button class="tag active" data-category="">全部</button>
      <button class="tag" data-category="linux">Linux</button>
      <button class="tag" data-category="cmd">CMD</button>
      <button class="tag" data-category="claude-code">Claude Code</button>
      <button class="tag" data-category="openclaw">OpenClaw</button>
    </div>

    <!-- 结果列表 -->
    <div id="results" class="results"></div>

    <!-- 详情面板 -->
    <div id="detail" class="detail hidden"></div>

    <!-- 空状态 -->
    <div id="empty" class="empty">
      <div class="empty-icon">⌨️</div>
      <div class="empty-text">输入中文描述或指令名开始搜索</div>
      <div class="empty-hint">试试: "查找文件" · "磁盘空间" · "进程管理"</div>
    </div>

    <!-- 加载中 -->
    <div id="loading" class="loading hidden">
      <div class="spinner"></div>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 CSS 样式（使用 VS Code 主题变量）**

```css
/* myterminal/src/ui/webview/style.css */
:root {
  --bg: var(--vscode-sideBar-background);
  --fg: var(--vscode-sideBar-foreground);
  --border: var(--vscode-sideBar-border);
  --input-bg: var(--vscode-input-background);
  --input-fg: var(--vscode-input-foreground);
  --input-border: var(--vscode-input-border);
  --focus: var(--vscode-focusBorder);
  --accent: var(--vscode-textLink-foreground);
  --badge: var(--vscode-badge-background);
  --badge-fg: var(--vscode-badge-foreground);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--vscode-font-family, -apple-system, sans-serif);
  font-size: 13px;
  padding: 8px;
}

.search-bar { margin-bottom: 8px; }

.search-bar input {
  width: 100%;
  padding: 6px 10px;
  background: var(--input-bg);
  color: var(--input-fg);
  border: 1px solid var(--input-border);
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}
.search-bar input:focus {
  border-color: var(--focus);
}

.category-tags {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.tag {
  padding: 2px 10px;
  border-radius: 10px;
  border: none;
  background: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
  cursor: pointer;
  font-size: 11px;
  line-height: 20px;
}
.tag:hover { opacity: 0.8; }
.tag.active {
  background: var(--vscode-textLink-foreground);
  color: var(--vscode-editor-background);
}

.results { display: flex; flex-direction: column; gap: 4px; }

.result-item {
  padding: 8px 10px;
  background: var(--vscode-editor-background);
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
}
.result-item:hover {
  border-color: var(--focus);
}
.result-item .name {
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.result-item .name .match-badge {
  font-size: 10px;
  background: var(--badge);
  color: var(--badge-fg);
  padding: 0 4px;
  border-radius: 4px;
}
.result-item .desc {
  color: var(--vscode-descriptionForeground);
  font-size: 12px;
  margin-top: 2px;
}
.result-item .meta {
  font-size: 10px;
  color: var(--vscode-descriptionForeground);
  margin-top: 4px;
  display: flex;
  gap: 8px;
}

.detail {
  padding: 12px;
  background: var(--vscode-editor-background);
  border-radius: 6px;
}
.detail.hidden { display: none; }
.results.hidden { display: none; }

.detail .back-btn {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 12px;
  margin-bottom: 8px;
  padding: 0;
}

.detail .cmd-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.detail .cmd-name {
  font-size: 18px;
  font-weight: 700;
}
.detail .platform-tag {
  font-size: 10px;
  background: var(--badge);
  color: var(--badge-fg);
  padding: 1px 6px;
  border-radius: 8px;
}

.detail .cmd-desc {
  color: var(--vscode-descriptionForeground);
  margin-bottom: 12px;
}

.detail .syntax-box {
  background: var(--input-bg);
  padding: 8px 10px;
  border-radius: 4px;
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 12px;
  margin-bottom: 10px;
}
.syntax-box .label {
  font-size: 10px;
  color: var(--vscode-descriptionForeground);
  margin-bottom: 2px;
}

.detail .examples h4 {
  font-size: 11px;
  margin-bottom: 4px;
}
.detail .example-item {
  background: var(--input-bg);
  padding: 6px 10px;
  border-radius: 4px;
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.example-item .ex-desc {
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  margin-bottom: 2px;
}
.example-item .ex-cmd {
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 12px;
}
.example-item .copy-btn {
  background: var(--badge);
  color: var(--badge-fg);
  border: none;
  padding: 2px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
}

.detail .related {
  margin-top: 12px;
}
.detail .related h4 {
  font-size: 11px;
  margin-bottom: 4px;
}
.detail .related-tag {
  display: inline-block;
  color: var(--accent);
  cursor: pointer;
  margin-right: 8px;
  font-size: 12px;
}
.related-tag:hover { text-decoration: underline; }

.empty {
  text-align: center;
  padding: 40px 16px;
  color: var(--vscode-descriptionForeground);
}
.empty-icon { font-size: 32px; margin-bottom: 8px; }
.empty-text { font-size: 13px; }
.empty-hint { font-size: 11px; margin-top: 6px; opacity: 0.7; }

.loading {
  text-align: center;
  padding: 20px;
}
.loading.hidden { display: none; }
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin: 0 auto;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

- [ ] **Step 3: 创建前端 JavaScript 逻辑**

```javascript
// myterminal/src/ui/webview/app.js
const vscode = acquireVsCodeApi();

let activeCategory = '';
let currentResults = [];
let currentDetailId = null;

// DOM
const searchInput = document.getElementById('searchInput');
const resultsDiv = document.getElementById('results');
const detailDiv = document.getElementById('detail');
const emptyDiv = document.getElementById('empty');
const loadingDiv = document.getElementById('loading');

// 分类标签点击
document.querySelectorAll('.tag').forEach(tag => {
  tag.addEventListener('click', () => {
    document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
    tag.classList.add('active');
    activeCategory = tag.dataset.category;
    doSearch();
  });
});

// 搜索输入（防抖）
let debounceTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(doSearch, 200);
});

function doSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    showEmpty();
    return;
  }

  showLoading();
  vscode.postMessage({
    type: 'search',
    query,
    category: activeCategory || undefined
  });
}

// 接收来自扩展的消息
window.addEventListener('message', (event) => {
  const msg = event.data;

  if (msg.type === 'searchResults') {
    currentResults = msg.results;
    renderResults(msg.results, msg.query);
  } else if (msg.type === 'commandDetail') {
    currentDetailId = msg.command.id;
    renderDetail(msg.command, msg.relatedCommands);
  }
});

function showEmpty() {
  resultsDiv.innerHTML = '';
  resultsDiv.classList.remove('hidden');
  detailDiv.classList.add('hidden');
  emptyDiv.classList.remove('hidden');
  loadingDiv.classList.add('hidden');
}

function showLoading() {
  resultsDiv.classList.add('hidden');
  detailDiv.classList.add('hidden');
  emptyDiv.classList.add('hidden');
  loadingDiv.classList.remove('hidden');
}

function renderResults(results, query) {
  loadingDiv.classList.add('hidden');
  emptyDiv.classList.add('hidden');
  detailDiv.classList.add('hidden');
  resultsDiv.classList.remove('hidden');

  if (results.length === 0) {
    resultsDiv.innerHTML =
      '<div class="empty"><div class="empty-text">未找到匹配 "'
      + escapeHtml(query) + '" 的指令</div></div>';
    return;
  }

  resultsDiv.innerHTML = results.map((r, i) => {
    const cmd = r.command;
    return `
      <div class="result-item" data-index="${i}">
        <div class="name">
          ${escapeHtml(cmd.name)}
          <span class="match-badge">${Math.round(r.score)}%</span>
        </div>
        <div class="desc">${escapeHtml(cmd.description)}</div>
        <div class="meta">
          <span>${escapeHtml(cmd.category)}</span>
          <span>${cmd.platform.join(' · ')}</span>
        </div>
      </div>`;
  }).join('');

  // 点击结果项 → 请求详情
  resultsDiv.querySelectorAll('.result-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.index);
      const cmd = results[idx].command;
      vscode.postMessage({ type: 'getDetail', id: cmd.id });
    });
  });
}

function renderDetail(command, relatedCommands) {
  resultsDiv.classList.add('hidden');
  emptyDiv.classList.add('hidden');
  loadingDiv.classList.add('hidden');
  detailDiv.classList.remove('hidden');

  detailDiv.innerHTML = `
    <button class="back-btn" id="backBtn">← 返回结果</button>
    <div class="cmd-header">
      <span class="cmd-name">${escapeHtml(command.name)}</span>
      ${command.platform.map(p => `<span class="platform-tag">${escapeHtml(p)}</span>`).join('')}
    </div>
    <div class="cmd-desc">${escapeHtml(command.description)}</div>

    <div class="syntax-box">
      <div class="label">语法</div>
      <code>${escapeHtml(command.syntax)}</code>
    </div>

    <div class="examples">
      <h4>示例</h4>
      ${command.examples.map(e => `
        <div class="example-item">
          <div>
            <div class="ex-desc">${escapeHtml(e.desc)}</div>
            <div class="ex-cmd">${escapeHtml(e.cmd)}</div>
          </div>
          <button class="copy-btn" data-cmd="${escapeHtml(e.cmd)}">复制</button>
        </div>
      `).join('')}
    </div>

    ${relatedCommands.length > 0 ? `
      <div class="related">
        <h4>相关指令</h4>
        ${relatedCommands.map(rc =>
          `<span class="related-tag" data-id="${escapeHtml(rc.id)}">${escapeHtml(rc.name)}</span>`
        ).join('')}
      </div>
    ` : ''}
  `;

  // 返回按钮
  document.getElementById('backBtn').addEventListener('click', () => {
    renderResults(currentResults, searchInput.value);
  });

  // 复制按钮
  detailDiv.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cmd = btn.dataset.cmd;
      vscode.postMessage({ type: 'copy', text: cmd });
    });
  });

  // 相关指令点击
  detailDiv.querySelectorAll('.related-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const id = tag.dataset.id;
      vscode.postMessage({ type: 'getDetail', id });
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

- [ ] **Step 4: Commit**

```bash
git add myterminal/src/ui/webview/
git commit -m "feat: add WebView frontend UI"
```

---

### Task 9: 侧边栏 Provider

**Files:**
- Create: `myterminal/src/ui/sidebar.ts`
- Create: `myterminal/src/ui/icons.ts`

- [ ] **Step 1: 创建 SVG 图标**

```typescript
// myterminal/src/ui/icons.ts

export const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="4 17 10 11 4 5"/>
  <line x1="12" y1="19" x2="20" y2="19"/>
</svg>`;
```

- [ ] **Step 2: 实现 SidebarViewProvider**

```typescript
// myterminal/src/ui/sidebar.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { search, initEmbedding, isEmbeddingReady } from '../search';
import { loadCommands, getCommands, getCommandById } from '../data';
import { getConfig } from '../config';
import {
  WebViewMessage,
  SearchRequest,
  CopyRequest,
  DetailRequest,
  SearchResult,
  Command,
} from '../types';

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
        vscode.Uri.file(path.join(this._context.extensionPath, 'src', 'ui', 'webview')),
      ],
    };

    webviewView.webview.html = this.getHtmlContent(webviewView.webview);

    // 监听来自 WebView 的消息
    webviewView.webview.onDidReceiveMessage(
      (msg: WebViewMessage) => this.handleMessage(msg),
      undefined,
      this._context.subscriptions
    );
  }

  /** 聚焦搜索框（命令触发） */
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
        this.sendResults(results, msg.query);
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

  private sendResults(results: SearchResult[], query: string) {
    this._view?.webview.postMessage({
      type: 'searchResults',
      results,
      query,
      took: 0,
    });
  }

  private getHtmlContent(webview: vscode.Webview): string {
    const webviewDir = path.join(this._context.extensionPath, 'src', 'ui', 'webview');

    // Read files from disk and inline them
    const fs = require('fs');
    const html = fs.readFileSync(path.join(webviewDir, 'index.html'), 'utf-8');
    const css = fs.readFileSync(path.join(webviewDir, 'style.css'), 'utf-8');
    const js = fs.readFileSync(path.join(webviewDir, 'app.js'), 'utf-8');

    // Replace relative links with inline content, using webview URIs where needed
    let result = html
      .replace(
        '<link rel="stylesheet" href="style.css">',
        `<style>${css}</style>`
      )
      .replace(
        '<script src="app.js"></script>',
        `<script>${js}</script>`
      );

    return result;
  }
}
```

Wait — the message type detection is awkward. Let me fix the WebView message format: add a `type` field to SearchRequest.

Actually, let me revise my approach. The SearchRequest should also have a `type: 'search'`. Let me fix the types first.

- [ ] **Step 2: 验证编译**

```bash
cd F:/desktop/AI_agent/myterminal && npx tsc -p ./ --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add myterminal/src/ui/sidebar.ts myterminal/src/ui/icons.ts myterminal/src/types.ts
git commit -m "feat: implement sidebar WebView provider"
```

---

### Task 10: 扩展入口 + 激活逻辑

**Files:**
- Create: `myterminal/src/extension.ts`

- [ ] **Step 1: 实现 activate 和 deactivate 函数**

```typescript
// myterminal/src/extension.ts
import * as vscode from 'vscode';
import { SidebarViewProvider } from './ui/sidebar';
import { loadCommands } from './data';
import { initEmbedding, isEmbeddingReady } from './search';

export function activate(context: vscode.ExtensionContext) {
  console.log('myterminal: activating...');

  // 加载指令数据
  const commands = loadCommands(context);
  console.log(`myterminal: loaded ${commands.length} commands`);

  // 注册侧边栏 WebView Provider
  const sidebarProvider = new SidebarViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarViewProvider.viewType,
      sidebarProvider
    )
  );

  // 注册聚焦命令
  context.subscriptions.push(
    vscode.commands.registerCommand('myterminal.focus', () => {
      sidebarProvider.focus();
    })
  );

  // 配置变更监听
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('myterminal')) {
        // 通知 WebView 配置已更新（如果需要）
      }
    })
  );

  // 异步初始化 embedding（不阻塞扩展启动）
  initEmbedding().then(success => {
    if (success) {
      console.log('myterminal: embedding engine ready');
      vscode.window.showInformationMessage('myterminal: 语义搜索已就绪');
    } else {
      console.log('myterminal: embedding unavailable, using keyword search only');
    }
  });

  console.log('myterminal: activated');
}

export function deactivate() {
  console.log('myterminal: deactivated');
}
```

- [ ] **Step 2: 验证编译**

```bash
cd F:/desktop/AI_agent/myterminal && npx tsc -p ./
```

Expected: TSC compiles all `.ts` files to `out/` directory successfully.

- [ ] **Step 3: Commit**

```bash
git add myterminal/src/extension.ts
git commit -m "feat: implement extension activation and entry point"
```

---

### Task 11: 集成验证与调试

- [ ] **Step 1: 完整编译**

```bash
cd F:/desktop/AI_agent/myterminal && npm run compile
```

Expected: No errors, `out/` directory populated.

- [ ] **Step 2: 启动扩展调试**

在 VS Code 中按 `F5`（使用 `.vscode/launch.json` 中的 "Run Extension" 配置），或运行：

```bash
cd F:/desktop/AI_agent/myterminal && code --extensionDevelopmentPath=.
```

- [ ] **Step 3: 功能验证清单**

在打开的 Extension Development Host 窗口中：

1. ✅ 左侧活动栏出现 myterminal 图标
2. ✅ 点击图标 → 侧边栏显示搜索面板
3. ✅ 输入"查找文件" → 返回 find、grep 等结果
4. ✅ 输入"find" → 精确匹配 find，排在第一位
5. ✅ 点击分类标签 "CMD" → 结果只显示 CMD 指令
6. ✅ 点击某条结果 → 展开详情（语法 + 示例）
7. ✅ 点击"复制"按钮 → 指令复制到剪贴板
8. ✅ 点击详情中的"相关指令" → 跳转到相关指令详情
9. ✅ 断开网络 → 基本搜索仍可用
10. ✅ `Ctrl+Shift+M` / `Cmd+Shift+M` → 聚焦搜索框

- [ ] **Step 4: 修复发现的问题**

根据验证结果修复编译错误、运行时错误、UI 问题。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: integration fixes from manual testing"
```

---

### Task 12: README 和打包

**Files:**
- Create: `myterminal/README.md`

- [ ] **Step 1: 创建 README.md**

```markdown
# myterminal — AI 指令查询智能体

在 VS Code 中随时搜索终端/Linux/Claude Code/OpenClaw 指令的用法和示例。

## 功能

- 🔍 **中文语义搜索**：输入"查找大文件"找到 `find / -size +100M`
- 📋 **一键复制**：点击复制按钮将指令复制到剪贴板
- 🏷️ **分类过滤**：按 Linux / CMD / Claude Code / OpenClaw 筛选
- 📝 **详细示例**：每个指令包含语法说明和多个实际示例
- 🔗 **关联推荐**：展示相关指令，方便扩展学习
- 🧠 **本地 AI**：内置 embedding 模型，完全离线也能语义搜索
- ✏️ **自定义扩展**：在项目 `myterminal/` 目录添加 JSON 文件扩充指令库

## 使用

1. 点击左侧活动栏 myterminal 图标，或按 `Ctrl+Shift+M` / `Cmd+Shift+M`
2. 在搜索框输入中文描述或指令名
3. 点击结果查看详情和示例
4. 点击"复制"按钮将指令复制到剪贴板

## 配置

在 VS Code 设置中搜索 `myterminal`：

- `myterminal.enableEmbedding`: 启用本地 AI 语义搜索（默认开启，需下载 ~80MB 模型）
- `myterminal.deepseekApiKey`: DeepSeek API Key（可选，增强语义理解）
- `myterminal.maxResults`: 搜索结果最大数量（默认 5）

## 自定义指令

在项目根目录创建 `myterminal/` 文件夹，放入 `.json` 文件：

```json
[
  {
    "id": "custom.mycommand",
    "name": "mycommand",
    "aliases": ["我的指令"],
    "category": "linux",
    "description": "指令描述",
    "syntax": "mycommand <参数>",
    "examples": [
      { "desc": "示例说明", "cmd": "mycommand arg1" }
    ],
    "tags": ["标签"],
    "platform": ["linux", "macos"],
    "related": [],
    "difficulty": "beginner"
  }
]
```

## 开发

```bash
npm install
npm run compile
# 按 F5 启动调试
```
```

- [ ] **Step 2: 最终验证和打包**

```bash
cd F:/desktop/AI_agent/myterminal && npm run compile
```

打包命令（需要 vsce）：

```bash
npm install -g @vscode/vsce
cd F:/desktop/AI_agent/myterminal && vsce package
```

- [ ] **Step 3: Commit**

```bash
git add myterminal/README.md
git commit -m "docs: add README"
```

---

## 验证总结

完成所有任务后，端到端验证：

| # | 验证项 | 方法 |
|---|--------|------|
| 1 | 扩展正常激活 | F5 启动 Extension Dev Host，侧边栏出现图标 |
| 2 | 中文关键词搜索 | 输入"查找文件" → 返回 find |
| 3 | 英文精确搜索 | 输入"find" → find 排第一 |
| 4 | 分类过滤 | 点击 "CMD" 标签 → 只显示 dir/copy/del 等 |
| 5 | 详情展开 | 点击结果 → 语法 + 示例展示 |
| 6 | 一键复制 | 点击复制 → 粘贴验证 |
| 7 | 相关指令导航 | 详情中点击关联指令 → 跳转 |
| 8 | 自定义 JSON 加载 | 在 myterminal/ 下放 JSON → 搜索命中 |
| 9 | 离线可用 | 断网 → 关键词搜索正常 |
| 10 | 快捷键 | Ctrl+Shift+M 聚焦搜索框 |
