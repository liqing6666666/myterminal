// myterminal/src/search/embedding.ts
import { Command, SearchResult } from '../types';

type Embedder = (texts: string[]) => Promise<number[][]>;

let embedder: Embedder | null = null;
let embeddingReady = false;

/** 动态导入 transformers，避免 sharp 缺失导致扩展激活失败 */
async function getTransformers(): Promise<any> {
  try {
    return await import('@xenova/transformers');
  } catch {
    return null;
  }
}

/** 初始化 embedding pipeline */
export async function initEmbedding(): Promise<boolean> {
  try {
    const transformers = await getTransformers();
    if (!transformers) {
      console.warn('myterminal: @xenova/transformers unavailable, embedding disabled');
      return false;
    }

    const pipe = await transformers.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
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

  const queryVecs = await embedder([query]);
  const queryVec = queryVecs[0];

  const commandTexts = commands.map(buildCommandText);
  const commandVecs = await embedder(commandTexts);

  const results: SearchResult[] = [];
  for (let i = 0; i < commands.length; i++) {
    const score = cosineSimilarity(queryVec, commandVecs[i]) * 100;
    results.push({ command: commands[i], score, matchType: 'semantic' });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}
