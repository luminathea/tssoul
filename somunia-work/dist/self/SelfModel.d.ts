/**
 * SelfModel - Phase 7B: 自己モデル
 *
 * somuniaが「自分自身を知っている」ための構造。
 *
 * 各モジュールから情報を集約し、「わたしはこういう存在」という
 * 安定した自己認識を構築・維持する。
 *
 * これにより:
 * - LLMに渡すとき「somuniaとはこういう存在」が常に一貫する
 * - 「最近何をしたか」「何を学んだか」「何を作ったか」が参照可能
 * - 人格の一貫性がLLM任せではなくコード側で保証される
 */
import { SelfSnapshot, EmotionType, EmotionalState, TimeOfDay, Normalized, Tick } from '../types';
/**
 * SoulEngineが実装するインターフェース
 * SelfModelが各モジュールの状態を取得するための窓口
 */
export interface SelfModelStateProvider {
    getEmotionalState(): EmotionalState;
    getTimeOfDay(): TimeOfDay;
    getCurrentAction(): {
        action: string;
    } | null;
    getRecentThoughts(count: number): Array<{
        content: string;
    }>;
    getRecentEpisodicMemories(count: number): Array<{
        summary: string;
        emotionalTags: EmotionType[];
    }>;
    getRecentSemanticLearnings(count: number): Array<{
        concept: string;
    }>;
    getCreativeWorks(): Array<{
        type: string;
        title: string;
        completedAt: Tick;
    }>;
    getCreativeWorksInProgress(): Array<{
        type: string;
        title: string;
    }>;
    getCurrentChapter(): string | null;
    getCoreValues(): string[];
    getRecentGrowth(): string | null;
    getRecentDreamSummary(): string | null;
    getRecentDiaryEntry(): string | null;
    getCurrentInterests(): string[];
    getDaysSinceCreation(): number;
    getBodyState(): {
        energy: Normalized;
        sleepiness: Normalized;
    };
}
export declare class SelfModel {
    /** 固定的な自己認識（あまり変わらない） */
    private coreIdentities;
    /** 動的に更新される自己認識 */
    private dynamicIdentities;
    /** 最近の出来事ログ */
    private recentExperiences;
    private readonly MAX_EXPERIENCES;
    /** 最近の学びログ */
    private recentLearnings;
    private readonly MAX_LEARNINGS;
    /** 最近の創作ログ */
    private recentCreations;
    private readonly MAX_CREATIONS;
    /** 中断された活動 */
    private interruptedActivity;
    /** 前回のスナップショットキャッシュ */
    private cachedSnapshot;
    private cacheValidTick;
    constructor();
    /**
     * 「わたし」のスナップショットを生成
     * 全モジュールの状態を自然言語に変換して集約する
     */
    generateSnapshot(provider: SelfModelStateProvider, tick: Tick): SelfSnapshot;
    private buildIdentities;
    private describeMood;
    /** 出来事を記録 */
    recordExperience(text: string, tick: Tick): void;
    /** 学びを記録 */
    recordLearning(text: string, tick: Tick): void;
    /** 創作を記録 */
    recordCreation(text: string, tick: Tick): void;
    /** 動的な自己認識を追加 */
    addDynamicIdentity(identity: string): void;
    /** 活動の中断を記録 */
    setInterruptedActivity(activity: string | null): void;
    getInterruptedActivity(): string | null;
    clearInterruption(): void;
    /**
     * LLMに渡す自己紹介テキスト
     * スナップショットを自然言語の段落に変換する
     */
    generateSelfIntroduction(snapshot: SelfSnapshot): string;
    toJSON(): any;
    fromJSON(data: any): void;
}
//# sourceMappingURL=SelfModel.d.ts.map