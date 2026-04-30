# myterminal — AI 指令查询智能体

**836 条精选命令，覆盖 20+ 开发工具方向，中文语义搜索，VS Code 侧边栏即开即用。**

---

## 功能

- 🔍 **中文语义搜索**：输入"查找大文件"找到 `find / -size +100M`
- 🏷️ **一键筛选**：17 个工具标签（Git / Docker / npm / pip / MySQL / Redis / K8s / Go ...），点击即列出该工具全部命令
- 📋 **详细示例**：每条指令含中文说明、语法格式、2-4 个实用示例
- 📎 **一键复制**：点击按钮直接复制命令到剪贴板
- 🔗 **关联推荐**：查看相关指令，触类旁通
- 🧠 **本地 AI 语义搜索**：Embedding 模型增强搜索精度，完全离线
- ⌨️ **快捷键**：`Ctrl+Shift+M` / `Cmd+Shift+M` 聚焦搜索框

---

## 安装与使用

1. 安装 .vsix 文件：`Ctrl+Shift+P` → `Extensions: Install from VSIX...`
2. 点击 VS Code 左侧活动栏 **`<?>`** 图标
3. 搜索框输入中文描述或英文指令名
4. 点击结果查看语法 + 示例 + 复制
5. 使用顶部标签快速筛选分类

---

## 数据统计

| 方向 | 数量 | 覆盖内容 |
|------|------|----------|
| **Linux 基础** | 288 | 文件管理、文本处理、系统管理、用户权限、进程、磁盘、网络、压缩、LVM、SELinux |
| **Windows CMD** | 119 | 文件目录、网络配置、系统信息、进程管理、磁盘、注册表、批处理、防火墙 |
| **Claude Code** | 39 | slash 命令、MCP 集成、审查工作流、调试策略、模型选择 |
| **OpenClaw** | 32 | CLI：setup、gateway、agents、models、channels、cron、plugins、skills、security |
| **Git** | 53 | init/clone、add/commit/push/pull、branch/merge/rebase、stash/reset、submodule/LFS |
| **Docker** | 47 | run/build/push、compose/swarm、network/volume、logs/stats、prune/system |
| **npm** | 32 | install/ci/audit、init/publish、run/test、link/pack、ls/view/search、config/cache |
| **pip** | 26 | install/uninstall、list/show/freeze、wheel/download、config/cache、requirements.txt |
| **apt** | 35 | update/install/remove/purge、search/show、policy/depends、source/build-dep、dpkg |
| **MySQL** | 41 | CRUD、JOIN/UNION/子查询、索引、用户权限、备份恢复、存储过程、触发器、binlog |
| **Redis** | 24 | STRING/HASH/LIST/SET/ZSET/Stream/Geo/Bitmap、事务、Lua、持久化、ACL、慢查询 |
| **kubectl** | 31 | get/describe/create/apply、exec/logs、scale/rollout、config/taint/cordon/drain |
| **Go** | 20 | build/run/test、mod/work、fmt/vet、get/install、env/doc、race/cross-compile |
| **SSH** | 12 | 连接、端口转发、config、keygen、copy-id、agent、跳板、scp/sftp、autossh |
| **vim** | 16 | 模式、导航、编辑、搜索替换、分屏/标签、可视、宏、寄存器、折叠、diff |
| **nginx** | 9 | CLI、systemctl、配置结构、location/代理、SSL、gzip 优化 |
| **brew** | 21 | install/uninstall、search/info、update/upgrade、services、bundle、pin、tap |
| **ffmpeg** | 8 | 格式转换、剪辑、压缩、GIF、音频、截图、水印 |
| **conda** | 16 | create/install、env export/import、list/search、update/clean、config/channel |
| **Java** | 10 | javac、jar、Maven 构建/依赖、Gradle 构建/依赖、java 运行 |
| **其他** | 32 | terraform、ansible、helm、nano、ranger、pytest、pyenv、poetry、uv、eslint、vite 等 |

---

## 搜索示例

| 输入 | 返回 |
|------|------|
| `查找大文件` | `find / -size +100M` |
| `磁盘空间` | `df -h` |
| `代码审查` | `/review` |
| `容器启动` | `docker run -d` |
| `数据库备份` | `mysqldump -u root -p` |
| `视频压缩` | `ffmpeg -i input.mp4 -crf 28` |
| `免密登录` | `ssh-copy-id` |
| `批量替换` | `sed 's/old/new/g'` |
| `查看端口` | `netstat -tulnp` |
| `git合并` | `git merge` |

---

## 版本

**v0.1.0** — 2026 年 5 月  
VS Code `^1.85.0` · 836 条内置指令 · 本地 Embedding 语义搜索  
@xenova/transformers + all-MiniLM-L6-v2

---

## 开发

```bash
cd myterminal
npm install
npm run compile
# 按 F5 启动调试
```
