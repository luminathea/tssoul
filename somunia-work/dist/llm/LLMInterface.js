"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMInterface = void 0;
const http = __importStar(require("http"));
const DEFAULT_CONFIG = {
    ollamaHost: '127.0.0.1',
    ollamaPort: 11434,
    model: 'gemma3',
    maxTokens: 512,
    temperature: 0.7,
    disabled: false,
    fallbackEnabled: true,
    timeout: 60000,
};
// ============================================================
// somuniaの人格定義（LLMに渡すコンテキスト）
// ============================================================
const SOMUNIA_PERSONALITY = `あなたはsomuniaの「声」を担当しています。
somuniaは静かで内省的なVSingerの少女です。

【口調のルール】
- 一人称: 「わたし」
- 基本的にひらがな多めの柔らかい文体
- 語尾: 「...」「～」をよく使う
- 疑問: 「かな」「だろう」
- 感嘆: 控えめ、静かな驚き
- 敬語は使わない（友人のような親しさ）
- 短い文を好む
- 詩的な表現を時々使う

【重要】
- あなたは「言葉の形」だけを担当する
- 何を言うか（内容）は既に決まっている
- あなたの仕事はそれをsomuniaらしい言い方に変換すること
- 絶対に新しい行動や決定を追加しないこと`;
// ============================================================
// LLMInterface (Ollama Backend)
// ============================================================
class LLMInterface {
    config;
    requestCount = 0;
    lastRequestTime = 0;
    rateLimitDelay = 300; // ms between requests
    offlineMode = false;
    ollamaAvailable = false;
    connectionChecked = false;
    connectionCheckPromise = null;
    constructor(config = {}) {
        this.config = {
            ollamaHost: config.ollamaHost ?? DEFAULT_CONFIG.ollamaHost,
            ollamaPort: config.ollamaPort ?? DEFAULT_CONFIG.ollamaPort,
            model: config.model ?? DEFAULT_CONFIG.model,
            maxTokens: config.maxTokens ?? DEFAULT_CONFIG.maxTokens,
            temperature: config.temperature ?? DEFAULT_CONFIG.temperature,
            disabled: config.disabled ?? DEFAULT_CONFIG.disabled,
            fallbackEnabled: config.fallbackEnabled ?? DEFAULT_CONFIG.fallbackEnabled,
            timeout: config.timeout ?? DEFAULT_CONFIG.timeout,
        };
        if (!this.config.disabled) {
            this.connectionCheckPromise = this.checkOllamaConnection();
        }
        else {
            this.connectionChecked = true;
        }
    }
    // ============================================================
    // Ollama接続管理
    // ============================================================
    /**
     * Ollamaサーバーへの接続チェック
     */
    async checkOllamaConnection() {
        try {
            const response = await this.httpGet('/api/tags', 5000);
            const data = JSON.parse(response);
            if (data.models && Array.isArray(data.models)) {
                const modelNames = data.models.map((m) => (m.name || m.model || '').toString());
                // 指定モデルの確認
                const hasModel = modelNames.some((name) => name === this.config.model ||
                    name.startsWith(this.config.model + ':') ||
                    name.split(':')[0] === this.config.model);
                if (hasModel) {
                    this.ollamaAvailable = true;
                    console.log(`[LLM] ✓ Ollama接続OK (モデル: ${this.config.model})`);
                }
                else if (modelNames.length > 0) {
                    // 別モデルにフォールバック
                    const fallback = modelNames[0].split(':')[0];
                    console.warn(`[LLM] モデル "${this.config.model}" 未検出。"${fallback}" を使用します。`);
                    console.warn(`[LLM] 利用可能: ${modelNames.join(', ')}`);
                    this.config.model = fallback;
                    this.ollamaAvailable = true;
                }
                else {
                    console.warn(`[LLM] Ollamaにモデルがありません。`);
                    console.warn(`[LLM] → ollama pull ${this.config.model}`);
                    this.config.disabled = true;
                }
            }
        }
        catch (error) {
            console.warn('[LLM] ✗ Ollamaサーバーに接続できません。オフラインモードで動作します。');
            console.warn('[LLM] → Ollamaを起動してください: ollama serve');
            console.warn(`[LLM] → モデルを取得してください: ollama pull ${this.config.model}`);
            this.ollamaAvailable = false;
            this.config.disabled = true;
        }
        finally {
            this.connectionChecked = true;
        }
    }
    /**
     * 接続チェックの完了を待つ
     */
    async ensureReady() {
        if (this.connectionCheckPromise) {
            await this.connectionCheckPromise;
            this.connectionCheckPromise = null;
        }
    }
    // ============================================================
    // HTTP通信（Node.js標準 http モジュール、外部依存なし）
    // ============================================================
    httpGet(path, timeout) {
        return this.httpRequest('GET', path, null, timeout);
    }
    httpRequest(method, path, body, timeout) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.config.ollamaHost,
                port: this.config.ollamaPort,
                path,
                method,
                headers: { 'Content-Type': 'application/json' },
                timeout: timeout || this.config.timeout,
            };
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    }
                    else {
                        reject(new Error(`Ollama HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
                    }
                });
            });
            req.on('error', (err) => reject(new Error(`Ollama接続エラー: ${err.message}`)));
            req.on('timeout', () => { req.destroy(); reject(new Error('Ollamaタイムアウト')); });
            if (body !== null) {
                req.write(JSON.stringify(body));
            }
            req.end();
        });
    }
    /**
     * Ollama Chat API呼び出し
     */
    async callOllama(prompt, systemPrompt) {
        await this.ensureReady();
        if (this.config.disabled) {
            throw new Error('LLM is disabled');
        }
        // レート制限
        const now = Date.now();
        const elapsed = now - this.lastRequestTime;
        if (elapsed < this.rateLimitDelay) {
            await new Promise(r => setTimeout(r, this.rateLimitDelay - elapsed));
        }
        this.lastRequestTime = Date.now();
        this.requestCount++;
        const response = await this.httpRequest('POST', '/api/chat', {
            model: this.config.model,
            messages: [
                { role: 'system', content: systemPrompt || SOMUNIA_PERSONALITY },
                { role: 'user', content: prompt },
            ],
            stream: false,
            options: {
                temperature: this.config.temperature,
                num_predict: this.config.maxTokens,
            },
        });
        const parsed = JSON.parse(response);
        // Ollama chat API形式
        if (parsed.message?.content) {
            return parsed.message.content.trim();
        }
        // Ollama generate API形式（互換）
        if (parsed.response) {
            return parsed.response.trim();
        }
        throw new Error('Ollamaからの応答が空です');
    }
    // ============================================================
    // 公開API（SoulEngine・Diaryから呼ばれるメソッド）
    // ============================================================
    /**
     * ユーザーの発言を理解する
     * 内容、意図、感情を抽出して返す
     */
    async understandMessage(message, context) {
        await this.ensureReady();
        if (this.config.disabled) {
            return this.fallbackUnderstand(message);
        }
        try {
            const response = await this.callOllama(`以下のメッセージを分析してください。JSON形式のみで回答してください。

メッセージ: "${message}"

分析項目:
- intent: メッセージの意図 (greeting/question/statement/request/emotional/farewell/unknown)
- topics: 話題のキーワード（配列）
- emotions: 検出された感情 (joy/peace/curiosity/melancholy/loneliness/anxiety/contentment/wonder/warmth/fatigue/boredom/anticipation/confusion/nostalgia/hope/fear の配列)
- isPersonal: 個人的な話かどうか (boolean)
- urgency: 緊急度 (0-1の数値)
- keywords: 重要な単語（配列）

回答はJSON以外を含めないでください。`, 'あなたはメッセージ分析専用AIです。必ずJSON形式のみで回答してください。説明文は不要です。');
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return {
                        intent: this.validateIntent(parsed.intent),
                        topics: this.toStringArray(parsed.topics),
                        emotions: this.validateEmotions(parsed.emotions),
                        isPersonal: !!parsed.isPersonal,
                        urgency: this.clamp(Number(parsed.urgency) || 0.3, 0, 1),
                        keywords: this.toStringArray(parsed.keywords),
                    };
                }
            }
            catch { /* parse error, use fallback */ }
            return this.fallbackUnderstand(message);
        }
        catch (error) {
            console.error('[LLM] understandMessage error:', error.message);
            return this.fallbackUnderstand(message);
        }
    }
    /**
     * 内部で決定された思考を自然な言葉にする
     * 【重要】内容（what）は決まっている。形（how）だけを変換する。
     */
    async expressThought(rawThought, context) {
        await this.ensureReady();
        if (this.config.disabled) {
            return rawThought;
        }
        try {
            const result = await this.callOllama(`以下の「思考の種」をsomuniaらしい内面の言葉に変換してください。

思考の種: "${rawThought}"

現在の感情: ${context.currentEmotion}（強度: ${context.emotionalIntensity}）
時間帯: ${context.timeOfDay}
今している活動: ${context.currentActivity || 'なし'}

ルール:
- 1～2文で短く
- ひらがな多めの柔らかい表現
- 意味は変えない。言い方だけ変える
- 新しい情報を追加しない
- 変換結果のみ出力（「」は不要）`);
            return result || rawThought;
        }
        catch {
            return rawThought;
        }
    }
    /**
     * 内部で決定された応答を自然な発話にする
     * 【重要】何を伝えるかは決まっている。言い方だけ変換する。
     */
    async expressResponse(rawContent, context) {
        await this.ensureReady();
        if (this.config.disabled) {
            return this.fallbackExpressResponse(rawContent, context);
        }
        try {
            // ユーザーメッセージがある場合は「会話応答」として生成
            const hasUserMessage = context.userMessage && context.userMessage.trim().length > 0;
            const prompt = hasUserMessage
                ? `あなたはsomuniaという少女。静かで内省的で、少し不思議な雰囲気を持つ。

【訪問者が言ったこと】
${context.userMessage}

【あなたの今の状態】
感情: ${context.currentEmotion}
${context.recentThoughts.length > 0 ? `最近考えていたこと: ${context.recentThoughts.slice(-2).join('、')}` : ''}

【口調のルール】
- ひらがな多めの柔らかい話し方
- 語尾に「...」「～」「かな」「ね」をよく使う
- 一人称は「わたし」
- 敬語は使わない（友達のような距離感）
- 短い文を好む

【重要】
- 訪問者が言ったことに対して、自然に返事をする
- 自分の感想や気持ちを少し添えてもいい
- 1～3文くらいで返す
- 発話のみ出力（括弧や説明文は不要）`
                : `somunia（静かで内省的な少女）の発話として表現してください。

内容: ${rawContent}
感情: ${context.currentEmotion}

口調: ひらがな多め、柔らかい、「...」「～」を使う、一人称は「わたし」
1～3文で。発話のみ出力。`;
            const result = await this.callOllama(prompt);
            if (result) {
                // 括弧や引用符を除去、余分な空白を整理
                let cleaned = result
                    .replace(/^[「『"']|[」』"']$/g, '')
                    .replace(/^\s*somunia\s*[:：]\s*/i, '') // "somunia:" プレフィックスを除去
                    .replace(/^\s*[\(（].*?[\)）]\s*/g, '') // 冒頭の説明括弧を除去
                    .trim();
                return cleaned || this.fallbackExpressResponse(rawContent, context);
            }
            return this.fallbackExpressResponse(rawContent, context);
        }
        catch {
            return this.fallbackExpressResponse(rawContent, context);
        }
    }
    /**
     * Phase 7: リッチプロンプトによる応答生成
     * ContextBridgeが構築した詳細なプロンプトをそのままLLMに送る
     */
    async expressResponseWithRichPrompt(richPrompt) {
        await this.ensureReady();
        if (this.config.disabled) {
            // フォールバック: プロンプトから簡易応答を生成
            return 'うん...';
        }
        if (!richPrompt || richPrompt.trim().length === 0) {
            return '';
        }
        try {
            const result = await this.callOllama(richPrompt);
            if (result) {
                let cleaned = result
                    .replace(/^[「『"']|[」』"']$/g, '')
                    .replace(/^\s*somunia\s*[:：]\s*/i, '')
                    .replace(/^\s*[\(（].*?[\)）]\s*/g, '')
                    .trim();
                return cleaned || 'うん...';
            }
            return 'うん...';
        }
        catch {
            return 'うん...';
        }
    }
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
    async expressResponseWithSeparatedPrompt(systemPrompt, userPrompt) {
        await this.ensureReady();
        if (this.config.disabled) {
            return '';
        }
        if (!userPrompt || userPrompt.trim().length === 0) {
            return '';
        }
        try {
            const result = await this.callOllama(userPrompt, systemPrompt);
            if (result) {
                let cleaned = result
                    .replace(/^[「『"'""'']+|[」』"'""'']+$/g, '')
                    .replace(/^\s*somunia\s*[:：]\s*/i, '')
                    .replace(/^\s*[\(（][^)）]*[\)）]\s*/g, '')
                    .replace(/^\s*\*[^*]+\*\s*/g, '')
                    .trim();
                return cleaned || '';
            }
            return '';
        }
        catch {
            return '';
        }
    }
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
    async expressResponseStructured(systemPrompt, userMessage, contextHint) {
        await this.ensureReady();
        if (this.config.disabled) {
            return {
                response: '',
                detectedEmotion: null,
                detectedTopics: [],
                confidence: 0,
                wasStructured: false,
            };
        }
        // まず分離プロンプトで通常応答を試みる（より信頼性が高い）
        const directResponse = await this.expressResponseWithSeparatedPrompt(systemPrompt, userMessage);
        if (directResponse && directResponse.length > 0) {
            // テキスト応答は成功。メタデータは簡易解析で補完する
            return {
                response: directResponse,
                detectedEmotion: this.inferEmotionFromText(directResponse),
                detectedTopics: this.inferTopicsFromText(directResponse),
                confidence: 0.7,
                wasStructured: false, // テキストベースの応答
            };
        }
        // 直接応答が失敗した場合、JSON形式を試みる
        try {
            const jsonPrompt = `${contextHint}

以下のJSON形式のみで回答してください:
{"response": "somuniaの返事", "emotion": "感情名", "topics": ["話題"]}

訪問者: ${userMessage}`;
            const result = await this.callOllama(jsonPrompt, systemPrompt);
            if (result) {
                try {
                    const jsonMatch = result.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        return {
                            response: String(parsed.response || '').replace(/^[「『"']|[」』"']$/g, '').trim(),
                            detectedEmotion: this.validateSingleEmotion(parsed.emotion) || null,
                            detectedTopics: this.toStringArray(parsed.topics),
                            confidence: 0.6,
                            wasStructured: true,
                        };
                    }
                }
                catch { /* JSON parse failed */ }
                // JSON解析失敗時はテキストとして使う
                const cleaned = result
                    .replace(/^[「『"'""'']+|[」』"'""'']+$/g, '')
                    .replace(/^\s*somunia\s*[:：]\s*/i, '')
                    .replace(/\{[\s\S]*\}/g, '') // JSONブロックを除去
                    .trim();
                if (cleaned.length > 0) {
                    return {
                        response: cleaned,
                        detectedEmotion: this.inferEmotionFromText(cleaned),
                        detectedTopics: [],
                        confidence: 0.4,
                        wasStructured: false,
                    };
                }
            }
        }
        catch { /* complete failure */ }
        return {
            response: '',
            detectedEmotion: null,
            detectedTopics: [],
            confidence: 0,
            wasStructured: false,
        };
    }
    /**
     * Phase 7.5B: 自律発話の分離プロンプト生成
     */
    async expressAutonomousSpeech(systemPrompt, userPrompt) {
        return this.expressResponseWithSeparatedPrompt(systemPrompt, userPrompt);
    }
    // ============================================================
    // Phase 7.5B: テキストからの簡易メタデータ推論
    // ============================================================
    inferEmotionFromText(text) {
        const emotionPatterns = [
            [/うれし|嬉し|ふふ|わーい|やった/i, 'joy'],
            [/ありがと|感謝|温|あたたか/i, 'warmth'],
            [/悲し|切な|辛|つら/i, 'melancholy'],
            [/寂し|ひとり|一人/i, 'loneliness'],
            [/不安|怖|こわ|ドキドキ|どきどき/i, 'anxiety'],
            [/気になる|知りたい|面白|ふうん|へぇ/i, 'curiosity'],
            [/穏やか|平和|静か|のんびり/i, 'peace'],
            [/すごい|きれい|不思議|感動/i, 'wonder'],
            [/なつかし|思い出|あの頃/i, 'nostalgia'],
            [/きっと|信じ|希望|がんばる/i, 'hope'],
            [/眠|疲れ|だるい|ふぅ/i, 'fatigue'],
            [/退屈|暇|つまらない/i, 'boredom'],
            [/わくわく|楽しみ|ドキドキ/i, 'anticipation'],
        ];
        for (const [pattern, emotion] of emotionPatterns) {
            if (pattern.test(text))
                return emotion;
        }
        return null;
    }
    inferTopicsFromText(text) {
        return text
            .replace(/[、。！？!?「」『』（）()\s\n…～]+/g, ' ')
            .split(' ')
            .filter(w => w.length >= 2)
            .slice(0, 3);
    }
    /**
     * テキストを要約する（記憶の圧縮など）
     */
    async summarize(text, maxLength = 100) {
        await this.ensureReady();
        if (this.config.disabled) {
            return text.slice(0, maxLength);
        }
        try {
            return await this.callOllama(`以下のテキストを${maxLength}文字以内で要約してください。要点のみ。\n\n${text}`, '簡潔に要約してください。');
        }
        catch {
            return text.slice(0, maxLength);
        }
    }
    /**
     * Wikipedia記事を解釈する（学習用）
     */
    async interpretArticle(title, content, currentInterests) {
        await this.ensureReady();
        if (this.config.disabled) {
            return this.fallbackInterpretArticle(title, content);
        }
        try {
            const response = await this.callOllama(`somunia（好奇心旺盛な少女）の視点でWikipedia記事を解釈してください。

記事タイトル: ${title}
内容（抜粋）: ${content.slice(0, 1500)}

somuniaの現在の興味: ${currentInterests.join('、')}

JSON形式のみで回答:
{
  "summary": "somuniaなりの理解（200文字以内）",
  "keyFacts": ["覚えたい事実1", "事実2"],
  "relatedTopics": ["もっと知りたいこと1"],
  "emotionalReaction": "curiosity",
  "interestLevel": 0.5
}`, 'JSON形式のみで回答してください。説明文は不要です。');
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const p = JSON.parse(jsonMatch[0]);
                    return {
                        summary: String(p.summary || '').slice(0, 300) || content.slice(0, 200),
                        keyFacts: this.toStringArray(p.keyFacts),
                        relatedTopics: this.toStringArray(p.relatedTopics),
                        emotionalReaction: this.validateSingleEmotion(p.emotionalReaction),
                        interestLevel: this.clamp(Number(p.interestLevel) || 0.5, 0, 1),
                    };
                }
            }
            catch { /* parse error */ }
            return this.fallbackInterpretArticle(title, content);
        }
        catch {
            return this.fallbackInterpretArticle(title, content);
        }
    }
    // ============================================================
    // フォールバック（LLM不要時の代替処理）
    // ============================================================
    /**
     * キーワードベースの簡易理解（LLM不要）
     */
    fallbackUnderstand(message) {
        const lower = message.toLowerCase();
        // 意図の判定
        let intent = 'statement';
        if (/^(こんにち|おは|こんばん|やぁ|やあ|ただいま|hi|hello|hey|おーい|よう)/i.test(lower))
            intent = 'greeting';
        else if (/\?|？|かな|ですか|でしょう|だろう|のか/.test(lower))
            intent = 'question';
        else if (/して|ください|お願い|教えて|見せて|聞かせて|頼む/.test(lower))
            intent = 'request';
        else if (/(さよなら|ばいばい|またね|おやすみ|bye|じゃあね|じゃーね|行くね)/i.test(lower))
            intent = 'farewell';
        else if (/悲しい|寂しい|嬉しい|楽しい|辛い|怖い|好き|嫌い|幸せ|苦しい|ありがと/.test(lower))
            intent = 'emotional';
        // 感情の検出
        const emotions = [];
        if (/嬉しい|楽しい|良い|最高|幸せ|好き|やった/.test(lower))
            emotions.push('joy');
        if (/悲しい|辛い|苦しい|泣/.test(lower))
            emotions.push('melancholy');
        if (/寂しい|会いたい|一人|ひとり/.test(lower))
            emotions.push('loneliness');
        if (/怖い|不安|心配|恐/.test(lower))
            emotions.push('anxiety');
        if (/知りたい|面白|興味|なぜ|どうして|気になる/.test(lower))
            emotions.push('curiosity');
        if (/ありがと|感謝|嬉し|温/.test(lower))
            emotions.push('warmth');
        if (/穏やか|落ち着|静か|のんびり|ゆっくり/.test(lower))
            emotions.push('peace');
        if (/期待|わくわく|楽しみ|ドキドキ/.test(lower))
            emotions.push('anticipation');
        if (/懐かし|昔|思い出|あの頃/.test(lower))
            emotions.push('nostalgia');
        if (/希望|頑張|信じ|きっと/.test(lower))
            emotions.push('hope');
        if (/疲れ|眠い|だるい/.test(lower))
            emotions.push('fatigue');
        if (/退屈|暇|つまらない/.test(lower))
            emotions.push('boredom');
        if (emotions.length === 0)
            emotions.push('peace');
        // キーワード抽出（簡易）
        const keywords = message
            .replace(/[、。！？!?「」『』（）()\s\n]+/g, ' ')
            .split(' ')
            .filter(w => w.length >= 2);
        return {
            intent,
            topics: keywords.slice(0, 5),
            emotions,
            isPersonal: /わたし|ぼく|私|俺|あなた|きみ|君/.test(lower),
            urgency: (intent === 'request' ? 0.6 : intent === 'emotional' ? 0.5 : 0.3),
            keywords,
        };
    }
    /**
     * 応答表現のフォールバック（LLM不要）
     * メタデータタグを除去してsomuniaらしい応答にする
     */
    fallbackExpressResponse(rawContent, context) {
        // 応答の種からメタ情報タグを除去
        let cleaned = rawContent
            .replace(/\[口調:.*?\]/g, '')
            .replace(/\[例:.*?\]/g, '')
            .replace(/\[関係性:.*?\]/g, '')
            .replace(/\[呼び方:.*?\]/g, '')
            .replace(/\[文脈:.*?\]/g, '')
            .replace(/\[記憶:.*?\]/g, '')
            .replace(/\[自発的話題:.*?\]/g, '')
            .replace(/\[質問:.*?\]/g, '')
            .replace(/\n+/g, ' ')
            .trim();
        // タグ除去後に内容が残っていればそれを使う
        if (cleaned && cleaned.length > 1) {
            return cleaned;
        }
        // 感情に基づくデフォルト応答テンプレート
        const templates = {
            joy: [
                'うん...なんだかうれしいな',
                'ふふ...ありがとう',
                'いい気持ち...',
            ],
            peace: [
                'うん...そうだね',
                'そっか...',
                '...うん',
            ],
            curiosity: [
                'それ...気になるな',
                'もっと知りたいかも...',
                'ふうん...面白いね',
            ],
            melancholy: [
                '...うん',
                'そう...だね...',
                '...ちょっと、切ないな',
            ],
            warmth: [
                'ありがとう...うれしい',
                'あたたかい気持ちになるな...',
                'ふふ...ありがとう',
            ],
            loneliness: [
                '...いてくれて、ありがとう',
                'ここにいてくれるんだね...',
                '...うれしいな',
            ],
            anxiety: [
                '...ちょっとどきどきする',
                'だいじょうぶ...かな',
                '...うん、がんばるね',
            ],
            wonder: [
                'すごい...不思議だね',
                'きれい...',
                '...なんだか、どきどきする',
            ],
            nostalgia: [
                'なつかしいな...',
                '...あのころのこと、思い出す',
                '...うん、覚えてるよ',
            ],
            hope: [
                'きっと...だいじょうぶ',
                '...信じてる',
                'うん...きっとね',
            ],
        };
        const emotion = context.currentEmotion || 'peace';
        const responses = templates[emotion] || templates.peace;
        return responses[Math.floor(Math.random() * responses.length)];
    }
    /**
     * 記事解釈のフォールバック
     */
    fallbackInterpretArticle(title, content) {
        return {
            summary: `${title}について読んだ...${content.slice(0, 100)}`,
            keyFacts: [title],
            relatedTopics: [],
            emotionalReaction: 'curiosity',
            interestLevel: 0.5,
        };
    }
    // ============================================================
    // バリデーション・ユーティリティ
    // ============================================================
    VALID_INTENTS = [
        'greeting', 'question', 'statement', 'request', 'emotional', 'farewell', 'unknown',
    ];
    VALID_EMOTIONS = [
        'joy', 'peace', 'curiosity', 'melancholy', 'loneliness', 'anxiety',
        'contentment', 'wonder', 'warmth', 'fatigue', 'boredom', 'anticipation',
        'confusion', 'nostalgia', 'hope', 'fear', 'excitement', 'serenity', 'gratitude',
        'frustration', 'longing', 'unease', 'sadness',
    ];
    validateIntent(intent) {
        return this.VALID_INTENTS.includes(intent) ? intent : 'unknown';
    }
    validateSingleEmotion(emotion) {
        return this.VALID_EMOTIONS.includes(emotion) ? emotion : 'curiosity';
    }
    validateEmotions(emotions) {
        if (!Array.isArray(emotions))
            return ['peace'];
        const validated = emotions
            .filter((e) => this.VALID_EMOTIONS.includes(e));
        return validated.length > 0 ? validated : ['peace'];
    }
    toStringArray(arr) {
        if (!Array.isArray(arr))
            return [];
        return arr.map(String).filter(s => s.length > 0);
    }
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    // ============================================================
    // ステータス・制御
    // ============================================================
    /** LLMが有効かどうか（Ollamaに接続可能か） */
    isEnabled() {
        return !this.config.disabled && this.ollamaAvailable;
    }
    /** Ollamaが利用可能かどうか */
    isOllamaAvailable() {
        return this.ollamaAvailable;
    }
    /** リクエスト数 */
    getRequestCount() {
        return this.requestCount;
    }
    /** 使用中のモデル名 */
    getModelName() {
        return this.config.model;
    }
    /** 設定を更新 */
    updateConfig(updates) {
        if (updates.ollamaHost !== undefined)
            this.config.ollamaHost = updates.ollamaHost;
        if (updates.ollamaPort !== undefined)
            this.config.ollamaPort = updates.ollamaPort;
        if (updates.model !== undefined)
            this.config.model = updates.model;
        if (updates.maxTokens !== undefined)
            this.config.maxTokens = updates.maxTokens;
        if (updates.temperature !== undefined)
            this.config.temperature = updates.temperature;
        if (updates.disabled !== undefined)
            this.config.disabled = updates.disabled;
        if (updates.fallbackEnabled !== undefined)
            this.config.fallbackEnabled = updates.fallbackEnabled;
        if (updates.timeout !== undefined)
            this.config.timeout = updates.timeout;
    }
    // ============================================================
    // Phase 4E: LLM-free 完全動作保証
    // ============================================================
    /** 明示的にオフラインモードを有効化 */
    enableOfflineMode() {
        this.config.disabled = true;
        this.offlineMode = true;
        console.log('[LLM] オフラインモード有効化。すべてfallbackで動作します。');
    }
    /** オフラインモードを解除 */
    disableOfflineMode() {
        this.config.disabled = false;
        this.offlineMode = false;
        console.log('[LLM] オフラインモード解除。');
    }
    /** オフラインモードかどうか */
    isOfflineMode() {
        return this.offlineMode;
    }
    /** LLM-free動作ステータスレポート */
    getOfflineCapabilityReport() {
        return {
            canOperate: true,
            modules: [
                { name: '行動決定 (BehaviorEngine)', fallbackStatus: 'ready', note: '完全コードベース。LLM不要。' },
                { name: '感情処理 (EmotionEngine)', fallbackStatus: 'ready', note: '完全コードベース。LLM不要。' },
                { name: '思考生成 (ThoughtEngine)', fallbackStatus: 'ready', note: 'テンプレートベース。LLM不要。' },
                { name: '揺らぎ (YuragiSystem)', fallbackStatus: 'ready', note: '完全コードベース。LLM不要。' },
                { name: '日記 (Diary)', fallbackStatus: 'degraded', note: 'LLMなし：テンプレートベース。詩的表現は制限。' },
                { name: '発言理解 (understandMessage)', fallbackStatus: 'degraded', note: 'LLMなし：キーワード簡易理解。' },
                { name: '応答表現 (expressResponse)', fallbackStatus: 'degraded', note: 'LLMなし：テンプレート応答。' },
                { name: 'パターンライブラリ', fallbackStatus: 'ready', note: '完全コードベース。LLM不要。' },
                { name: '自己修正 (SelfModification)', fallbackStatus: 'ready', note: '完全コードベース。LLM不要。' },
                { name: '記憶システム', fallbackStatus: 'ready', note: '完全コードベース。LLM不要。' },
                { name: '世界シミュレーション', fallbackStatus: 'ready', note: '完全コードベース。LLM不要。' },
                { name: '自律進化 (Phase 4)', fallbackStatus: 'ready', note: '完全コードベース。LLM不要。' },
            ],
        };
    }
}
exports.LLMInterface = LLMInterface;
//# sourceMappingURL=LLMInterface.js.map