/**
 * somunia v10 - Yuragi System（揺らぎシステム）
 *
 * 非合理的な人間らしさを生み出すシステム
 *
 * 「揺らぎ」とは:
 * - 予定通りに動かない
 * - 理由なく気分が変わる
 * - 突然何かを思い出す
 * - 合理的でない選択をする
 * - デジャヴや既視感
 *
 * これらがsomuniaを「計算できる機械」ではなく
 * 「予測不能な生命体」に近づける
 */
import { Normalized, YuragiState, YuragiType, IrrationalAction, ActionType, EmotionType, EmotionalState, UrgeSystemState, TimeOfDay } from '../types';
export interface YuragiConfig {
    baseFrequency: Normalized;
    baseIntensity: Normalized;
    maxDuration: number;
    typeWeights: Record<YuragiType, number>;
    environmentalInfluence: Normalized;
    maxIrrationalActions: number;
}
export declare class YuragiSystem {
    private state;
    private config;
    private activeYuragiEndTicks;
    private lastYuragiTick;
    private currentTick;
    private randomConcepts;
    constructor(config?: Partial<YuragiConfig>);
    /**
     * 初期状態を作成
     */
    private createInitialState;
    /**
     * ティック処理
     */
    tick(currentTick: number, emotionalState: EmotionalState, urges: UrgeSystemState, timeOfDay: TimeOfDay, fatigue: Normalized, plannedAction: ActionType | null): {
        triggered: YuragiType | null;
        thoughtIntrusion: string | null;
        actionOverride: ActionType | null;
        emotionChanges: Partial<Record<EmotionType, number>>;
        irrationalAction: IrrationalAction | null;
    };
    /**
     * 揺らぎの発生をチェック
     */
    private checkYuragiTrigger;
    /**
     * 揺らぎをアクティブにする
     */
    private activateYuragi;
    /**
     * アクティブな揺らぎを更新
     */
    private updateActiveYuragi;
    /**
     * 非合理的行動を記録
     */
    private recordIrrationalAction;
    /**
     * 状態を更新
     */
    private updateState;
    /**
     * 強制的に揺らぎを発生させる（外部からの注入）
     */
    injectYuragi(type: YuragiType, intensity?: Normalized): {
        thoughtIntrusion: string;
        emotionChanges: Partial<Record<EmotionType, number>>;
    };
    /**
     * ランダムな微小揺らぎを発生させる
     * これは常にバックグラウンドで動く「ノイズ」
     */
    generateMicroYuragi(): {
        emotionNoise: Partial<Record<EmotionType, number>>;
        thoughtFragment: string | null;
    };
    /**
     * 行動決定に揺らぎを適用
     * 確率的に異なる行動を選択させる
     */
    applyActionYuragi(sortedActions: {
        action: ActionType;
        score: number;
    }[], topN?: number): ActionType;
    /**
     * 感情変化に揺らぎを適用
     */
    applyEmotionYuragi(baseChange: Partial<Record<EmotionType, number>>): Partial<Record<EmotionType, number>>;
    /**
     * ランダム連想用の概念を追加
     */
    addConcept(concept: string): void;
    /**
     * 概念リストを取得
     */
    getConcepts(): string[];
    /**
     * 現在の状態を取得
     */
    getState(): YuragiState;
    /**
     * 特定の揺らぎがアクティブか
     */
    isYuragiActive(type: YuragiType): boolean;
    /**
     * JSON形式でエクスポート
     */
    toJSON(): object;
    /**
     * JSON形式からインポート
     */
    fromJSON(data: any): void;
    /**
     * 統計情報を取得
     */
    getStats(): {
        totalIrrationalActions: number;
        yuragiDistribution: Record<YuragiType, number>;
        averageWhimsicality: number;
        averageUnpredictability: number;
    };
}
export declare const yuragiSystem: YuragiSystem;
/**
 * 簡易揺らぎ生成器（モジュール内部用）
 *
 * SelfModification, DreamPhase, WikipediaLearner等が
 * 独自の微細な揺らぎを生成するために使用。
 */
export declare class Yuragi {
    private phase;
    private frequency;
    getValue(): number;
}
//# sourceMappingURL=Yuragi.d.ts.map