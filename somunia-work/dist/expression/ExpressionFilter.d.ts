/**
 * ExpressionFilter - Phase 7.5D: 表現フィルタ＆反復防止
 *
 * LLMの応答を「somuniaの発話として適切か」検証・修正するモジュール。
 *
 * 検出・修正する問題:
 * 1. 「わたしは…somunia」の反復（プロンプト復唱）
 * 2. 内部検証メッセージの漏れ
 * 3. AIアシスタント口調
 * 4. 第三者視点の記述（「この人に聞かれた」等）
 * 5. プロンプトの状況記述の復唱
 * 6. 前回応答との高類似度
 * 7. 長すぎる/短すぎる応答
 *
 * 修正できない場合は、文脈に応じたフォールバック応答を生成する。
 */
import { EmotionType, Normalized, ConversationIntent, ConversationDepth, ExpressionFilterConfig } from '../types';
export declare class ExpressionFilter {
    private config;
    private responseHistory;
    private selfIntroCount;
    constructor(config?: Partial<ExpressionFilterConfig>);
    /**
     * LLMの応答をフィルタリングし、問題があれば修正する
     * 修正不能な場合はフォールバック応答を返す
     */
    filter(rawResponse: string, context: {
        intent: ConversationIntent;
        emotion: EmotionType;
        userMessage: string;
        visitorName?: string;
        depth: ConversationDepth;
    }): {
        response: string;
        wasFiltered: boolean;
        filterReasons: string[];
        qualityScore: Normalized;
    };
    /**
     * 基本クリーニング
     */
    private basicClean;
    /**
     * プロンプト復唱の検出
     */
    private detectPromptEcho;
    /**
     * AIアシスタント口調の検出と除去
     */
    private detectAIAssistant;
    /**
     * 内部メッセージの漏れ検出
     */
    private detectInternalMessage;
    /**
     * 第三者視点の検出
     */
    private detectThirdPerson;
    /**
     * 応答の短縮（文の境界で切る）
     */
    private truncateResponse;
    /**
     * 前回応答との類似度チェック（簡易Jaccard係数）
     */
    private checkSimilarity;
    /**
     * 文脈に応じたフォールバック応答を生成する
     * 内部メッセージは絶対に漏れない
     */
    generateFallback(context: {
        intent: ConversationIntent;
        emotion: EmotionType;
        userMessage: string;
        visitorName?: string;
        depth?: ConversationDepth;
    }): string;
    private finalClean;
    private calculateQuality;
    private recordResponse;
    /**
     * 会話開始時にリセット
     */
    resetConversation(): void;
    toJSON(): any;
    fromJSON(data: any): void;
}
//# sourceMappingURL=ExpressionFilter.d.ts.map