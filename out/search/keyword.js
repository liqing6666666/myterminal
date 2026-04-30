"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keywordSearch = keywordSearch;
/** 关键词搜索：精确匹配 + 模糊匹配 + 标签加权 */
function keywordSearch(query, commands, topK = 50) {
    const q = query.toLowerCase().trim();
    if (!q)
        return [];
    const results = [];
    for (const cmd of commands) {
        let score = 0;
        let matchType = 'keyword';
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
//# sourceMappingURL=keyword.js.map