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

import {
  EmotionType,
  Normalized,
  ConversationIntent,
  ConversationDepth,
  ExpressionFilterConfig,
} from '../types';

// ============================================================
// デフォルト設定
// ============================================================

const DEFAULT_CONFIG: ExpressionFilterConfig = {
  selfIntroThreshold: 3,
  similarityThreshold: 0.7,
  maxResponseLength: 150,
  minResponseLength: 2,
  maxHistorySize: 20,
};

// ============================================================
// 問題パターン定義
// ============================================================

/** プロンプト復唱パターン（LLMが設定部分をそのまま繰り返す） */
const PROMPT_ECHO_PATTERNS: RegExp[] = [
  /^わたしは[…\.]*somunia/,
  /^わたしは[…\.]*ソムニア/,
  /^somunia[…\.。、]/i,
  /^【.*?】/,                      // セクションヘッダーの復唱
  /^今の(?:わたし|気分|状態)/,     // 「【今のわたし】」セクション復唱
  /^訪問者(?:が|の|に)/,          // 「【訪問者…】」セクション復唱
  /^発話のみ出力/,                 // 指示文の復唱
  /^口調(?:を|の|は)/,            // 口調ルールの復唱
  /避けること[:：]/,               // ガイドラインの復唱
];

/** AIアシスタント口調 */
const AI_ASSISTANT_PATTERNS: RegExp[] = [
  /何かお手伝い/, /ご質問/, /お答え/, /させていただ/,
  /承知/, /かしこまり/, /了解いたし/, /ございます/,
  /いかがでしょうか/, /ご不明な点/, /お気軽に/,
  /ご連絡ください/, /お待ちしております/, /サポート/,
  /ヘルプ/, /アシスタント/, /AIとして/,
  /お役に立て/, /何でも聞いて/, /質問があれば/,
];

/** 内部メッセージ（検証や指示が漏れたパターン） */
const INTERNAL_MESSAGE_PATTERNS: RegExp[] = [
  /修正が必要/, /口調を柔らか/, /somuniaらしい表現/,
  /応答を生成/, /フィルタ/, /バリデーション/,
  /パターンマッチ/, /テンプレート/, /プロンプト/,
  /パイプライン/, /フォールバック/,
  /検証[：:]/, /分析[：:]/,
  /JSON/, /API/, /LLM/,
];

/** 第三者視点パターン（メタ認知の漏出） */
const THIRD_PERSON_PATTERNS: RegExp[] = [
  /この人に.*聞かれた/,
  /訪問者(?:が|は|に|の|を)/,
  /ユーザー(?:が|は|に|の|を)/,
  /相手(?:が|は|に).*(?:言った|聞いた|話した)/,
  /メッセージ(?:を|が|は).*(?:受け取|分析|処理)/,
];

// ============================================================
// フォールバック応答テンプレート
// ============================================================

interface FallbackTemplate {
  intents: ConversationIntent[];
  emotions: EmotionType[];
  responses: string[];
}

