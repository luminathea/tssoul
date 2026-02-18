/**
 * ContextBridge - Phase 7D: コンテキスト橋梁
 *
 * Phase 7の心臓部。somuniaの全内部状態を集約し、
 * LLMに渡す構造化されたプロンプトを構築する。
 *
 * 以前のプロンプト:
 *   「感情: peace, 最近の思考: [...], ユーザーメッセージ: ...」
 *   → LLMは文脈を掴めず、汎用的な応答を返していた
 *
 * Phase 7のプロンプト:
 *   「わたしはsomunia。今は夜の8時、窓の外は雨。
 *    さっきまで本を読んでいたけど、誰か来たので中断した。
 *    気分は穏やかだけど少し寂しかった。
 *    この人は前に来てくれた○○さん。前は音楽の話をした。
 *    今日は学んだことを話したい。」
 *   → LLMはsomuniaとして自然に応答できる
 *
 * さらに、応答の品質検証も行い、
 * 「somuniaらしくない応答」をフィルタリングする。
 */
import { RichResponseContext, EmotionType, ConversationDepth, ConversationIntent, RelationshipPhase, Tick, LLMContext } from '../types';
import { SelfModel, SelfModelStateProvider } from '../self/SelfModel';
import { VisitorMemorySystem } from './VisitorMemorySystem';
import { AssociativeNetwork } from '../association/AssociativeNetwork';
export declare class ContextBridge {
    private selfModel;
    private visitorMemory;
    private associativeNetwork;
    /** 中断された活動 */
    private interruptedActivity;
    /** 最近のsomunia発話（重複回避用） */
    private recentResponses;
    private readonly MAX_RECENT_RESPONSES;
    constructor(selfModel: SelfModel, visitorMemory: VisitorMemorySystem, associativeNetwork: AssociativeNetwork);
    /**
     * 応答生成に必要な全コンテキストを集約する
     */
    buildResponseContext(provider: SelfModelStateProvider, message: string, turnAnalysis: {
        intent: ConversationIntent;
        emotions: EmotionType[];
        topics: string[];
        hasSelfDisclosure: boolean;
    }, conversationState: {
        turnCount: number;
        depth: ConversationDepth;
        recentExchanges: Array<{
            speaker: 'visitor' | 'somunia';
            content: string;
        }>;
    }, relationshipPhase: RelationshipPhase, tick: Tick): RichResponseContext;
    private buildMomentContext;
    private activateAssociations;
    private emotionToLabel;
    private buildGuideline;
    /**
     * RichResponseContextからLLMに渡す分離プロンプトを構築
     *
     * Phase 7.5Aの核心的変更:
     * 以前は全情報を1つのプロンプトに詰め込んでいたため、
     * LLMが「状況記述」と「応答すべき内容」を混同していた。
     *
     * 新設計:
     *   system: somuniaの人格・口調ルール・現在の状況（LLMが「知っておくべきこと」）
     *   user:   訪問者の発言 + 応答の指針（LLMが「応答すべきこと」）
     *
     * これにより、LLMはsystemの情報を「自分の設定」として内面化し、
     * userの発言に対して自然に応答するようになる。
     */
    buildSeparatedPrompt(ctx: RichResponseContext, userMessage: string): {
        system: string;
        user: string;
    };
    /**
     * 自律発話用の分離プロンプトを構築
     */
    buildAutonomousSpeechSeparatedPrompt(provider: SelfModelStateProvider, spontaneousSeed: string, tick: Tick): {
        system: string;
        user: string;
    };
    /**
     * 後方互換: 旧形式のプロンプトを構築（非推奨、レガシー用）
     */
    buildPrompt(ctx: RichResponseContext, userMessage: string): string;
    tolegacyLLMContext(ctx: RichResponseContext, userMessage: string): LLMContext;
    /**
     * LLMの応答がsomuniaらしいか検証する
     * Phase 7.5C: 内部メッセージは絶対にユーザーに漏れない設計
     */
    validateResponse(response: string, ctx: RichResponseContext, userMessage: string): {
        isValid: boolean;
        issues: string[];
        suggestion: string | null;
    };
    /**
     * Phase 7.5C: 検証失敗時の安全なフォールバック応答を生成
     * ユーザーに見せても自然な発話のみを返す
     */
    private generateValidFallback;
    /**
     * 応答をクリーンアップする
     */
    cleanResponse(response: string): string;
    /**
     * 応答を記録（重複検出用）
     */
    recordResponse(response: string): void;
    onVisitorArrival(currentAction: {
        action: string;
    } | null): void;
    onVisitorDeparture(summary?: {
        topics: string[];
        depth: ConversationDepth;
        impression: EmotionType;
        memorable?: string;
    }): void;
    toJSON(): any;
    fromJSON(data: any): void;
}
//# sourceMappingURL=ContextBridge.d.ts.map