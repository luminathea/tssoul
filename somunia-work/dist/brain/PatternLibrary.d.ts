/**
 * somunia v10 - Pattern Library
 *
 * 自己進化する発話・行動・感情パターンのライブラリ
 *
 * このシステムは:
 * 1. 初期パターンを提供
 * 2. 新しいパターンを学習・追加
 * 3. パターンを変異・進化させる
 * 4. パターンを自己評価・削除
 */
import { ID, Normalized, SpeechPattern, BehaviorPattern, EmotionPattern, PatternEvolutionResult, ActionType, EmotionalState, TimeOfDay } from '../types';
export interface PatternLibraryConfig {
    dataPath: string;
    maxSpeechPatterns: number;
    maxBehaviorPatterns: number;
    maxEmotionPatterns: number;
    mutationRate: Normalized;
    pruneThreshold: number;
}
export declare class PatternLibrary {
    private speechPatterns;
    private behaviorPatterns;
    private emotionPatterns;
    private config;
    constructor(config?: Partial<PatternLibraryConfig>);
    /**
     * 初期パターンで初期化
     */
    initialize(): void;
    /**
     * 初期発話パターン
     */
    private initializeSpeechPatterns;
    /**
     * 初期行動パターン
     */
    private initializeBehaviorPatterns;
    /**
     * 初期感情パターン
     */
    private initializeEmotionPatterns;
    /**
     * 状況に合う発話パターンを検索
     */
    findMatchingSpeechPatterns(emotionalState: Partial<EmotionalState>, timeOfDay: TimeOfDay, activity: ActionType | null, visitorPresent: boolean, urges: Record<string, Normalized>): SpeechPattern[];
    /**
     * 状況に合う行動パターンを検索
     */
    findMatchingBehaviorPatterns(urges: Record<string, Normalized>, timeOfDay: TimeOfDay, emotionalState: Partial<EmotionalState>, currentEnergy: Normalized): BehaviorPattern[];
    /**
     * 状況に合う感情パターンを検索
     */
    findMatchingEmotionPatterns(timeOfDay: TimeOfDay, urges: Record<string, Normalized>, visitorPresent: boolean, recentEvents: string[]): EmotionPattern[];
    /**
     * 新しい発話パターンを追加
     */
    addSpeechPattern(pattern: Omit<SpeechPattern, 'id' | 'createdAt' | 'useCount' | 'lastUsed' | 'mutationHistory'>): ID;
    /**
     * 新しい行動パターンを追加
     */
    addBehaviorPattern(pattern: Omit<BehaviorPattern, 'id' | 'createdAt' | 'lastUsed' | 'mutationHistory'>): ID;
    /**
     * 新しい感情パターンを追加
     */
    addEmotionPattern(pattern: Omit<EmotionPattern, 'id' | 'modificationHistory'>): ID;
    /**
     * パターンを変異させる
     */
    mutatePattern(patternId: ID, type: 'speech' | 'behavior' | 'emotion'): boolean;
    /**
     * 発話パターンを変異
     */
    private mutateSpeechPattern;
    /**
     * 行動パターンを変異
     */
    private mutateBehaviorPattern;
    /**
     * 感情パターンを変異
     */
    private mutateEmotionPattern;
    /**
     * パターンの使用を記録
     */
    recordPatternUse(patternId: ID, type: 'speech' | 'behavior' | 'emotion', success: boolean, satisfaction: Normalized): void;
    /**
     * 経験に基づくパターン進化を実行（定期的に呼ばれる）
     * 成功率・使用頻度・満足度から総合的に進化方向を決定
     */
    evolvePatterns(): PatternEvolutionResult;
    /**
     * 行動パターンの適応度を評価
     */
    private evaluateBehaviorFitness;
    /**
     * 大幅な行動パターン変異
     */
    private radicalBehaviorMutation;
    /**
     * 統合候補のペアを探す
     */
    private findMergeCandidates;
    /**
     * 2つのパターンを統合
     */
    private mergePatterns;
    /**
     * パターンを2つに分岐
     */
    private splitBehaviorPattern;
    /**
     * 発話パターンを感情状態に適応させる
     */
    private adaptSpeechToEmotion;
    /**
     * 感情パターンの感度を経験に基づいて調整
     */
    private adjustEmotionSensitivity;
    /**
     * 弱いパターンを淘汰
     */
    private eliminateWeakPatterns;
    /**
     * パターンを削除
     */
    deletePattern(patternId: ID, type: 'speech' | 'behavior' | 'emotion'): boolean;
    private matchEmotionCondition;
    private matchTimeCondition;
    private matchUrgeCondition;
    private selectMutationType;
    private createMinorVariation;
    private generateExampleVariation;
    private pruneOldPatterns;
    /**
     * パターンを保存
     */
    save(): Promise<void>;
    /**
     * パターンを読み込み
     */
    load(): Promise<void>;
    /**
     * 統計情報を取得
     */
    getStats(): {
        speechPatternCount: number;
        behaviorPatternCount: number;
        emotionPatternCount: number;
        totalMutations: number;
        mostUsedSpeechPatterns: {
            id: ID;
            useCount: number;
        }[];
        mostSuccessfulBehaviorPatterns: {
            id: ID;
            successRate: number;
        }[];
    };
    /**
     * すべてのパターンを取得（デバッグ用）
     */
    getAllPatterns(): {
        speech: SpeechPattern[];
        behavior: BehaviorPattern[];
        emotion: EmotionPattern[];
    };
}
export declare const patternLibrary: PatternLibrary;
//# sourceMappingURL=PatternLibrary.d.ts.map