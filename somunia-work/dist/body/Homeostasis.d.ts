/**
 * Homeostasis - ホメオスタシス（恒常性維持）システム
 *
 * somuniaの内部状態のバランスを維持し、
 * 逸脱があれば行動を促す基盤システム
 *
 * 設計原則:
 * - 各種内部状態の「適正範囲」を定義
 * - 逸脱時に緊急度（urgency）を計算
 * - 行動システムへの入力として機能
 * - 感情・欲求と双方向に影響
 */
import { HomeostasisState, Normalized, Timestamp, Tick, EmotionType, UrgeType, ActionType, TimeOfDay } from '../types';
export interface HomeostasisConfig {
    regulationSpeed: number;
    urgencyMultiplier: number;
    deviationThreshold: number;
    criticalThreshold: number;
    noveltyDecay: number;
    connectionDecay: number;
    expressionDecay: number;
}
export interface HomeostasisChangeEvent {
    timestamp: Timestamp;
    variable: HomeostasisVariable;
    previousValue: Normalized;
    newValue: Normalized;
    urgencyChange: number;
    trigger: HomeostasisTrigger;
}
export type HomeostasisVariable = 'energy' | 'novelty' | 'safety' | 'connection' | 'expression';
export type HomeostasisTrigger = {
    type: 'natural_decay';
} | {
    type: 'time_passage';
    elapsed: number;
} | {
    type: 'action';
    action: ActionType;
} | {
    type: 'event';
    event: string;
} | {
    type: 'emotion_influence';
    emotion: EmotionType;
} | {
    type: 'urge_influence';
    urge: UrgeType;
} | {
    type: 'regulation';
    towards: 'optimal';
} | {
    type: 'external';
    source: string;
};
export declare class Homeostasis {
    private state;
    private config;
    private changeHistory;
    private lastUpdateTick;
    private lastUpdateTimestamp;
    constructor(config?: Partial<HomeostasisConfig>);
    /**
     * 初期状態を作成
     */
    private createInitialState;
    /**
     * 毎tickの更新
     */
    update(currentTick: Tick, timeOfDay: TimeOfDay, fatigueLevel: Normalized): HomeostasisChangeEvent[];
    /**
     * エネルギーの更新
     */
    private updateEnergy;
    /**
     * 新規性の更新
     */
    private updateNovelty;
    /**
     * 接続の更新
     */
    private updateConnection;
    /**
     * 表現の更新
     */
    private updateExpression;
    /**
     * 安全の更新
     */
    private updateSafety;
    /**
     * エネルギー緊急度
     */
    private calculateEnergyUrgency;
    /**
     * 新規性緊急度
     */
    private calculateNoveltyUrgency;
    /**
     * 安全緊急度
     */
    private calculateSafetyUrgency;
    /**
     * 接続緊急度
     */
    private calculateConnectionUrgency;
    /**
     * 表現緊急度
     */
    private calculateExpressionUrgency;
    /**
     * すべての緊急度を再計算
     */
    private recalculateAllUrgencies;
    /**
     * エネルギーを回復
     */
    restoreEnergy(amount: Normalized, source: string): HomeostasisChangeEvent;
    /**
     * エネルギーを消費
     */
    consumeEnergy(amount: Normalized, action: ActionType): HomeostasisChangeEvent;
    /**
     * 新規体験をした
     */
    experienceNovelty(intensity: Normalized): HomeostasisChangeEvent;
    /**
     * 接続を体験
     */
    experienceConnection(intensity: Normalized): HomeostasisChangeEvent;
    /**
     * 表現をした
     */
    express(intensity: Normalized, action: ActionType): HomeostasisChangeEvent;
    /**
     * 脅威を感じる
     */
    perceiveThreat(intensity: Normalized, source: string): HomeostasisChangeEvent;
    /**
     * 安心する
     */
    feelSafe(amount: Normalized): HomeostasisChangeEvent;
    /**
     * 現在の状態を取得
     */
    getState(): Readonly<HomeostasisState>;
    /**
     * 全体的な緊急度を取得
     */
    getOverallUrgency(): Normalized;
    /**
     * 最も緊急な変数を取得
     */
    getMostUrgent(): {
        variable: HomeostasisVariable;
        urgency: Normalized;
        description: string;
    } | null;
    /**
     * 危機的状態かどうか
     */
    isCritical(): boolean;
    /**
     * 不安定な変数を取得
     */
    getUnstableVariables(): HomeostasisVariable[];
    /**
     * 推奨される行動を取得
     */
    getRecommendedActions(): Array<{
        action: ActionType;
        reason: HomeostasisVariable;
        urgency: Normalized;
    }>;
    /**
     * サマリーを取得
     */
    getSummary(): {
        overall: 'stable' | 'unstable' | 'critical';
        energy: Normalized;
        description: string;
        recommendedAction: ActionType | null;
    };
    /**
     * 最近の変化履歴を取得
     */
    getRecentChanges(count?: number): HomeostasisChangeEvent[];
    /**
     * 統計を取得
     */
    getStats(): {
        averageEnergy: Normalized;
        criticalEventsCount: number;
        mostFrequentImbalance: HomeostasisVariable | null;
    };
    /**
     * 履歴をトリミング
     */
    private trimHistory;
    /**
     * 感情からの影響を受ける
     */
    applyEmotionInfluence(emotion: EmotionType, level: Normalized): void;
    /**
     * 欲求への影響を計算
     */
    getUrgeInfluences(): Partial<Record<UrgeType, Normalized>>;
    /**
     * JSON形式でエクスポート
     */
    toJSON(): object;
    /**
     * JSONからリストア
     */
    static fromJSON(json: any): Homeostasis;
}
export default Homeostasis;
//# sourceMappingURL=Homeostasis.d.ts.map