/**
 * LearnEngine.ts - somuniaの学習エンジン
 *
 * 新しい知識を獲得し、既存の知識と統合する。
 * 学習は単なる情報の蓄積ではなく、
 * 理解と内省を伴う意味のある成長。
 */
import { EmotionType, TimeOfDay } from '../types';
/** 学習ソース */
export type LearningSource = 'wikipedia' | 'book' | 'observation' | 'reflection' | 'conversation' | 'experience' | 'dream';
/** 知識の種類 */
export type KnowledgeType = 'fact' | 'concept' | 'connection' | 'skill' | 'insight' | 'preference' | 'memory';
/** 学習アイテム */
export interface LearningItem {
    id: string;
    source: LearningSource;
    type: KnowledgeType;
    content: string;
    keywords: string[];
    comprehension: number;
    interest: number;
    relevance: number;
    emotionalResponse: Partial<Record<EmotionType, number>>;
    personalReflection?: string;
    learnedAt: Date;
    lastRecalled: Date;
    recallCount: number;
    consolidationLevel: number;
}
/** 学習セッション */
export interface LearningSession {
    id: string;
    startTime: Date;
    endTime?: Date;
    source: LearningSource;
    topic: string;
    items: LearningItem[];
    satisfaction: number;
    fatigue: number;
    discoveries: number;
    connections: number;
    summary?: string;
}
/** 学習目標 */
export interface LearningGoal {
    id: string;
    topic: string;
    reason: string;
    progress: number;
    relatedItems: string[];
    createdAt: Date;
    deadline?: Date;
    completed: boolean;
}
/** 学習の傾向 */
export interface LearningTendency {
    preferredSources: LearningSource[];
    preferredTopics: string[];
    learningPeakTime: TimeOfDay;
    averageSessionLength: number;
    retentionRate: number;
    curiosityLevel: number;
}
/** 学習統計 */
export interface LearningStats {
    totalItems: number;
    itemsByType: Record<KnowledgeType, number>;
    itemsBySource: Record<LearningSource, number>;
    averageComprehension: number;
    averageInterest: number;
    totalSessions: number;
    recentTopics: string[];
    strongestAreas: string[];
}
export interface LearnEngineConfig {
    maxItems: number;
    maxSessions: number;
    maxGoals: number;
    baseComprehension: number;
    interestBoost: number;
    consolidationRate: number;
    decayRate: number;
    fatiguePerItem: number;
    recoveryRate: number;
}
export declare class LearnEngine {
    private config;
    private items;
    private sessions;
    private goals;
    private currentSession;
    private currentFatigue;
    private tendency;
    constructor(config?: Partial<LearnEngineConfig>);
    /**
     * 学習セッションを開始
     */
    startSession(source: LearningSource, topic: string): LearningSession;
    /**
     * 学習セッションを終了
     */
    endSession(): LearningSession | null;
    /**
     * 新しい知識を学習
     */
    learn(content: string, source: LearningSource, type: KnowledgeType, keywords: string[], options?: {
        emotionalResponse?: Partial<Record<EmotionType, number>>;
        personalReflection?: string;
    }): LearningItem;
    /**
     * 内省的な学習（観察や思考から）
     */
    learnFromReflection(thought: string, relatedKeywords: string[]): LearningItem;
    /**
     * 経験からの学習
     */
    learnFromExperience(experience: string, outcome: 'positive' | 'negative' | 'neutral', keywords: string[]): LearningItem;
    /**
     * キーワードで知識を検索
     */
    recall(keywords: string[], limit?: number): LearningItem[];
    /**
     * 関連アイテムを見つける
     */
    findRelatedItems(keywords: string[], excludeId?: string): LearningItem[];
    /**
     * ランダムに知識を思い出す（連想）
     */
    randomRecall(): LearningItem | null;
    /**
     * 学習目標を設定
     */
    setGoal(topic: string, reason: string, deadline?: Date): LearningGoal;
    /**
     * 目標の進捗を更新
     */
    private updateGoalProgress;
    /**
     * アクティブな目標を取得
     */
    getActiveGoals(): LearningGoal[];
    private calculateInterest;
    private calculateRelevance;
    private generateEmotionalResponse;
    private evaluateSessionSatisfaction;
    private generateSessionSummary;
    private updateTendency;
    private pruneOldItems;
    /**
     * 疲労を回復
     */
    recover(amount?: number): void;
    /**
     * 学習可能かチェック
     */
    canLearn(): boolean;
    getFatigue(): number;
    /**
     * 時間経過による忘却をシミュレート
     */
    applyDecay(): void;
    /**
     * 睡眠による知識の整理
     */
    consolidateDuringSleep(): {
        strengthened: number;
        forgotten: number;
    };
    getStats(): LearningStats;
    getTendency(): LearningTendency;
    private generateId;
    getItem(id: string): LearningItem | null;
    getAllItems(): LearningItem[];
    getRecentSessions(count?: number): LearningSession[];
    getCurrentSession(): LearningSession | null;
    serialize(): Record<string, any>;
    static deserialize(data: ReturnType<LearnEngine['serialize']>): LearnEngine;
}
export default LearnEngine;
//# sourceMappingURL=LearnEngine.d.ts.map