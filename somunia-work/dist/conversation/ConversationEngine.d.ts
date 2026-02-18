/**
 * ConversationEngine - Phase 5A: 対話深化エンジン
 *
 * 会話の深度追跡、文脈記憶、トピック遷移、自発的話題提供を担う。
 * somuniaが「本当に対話している」と感じられるレベルの会話管理。
 *
 * 設計思想:
 * - 会話は「深さ」を持つ。表面→カジュアル→共有→親密→深淵
 * - トピックは有機的に遷移する（脱線、深掘り、回帰）
 * - somuniaは自分から話題を出せる（沈黙が続いた時、思い出した時）
 * - 会話のリズムとバランスを感じ取る
 * - 会話の「温度」が自然に上下する
 */
import { ConversationDepth, ConversationFlowState, ConversationTopic, TopicCategory, SpontaneousTopic, TurnAnalysis, EmotionType, Normalized, Tick, TimeOfDay, ActionType } from '../types';
export interface ConversationEngineConfig {
    /** 沈黙の閾値（この秒数以上で「長い沈黙」） */
    longSilenceThreshold: number;
    /** 自発的話題生成の間隔（ティック） */
    spontaneousInterval: number;
    /** 深度変化の減衰率 */
    depthDecayRate: number;
    /** 最大トピック履歴 */
    maxTopicHistory: number;
    /** 最大会話履歴 */
    maxConversationHistory: number;
}
export declare class ConversationEngine {
    private config;
    private flowState;
    private activeTopics;
    private topicHistory;
    private currentPrimaryTopic;
    private conversationContext;
    private mentionedConcepts;
    private sharedStories;
    private pendingSpontaneousTopics;
    private lastSpontaneousGeneration;
    private turnCount;
    private visitorTurnCount;
    private somuniaTurnCount;
    private totalWordCount;
    private lastMessageTick;
    private messageTiming;
    private pastConversationPatterns;
    constructor(config?: Partial<ConversationEngineConfig>);
    private createInitialFlowState;
    /**
     * 会話開始
     */
    startConversation(tick: Tick): void;
    /**
     * 訪問者の発言を分析する
     * LLMに頼らず、コードで会話の構造を解析
     */
    analyzeVisitorTurn(message: string, tick: Tick, currentEmotion: EmotionType, recentThoughts: string[]): TurnAnalysis;
    /**
     * somuniaの応答方針を決定する
     * 会話の文脈、深度、フローに基づいて最適な応答の種を生成
     */
    decideResponseStrategy(analysis: TurnAnalysis, currentEmotion: EmotionType, relationship: {
        familiarity: Normalized;
        trust: Normalized;
        affection: Normalized;
    }, recentThoughts: string[], knownTopics: string[], timeOfDay: TimeOfDay): ResponseStrategy;
    /**
     * somuniaの応答を記録する
     */
    recordSomuniaResponse(content: string, tick: Tick): void;
    /**
     * 沈黙中のティック処理
     * 自発的話題の生成など
     */
    tickSilence(tick: Tick, currentEmotion: EmotionType, recentThoughts: string[], recentMemories: string[], currentActivity: ActionType | null, timeOfDay: TimeOfDay): SpontaneousTopic | null;
    /**
     * 会話終了時の処理
     * 統計と振り返り情報を返す
     */
    endConversation(): ConversationSummary;
    /**
     * メッセージから意図を推定
     */
    private detectIntent;
    /**
     * メッセージからトピックを検出
     */
    private detectTopics;
    /**
     * メッセージから感情を検出
     */
    private detectEmotions;
    /**
     * 応答タイプの決定
     */
    private decideResponseType;
    /**
     * 質問を返すべきか判定
     */
    private shouldAskQuestion;
    /**
     * 自己開示すべきか判定
     */
    private shouldShareSelf;
    /**
     * 感情トーンの調整
     */
    private adjustEmotionalTone;
    /**
     * 応答の種を生成
     */
    private generateResponseSeeds;
    /**
     * フォローアップ質問の生成
     */
    private generateFollowUpQuestions;
    /**
     * somuniaが自分から話したい話題を生成
     */
    private generateSpontaneousTopic;
    /**
     * 話題の提案を生成
     */
    private generateTopicSuggestions;
    /**
     * 会話フロー状態の更新
     */
    private updateFlowState;
    /**
     * 深度スコアからラベルへの変換
     */
    private scoreToDepth;
    /**
     * 深度方向の推定
     */
    private estimateDepthDirection;
    /**
     * トピックの更新
     */
    private updateTopics;
    /**
     * 文脈の更新
     */
    private updateContext;
    /**
     * 文脈参照の検索
     */
    private findContextReferences;
    private getTopicName;
    private getSomuniaInterestForTopic;
    private hasQuestion;
    private hasSelfDisclosure;
    private calculateAverageTempo;
    private updatePastPatterns;
    getFlowState(): ConversationFlowState;
    getActiveTopics(): ConversationTopic[];
    getTopicHistory(): ConversationTopic[];
    getCurrentPrimaryTopic(): ConversationTopic | null;
    getPendingSpontaneousTopics(): SpontaneousTopic[];
    getConversationContext(): string[];
    getMentionedConcepts(): string[];
    getSharedStories(): string[];
    getTurnCount(): number;
    getPastPatterns(): typeof this.pastConversationPatterns;
    toJSON(): object;
    fromJSON(data: any): void;
}
export type ResponseType = 'greet' | 'farewell' | 'react' | 'empathize' | 'resonate' | 'answer' | 'explore_together' | 'play_along' | 'receive_comfort' | 'accept_thanks' | 'consider_request';
export interface ResponseStrategy {
    responseType: ResponseType;
    depth: ConversationDepth;
    shouldAskQuestion: boolean;
    shouldShareSelf: boolean;
    shouldOfferTopic: boolean;
    suggestedTopics: string[];
    emotionalTone: EmotionType;
    seeds: string[];
    contextReferences: string[];
    spontaneousTopic: SpontaneousTopic | null;
}
export interface ConversationSummary {
    totalTurns: number;
    visitorTurns: number;
    somuniaTurns: number;
    maxDepth: number;
    maxDepthLabel: ConversationDepth;
    topics: Array<{
        name: string;
        category: TopicCategory;
        depth: Normalized;
        interest: Normalized;
    }>;
    emotionalArc: string[];
    sharedStories: string[];
    mentionedConcepts: string[];
    overallEnergy: Normalized;
    averageTempo: string;
}
//# sourceMappingURL=ConversationEngine.d.ts.map