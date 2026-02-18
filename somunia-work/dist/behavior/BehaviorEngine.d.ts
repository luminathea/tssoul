/**
 * BehaviorEngine - somunia v10 行動決定エンジン
 *
 * 【核心的設計原則】
 * 全ての行動決定はこのコード内で行われる。
 * LLMには一切頼らない。欲求、感情、習慣、揺らぎ、記憶、
 * パターンライブラリからの条件マッチングにより行動が決まる。
 *
 * 行動決定のフロー:
 * 1. 習慣チェック（時間ベースのルーティン）
 * 2. 欲求の評価（最も強い欲求は何か）
 * 3. 揺らぎの適用（非合理的な変更の可能性）
 * 4. パターンマッチング（欲求×状況→行動パターン）
 * 5. 行動の実行
 * 6. 結果のフィードバック
 */
import { ActionType, ActionInProgress, UrgeType, UrgeSystemState, EmotionalState, EmotionType, TimeOfDay, Normalized, Tick, VirtualBody } from '../types';
import { EventBus } from '../core/EventBus';
interface ActionRule {
    id: string;
    name: string;
    description: string;
    /** このルールが適用される条件 */
    condition: (state: BehaviorContext) => boolean;
    /** 選択される行動 */
    action: ActionType;
    /** 行動の対象（オプション） */
    target?: string;
    /** 予想所要時間（ティック） */
    duration: number;
    /** 中断可能か */
    interruptible: boolean;
    /** 優先度（高いほど優先） */
    priority: number;
    /** 満たされる欲求 */
    satisfies: UrgeType[];
    /** エネルギーコスト */
    energyCost: Normalized;
    /** 行動中に浮かぶ思考のテンプレート */
    thoughtTemplates: string[];
}
interface BehaviorContext {
    urges: UrgeSystemState;
    emotion: EmotionalState;
    timeOfDay: TimeOfDay;
    body: VirtualBody;
    isVisitorPresent: boolean;
    isAwake: boolean;
    currentAction: ActionInProgress | null;
    recentActions: ActionType[];
    day: number;
    hour: number;
}
/** 行動結果のフィードバック */
interface ActionOutcome {
    success: boolean;
    satisfaction: Normalized;
    emotionAfter?: EmotionType;
    energyChange?: number;
}
/** 行動パターンの発見記録 */
interface BehaviorDiscovery {
    type: 'time_specific' | 'emotion_triggered' | 'energy_optimized' | 'sequence';
    ruleId: string;
    description: string;
    discoveredAt: number;
    basedOnAttempts: number;
    confidence: number;
}
export declare class BehaviorEngine {
    private rules;
    private currentAction;
    private recentActions;
    private maxRecentActions;
    private actionHistory;
    private customRules;
    private events;
    constructor(events?: EventBus);
    /**
     * 行動を決定する（メインロジック）
     *
     * 全てのルールを評価し、条件にマッチする最高優先度のルールを選択。
     * 揺らぎがある場合は、低優先度のルールが選ばれる可能性もある。
     */
    decideAction(context: BehaviorContext, yuragiLevel?: Normalized, yuragiOverride?: ActionType): {
        rule: ActionRule;
        wasYuragiInfluenced: boolean;
        thought: string;
    } | null;
    /**
     * 行動を開始する
     */
    startAction(rule: ActionRule, tick: Tick): ActionInProgress;
    /**
     * 行動を進行させる
     */
    progressAction(tick: Tick): {
        completed: boolean;
        progress: Normalized;
    };
    /**
     * 行動を中断する
     */
    interruptAction(tick: Tick, reason: string): boolean;
    /**
     * カスタムルールを追加（自己学習）
     */
    addCustomRule(rule: ActionRule): void;
    /**
     * カスタムルールを削除
     */
    removeCustomRule(ruleId: string): boolean;
    /**
     * 思考テンプレートから選択
     */
    private selectThought;
    /**
     * 現在の行動を取得
     */
    getCurrentAction(): ActionInProgress | null;
    /**
     * 最近の行動履歴を取得
     */
    getRecentActions(): ActionType[];
    /**
     * 行動履歴の統計
     */
    getActionStats(): Record<ActionType, number>;
    /**
     * JSON出力
     */
    toJSON(): object;
    /**
     * JSONから復元
     */
    fromJSON(data: any): void;
    /** 行動成功/失敗の記録 */
    private behaviorInsights;
    /** 発見ログ */
    private discoveryLog;
    /**
     * 行動結果のフィードバックを受け取る
     * 成功/失敗のパターンを分析して新ルール生成の材料にする
     */
    recordActionOutcome(ruleId: string, action: ActionType, context: BehaviorContext, outcome: ActionOutcome): void;
    /**
     * 経験から新しい行動ルールを発見する
     */
    private tryDiscoverNewRule;
    /**
     * 時間帯に特化したルールを生成
     */
    private createTimeSpecificRule;
    /**
     * 感情パターンから新ルールを生成
     */
    private createEmotionTriggeredRule;
    /**
     * エネルギー最適化ルール
     */
    private createEnergyOptimizedRule;
    /**
     * 行動連鎖ルールの発見
     */
    private tryDiscoverSequenceRule;
    private findEmotionActionPattern;
    private findEnergyPattern;
    private getTopUrge;
    private inferSatisfiedUrges;
    private actionToJapanese;
    private emotionToJapanese;
    /**
     * メタデータからカスタムルールを再構築
     */
    private regenerateCustomRule;
    /**
     * 発見ログを取得
     */
    getDiscoveries(): BehaviorDiscovery[];
    /**
     * カスタムルール数を取得
     */
    getCustomRuleCount(): number;
    /**
     * 行動インサイトのサマリー
     */
    getInsightSummary(): Array<{
        action: ActionType;
        timeOfDay: TimeOfDay;
        successRate: number;
        avgSatisfaction: number;
    }>;
}
export {};
//# sourceMappingURL=BehaviorEngine.d.ts.map