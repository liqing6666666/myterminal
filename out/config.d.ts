export interface MyterminalConfig {
    enableEmbedding: boolean;
    deepseekApiKey: string;
    maxResults: number;
}
export declare function getConfig(): MyterminalConfig;
