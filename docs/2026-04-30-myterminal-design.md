# myterminal — AI 指令查询智能体 设计文档

## 概述

**myterminal** 是一个 VS Code 扩展插件，提供 AI 指令的语义搜索与查询功能。用户输入中文自然语言描述或指令名，即可获得对应指令的用法说明、语法、示例，以及相关指令推荐。

### 核心功能

- 中文自然语言语义搜索指令（如"查找大文件" → `find / -size +100M`）
- 精确指令名匹配（如直接搜 `find`）
- 按平台/分类过滤（终端 cmd、Linux、OpenClaw、Claude Code，可扩展）
- 一键复制指令到剪贴板
- 内置 ~200+ 条常用指令，支持用户自定义扩展
- 可选云端 API 增强语义理解和数据更新

## 架构

```
VS Code Extension UI (侧边栏面板)
    │
    ▼
Search Engine
    ├── 本地 embedding 向量检索 (all-MiniLM-L6-v2 + sqlite-vec)
    └── 精确关键词兜底
    │
    ▼
Knowledge Base
    ├── 内置指令库 (JSON, ~200 条)
    ├── 用户自定义库 (myterminal/*.json)
    └── 联网扩展 (可选)
```

## 技术选型

| 层级 | 技术 | 理由 |
|------|------|------|
| Extension | TypeScript + VS Code API | VS Code 原生扩展开发 |
| Embedding | all-MiniLM-L6-v2 (ONNX) | 384维，轻量(~120MB)，本地离线运行 |
| 向量存储 | sqlite-vec | SQLite 扩展，零配置，VS Code 内置 SQLite |
| 数据格式 | JSON | 易编辑，版本管理友好 |
| 增强 (可选) | DeepSeek API | 复杂语义重排序 + 联网数据拉取 |

## 数据模型

每条指令的结构：

```json
{
  "id": "cmd.find",
  "name": "find",
  "aliases": ["查找", "搜索文件"],
  "category": "linux",
  "description": "按文件名/类型/大小递归搜索文件系统",
  "syntax": "find <路径> -name <模式>",
  "examples": [
    {"desc": "查找所有 .log 文件", "cmd": "find . -name '*.log'"},
    {"desc": "查找大于 100MB 的文件", "cmd": "find / -size +100M"}
  ],
  "tags": ["文件", "搜索", "目录"],
  "platform": ["linux", "macos"],
  "related": ["cmd.locate", "cmd.grep"],
  "difficulty": "beginner"
}
```

### 字段说明

- `id`: 唯一标识，格式 `cmd.<指令名>`
- `name`: 指令英文全称
- `aliases`: 中文别名/搜索关键词
- `category`: 分类 (linux / cmd / claude-code / openclaw)
- `description`: 中文功能描述
- `syntax`: 语法格式
- `examples`: 示例数组，每条含 `desc`(中文描述) 和 `cmd`(具体指令)
- `tags`: 中文标签，用于精确匹配加权
- `platform`: 适用平台
- `related`: 相关指令 ID 列表
- `difficulty`: 难度级别 (beginner / intermediate / advanced)

## 搜索流程

```
用户输入 (中文/英文/拼音)
    │
    ├── ① 输入预处理 (去空格、简繁转换)
    │
    ├── ② 精确匹配检查 (指令名、aliases、tags)
    │   └── 命中 → 直接返回，权重最高
    │
    ├── ③ Embedding 向量化 (all-MiniLM-L6-v2)
    │
    ├── ④ sqlite-vec 余弦相似度检索 (Top-10)
    │
    ├── ⑤ 标签加权重排序 (tags 命中加分)
    │
    ├── ⑥ (可选) DeepSeek API 重排序
    │
    └── ⑦ 返回 Top-5 结果
```

## UI 设计

VS Code 侧边栏面板，3 种状态：

### 状态 1: 搜索态
- 搜索框（支持中文/英文/拼音输入）
- 分类标签栏（全部 / Linux / CMD / Claude Code / OpenClaw）
- 输入即搜，实时出结果

### 状态 2: 结果列表
- 按匹配度降序排列
- 每条显示：指令名、简介、适用平台、匹配百分比
- 点击展开详情

### 状态 3: 详情面板
- 指令名称 + 平台标签
- 中文功能说明
- 语法格式
- 示例列表（含中文说明 + 指令代码）
- "复制"按钮（一键复制指令）
- "相关指令"推荐

### 交互
- 快捷键唤起搜索面板（默认 `Ctrl+Shift+M` / `Cmd+Shift+M`）
- 结果项点击复制或展开详情
- 跟随 VS Code 深色/浅色主题

## 数据分层

| 层级 | 来源 | 说明 |
|------|------|------|
| 内置核心库 | 插件内置 | ~200 条精选指令，覆盖日常 90% 场景 |
| 用户自定义库 | `myterminal/` 目录下 JSON | 用户自行添加/覆盖，优先级高于内置 |
| 联网扩展 | GitHub raw / API | 可选配置，按需拉取最新文档 |

## 项目结构

```
myterminal/
├── package.json              # VS Code 扩展配置
├── src/
│   ├── extension.ts          # 入口，激活侧边栏
│   ├── search/
│   │   ├── engine.ts         # 搜索引擎主逻辑
│   │   ├── embedding.ts      # ONNX embedding 推理
│   │   └── vectordb.ts       # sqlite-vec 向量存储
│   ├── data/
│   │   ├── commands/         # 内置指令 JSON 文件
│   │   │   ├── linux.json
│   │   │   ├── cmd.json
│   │   │   ├── claude-code.json
│   │   │   └── openclaw.json
│   │   └── loader.ts         # 数据加载 + 合并
│   ├── ui/
│   │   ├── sidebar.ts        # 侧边栏 WebView Provider
│   │   └── webview/          # WebView 前端 (HTML/CSS/JS)
│   └── config.ts             # 配置管理
├── docs/
│   └── 2026-04-30-myterminal-design.md
└── README.md
```

## 验证计划

1. **功能验证**: 安装扩展后，打开 VS Code，侧边栏出现 myterminal 面板
2. **搜索验证**: 
   - 输入中文"查找文件" → 返回 find、grep 等
   - 输入"find" → 精确返回 find 指令
   - 切换分类标签 → 结果按分类过滤
3. **详情验证**: 点击结果 → 展开语法和示例 → 点击复制 → 粘贴验证
4. **自定义数据**: 在 myterminal/ 下放置自定义 JSON → 搜索能命中
5. **离线验证**: 断开网络 → 搜索功能正常（本地 embedding 工作）
