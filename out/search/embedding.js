"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initEmbedding = initEmbedding;
exports.isEmbeddingReady = isEmbeddingReady;
exports.embeddingSearch = embeddingSearch;
let embedder = null;
let embeddingReady = false;
/** 动态导入 transformers，避免 sharp 缺失导致扩展激活失败 */
async function getTransformers() {
    try {
        return await Promise.resolve().then(() => __importStar(require('@xenova/transformers')));
    }
    catch {
        return null;
    }
}
/** 初始化 embedding pipeline */
async function initEmbedding() {
    try {
        const transformers = await getTransformers();
        if (!transformers) {
            console.warn('myterminal: @xenova/transformers unavailable, embedding disabled');
            return false;
        }
        const pipe = await transformers.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        embedder = async (texts) => {
            const results = [];
            for (const text of texts) {
                const output = await pipe(text, { pooling: 'mean', normalize: true });
                results.push(Array.from(output.data));
            }
            return results;
        };
        embeddingReady = true;
        return true;
    }
    catch (e) {
        console.warn('myterminal: embedding model failed to load:', e);
        embeddingReady = false;
        return false;
    }
}
function isEmbeddingReady() {
    return embeddingReady;
}
/** 构建指令文本（用于向量化） */
function buildCommandText(cmd) {
    return [
        cmd.name,
        ...cmd.aliases,
        cmd.description,
        ...cmd.tags,
        ...cmd.examples.map(e => e.desc),
    ].join(' ');
}
/** 余弦相似度 */
function cosineSimilarity(a, b) {
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
async function embeddingSearch(query, commands, topK = 5) {
    if (!embedder || !embeddingReady)
        return [];
    const queryVecs = await embedder([query]);
    const queryVec = queryVecs[0];
    const commandTexts = commands.map(buildCommandText);
    const commandVecs = await embedder(commandTexts);
    const results = [];
    for (let i = 0; i < commands.length; i++) {
        const score = cosineSimilarity(queryVec, commandVecs[i]) * 100;
        results.push({ command: commands[i], score, matchType: 'semantic' });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
}
//# sourceMappingURL=embedding.js.map