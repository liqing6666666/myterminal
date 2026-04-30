"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = search;
const keyword_1 = require("./keyword");
const embedding_1 = require("./embedding");
const config_1 = require("../config");
/** 主搜索入口 */
async function search(query, commands, category) {
    const config = (0, config_1.getConfig)();
    let candidates = category
        ? commands.filter(c => c.category === category)
        : commands;
    // 第 1 层：关键词搜索（总是可用）
    const keywordResults = (0, keyword_1.keywordSearch)(query, candidates);
    // 第 2 层：embedding 语义搜索（如果启用且可用）
    let embeddingResults = [];
    if (config.enableEmbedding && (0, embedding_1.isEmbeddingReady)()) {
        embeddingResults = await (0, embedding_1.embeddingSearch)(query, candidates, config.maxResults);
    }
    // 融合结果：关键词优先，embedding 补充
    const merged = mergeResults(keywordResults, embeddingResults, config.maxResults);
    return merged;
}
function mergeResults(keyword, embedding, topK) {
    const seen = new Set();
    const results = [];
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
//# sourceMappingURL=engine.js.map