/**
 * WikipediaLearner - somuniaのWikipedia学習システム
 *
 * 古いPCでWikipediaを探索し、知識を獲得する
 * 単なる情報収集ではなく、somuniaらしい詩的な解釈と発見の喜びを含む
 */
import { APIConnectionStatus, WikiSearchResult } from './WikipediaAPI';
/** Wikipedia記事の構造 */
export interface WikiArticle {
    /** 記事タイトル */
    title: string;
    /** 記事URL */
    url: string;
    /** 要約（最初の段落） */
    summary: string;
    /** 本文セクション */
    sections: WikiSection[];
    /** カテゴリ */
    categories: string[];
    /** 関連記事へのリンク */
    links: string[];
    /** 取得日時 */
    fetchedAt: number;
    /** 記事の言語 */
    language: 'ja' | 'en';
}
/** 記事のセクション */
export interface WikiSection {
    /** セクション見出し */
    heading: string;
    /** セクション本文 */
    content: string;
    /** サブセクション */
    subsections?: WikiSection[];
}
/** 探索セッション */
export interface ExplorationSession {
    /** セッションID */
    id: string;
    /** 開始時刻 */
    startedAt: number;
    /** 終了時刻 */
    endedAt?: number;
    /** 開始トピック */
    startTopic: string;
    /** 訪れた記事 */
    visitedArticles: VisitedArticle[];
    /** 探索の軌跡（トピックの連鎖） */
    explorationPath: string[];
    /** セッション中の発見 */
    discoveries: Discovery[];
    /** 全体の感想 */
    overallImpression?: string;
    /** 疲労度 */
    fatigue: number;
    /** 満足度 */
    satisfaction: number;
}
/** 訪れた記事の記録 */
export interface VisitedArticle {
    /** 記事タイトル */
    title: string;
    /** 訪問時刻 */
    visitedAt: number;
    /** 滞在時間（ミリ秒） */
    timeSpent: number;
    /** 読んだセクション */
    sectionsRead: string[];
    /** 興味度 */
    interestLevel: number;
    /** 理解度 */
    comprehension: number;
    /** 感想・メモ */
    notes: string[];
    /** 心に残った言葉 */
    memorableWords: string[];
    /** 次に辿ったリンク */
    followedLink?: string;
}
/** 発見 */
export interface Discovery {
    /** 発見の種類 */
    type: 'fact' | 'connection' | 'beauty' | 'question' | 'resonance';
    /** 内容 */
    content: string;
    /** 関連記事 */
    relatedArticle: string;
    /** 感情的反応 */
    emotionalResponse: string;
    /** 重要度 */
    significance: number;
    /** 発見時刻 */
    discoveredAt: number;
}
/** 探索の動機 */
export interface ExplorationMotivation {
    /** 動機の種類 */
    type: 'curiosity' | 'boredom' | 'specific_interest' | 'random' | 'continuation';
    /** 具体的なトピック（あれば） */
    topic?: string;
    /** 動機の強さ */
    intensity: number;
    /** きっかけ */
    trigger?: string;
}
/** 読書スタイル */
export interface ReadingStyle {
    /** 深読み vs 斜め読み */
    depth: 'deep' | 'skim' | 'selective';
    /** 集中度 */
    focus: number;
    /** メモを取るか */
    takeNotes: boolean;
    /** リンクを辿る傾向 */
    linkFollowTendency: number;
}
/** 学習者の状態 */
export interface LearnerState {
    /** 現在のセッション */
    currentSession?: ExplorationSession;
    /** 過去のセッション */
    pastSessions: ExplorationSession[];
    /** お気に入りのトピック */
    favoriteTopics: FavoriteTopic[];
    /** 探索履歴（記事タイトルと訪問回数） */
    visitHistory: Map<string, number>;
    /** 累計探索時間 */
    totalExplorationTime: number;
    /** 累計発見数 */
    totalDiscoveries: number;
}
/** お気に入りトピック */
export interface FavoriteTopic {
    /** トピック名 */
    topic: string;
    /** 訪問回数 */
    visitCount: number;
    /** 最終訪問 */
    lastVisited: number;
    /** 関連発見 */
    relatedDiscoveries: number;
    /** 愛着度 */
    affection: number;
}
/** 設定 */
export interface WikipediaLearnerConfig {
    /** 最大セッション履歴 */
    maxSessionHistory: number;
    /** 最大お気に入りトピック */
    maxFavoriteTopics: number;
    /** 基本読書速度（文字/分） */
    baseReadingSpeed: number;
    /** 疲労による速度低下率 */
    fatigueSpeedReduction: number;
    /** 興味による速度変化 */
    interestSpeedModifier: number;
    /** リンク追跡の基本確率 */
    baseLinkFollowProbability: number;
    /** セッション最大時間（ミリ秒） */
    maxSessionDuration: number;
    /** 疲労蓄積率 */
    fatigueRate: number;
    /** 発見による満足度 */
    discoveryReward: number;
}
export declare class WikipediaLearner {
    private state;
    private config;
    private yuragi;
    private articleDatabase;
    private api;
    constructor(config?: Partial<WikipediaLearnerConfig>);
    /**
     * 探索セッションを開始
     */
    startExploration(motivation: ExplorationMotivation): ExplorationSession;
    /**
     * ランダムな開始トピックを選択
     */
    private chooseRandomStartTopic;
    /**
     * 記事を読む
     */
    readArticle(title: string, style: ReadingStyle, currentFatigue: number, currentMood: number): Promise<VisitedArticle | null>;
    /**
     * 興味度を計算
     */
    private calculateInterest;
    /**
     * 読むセクションを決定
     */
    private decideSectionsToRead;
    /**
     * セクションへの興味を計算
     */
    private calculateSectionInterest;
    /**
     * 読書時間を計算
     */
    private calculateReadingTime;
    /**
     * 理解度を計算
     */
    private calculateComprehension;
    /**
     * 心に残る言葉を抽出
     */
    private extractMemorableWords;
    /**
     * 感想・メモを生成
     */
    private generateNotes;
    /**
     * 発見をチェック
     */
    private checkForDiscoveries;
    /**
     * 記事間の関連性を見つける
     */
    private findConnection;
    /**
     * 次に辿るリンクを決定
     */
    private decideNextLink;
    /**
     * リンクへの興味を計算
     */
    private calculateLinkInterest;
    /**
     * お気に入りトピックを更新
     */
    private updateFavoriteTopics;
    /**
     * 記事からトピックを抽出
     */
    private extractTopics;
    /**
     * 探索セッションを終了
     */
    endExploration(): ExplorationSession | null;
    /**
     * セッションの感想を生成
     */
    private generateSessionImpression;
    /**
     * 記事を取得
     */
    /**
     * 記事を取得（ローカルDB優先、なければundefined）
     */
    getArticle(title: string): WikiArticle | undefined;
    /**
     * Phase 6A: オンラインAPIから記事を取得（非同期）
     * ローカルDBにない場合、リアルAPIに接続してDBに追加
     */
    fetchArticleOnline(title: string): Promise<WikiArticle | null>;
    /**
     * Phase 6A: オンライン検索
     */
    searchOnline(query: string, limit?: number): Promise<WikiSearchResult[]>;
    /**
     * Phase 6A: ランダム記事を取得
     */
    fetchRandomOnline(): Promise<WikiArticle | null>;
    /**
     * Phase 6A: API接続ステータス
     */
    getAPIStatus(): APIConnectionStatus;
    /**
     * Phase 6A: 接続テスト
     */
    testAPIConnection(): Promise<boolean>;
    /**
     * Phase 6A: オフラインモード切替
     */
    setOfflineMode(offline: boolean): void;
    /**
     * 模擬記事データベースを初期化
     */
    private initializeArticleDatabase;
    /**
     * 記事を追加
     */
    private addArticle;
    /**
     * 記事を検索（タイトルの部分一致）
     */
    searchArticles(query: string): WikiArticle[];
    /**
     * ランダムな記事を取得
     */
    getRandomArticle(): WikiArticle | undefined;
    /**
     * 重み付きランダム選択
     */
    private weightedRandom;
    /**
     * セッションIDを生成
     */
    private generateSessionId;
    getState(): LearnerState;
    getCurrentSession(): ExplorationSession | undefined;
    getFavoriteTopics(): FavoriteTopic[];
    /**
     * 統計を取得
     */
    getStatistics(): {
        totalSessions: number;
        totalArticlesRead: number;
        totalExplorationTime: number;
        totalDiscoveries: number;
        topFavoriteTopics: string[];
        averageSessionLength: number;
        mostVisitedArticles: {
            title: string;
            count: number;
        }[];
    };
    serialize(): object;
    static deserialize(data: any): WikipediaLearner;
}
//# sourceMappingURL=WikipediaLearner.d.ts.map