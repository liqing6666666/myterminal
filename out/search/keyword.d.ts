import { Command, SearchResult } from '../types';
/** 关键词搜索：精确匹配 + 模糊匹配 + 标签加权 */
export declare function keywordSearch(query: string, commands: Command[], topK?: number): SearchResult[];
