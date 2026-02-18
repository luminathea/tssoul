/**
 * WikipediaAPI - Phase 6A: MediaWiki API実接続
 *
 * ja.wikipedia.orgのMediaWiki APIに直接接続し、
 * リアルタイムで記事を取得する。
 *
 * 設計思想:
 * - オンライン時はリアルAPI、オフライン時はスタブにフォールバック
 * - レート制限を遵守（1.2秒間隔）
 * - 取得した記事はディスク＋メモリにキャッシュ
 * - somuniaの興味に基づいた検索・探索が可能
 * - API応答をWikiArticle形式に正規化
 */
import { WikiArticle } from './WikipediaLearner';
/** API設定 */
export interface WikipediaAPIConfig {
    /** 言語 */
    language: 'ja' | 'en';
    /** リクエスト間の最小間隔（ms） */
    rateLimitMs: number;
    /** リクエストタイムアウト（ms） */
    timeoutMs: number;
    /** ユーザーエージェント */
    userAgent: string;
    /** ローカルキャッシュを使うか */
    enableCache: boolean;
    /** キャッシュディレクトリ */
    cacheDir: string;
    /** キャッシュ有効期間（ms） */
    cacheTTL: number;
    /** オフラインモードか */
    offlineMode: boolean;
    /** 最大取得セクション数 */
    maxSections: number;
    /** 最大リンク取得数 */
    maxLinks: number;
}
/** API検索結果 */
export interface WikiSearchResult {
    title: string;
    snippet: string;
    pageId: number;
    wordCount: number;
}
/** API接続ステータス */
export interface APIConnectionStatus {
    isOnline: boolean;
    lastSuccessAt: number | null;
    lastFailureAt: number | null;
    totalRequests: number;
    successCount: number;
    failureCount: number;
    cacheHits: number;
    cachedArticles: number;
    lastError: string | null;
}
export declare class WikipediaAPI {
    private config;
    private lastRequestTime;
    private status;
    private memoryCache;
    constructor(config?: Partial<WikipediaAPIConfig>);
    /** APIのベースURL */
    private get baseUrl();
    /**
     * 記事を取得（メモリキャッシュ → ディスクキャッシュ → API）
     */
    fetchArticle(title: string): Promise<WikiArticle | null>;
    /**
     * キーワードで記事を検索
     */
    search(query: string, limit?: number): Promise<WikiSearchResult[]>;
    /**
     * ランダム記事を取得
     */
    fetchRandomArticle(): Promise<WikiArticle | null>;
    /**
     * 記事のリンク先を取得
     */
    fetchLinks(title: string): Promise<string[]>;
    /**
     * 記事のカテゴリを取得
     */
    fetchCategories(title: string): Promise<string[]>;
    /**
     * MediaWiki parse APIで記事本文を取得しWikiArticleに変換
     */
    private fetchFromAPI;
    private htmlToPlainText;
    private extractSummary;
    private parseSections;
    private httpGet;
    private waitForRateLimit;
    private recordSuccess;
    private recordFailure;
    private loadFromDiskCache;
    private saveToDiskCache;
    private searchCache;
    private getRandomFromCache;
    private getCachePath;
    private ensureCacheDir;
    private countCachedArticles;
    private stripHtml;
    getStatus(): APIConnectionStatus;
    setOfflineMode(offline: boolean): void;
    testConnection(): Promise<boolean>;
    clearCache(): void;
    toJSON(): object;
    fromJSON(data: any): void;
}
//# sourceMappingURL=WikipediaAPI.d.ts.map