/**
 * LLMInterface - somunia v10 言語処理インターフェース
 *
 * 【重要な設計原則】
 * LLMは「言語の理解」と「言葉としての出力」にのみ使用する。
 * 行動の決定、感情の変化、思考の生成はすべてコード内で行われる。
 *
 * LLMの役割:
 * 1. ユーザーの発言を理解し、意図・感情を抽出する
 * 2. 内部で決定された思考・行動を自然な日本語で表現する
 * 3. 記憶や知識を要約する
 * 4. Wikipedia記事を解釈する
 *
 * LLMが決してしないこと:
 * - 次に何をするか決める
 * - 感情を「考える」
 * - 人格を演じる（人格はコードで定義される）
 *
 * 【バックエンド: Ollama（ローカルLLM）】
 * PC内で完結。APIキー不要。外部通信なし。
 * http://127.0.0.1:11434 のOllamaサーバーに接続。
 *
 * セットアップ:
 *   1. Ollamaをインストール: https://ollama.com
 *   2. モデルを取得: ollama pull gemma3
 *   3. Ollamaを起動: ollama serve（自動起動設定推奨）
 */
import { LLMContext, EmotionType, Normalized } from '../types';
export interface LLMConfig {
    /** Ollamaサーバーのホスト（デフォルト: 127.0.0.1） */
    ollamaHost?: string;
    /** Ollamaサーバーのポート（デフォルト: 11434） */
    ollamaPort?: number;
    /** モデル名（ollamaにインストール済みのもの） */
    model?: string;
    /** 最大トークン数 */
    maxTokens?: number;
    /** 温度（創造性） */
    temperature?: number;
    /** LLMを無効にするか */
    disabled?: boolean;
    /** フォールバック時のデフォルト応答 */
    fallbackEnabled?: boolean;
    /** リクエストタイムアウト（ms） */
    timeout?: number;
}
export declare class LLMInterface {
    private config;
    private requestCount;
    private lastRequestTime;
    private rateLimitDelay;
    private offlineMode;
    private ollamaAvailable;
    private connectionChecked;
    private connectionCheckPromise;
    constructor(config?: Partial<LLMConfig>);
    /**
     * Ollamaサーバーへの接続チェック
     */
    private checkOllamaConnection;
    /**
     * 接続チェックの完了を待つ
     */
    private ensureReady;
    private httpGet;
    private httpRequest;
    /**
     * Ollama Chat API呼び出し
     */
    private callOllama;
    /**
     * ユーザーの発言を理解する
     * 内容、意図、感情を抽出して返す
     */
    understandMessage(message: string, context: LLMContext): Promise<{
        intent: 'greeting' | 'question' | 'statement' | 'request' | 'emotional' | 'farewell' | 'unknown';
        topics: string[];
        emotions: EmotionType[];
        isPersonal: boolean;
        urgency: Normalized;
        keywords: string[];
    }>;
    /**
     * 内部で決定された思考を自然な言葉にする
     * 【重要】内容（what）は決まっている。形（how）だけを変換する。
     */
    expressThought(rawThought: string, context: LLMContext): Promise<string>;
    /**
     * 内部で決定された応答を自然な発話にする
     * 【重要】何を伝えるかは決まっている。言い方だけ変換する。
     */
    expressResponse(rawContent: string, context: LLMContext): Promise<string>;
    /**
     * Phase 7: リッチプロンプトによる応答生成
     * ContextBridgeが構築した詳細なプロンプトをそのままLLMに送る
     */
    expressResponseWithRichPrompt(richPrompt: string): Promise<string>;
    /**
     * Phase 7.5B: 分離プロンプトによる応答生成
     * system/user を正しく分離してOllamaに送信する
     *
     * これにより、LLMは:
     * - system: somuniaの設定として内面化する
     * - user: 訪問者のメッセージとして受け取り、応答する
     *
     * 「プロンプトの復唱」問題が根本的に解決される。
     */
    expressResponseWithSeparatedPrompt(systemPrompt: string, userPrompt: string): Promise<string>;
    /**
     * Phase 7.5B: 構造化応答の生成
     * LLMにJSON形式で応答+メタデータを返させる
     *
     * 返すデータ:
     * - response: somuniaの発話テキスト
     * - emotion: 検出された感情（応答に込めた感情）
     * - topics: 話題のキーワード
     * - confidence: 応答の確信度
     */
    expressResponseStructured(systemPrompt: string, userMessage: string, contextHint: string): Promise<{
        response: string;
        detectedEmotion: EmotionType | null;
        detectedTopics: string[];
        confidence: number;
        wasStructured: boolean;
    }>;
    /**
     * Phase 7.5B: 自律発話の分離プロンプト生成
     */
    expressAutonomousSpeech(systemPrompt: string, userPrompt: string): Promise<string>;
    private inferEmotionFromText;
    private inferTopicsFromText;
    /**
     * テキストを要約する（記憶の圧縮など）
     */
    summarize(text: string, maxLength?: number): Promise<string>;
    /**
     * Wikipedia記事を解釈する（学習用）
     */
    interpretArticle(title: string, content: string, currentInterests: string[]): Promise<{
        summary: string;
        keyFacts: string[];
        relatedTopics: string[];
        emotionalReaction: EmotionType;
        interestLevel: Normalized;
    }>;
    /**
     * キーワードベースの簡易理解（LLM不要）
     */
    private fallbackUnderstand;
    /**
     * 応答表現のフォールバック（LLM不要）
     * メタデータタグを除去してsomuniaらしい応答にする
     */
    private fallbackExpressResponse;
    /**
     * 記事解釈のフォールバック
     */
    private fallbackInterpretArticle;
    private readonly VALID_INTENTS;
    private readonly VALID_EMOTIONS;
    private validateIntent;
    private validateSingleEmotion;
    private validateEmotions;
    private toStringArray;
    private clamp;
    /** LLMが有効かどうか（Ollamaに接続可能か） */
    isEnabled(): boolean;
    /** Ollamaが利用可能かどうか */
    isOllamaAvailable(): boolean;
    /** リクエスト数 */
    getRequestCount(): number;
    /** 使用中のモデル名 */
    getModelName(): string;
    /** 設定を更新 */
    updateConfig(updates: Partial<LLMConfig>): void;
    /** 明示的にオフラインモードを有効化 */
    enableOfflineMode(): void;
    /** オフラインモードを解除 */
    disableOfflineMode(): void;
    /** オフラインモードかどうか */
    isOfflineMode(): boolean;
    /** LLM-free動作ステータスレポート */
    getOfflineCapabilityReport(): {
        canOperate: boolean;
        modules: Array<{
            name: string;
            fallbackStatus: 'ready' | 'degraded' | 'unavailable';
            note: string;
        }>;
    };
}
//# sourceMappingURL=LLMInterface.d.ts.map