/**
 * EpisodicMemorySystem - エピソード記憶システム
 *
 * somuniaが体験した出来事を記録・保存・想起する
 * 感情的に重要な記憶ほど強く保持される
 *
 * 設計原則:
 * - 記憶は時間とともに減衰（忘却曲線）
 * - 感情的強度が高い記憶は減衰が遅い
 * - 想起するたびに記憶が強化される
 * - 関連する記憶同士がネットワークを形成
 * - 大量の記憶を効率的に管理
 */
import { EpisodicMemory, EmotionType, Normalized, Timestamp, Tick, ID } from '../types';
export interface EpisodicMemoryConfig {
    baseForgetRate: number;
    emotionalRetentionBonus: number;
    recallStrengthening: number;
    maxMemories: number;
    deletionThreshold: number;
    associationThreshold: number;
}
export interface MemorySearchResult {
    memory: EpisodicMemory;
    relevance: Normalized;
    matchedCriteria: string[];
}
export interface MemoryFormationEvent {
    timestamp: Timestamp;
    memoryId: ID;
    type: 'formed' | 'recalled' | 'strengthened' | 'weakened' | 'forgotten' | 'associated';
    details: string;
}
export declare class EpisodicMemorySystem {
    private memories;
    private config;
    private eventLog;
    private lastMaintenanceTick;
    private emotionIndex;
    private conceptIndex;
    private timeIndex;
    constructor(config?: Partial<EpisodicMemoryConfig>);
    /**
     * 新しい記憶を形成
     */
    formMemory(params: {
        content: string;
        summary: string;
        emotionalTags: EmotionType[];
        emotionalIntensity: Normalized;
        relatedConcepts?: string[];
        duration?: number;
    }): EpisodicMemory;
    /**
     * 重要度を計算
     */
    private calculateImportance;
    /**
     * IDを生成
     */
    private generateId;
    /**
     * インデックスを更新
     */
    private updateIndices;
    /**
     * 日付キーを取得
     */
    private getDateKey;
    /**
     * 関連記憶を探して紐付け
     */
    private findAndAssociateMemories;
    /**
     * 記憶を想起
     */
    recall(memoryId: ID): EpisodicMemory | null;
    /**
     * 感情で記憶を検索
     */
    searchByEmotion(emotion: EmotionType, limit?: number): MemorySearchResult[];
    /**
     * 概念で記憶を検索
     */
    searchByConcept(concept: string, limit?: number): MemorySearchResult[];
    /**
     * 自由検索（内容から）
     */
    search(query: string, limit?: number): MemorySearchResult[];
    /**
     * 時間範囲で検索
     */
    searchByTimeRange(startTime: Timestamp, endTime: Timestamp, limit?: number): MemorySearchResult[];
    /**
     * 関連記憶を取得
     */
    getRelatedMemories(memoryId: ID, limit?: number): EpisodicMemory[];
    /**
     * ランダムな記憶を想起（懐かしさ、連想）
     */
    recallRandom(options?: {
        preferEmotion?: EmotionType;
        minImportance?: Normalized;
    }): EpisodicMemory | null;
    /**
     * 定期メンテナンス（忘却処理）
     */
    performMaintenance(currentTick: Tick): void;
    /**
     * 記憶を削除
     */
    private deleteMemory;
    /**
     * 容量制限を適用
     */
    private enforceCapacity;
    /**
     * イベントをログ
     */
    private logEvent;
    /**
     * 記憶を取得
     */
    getMemory(memoryId: ID): EpisodicMemory | null;
    /**
     * 記憶数を取得
     */
    getMemoryCount(): number;
    /**
     * 最近の記憶を取得
     */
    getRecentMemories(count?: number): EpisodicMemory[];
    /**
     * 最も重要な記憶を取得
     */
    getMostImportantMemories(count?: number): EpisodicMemory[];
    /**
     * 最も想起された記憶を取得
     */
    getMostRecalledMemories(count?: number): EpisodicMemory[];
    /**
     * 統計を取得
     */
    getStats(): {
        totalMemories: number;
        activeMemories: number;
        avgRetention: Normalized;
        avgImportance: Normalized;
        oldestMemory: Timestamp | null;
        newestMemory: Timestamp | null;
        emotionDistribution: Partial<Record<EmotionType, number>>;
    };
    /**
     * 最近のイベントを取得
     */
    getRecentEvents(count?: number): MemoryFormationEvent[];
    /**
     * サマリーを取得
     */
    getSummary(): {
        totalCount: number;
        recentHighlight: string | null;
        dominantEmotion: EmotionType | null;
    };
    /**
     * JSON形式でエクスポート
     */
    toJSON(): object;
    /**
     * JSONからリストア
     */
    static fromJSON(json: any): EpisodicMemorySystem;
}
export default EpisodicMemorySystem;
//# sourceMappingURL=EpisodicMemory.d.ts.map