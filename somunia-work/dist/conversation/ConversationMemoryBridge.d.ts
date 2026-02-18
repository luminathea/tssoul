/**
 * ConversationMemoryBridge - Phase 5E: 会話-記憶統合ブリッジ
 *
 * 会話の内容を記憶システム・学習システム・自己修正システムに
 * 有機的に接続する。会話は単なるやり取りではなく、
 * somuniaの成長の源泉。
 *
 * 設計思想:
 * - 会話から得た知識は意味記憶へ
 * - 会話の体験はエピソード記憶へ
 * - 相手から学んだ話し方は手続き記憶へ
 * - 会話後には自動的に振り返りが行われる
 * - 重要な会話は「共有記憶」として特別に保存
 * - 会話のパターンから自己の傾向を認識
 */
import { ConversationLearning, PostConversationReflection, ConversationDepth, EmotionType, Normalized, Tick, ID } from '../types';
import { ConversationSummary } from './ConversationEngine';
export interface ConversationMemoryBridgeConfig {
    /** 学習の最大保持数 */
    maxLearnings: number;
    /** 振り返りの最大保持数 */
    maxReflections: number;
    /** 会話パターン分析の最小ターン数 */
    minTurnsForAnalysis: number;
    /** 重要度の閾値（これ以上で記憶） */
    importanceThreshold: Normalized;
}
export declare class ConversationMemoryBridge {
    private config;
    private learnings;
    private reflections;
    private currentConversationLearnings;
    private currentMessages;
    private currentEmotionalArc;
    private currentTopics;
    private somuniaSelfDisclosures;
    private visitorDisclosures;
    private conversationPatterns;
    private learnedExpressions;
    private learnedTopicTransitions;
    constructor(config?: Partial<ConversationMemoryBridgeConfig>);
    /**
     * 会話開始時の初期化
     */
    onConversationStart(): void;
    /**
     * 各メッセージの処理
     * 会話の各ターンで呼ばれ、リアルタイムで学習を抽出
     */
    processMessage(speaker: 'visitor' | 'somunia', content: string, emotion: EmotionType | null, topics: string[], depth: ConversationDepth, tick: Tick): MessageProcessResult;
    /**
     * 会話終了時の振り返り生成
     */
    generatePostConversationReflection(conversationId: ID, summary: ConversationSummary, currentEmotion: EmotionType, relationship: {
        familiarity: Normalized;
        trust: Normalized;
        affection: Normalized;
        understanding: Normalized;
    }, tick: Tick): PostConversationReflection;
    /**
     * 過去の会話から関連する学びを検索
     */
    searchRelevantLearnings(topics: string[], emotion?: EmotionType): ConversationLearning[];
    /**
     * 会話中に使える「前に話したこと」の参照を生成
     */
    generatePastReference(currentTopics: string[]): string | null;
    /**
     * somuniaの会話傾向分析を取得
     */
    getSelfAnalysis(): ConversationSelfAnalysis;
    /**
     * 学習内容の抽出
     */
    private extractLearningContent;
    /**
     * 重要度の計算
     */
    private calculateImportance;
    /**
     * 概念の抽出
     */
    private extractConcept;
    /**
     * エピソード記憶を生成すべきか判定
     */
    private shouldCreateEpisodic;
    /**
     * エピソード記憶のフォーマット
     */
    private formatEpisodicContent;
    /**
     * エピソード記憶のサマリー
     */
    private generateEpisodicSummary;
    /**
     * 自己開示の判定
     */
    private isSelfDisclosure;
    /**
     * 学習可能な表現の検出
     */
    private detectLearnableExpression;
    /**
     * 最近の会話コンテキストを取得
     */
    private getRecentContext;
    /**
     * 会話品質の評価
     */
    private evaluateConversationQuality;
    private calculateReciprocity;
    private calculateEmotionalResonance;
    private calculateNaturalness;
    /**
     * 心に残った瞬間の抽出
     */
    private extractMemorableMoments;
    /**
     * 次に話したいことの生成
     */
    private generateFutureTopics;
    /**
     * 自分のパフォーマンス評価
     */
    private evaluateSelfPerformance;
    /**
     * 関係性への影響の計算
     */
    private calculateRelationshipImpact;
    /**
     * 振り返りの内容を生成
     */
    private generateReflectionContent;
    /**
     * 全体的な印象の決定
     */
    private determineOverallImpression;
    private updatePatternAnalysis;
    /**
     * 長所の特定
     */
    private identifyStrengths;
    /**
     * 弱点の特定
     */
    private identifyWeaknesses;
    /**
     * 成長提案の生成
     */
    private generateGrowthSuggestions;
    getLearnings(): ConversationLearning[];
    getReflections(): PostConversationReflection[];
    getLatestReflection(): PostConversationReflection | null;
    getConversationPatterns(): ConversationPatternAnalysis;
    getLearnedExpressions(): string[];
    getCurrentLearnings(): ConversationLearning[];
    /**
     * 特定タイプの学びを取得
     */
    getLearningsByType(type: ConversationLearning['type']): ConversationLearning[];
    /**
     * 訪問者について知っていることの一覧
     */
    getVisitorKnowledge(): string[];
    toJSON(): object;
    fromJSON(data: any): void;
}
export interface MessageProcessResult {
    learnings: ConversationLearning[];
    shouldCreateEpisodicMemory: boolean;
    episodicMemoryContent: {
        content: string;
        summary: string;
        emotionalTags: EmotionType[];
        emotionalIntensity: Normalized;
        relatedConcepts: string[];
    } | null;
    shouldCreateSemanticMemory: boolean;
    semanticMemoryContent: {
        concept: string;
        description: string;
        source: string;
        confidence: Normalized;
    } | null;
    expressionLearned: string | null;
}
export interface ConversationPatternAnalysis {
    averageDepth: Normalized;
    averageDuration: number;
    frequentTopics: string[];
    emotionalTendencies: EmotionType[];
    somuniaGrowthAreas: string[];
    visitorPreferences: string[];
    totalConversations: number;
}
export interface ConversationSelfAnalysis {
    strengths: string[];
    weaknesses: string[];
    growthSuggestions: string[];
    patterns: ConversationPatternAnalysis;
    learnedExpressions: string[];
}
//# sourceMappingURL=ConversationMemoryBridge.d.ts.map