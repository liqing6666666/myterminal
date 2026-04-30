import { Command, CommandCategory, SearchResult } from '../types';
/** 主搜索入口 */
export declare function search(query: string, commands: Command[], category?: CommandCategory): Promise<SearchResult[]>;
