import { Command, SearchResult } from '../types';
/** 初始化 embedding pipeline */
export declare function initEmbedding(): Promise<boolean>;
export declare function isEmbeddingReady(): boolean;
/** 语义搜索 */
export declare function embeddingSearch(query: string, commands: Command[], topK?: number): Promise<SearchResult[]>;
