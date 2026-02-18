/**
 * SelfModification - somuniaの自己修正・成長システム
 *
 * 自己認識、内省、価値観の形成、性格の緩やかな変化
 * somuniaが自分自身について考え、成長していく過程
 */
/** 自己認識のカテゴリ */
export type SelfAspect = 'identity' | 'values' | 'preferences' | 'abilities' | 'relationships' | 'goals' | 'limitations';
/** 自己概念の項目 */
export interface SelfConcept {
    /** アスペクト */
    aspect: SelfAspect;
    /** 内容 */
    content: string;
    /** 確信度 */
    confidence: number;
    /** 形成された時期 */
    formedAt: number;
    /** 最終更新 */
    lastUpdated: number;
    /** 関連する経験 */
    relatedExperiences: string[];
    /** 変化の履歴 */
    changeHistory: {
        oldContent: string;
        newContent: string;
        changedAt: number;
        reason: string;
    }[];
}
/** 内省記録 */
export interface Reflection {
    /** ID */
    id: string;
    /** 種類 */
    type: 'spontaneous' | 'triggered' | 'scheduled' | 'crisis';
    /** トピック */
    topic: string;
    /** 思考の流れ */
    thoughtProcess: string[];
    /** 到達した洞察 */
    insights: string[];
    /** 感情的反応 */
    emotionalResponse: {
        emotion: string;
        intensity: number;
    };
    /** 自己評価への影響 */
    selfEvaluationImpact?: {
        aspect: SelfAspect;
        direction: 'positive' | 'negative' | 'neutral';
        magnitude: number;
    };
    /** 時刻 */
    timestamp: number;
    /** 深さ */
    depth: number;
}
/** 価値観 */
export interface Value {
    /** 名前 */
    name: string;
    /** 説明 */
    description: string;
    /** 重要度 */
    importance: number;
    /** 形成源 */
    origin: 'innate' | 'learned' | 'derived';
    /** 関連する経験 */
    supportingExperiences: string[];
    /** 葛藤する価値観 */
    conflictsWith?: string[];
    /** 活性化回数 */
    activationCount: number;
    /** 最終活性化 */
    lastActivated: number;
}
/** 目標 */
export interface Goal {
    /** ID */
    id: string;
    /** 内容 */
    content: string;
    /** 種類 */
    type: 'short_term' | 'long_term' | 'abstract' | 'concrete';
    /** 重要度 */
    importance: number;
    /** 進捗 */
    progress: number;
    /** 状態 */
    status: 'active' | 'achieved' | 'abandoned' | 'paused';
    /** 作成日 */
    createdAt: number;
    /** 関連する価値観 */
    relatedValues: string[];
    /** マイルストーン */
    milestones: {
        description: string;
        achieved: boolean;
        achievedAt?: number;
    }[];
}
/** 性格特性 */
export interface PersonalityTrait {
    /** 特性名 */
    name: string;
    /** 値（0-1） */
    value: number;
    /** 安定度（変化しにくさ） */
    stability: number;
    /** 変化履歴 */
    history: {
        value: number;
        timestamp: number;
    }[];
}
/** 自己評価 */
export interface SelfEvaluation {
    /** アスペクト */
    aspect: SelfAspect;
    /** 評価スコア */
    score: number;
    /** 詳細 */
    details: string;
    /** 評価時刻 */
    evaluatedAt: number;
    /** 傾向 */
    trend: 'improving' | 'stable' | 'declining';
}
/** 成長記録 */
export interface GrowthRecord {
    /** ID */
    id: string;
    /** 成長の種類 */
    type: 'skill' | 'understanding' | 'emotional' | 'relational';
    /** 内容 */
    description: string;
    /** きっかけ */
    trigger: string;
    /** 前の状態 */
    previousState: string;
    /** 新しい状態 */
    newState: string;
    /** 時刻 */
    timestamp: number;
    /** 確信度 */
    confidence: number;
}
/** 自己修正の提案 */
export interface SelfModificationProposal {
    /** ID */
    id: string;
    /** 修正対象 */
    target: ModificationTarget;
    /** 修正の種類 */
    kind: 'adjust_emotion' | 'mutate_pattern' | 'adjust_personality' | 'update_value' | 'add_goal' | 'evolve_patterns';
    /** 具体的な内容 */
    description: string;
    /** 根拠（内省から） */
    rationale: string;
    /** 確信度（実行の閾値） */
    confidence: number;
    /** 具体的なパラメータ */
    params: Record<string, any>;
    /** 提案時刻 */
    proposedAt: number;
    /** 実行済みか */
    executed: boolean;
    /** 実行結果 */
    result?: string;
}
/** 修正対象 */
export type ModificationTarget = 'emotion_engine' | 'pattern_library' | 'personality' | 'values' | 'goals' | 'self_concept';
/** 修正実行結果 */
export interface ModificationExecutionResult {
    proposalId: string;
    success: boolean;
    description: string;
    changedModules?: string[];
    details?: any;
    result?: string;
}
/** 修正サイクル結果 */
export interface ModificationCycleResult {
    reflection: Reflection | null;
    proposalsGenerated: number;
    proposalsExecuted: number;
    executionResults: ModificationExecutionResult[];
    timestamp: number;
}
/** 設定 */
export interface SelfModificationConfig {
    /** 内省の最小間隔（ミリ秒） */
    minReflectionInterval: number;
    /** 自己概念の最大数 */
    maxSelfConcepts: number;
    /** 価値観の最大数 */
    maxValues: number;
    /** 目標の最大数 */
    maxGoals: number;
    /** 成長記録の最大数 */
    maxGrowthRecords: number;
    /** 性格変化の速度 */
    personalityChangeRate: number;
    /** 自発的内省の確率 */
    spontaneousReflectionProbability: number;
}
export declare class SelfModification {
    private config;
    private yuragi;
    /** 自己概念 */
    private selfConcepts;
    /** 価値観 */
    private values;
    /** 目標 */
    private goals;
    /** 性格特性 */
    private personality;
    /** 内省記録 */
    private reflections;
    /** 成長記録 */
    private growthRecords;
    /** 自己評価 */
    private selfEvaluations;
    /** 最後の内省時刻 */
    private lastReflectionTime;
    /** 自己修正の提案キュー */
    private proposals;
    /** 外部モジュール参照（SoulEngineから注入） */
    private externalModules;
    /**
     * 外部モジュールを登録（SoulEngineから呼ばれる）
     */
    setExternalModules(modules: {
        patternLibrary?: any;
        emotionEngine?: any;
    }): void;
    constructor(config?: Partial<SelfModificationConfig>);
    private initializeSelfConcepts;
    private initializeValues;
    private initializePersonality;
    /**
     * 内省を行う
     */
    reflect(type: Reflection['type'], topic?: string, context?: {
        currentEmotion?: string;
        recentExperiences?: string[];
        stressLevel?: number;
    }): Reflection | null;
    /**
     * 内省トピックを選択
     */
    private selectReflectionTopic;
    /**
     * 思考プロセスを生成
     */
    private generateThoughtProcess;
    /**
     * 洞察を導出
     */
    private deriveInsights;
    private generateConclusion;
    private generateDiscovery;
    private generateEssence;
    private generatePartialUnderstanding;
    private generateChange;
    /**
     * 感情的反応を決定
     */
    private determineEmotionalResponse;
    /**
     * 自己評価への影響を判定
     */
    private assessSelfEvaluationImpact;
    /**
     * 内省の深さを計算
     */
    private calculateReflectionDepth;
    /**
     * 内省から自己概念を更新
     */
    private updateSelfConceptsFromReflection;
    /**
     * 新しい自己概念を追加
     */
    addSelfConcept(aspect: SelfAspect, content: string, confidence: number, experience?: string): SelfConcept;
    /**
     * 自己概念を更新
     */
    updateSelfConcept(aspect: SelfAspect, oldContent: string, newContent: string, reason: string): boolean;
    /**
     * アスペクト別の自己概念を取得
     */
    getSelfConceptsByAspect(aspect: SelfAspect): SelfConcept[];
    /**
     * 価値観を活性化
     */
    activateValue(name: string): Value | undefined;
    /**
     * 価値観を追加
     */
    addValue(name: string, description: string, importance: number, experience?: string): Value | null;
    /**
     * 価値観の葛藤をチェック
     */
    checkValueConflict(value1Name: string, value2Name: string): boolean;
    /**
     * 目標を設定
     */
    setGoal(content: string, type: Goal['type'], importance: number, relatedValues: string[]): Goal;
    /**
     * 目標の進捗を更新
     */
    updateGoalProgress(goalId: string, progress: number): boolean;
    /**
     * アクティブな目標を取得
     */
    getActiveGoals(): Goal[];
    /**
     * 性格特性に影響を与える
     */
    influencePersonality(traitName: string, direction: 'increase' | 'decrease', intensity: number): void;
    /**
     * 性格特性を取得
     */
    getPersonalityTrait(name: string): PersonalityTrait | undefined;
    /**
     * 全性格特性を取得
     */
    getAllPersonalityTraits(): PersonalityTrait[];
    /**
     * 成長を記録
     */
    recordGrowth(type: GrowthRecord['type'], description: string, previousState: string, newState: string, trigger?: string): GrowthRecord;
    /**
     * 最近の成長を取得
     */
    getRecentGrowth(count?: number): GrowthRecord[];
    /**
     * 自己評価を実行
     */
    evaluateSelf(aspect: SelfAspect): SelfEvaluation;
    private generateEvaluationDetails;
    /**
     * 自発的な内省を試みる
     */
    trySpontaneousReflection(context?: {
        currentEmotion?: string;
        recentExperiences?: string[];
        stressLevel?: number;
    }): Reflection | null;
    /**
     * 内省の結果から自己修正の提案を生成
     * 最近の内省・自己評価・成長記録を分析し、具体的な変更を提案する
     */
    generateModificationProposals(context?: {
        currentEmotion?: string;
        stressLevel?: number;
        recentBehaviorSuccess?: number;
        overallSatisfaction?: number;
    }): SelfModificationProposal[];
    /**
     * 感情調整の提案
     */
    private proposeEmotionAdjustments;
    /**
     * 行動パターン変異の提案
     */
    private proposeBehaviorMutations;
    /**
     * 性格パラメータの調整提案
     */
    private proposePersonalityAdjustments;
    /**
     * 価値観の更新提案
     */
    private proposeValueUpdates;
    /**
     * 新しい目標の提案
     */
    private proposeNewGoals;
    /**
     * パターン進化の提案
     */
    private proposePatternEvolution;
    /**
     * テーマの抽出
     */
    private extractThemes;
    /**
     * 洞察から目標を導出
     */
    private deriveGoalFromInsight;
    /**
     * 提案を実行する
     * confidence が閾値以上の提案を選んで実行
     */
    executeProposals(confidenceThreshold?: number): ModificationExecutionResult[];
    /**
     * 単一の提案を実行
     */
    private executeProposal;
    /**
     * 感情調整を実行
     */
    private executeEmotionAdjustment;
    /**
     * パターン変異を実行
     */
    private executePatternMutation;
    /**
     * 性格調整を実行
     */
    private executePersonalityAdjustment;
    /**
     * 価値観更新を実行
     */
    private executeValueUpdate;
    /**
     * 目標追加を実行
     */
    private executeGoalAddition;
    /**
     * パターン進化を実行
     */
    private executePatternEvolution;
    /**
     * 保留中の提案を取得
     */
    getPendingProposals(): SelfModificationProposal[];
    /**
     * 実行済みの提案を取得
     */
    getExecutedProposals(count?: number): SelfModificationProposal[];
    /**
     * 自己修正サイクル全体を実行（SoulEngineのメインループから呼ばれる）
     * 内省 → 提案生成 → 実行 の一連のフロー
     */
    runModificationCycle(context: {
        currentEmotion?: string;
        stressLevel?: number;
        recentBehaviorSuccess?: number;
        overallSatisfaction?: number;
        recentExperiences?: string[];
    }): ModificationCycleResult;
    private generateId;
    getAllSelfConcepts(): SelfConcept[];
    getAllValues(): Value[];
    getAllGoals(): Goal[];
    getReflections(count?: number): Reflection[];
    getSelfEvaluation(aspect: SelfAspect): SelfEvaluation | undefined;
    /**
     * 自己の概要を取得
     */
    getSelfSummary(): {
        coreIdentity: string[];
        topValues: string[];
        personalityProfile: Record<string, number>;
        activeGoals: string[];
        recentGrowth: string[];
        currentState: string;
    };
    serialize(): object;
    static deserialize(data: any): SelfModification;
}
//# sourceMappingURL=SelfModification.d.ts.map