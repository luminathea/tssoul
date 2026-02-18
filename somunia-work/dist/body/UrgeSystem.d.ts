/**
 * UrgeSystem - 欲求システム
 *
 * somuniaの内的動機を管理し、行動の原動力となる
 * LLMに依存せず、コードベースで欲求の変化を処理
 *
 * 設計原則:
 * - 欲求は時間経過で自然に増加
 * - 特定の行動により欲求が満たされる
 * - 欲求間の葛藤（conflict）が存在
 * - 感情とホメオスタシスと相互作用
 * - somuniaらしい欲求の優先度
 */
import { UrgeType, UrgeSystemState, UrgeConflict, EmotionType, Normalized, Timestamp, Tick, ID, ActionType, TimeOfDay } from '../types';
export interface UrgeSystemConfig {
    baseGrowthRate: number;
    maxSatisfactionRate: number;
    conflictThreshold: number;
    dominanceThreshold: number;
    minimumLevel: number;
    urgentThreshold: number;
}
export interface UrgeChangeEvent {
    timestamp: Timestamp;
    urge: UrgeType;
    previousLevel: Normalized;
    newLevel: Normalized;
    trigger: UrgeTrigger;
}
export type UrgeTrigger = {
    type: 'natural_growth';
} | {
    type: 'time_influence';
    timeOfDay: TimeOfDay;
} | {
    type: 'emotion_influence';
    emotion: EmotionType;
} | {
    type: 'action_satisfaction';
    action: ActionType;
} | {
    type: 'suppression';
    by: UrgeType;
} | {
    type: 'external';
    source: string;
} | {
    type: 'conflict_resolution';
    otherUrge: UrgeType;
};
export declare class UrgeSystem {
    private state;
    private config;
    private changeHistory;
    private lastUpdateTick;
    constructor(config?: Partial<UrgeSystemConfig>);
    /**
     * 初期状態を作成 - somuniaの性格に基づく
     */
    private createInitialState;
    /**
     * 初期レベルを計算
     */
    private calculateInitialLevel;
    /**
     * 毎tickの更新
     */
    update(currentTick: Tick, timeOfDay: TimeOfDay, emotionLevels: Partial<Record<EmotionType, Normalized>>): UrgeChangeEvent[];
    /**
     * 自然な欲求増加
     */
    private applyNaturalGrowth;
    /**
     * 時間帯の影響を適用
     */
    private applyTimeInfluence;
    /**
     * 感情の影響を適用
     */
    private applyEmotionInfluence;
    /**
     * 欲求間の抑制を適用
     */
    private applySuppression;
    /**
     * 葛藤を検出
     */
    private detectConflicts;
    /**
     * 支配的欲求を見つける
     */
    private findDominantUrge;
    /**
     * 欲求を正規化
     */
    private normalizeUrges;
    /**
     * 行動による欲求の満足
     */
    satisfyByAction(action: ActionType, intensity?: Normalized): UrgeChangeEvent[];
    /**
     * 特定の欲求を直接満足
     */
    satisfyUrge(urgeType: UrgeType, amount: Normalized, source: string): UrgeChangeEvent | null;
    /**
     * 特定の欲求を増加
     */
    increaseUrge(urgeType: UrgeType, amount: Normalized, source: string): UrgeChangeEvent | null;
    /**
     * 記憶を欲求に関連付け
     */
    associateMemory(urgeType: UrgeType, memoryId: ID): void;
    /**
     * 葛藤を解決しようとする
     */
    attemptResolveConflict(conflict: UrgeConflict): {
        resolved: boolean;
        winner: UrgeType | null;
        action?: string;
    };
    /**
     * 現在の状態を取得
     */
    getState(): Readonly<UrgeSystemState>;
    /**
     * 特定の欲求レベルを取得
     */
    getUrgeLevel(urge: UrgeType): Normalized;
    /**
     * 支配的欲求を取得
     */
    getDominantUrge(): UrgeType | null;
    /**
     * 緊急の欲求を取得（閾値以上）
     */
    getUrgentUrges(): Array<{
        urge: UrgeType;
        level: Normalized;
    }>;
    /**
     * アクティブな欲求を取得（0.3以上）
     */
    getActiveUrges(): Array<{
        urge: UrgeType;
        level: Normalized;
        priority: Normalized;
    }>;
    /**
     * 現在の葛藤を取得
     */
    getConflicts(): UrgeConflict[];
    /**
     * 行動の推奨を取得
     */
    getRecommendedActions(): Array<{
        action: ActionType;
        urgency: Normalized;
        satisfies: UrgeType[];
    }>;
    /**
     * 欲求のサマリーを取得
     */
    getSummary(): {
        dominant: UrgeType | null;
        urgent: UrgeType[];
        conflicting: [UrgeType, UrgeType][];
        description: string;
    };
    /**
     * 欲求の描写を生成
     */
    private generateUrgeDescription;
    /**
     * 最近の変化履歴を取得
     */
    getRecentChanges(count?: number): UrgeChangeEvent[];
    /**
     * 統計を取得
     */
    getStats(): {
        totalSatisfactions: number;
        mostFrequentUrge: UrgeType | null;
        averageLevel: Normalized;
        conflictCount: number;
    };
    /**
     * 履歴をトリミング
     */
    private trimHistory;
    /**
     * JSON形式でエクスポート
     */
    toJSON(): object;
    /**
     * JSONからリストア
     */
    static fromJSON(json: any): UrgeSystem;
}
export default UrgeSystem;
//# sourceMappingURL=UrgeSystem.d.ts.map