/**
 * ThoughtEngine - somunia v10 思考生成エンジン
 *
 * 思考は「外から与えられる」のではなく「内から湧き出る」。
 * 欲求、感情、知覚、記憶、揺らぎから思考が自然に生まれる。
 *
 * LLMは生成された思考の「言語化」にのみ使用される。
 * 思考の「内容」はこのエンジンが決定する。
 */
import { ThoughtNode, ThoughtType, ThoughtSource, EmotionalState, EmotionType, UrgeSystemState, TimeOfDay, Normalized, Tick, ActionType } from '../types';
import { EventBus } from '../core/EventBus';
interface ThoughtTemplate {
    type: ThoughtType;
    source: ThoughtSource;
    conditions: ThoughtCondition[];
    templates: string[];
    emotionalColors: EmotionType[];
    baseIntensity: Normalized;
}
interface ThoughtCondition {
    check: (ctx: ThoughtContext) => boolean;
    weight: Normalized;
}
interface ThoughtContext {
    emotion: EmotionalState;
    urges: UrgeSystemState;
    timeOfDay: TimeOfDay;
    currentAction: ActionType | null;
    isVisitorPresent: boolean;
    isAwake: boolean;
    recentThoughts: ThoughtNode[];
    day: number;
    hour: number;
}
export declare class ThoughtEngine {
    private recentThoughts;
    private maxRecentThoughts;
    private thoughtHistory;
    private maxHistory;
    private customTemplates;
    private lastThoughtTick;
    private minThoughtInterval;
    private events;
    constructor(events?: EventBus);
    /**
     * 思考を生成する
     *
     * 内部状態に基づいて、適切な思考を選択・生成する。
     * これはLLMを一切使わない。純粋なコードロジック。
     */
    generateThought(context: ThoughtContext, tick: Tick): ThoughtNode | null;
    /**
     * 揺らぎによる突然の思考
     */
    generateYuragiThought(yuragiType: string, tick: Tick): ThoughtNode;
    /**
     * カスタム思考テンプレートを追加
     */
    addTemplate(template: ThoughtTemplate): void;
    /**
     * 連想を見つける
     */
    private findAssociations;
    /**
     * 最近の思考を取得
     */
    getRecentThoughts(count?: number): ThoughtNode[];
    /**
     * 現在の思考（最新）を取得
     */
    getCurrentThought(): ThoughtNode | null;
    /**
     * JSON出力
     */
    toJSON(): object;
    /**
     * JSONから復元
     */
    fromJSON(data: any): void;
}
export {};
//# sourceMappingURL=ThoughtEngine.d.ts.map