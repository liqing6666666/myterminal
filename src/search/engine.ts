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