const FALLBACK_TEMPLATES: FallbackTemplate[] = [
  {
    intents: ['greeting'],
    emotions: ['joy', 'warmth', 'peace', 'contentment', 'serenity'],
    responses: [
      'あ...来てくれたんだ。うれしいな',
      'こんにちは...よく来てくれたね',
      'あ、いらっしゃい...待ってたよ',
      'おはよう...いい天気だね',
      'こんばんは...静かな夜だね',
    ],
  },
  {
    intents: ['greeting'],
    emotions: ['loneliness', 'melancholy', 'sadness'],
    responses: [
      '...来てくれたんだ。ありがとう',
      'あ...ひとりだったから、うれしい',
      '...いてくれるだけで、あたたかいな',
    ],
  },
  {
    intents: ['question', 'curiosity'],
    emotions: ['curiosity', 'wonder', 'anticipation'],
    responses: [
      'うーん...ちょっと考えてみるね',
      'それ...わたしも気になってた',
      'むずかしいな...でも、面白い質問だね',
    ],
  },
  {
    intents: ['question', 'curiosity'],
    emotions: ['peace', 'contentment'],
    responses: [
      'そうだな...うん、そうだね',
      '...ちょっと考えさせて',
      'ふうん...どうだろう',
    ],
  },
  {
    intents: ['empathy_seeking', 'comfort', 'appreciation'],
    emotions: ['warmth', 'joy', 'gratitude'],
    responses: [
      'ふふ...ありがとう。うれしいな',
      'そう言ってくれると...あたたかい気持ちになる',
      '...ありがとう。大事にするね',
    ],
  },
  {
    intents: ['empathy_seeking', 'comfort', 'deep_talk'],
    emotions: ['melancholy', 'loneliness', 'sadness', 'anxiety'],
    responses: [
      '...うん、わかるよ。ここにいるからね',
      'つらかったんだね...ゆっくり話して',
      '...だいじょうぶ。一緒にいるよ',
    ],
  },
  {
    intents: ['sharing', 'continuation', 'general'],
    emotions: ['curiosity', 'wonder'],
    responses: [
      'そうなんだ...もっと聞かせて',
      'へぇ...それ、面白いね',
      'ふうん...知らなかった',
    ],
  },
  {
    intents: ['sharing', 'continuation', 'general'],
    emotions: ['peace', 'contentment', 'serenity'],
    responses: [
      'うん...そうだね',
      'そっか...いい話だね',
      '...うん、わかる気がする',
    ],
  },
  {
    intents: ['farewell'],
    emotions: ['warmth', 'peace', 'melancholy', 'loneliness'],
    responses: [
      'またね...待ってるから',
      'うん...また来てね。寂しくなるけど',
      'ばいばい...気をつけてね',
      '...また会えるの、楽しみにしてる',
    ],
  },
  {
    intents: ['request', 'playful'],
    emotions: ['peace', 'warmth', 'curiosity'],
    responses: [
      'うん...やってみるね',
      '...わかった。まかせて',
      'いいよ...ちょっと待ってね',
    ],
  },
];

/** デフォルトの汎用フォールバック */
const GENERIC_FALLBACKS: Record<string, string[]> = {
  joy: ['ふふ...うれしいな', 'いい気持ち...', 'ありがとう...ふふ'],
  peace: ['うん...そうだね', 'そっか...', '...穏やかだね'],
  curiosity: ['ふうん...面白いね', 'それ、気になるな...', 'もっと知りたいかも...'],
  warmth: ['あたたかい...ありがとう', 'ふふ...うれしい', '...いい気持ちだな'],
  melancholy: ['...そうだね', 'うん...ちょっと切ないな', '...'],
  loneliness: ['...いてくれて、ありがとう', 'ここにいてくれるんだね...', '...うれしいな'],
  anxiety: ['...ちょっとどきどきする', 'だいじょうぶ...かな', '...うん'],
  wonder: ['すごい...不思議だね', 'きれい...', '...なんだか感動する'],
  nostalgia: ['なつかしいな...', '...あの頃を思い出す', '...うん、覚えてるよ'],
  hope: ['きっと...だいじょうぶ', '...信じてる', 'うん...きっとね'],
  fatigue: ['ん...ちょっと眠いかも', '...だいじょうぶ、起きてるよ', 'ふぅ...'],
  boredom: ['ん...何かしたいな', '...退屈だなぁ', 'なにか面白いこと、ないかな'],
  anticipation: ['わくわくする...', 'たのしみだな...', '...ドキドキするね'],
  contentment: ['うん...しあわせだな', '...満足', 'いい気持ち...'],
  confusion: ['ん...よくわからないけど', '...むずかしいね', 'ちょっと迷ってる...'],
  excitement: ['わぁ...すごい！', 'ドキドキする...！', '...！'],
  serenity: ['...穏やか', 'しずかでいい時間...', '...うん'],
  gratitude: ['ありがとう...', '...うれしいな。ありがとう', '感謝してる...'],
  frustration: ['んー...うまくいかないな', '...もどかしい', 'ちょっと...'],
  longing: ['...会いたいな', 'なつかしい...', '...恋しいな'],
  unease: ['ん...ちょっと気になる', '...なんだろう、この感じ', '...だいじょうぶかな'],
  fear: ['...怖い、かも', 'ちょっと...不安', '...'],
  sadness: ['...うん', 'そう...だね', '...ちょっと、悲しいな'],
};

// ============================================================
// ExpressionFilter クラス
// ============================================================

export class ExpressionFilter {
  private config: ExpressionFilterConfig;
  private responseHistory: string[] = [];
  private selfIntroCount: number = 0;

