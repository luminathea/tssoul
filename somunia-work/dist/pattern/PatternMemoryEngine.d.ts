/**
 * PatternMemoryEngine - Phase 7E: 応答パターン記憶エンジン
 *
 * somuniaが「自分らしい応答」を学習し、蓄積するシステム。
 *
 * 核心的な問題:
 * - LLMは毎回ゼロから応答を生成するため、人格の一貫性が不安定
 * - 同じような状況でも異なるトーンの応答が返ってくる
 * - somunia独自の表現パターンが蓄積されない
 *
 * このモジュールが解決すること:
 * 1. 成功した応答からパターンを抽出して蓄積
 * 2. 類似状況でパターンを検索・マッチング
 * 3. パターンの品質を継続的に評価・淘汰
 * 4. 状況に応じたテンプレート変数の展開
 * 5. GradualAutonomyモジュールと連携し、
 *    パターンが十分に蓄積された領域ではLLMをバイパス
 *
 * 設計思想:
 * - パターンは「状況 → 応答テンプレート」の対応
 * - 状況は感情・時間帯・会話深度・関係性・キーワードの組合せ
 * - テンプレートは変数を含み、文脈に応じて展開される
 * - 成功回数と満足度でパターンの「信頼度」が決まる
 * - 低品質パターンは自然に淘汰される
 */
import { ResponsePattern, PatternSituation, Normalized, Tick, ID } from '../types';
/** テンプレート内で使用可能な変数 */
export interface TemplateVariables {
    /** 訪問者の名前（呼び名） */
    visitorName: string;
    /** 現在の時間帯の表現 */
    timeExpression: string;
    /** 現在の気分表現 */
    moodExpression: string;
    /** 現在の活動 */
    currentActivity: string | null;
    /** 中断された活動 */
    interruptedActivity: string | null;
    /** 最近学んだこと */
    recentLearning: string | null;
    /** 話したいこと */
    thingToTell: string | null;
    /** 過去の話題（関連するもの） */
    pastTopic: string | null;
    /** 天気の表現 */
    weatherExpression: string;
    /** 訪問者への呼びかけ */
    greeting: string;
    /** 感情の理由 */
    emotionReason: string | null;
}
interface PatternMatch {
    pattern: ResponsePattern;
    score: number;
    expandedTemplate: string;
}
/**
 * 応答からパターンを抽出するための分析
 * LLMの応答が「良い」と判定された場合に実行される
 */
interface ResponseAnalysis {
    /** 元の応答 */
    response: string;
    /** 応答時の状況 */
    situation: PatternSituation;
    /** 満足度 */
    satisfaction: Normalized;
    /** テンプレート変数の逆マッピング */
    variables: TemplateVariables;
}
export interface PatternMemoryConfig {
    /** 保持するパターンの最大数 */
    maxPatterns: number;
    /** パターン適用の最低スコア閾値 */
    minMatchScore: number;
    /** パターンの最低使用回数（淘汰保護） */
    minUsesBeforeCulling: number;
    /** パターンの最低満足度（これ以下は淘汰候補） */
    minSatisfactionForKeep: number;
    /** テンプレートの最大長 */
    maxTemplateLength: number;
    /** パターン抽出の最低満足度 */
    minSatisfactionForExtraction: number;
    /** 同一パターン判定の類似度閾値 */
    duplicateThreshold: number;
}
export declare class PatternMemoryEngine {
    private config;
    private patterns;
    private nextId;
    /** 最近使用されたパターンID（重複回避） */
    private recentlyUsed;
    private readonly recentlyUsedLimit;
    constructor(config?: Partial<PatternMemoryConfig>);
    private initializePatterns;
    /**
     * 現在の状況に最も適合するパターンを検索する
     * @returns マッチしたパターンと展開済みテンプレート、またはnull
     */
    findBestMatch(situation: PatternSituation, variables: TemplateVariables, tick: Tick): PatternMatch | null;
    /**
     * 状況のマッチングスコアを計算
     * 各次元のマッチ度を重み付きで合計
     */
    private calculateMatchScore;
    /**
     * 感情の類似度を計算
     */
    private calculateEmotionSimilarity;
    /**
     * パターンの信頼度を計算
     */
    private calculateReliability;
    /**
     * テンプレート内の変数を実際の値で置換する
     * 必要な変数が不足している場合はnullを返す
     */
    private expandTemplate;
    /**
     * 成功した応答からパターンを抽出して蓄積する
     */
    extractAndStore(analysis: ResponseAnalysis): ResponsePattern | null;
    /**
     * 応答テキストからテンプレートを生成する
     * 固有の値を変数で置換する
     */
    private createTemplate;
    private escapeRegex;
    private isDuplicate;
    private reinforceExistingPattern;
    private templateSimilarity;
    private situationOverlap;
    private recordUsage;
    /**
     * パターン使用結果のフィードバック
     * 応答検証の結果に基づいて呼ばれる
     */
    feedback(patternId: ID, success: boolean, satisfaction: Normalized): void;
    private enforcePatternLimit;
    private calculatePatternValue;
    /**
     * 定期的な淘汰処理（tick毎に呼ばれる）
     */
    cullLowQuality(): number;
    getStats(): {
        totalPatterns: number;
        initialPatterns: number;
        extractedPatterns: number;
        avgSatisfaction: number;
        topPatterns: Array<{
            template: string;
            satisfaction: number;
            uses: number;
        }>;
    };
    /**
     * パターンのカバレッジを計算
     * どの程度の状況がパターンでカバーされているか
     */
    getCoverage(): Normalized;
    toJSON(): any;
    fromJSON(data: any): void;
}
export {};
//# sourceMappingURL=PatternMemoryEngine.d.ts.map