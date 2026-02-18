/**
 * EmotionEngine - 感情エンジン
 *
 * somuniaの感情状態を管理し、状況に応じて感情を生成・変化させる
 * LLMに依存せず、コードベースで感情の遷移を処理
 *
 * 設計原則:
 * - 感情は複数が同時に存在できる（多重感情）
 * - 感情には慣性（momentum）がある
 * - 環境・行動・記憶から感情が生まれる
 * - 揺らぎによる非合理的な感情変化もある
 */
import { EmotionalState, EmotionType, EmotionPattern, SituationDescriptor, TimeOfDay, Normalized, Timestamp, Tick, ID } from '../types';
export interface EmotionEngineConfig {
    decayRate: number;
    momentumRetention: number;
    activationThreshold: number;
    primaryThreshold: number;
    maxChangePerTick: number;
    emotionInteractionStrength: number;
}
/** 感情自己修正の記録 */
interface EmotionSelfCorrection {
    type: 'desensitize' | 'reduce_idle' | 'break_stagnation' | 'diversity_boost' | 'coupling_adjust' | 'baseline_adapt' | 'external_adjust';
    target: EmotionType;
    description: string;
    adjustment: number;
    reason: string;
    timestamp: number;
}
export interface EmotionChangeEvent {
    timestamp: Timestamp;
    trigger: EmotionTrigger;
    changes: EmotionChange[];
}
export interface EmotionChange {
    emotion: EmotionType;
    previousLevel: Normalized;
    newLevel: Normalized;
    delta: number;
}
export type EmotionTrigger = {
    type: 'pattern';
    patternId: ID;
} | {
    type: 'decay';
} | {
    type: 'time';
    timeOfDay: TimeOfDay;
} | {
    type: 'event';
    eventName: string;
} | {
    type: 'visitor';
    event: 'arrived' | 'departed' | 'message';
} | {
    type: 'action';
    action: string;
    outcome: 'started' | 'completed' | 'failed';
} | {
    type: 'memory';
    memoryId: ID;
} | {
    type: 'yuragi';
    yuragiType: string;
} | {
    type: 'urge';
    urgeType: string;
} | {
    type: 'homeostasis';
    state: string;
} | {
    type: 'external';
    source: string;
};
export declare class EmotionEngine {
    private state;
    private config;
    private changeHistory;
    private patterns;
    private lastUpdateTick;
    constructor(config?: Partial<EmotionEngineConfig>);
    /**
     * 初期状態を作成
     */
    private createInitialState;
    /**
     * 感情パターンを登録
     */
    registerPatterns(patterns: EmotionPattern[]): void;
    /**
     * 感情パターンを追加
     */
    addPattern(pattern: EmotionPattern): void;
    /**
     * 毎tickの更新
     */
    update(currentTick: Tick, timeOfDay: TimeOfDay): EmotionChangeEvent | null;
    /**
     * 特定の感情を直接変化させる
     */
    changeEmotion(emotion: EmotionType, delta: number, trigger: EmotionTrigger): EmotionChangeEvent;
    /**
     * 複数の感情を同時に変化させる
     */
    changeEmotions(changes: Array<{
        emotion: EmotionType;
        delta: number;
    }>, trigger: EmotionTrigger): EmotionChangeEvent;
    /**
     * 感情パターンを適用
     */
    applyPattern(pattern: EmotionPattern): EmotionChangeEvent;
    /**
     * 状況に基づいて感情パターンを検索し適用
     */
    respondToSituation(situation: SituationDescriptor): EmotionChangeEvent | null;
    /**
     * 訪問者イベントへの感情反応
     */
    respondToVisitor(event: 'arrived' | 'departed' | 'message', familiarity: Normalized): EmotionChangeEvent;
    /**
     * 行動完了時の感情反応
     */
    respondToAction(action: string, outcome: 'started' | 'completed' | 'failed', satisfaction: Normalized): EmotionChangeEvent;
    /**
     * 記憶想起時の感情反応
     */
    respondToMemory(memoryId: ID, emotionalTags: EmotionType[], intensity: Normalized): EmotionChangeEvent;
    /**
     * 揺らぎによる感情変化
     */
    applyYuragiEffect(yuragiType: string, emotionChanges: Partial<Record<EmotionType, number>>): EmotionChangeEvent;
    /**
     * 自然な減衰を適用
     */
    private applyDecay;
    /**
     * 慣性による変化を適用
     */
    private applyMomentum;
    /**
     * 時間帯バイアスを適用
     */
    private applyTimeBias;
    /**
     * 感情間の相互作用を適用
     */
    private applyEmotionInteractions;
    /**
     * 感情変化を他の感情に伝播
     */
    private propagateInteraction;
    /**
     * 状態を正規化
     */
    private normalizeState;
    /**
     * 主要・副次感情を更新
     */
    private updatePrimarySecondary;
    /**
     * valence/arousalを更新
     */
    private updateValenceArousal;
    /**
     * マッチするパターンを検索
     */
    private findMatchingPattern;
    /**
     * 状況のマッチスコアを計算
     */
    private scoreSituationMatch;
    /**
     * トリガーを文字列に変換
     */
    private triggerToString;
    /**
     * 履歴をトリミング
     */
    private trimHistory;
    /**
     * 現在の状態を取得
     */
    getState(): Readonly<EmotionalState>;
    /**
     * 特定の感情レベルを取得
     */
    getEmotionLevel(emotion: EmotionType): Normalized;
    /**
     * 主要感情を取得
     */
    getPrimaryEmotion(): EmotionType;
    /**
     * アクティブな感情（閾値以上）を取得
     */
    getActiveEmotions(): Array<{
        emotion: EmotionType;
        level: Normalized;
    }>;
    /**
     * 感情のサマリーを取得
     */
    getSummary(): {
        primary: EmotionType;
        secondary: EmotionType | null;
        valence: number;
        arousal: Normalized;
        description: string;
    };
    /**
     * 感情状態の自然言語描写を生成
     */
    private generateDescription;
    /**
     * 最近の変化履歴を取得
     */
    getRecentChanges(count?: number): EmotionChangeEvent[];
    /**
     * 最後の大きな変化を取得
     */
    getLastSignificantChange(): {
        emotion: EmotionType;
        timestamp: Timestamp;
        trigger: string;
    } | null;
    /**
     * 統計を取得
     */
    getStats(): {
        activeEmotionCount: number;
        dominantEmotion: EmotionType;
        averageValence: number;
        averageArousal: number;
        changesSinceLastSave: number;
    };
    /** 感情トリガーの統計 */
    private triggerStats;
    /** 感情の滞留検知用 */
    private stagnationTracker;
    /** 自己修正の履歴 */
    private selfCorrectionLog;
    /**
     * 感情トリガーの結果を記録
     * どの状況でどの感情が発生し、その後どうなったかを追跡
     */
    recordTriggerOutcome(triggerType: string, triggeredEmotion: EmotionType, intensity: number, outcome: {
        wasHelpful: boolean;
        durationTicks: number;
        ledToAction: boolean;
        subsequentEmotion?: EmotionType;
    }): void;
    /**
     * 感情の自己修正を実行
     * 蓄積された統計データから感情システムのパラメータを調整
     */
    performSelfCorrection(): EmotionSelfCorrection[];
    /**
     * 滞留検知の更新（毎ティック呼ぶ）
     */
    updateStagnationTracking(): void;
    /**
     * 過敏な感情を鈍化
     */
    private desensitizeEmotion;
    /**
     * 行動に繋がらない感情を弱める
     */
    private reduceIdleEmotion;
    /**
     * 滞留状態を解消
     */
    private breakStagnation;
    /**
     * 感情の多様性を確保
     */
    private ensureEmotionalDiversity;
    /**
     * 感情間の結合を経験から調整
     */
    private adjustEmotionCouplings;
    /**
     * ベースライン感情の適応的調整
     * 長期的な感情パターンに基づいてベースラインを微調整
     */
    private adaptBaselineEmotions;
    /** 結合強度のオーバーライド */
    private couplingOverrides;
    /**
     * 結合強度を取得（オーバーライド込み）
     */
    getEffectiveCoupling(source: EmotionType, target: EmotionType): number;
    /**
     * 自己修正ログを取得
     */
    getSelfCorrectionLog(count?: number): EmotionSelfCorrection[];
    /**
     * 感度調整API（SelfModificationから呼ばれる）
     */
    adjustSensitivity(emotion: EmotionType, direction: 'increase' | 'decrease', amount: number): void;
    /**
     * JSON形式でエクスポート
     */
    toJSON(): object;
    /**
     * JSONからリストア
     */
    static fromJSON(json: any, patterns: EmotionPattern[]): EmotionEngine;
}
export default EmotionEngine;
//# sourceMappingURL=EmotionEngine.d.ts.map