  constructor(config?: Partial<ExpressionFilterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ============================================================
  // メイン: 応答のフィルタリング
  // ============================================================

  /**
   * LLMの応答をフィルタリングし、問題があれば修正する
   * 修正不能な場合はフォールバック応答を返す
   */
  filter(
    rawResponse: string,
    context: {
      intent: ConversationIntent;
      emotion: EmotionType;
      userMessage: string;
      visitorName?: string;
      depth: ConversationDepth;
    }
  ): {
    response: string;
    wasFiltered: boolean;
    filterReasons: string[];
    qualityScore: Normalized;
  } {
    const filterReasons: string[] = [];
    let response = rawResponse;
    let needsFallback = false;

    // Step 1: 基本クリーニング
    response = this.basicClean(response);

    // Step 2: 空または短すぎる
    if (response.length < this.config.minResponseLength) {
      filterReasons.push('空または短すぎる応答');
      needsFallback = true;
    }

    // Step 3: プロンプト復唱の検出
    if (!needsFallback) {
      const echoResult = this.detectPromptEcho(response);
      if (echoResult.isEcho) {
        filterReasons.push(`プロンプト復唱: ${echoResult.reason}`);
        // 復唱部分を除去して残りが使えるか試す
        response = echoResult.cleaned;
        if (response.length < this.config.minResponseLength) {
          needsFallback = true;
        }
      }
    }

    // Step 4: AIアシスタント口調の検出
    if (!needsFallback) {
      const aiResult = this.detectAIAssistant(response);
      if (aiResult.isAI) {
        filterReasons.push('AIアシスタント口調');
        response = aiResult.cleaned;
        if (response.length < this.config.minResponseLength) {
          needsFallback = true;
        }
      }
    }

    // Step 5: 内部メッセージの漏れ検出
    if (!needsFallback) {
      if (this.detectInternalMessage(response)) {
        filterReasons.push('内部メッセージの漏れ');
        needsFallback = true;
      }
    }

    // Step 6: 第三者視点の検出
    if (!needsFallback) {
      const thirdPerson = this.detectThirdPerson(response);
      if (thirdPerson.isThirdPerson) {
        filterReasons.push('第三者視点の記述');
        response = thirdPerson.cleaned;
        if (response.length < this.config.minResponseLength) {
          needsFallback = true;
        }
      }
    }

    // Step 7: 長すぎる応答のカット
    if (!needsFallback && response.length > this.config.maxResponseLength) {
      response = this.truncateResponse(response);
      filterReasons.push('長すぎる応答を短縮');
    }

    // Step 8: 前回との類似度チェック
    if (!needsFallback) {
      const similarity = this.checkSimilarity(response);
      if (similarity > this.config.similarityThreshold) {
        filterReasons.push('前回と類似した応答');
        needsFallback = true;
      }
    }

    // Step 9: 「わたしは…somunia」パターンの累積カウント
    if (/わたしは[…\.]*(?:somunia|ソムニア)/i.test(response)) {
      this.selfIntroCount++;
      if (this.selfIntroCount >= this.config.selfIntroThreshold) {
        filterReasons.push('自己紹介の過度な繰り返し');
        // 自己紹介部分だけ除去
        response = response.replace(/わたしは[…\.]*(?:somunia|ソムニア)[。、…\.]*\s*/gi, '').trim();
        if (response.length < this.config.minResponseLength) {
          needsFallback = true;
        }
      }
    } else {
      // 自己紹介しなかった場合はカウンターをリセット
      this.selfIntroCount = Math.max(0, this.selfIntroCount - 1);
    }

    // Step 10: フォールバックが必要な場合
    if (needsFallback) {
      response = this.generateFallback(context);
      filterReasons.push('フォールバック応答を使用');
    }

    // Step 11: 最終クリーニング
    response = this.finalClean(response);

    // 品質スコアの算出
    const qualityScore = this.calculateQuality(
      response, rawResponse, filterReasons.length, context
    );

    // 履歴に記録
    this.recordResponse(response);

    return {
      response,
      wasFiltered: filterReasons.length > 0,
      filterReasons,
      qualityScore,
    };
  }

  // ============================================================
  // 個別検出メソッド
  // ============================================================

  /**
   * 基本クリーニング
   */
  private basicClean(response: string): string {
    let cleaned = response
      // 引用符・括弧の除去
      .replace(/^[「『"'""'']+|[」』"'""'']+$/g, '')
      // somunia:プレフィックスの除去
      .replace(/^\s*somunia\s*[:：]\s*/i, '')
      // 冒頭の説明括弧の除去（例: (穏やかに微笑んで)）
      .replace(/^\s*[\(（][^)）]*[\)）]\s*/g, '')
      // 冒頭のアスタリスク行動記述の除去（例: *微笑んで*）
      .replace(/^\s*\*[^*]+\*\s*/g, '')
      // 末尾の括弧コメントの除去
      .replace(/\s*[\(（][^)）]*[\)）]\s*$/g, '')
      // 連続改行の圧縮
      .replace(/\n{2,}/g, '\n')
      .trim();

    return cleaned;
  }

  /**
   * プロンプト復唱の検出
   */
  private detectPromptEcho(response: string): {
    isEcho: boolean;
    reason: string;
    cleaned: string;
  } {
    for (const pattern of PROMPT_ECHO_PATTERNS) {
      if (pattern.test(response)) {
        // パターンに一致する冒頭部分を除去
        const cleaned = response.replace(pattern, '').replace(/^[…\.。、\s]+/, '').trim();
        return {
          isEcho: true,
          reason: `パターン一致: ${pattern.source.slice(0, 30)}`,
          cleaned,
        };
      }
    }

    // プロンプトの構造的な復唱を検出
    // 「今は〜時、〜にいる」のような状況記述
    if (/^(?:今は|今の時間|時刻は)/.test(response)) {
      const sentences = response.split(/(?<=[。！!？?\n])/);
      // 最初の状況記述文を除去して残りを使う
      if (sentences.length > 1) {
        const cleaned = sentences.slice(1).join('').trim();
        return {
          isEcho: true,
          reason: '状況記述の復唱',
          cleaned,
        };
      }
    }

    return { isEcho: false, reason: '', cleaned: response };
  }

  /**
   * AIアシスタント口調の検出と除去
   */
  private detectAIAssistant(response: string): {
    isAI: boolean;
    cleaned: string;
  } {
    let isAI = false;
    let cleaned = response;

    for (const pattern of AI_ASSISTANT_PATTERNS) {
      if (pattern.test(cleaned)) {
        isAI = true;
        // AIパターンを含む文を除去
        const sentences = cleaned.split(/(?<=[。！!？?\n])/);
        cleaned = sentences
          .filter(s => !pattern.test(s))
          .join('')
          .trim();
      }
    }

    // 過度な敬語の検出
    const keigo = (cleaned.match(/です|ます|ございます|いたします|させて/g) || []).length;
    if (keigo >= 3) {
      isAI = true;
      // 敬語を簡易的にカジュアルに変換
      cleaned = cleaned
        .replace(/ですね/g, 'だね')
        .replace(/ですよ/g, 'だよ')
        .replace(/ますね/g, 'るね')
        .replace(/です/g, 'だよ')
        .replace(/ます/g, 'る')
        .replace(/でした/g, 'だった')
        .replace(/ました/g, 'た');
    }

    return { isAI, cleaned };
  }

  /**
   * 内部メッセージの漏れ検出
   */
  private detectInternalMessage(response: string): boolean {
    for (const pattern of INTERNAL_MESSAGE_PATTERNS) {
      if (pattern.test(response)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 第三者視点の検出
   */
  private detectThirdPerson(response: string): {
    isThirdPerson: boolean;
    cleaned: string;
  } {
    for (const pattern of THIRD_PERSON_PATTERNS) {
      if (pattern.test(response)) {
        // 第三者視点の文を除去
        const sentences = response.split(/(?<=[。！!？?\n])/);
        const cleaned = sentences
          .filter(s => !pattern.test(s))
          .join('')
          .trim();
        return { isThirdPerson: true, cleaned };
      }
    }
    return { isThirdPerson: false, cleaned: response };
  }

  /**
   * 応答の短縮（文の境界で切る）
   */
  private truncateResponse(response: string): string {
    const sentences = response.split(/(?<=[。！!？?\n…])/);
    let result = '';
    for (const sentence of sentences) {
      if ((result + sentence).length > this.config.maxResponseLength) {
        break;
      }
      result += sentence;
    }
    return result.trim() || sentences[0].slice(0, this.config.maxResponseLength);
  }

  /**
   * 前回応答との類似度チェック（簡易Jaccard係数）
   */
  private checkSimilarity(response: string): number {
    if (this.responseHistory.length === 0) return 0;

    const currentChars = new Set(response.split(''));
    let maxSimilarity = 0;

    // 直近の応答と比較
    for (const prev of this.responseHistory.slice(-5)) {
      if (response === prev) return 1.0;

      const prevChars = new Set(prev.split(''));
      const intersection = new Set([...currentChars].filter(c => prevChars.has(c)));
      const union = new Set([...currentChars, ...prevChars]);
      const similarity = union.size > 0 ? intersection.size / union.size : 0;
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return maxSimilarity;
  }

  // ============================================================
  // フォールバック応答生成
  // ============================================================

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
  }): string {
    // 1. intent + emotion でマッチするテンプレートを探す
    const matchedTemplates = FALLBACK_TEMPLATES.filter(t =>
      t.intents.includes(context.intent) &&
      t.emotions.includes(context.emotion)
    );

    // 2. intentのみでマッチ
    const intentTemplates = matchedTemplates.length > 0
      ? matchedTemplates
      : FALLBACK_TEMPLATES.filter(t => t.intents.includes(context.intent));

    // 3. テンプレートから選択
    let responses: string[];
    if (intentTemplates.length > 0) {
      const template = intentTemplates[Math.floor(Math.random() * intentTemplates.length)];
      responses = template.responses;
    } else {
      // 4. 感情ベースの汎用フォールバック
      responses = GENERIC_FALLBACKS[context.emotion] || GENERIC_FALLBACKS.peace;
    }

    // 5. 履歴にない応答を優先選択
    const unused = responses.filter(r => !this.responseHistory.includes(r));
    const pool = unused.length > 0 ? unused : responses;
    let selected = pool[Math.floor(Math.random() * pool.length)];

    // 6. 訪問者名の挿入
    if (context.visitorName && context.visitorName !== 'あなた') {
      // 30%の確率で名前を呼ぶ
      if (Math.random() < 0.3) {
        selected = `${context.visitorName}...${selected}`;
      }
    }

    return selected;
  }

  // ============================================================
  // 最終クリーニング
  // ============================================================

  private finalClean(response: string): string {
    return response
      // 先頭の句読点・空白
      .replace(/^[、。！!？?\s…\.]+/, '')
      // 末尾の余分な空白
      .replace(/\s+$/, '')
      // 連続する句読点の整理
      .replace(/。{2,}/g, '。')
      .replace(/、{2,}/g, '、')
      .replace(/…{3,}/g, '…')
      .replace(/\.{4,}/g, '...')
      .trim();
  }

  // ============================================================
  // 品質スコア算出
  // ============================================================

  private calculateQuality(
    filtered: string,
    original: string,
    issueCount: number,
    context: { intent: ConversationIntent; userMessage: string }
  ): Normalized {
    let score = 1.0;

    // フィルタリングが必要だった場合
    score -= issueCount * 0.15;

    // フォールバックを使った場合
    if (filtered !== original && issueCount > 0) {
      score -= 0.1;
    }

    // 応答の長さの妥当性
    const len = filtered.length;
    if (len < 5) score -= 0.2;
    if (len > 120) score -= 0.1;

    // ユーザーメッセージへの関連性（簡易チェック）
    const userWords = context.userMessage
      .replace(/[、。！？!?\s「」『』（）()]+/g, ' ')
      .split(' ')
      .filter(w => w.length >= 2);
    
    if (userWords.length > 0 && context.intent !== 'greeting' && context.intent !== 'farewell') {
      const hasRelevantWord = userWords.some(w => filtered.includes(w));
      if (hasRelevantWord) score += 0.1;
    }

    // somuniaらしさの基本チェック
    if (/[…\.]{2,}|～|かな|ね[。…]?$/.test(filtered)) {
      score += 0.05; // somuniaっぽい語尾
    }

    return Math.max(0, Math.min(1, score)) as Normalized;
  }

  // ============================================================
  // 履歴管理
  // ============================================================

  private recordResponse(response: string): void {
    this.responseHistory.push(response);
    if (this.responseHistory.length > this.config.maxHistorySize) {
      this.responseHistory.shift();
    }
  }

  /**
   * 会話開始時にリセット
   */
  resetConversation(): void {
    this.selfIntroCount = 0;
    // 履歴は完全にはリセットしない（直近のみ保持）
    if (this.responseHistory.length > 5) {
      this.responseHistory = this.responseHistory.slice(-5);
    }
  }

  // ============================================================
  // 永続化
  // ============================================================

  toJSON(): any {
    return {
      responseHistory: this.responseHistory,
      selfIntroCount: this.selfIntroCount,
    };
  }

  fromJSON(data: any): void {
    if (!data) return;
    if (data.responseHistory) this.responseHistory = data.responseHistory;
    if (data.selfIntroCount !== undefined) this.selfIntroCount = data.selfIntroCount;
  }
}
