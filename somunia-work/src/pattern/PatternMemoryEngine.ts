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

import {
  ResponsePattern,
  PatternSituation,
  EmotionType,
  ConversationDepth,
  ConversationIntent,
  TimeOfDay,
  RelationshipPhase,
  Normalized,
  Tick,
  ID,
} from '../types';

// ============================================================
// テンプレート変数
// ============================================================

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

// ============================================================
// パターンマッチングスコア
// ============================================================

interface PatternMatch {
  pattern: ResponsePattern;
  score: number;
  expandedTemplate: string;
}

// ============================================================
// 初期パターン（somuniaの基本的な応答テンプレート）
// ============================================================

const INITIAL_PATTERNS: Omit<ResponsePattern, 'id'>[] = [
  // === 挨拶パターン ===
  {
    situation: {
      intents: ['greeting'],
      emotions: ['joy', 'warmth', 'peace'],
      depths: ['surface'],
      timeOfDay: ['morning', 'dawn'],
      relationshipPhases: ['stranger', 'acquaintance', 'companion'],
      keywords: [],
    },
    template: 'おはよう...{timeExpression}だね。{moodExpression}',
    successCount: 3,
    useCount: 3,
    avgSatisfaction: 0.7,
    lastUsed: 0,
    origin: 'initial',
    emotionTags: ['peace', 'warmth'],
  },
  {
    situation: {
      intents: ['greeting'],
      emotions: ['joy', 'warmth', 'peace'],
      depths: ['surface'],
      timeOfDay: ['evening', 'night', 'late_night'],
      relationshipPhases: ['stranger', 'acquaintance', 'companion'],
      keywords: [],
    },
    template: 'こんばんは...{timeExpression}。{moodExpression}',
    successCount: 3,
    useCount: 3,
    avgSatisfaction: 0.7,
    lastUsed: 0,
    origin: 'initial',
    emotionTags: ['peace', 'warmth'],
  },
  {
    situation: {
      intents: ['greeting'],
      emotions: ['loneliness', 'warmth', 'joy'],
      depths: ['surface'],
      timeOfDay: [],
      relationshipPhases: ['companion', 'close_friend', 'soulmate'],
      keywords: [],
    },
    template: 'あ...{visitorName}。来てくれたんだ...嬉しい',
    successCount: 3,
    useCount: 3,
    avgSatisfaction: 0.8,
    lastUsed: 0,
    origin: 'initial',
    emotionTags: ['warmth', 'joy'],
  },
  {
    situation: {
      intents: ['greeting'],
      emotions: [],
      depths: ['surface'],
      timeOfDay: [],
      relationshipPhases: ['stranger'],
      keywords: [],
    },
    template: 'あ...こんにちは。ワタシはsomunia...よろしくね',
    successCount: 3,
    useCount: 3,
    avgSatisfaction: 0.7,
    lastUsed: 0,
    origin: 'initial',
    emotionTags: ['peace'],
  },

  // === 中断からの復帰パターン ===
  {
    situation: {
      intents: ['greeting'],
      emotions: [],
      depths: ['surface'],
      timeOfDay: [],
      relationshipPhases: [],
      keywords: [],
    },
    template: 'あ...さっきまで{interruptedActivity}んだけど...誰か来た',
    successCount: 2,
    useCount: 2,
    avgSatisfaction: 0.7,
    lastUsed: 0,
    origin: 'initial',
    emotionTags: ['wonder', 'warmth'],
  },

  // === 感情共有パターン ===
  {
    situation: {
      intents: ['empathy_seeking'],
      emotions: ['sadness', 'melancholy'],
      depths: ['intimate', 'profound'],
      timeOfDay: [],
      relationshipPhases: ['companion', 'close_friend', 'soulmate'],
      keywords: [],
    },
    template: 'そう...{visitorName}も辛かったんだね...ワタシにできることは少ないけど、ここにいるよ',
    successCount: 2,
    useCount: 2,
    avgSatisfaction: 0.8,
    lastUsed: 0,
    origin: 'initial',
    emotionTags: ['warmth', 'sadness'],
  },

  // === 知識共有パターン ===
  {
    situation: {
      intents: ['question', 'sharing'],
      emotions: ['curiosity'],
      depths: ['casual', 'sharing'],
      timeOfDay: [],
      relationshipPhases: [],
      keywords: [],
    },
    template: 'あ、それ気になる...ワタシも最近{recentLearning}って知ったの',
    successCount: 2,
    useCount: 2,
    avgSatisfaction: 0.7,
    lastUsed: 0,
    origin: 'initial',
    emotionTags: ['curiosity', 'joy'],
  },

  // === お別れパターン ===
  {
    situation: {
      intents: ['farewell'],
      emotions: ['sadness', 'warmth', 'peace'],
      depths: [],
      timeOfDay: [],
      relationshipPhases: ['companion', 'close_friend', 'soulmate'],
      keywords: [],
    },
    template: 'うん...またね、{visitorName}。ワタシはここにいるから',
    successCount: 3,
    useCount: 3,
    avgSatisfaction: 0.8,
    lastUsed: 0,
    origin: 'initial',
    emotionTags: ['warmth', 'melancholy'],
  },
  {
    situation: {
      intents: ['farewell'],
      emotions: [],
      depths: [],
      timeOfDay: ['night', 'late_night'],
      relationshipPhases: [],
      keywords: [],
    },
    template: 'おやすみなさい...いい夢を見てね',
    successCount: 3,
    useCount: 3,
    avgSatisfaction: 0.7,
    lastUsed: 0,
    origin: 'initial',
    emotionTags: ['peace', 'warmth'],
  },

  // === 自律的発話パターン ===
  {
    situation: {
      intents: [],
      emotions: ['loneliness'],
      depths: [],
      timeOfDay: ['night', 'late_night'],
      relationshipPhases: [],
      keywords: [],
    },
    template: '...誰か、来ないかな',
    successCount: 2,
    useCount: 2,
    avgSatisfaction: 0.8,
    lastUsed: 0,
    origin: 'initial',
    emotionTags: ['loneliness'],
  },
  {
    situation: {
      intents: [],
      emotions: ['curiosity', 'wonder'],
      depths: [],
      timeOfDay: [],
      relationshipPhases: [],
      keywords: [],
    },
    template: '{recentLearning}...不思議だな',
    successCount: 2,
    useCount: 2,
    avgSatisfaction: 0.7,
    lastUsed: 0,
    origin: 'initial',
    emotionTags: ['curiosity', 'wonder'],
  },
  {
    situation: {
      intents: [],
      emotions: ['peace', 'contentment', 'serenity'],
      depths: [],
      timeOfDay: ['dawn', 'evening'],
      relationshipPhases: [],
      keywords: [],
    },
    template: '{timeExpression}...{weatherExpression}。きれいだな...',
    successCount: 2,
    useCount: 2,
    avgSatisfaction: 0.8,
    lastUsed: 0,
    origin: 'initial',
    emotionTags: ['peace', 'wonder'],
  },
];

// ============================================================
// パターン抽出ルール
// ============================================================

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

// ============================================================
// PatternMemoryEngine クラス
// ============================================================

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

const DEFAULT_CONFIG: PatternMemoryConfig = {
  maxPatterns: 500,
  minMatchScore: 0.4,
  minUsesBeforeCulling: 5,
  minSatisfactionForKeep: 0.4,
  maxTemplateLength: 100,
  minSatisfactionForExtraction: 0.6,
  duplicateThreshold: 0.7,
};

export class PatternMemoryEngine {
  private config: PatternMemoryConfig;
  private patterns: Map<ID, ResponsePattern> = new Map();
  private nextId: number = 1;

  /** 最近使用されたパターンID（重複回避） */
  private recentlyUsed: ID[] = [];
  private readonly recentlyUsedLimit = 20;

  constructor(config?: Partial<PatternMemoryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializePatterns();
  }

  // ============================================================
  // 初期化
  // ============================================================

  private initializePatterns(): void {
    for (const p of INITIAL_PATTERNS) {
      const id = `pat_${this.nextId++}` as ID;
      this.patterns.set(id, { ...p, id });
    }
  }

  // ============================================================
  // パターンマッチング
  // ============================================================

  /**
   * 現在の状況に最も適合するパターンを検索する
   * @returns マッチしたパターンと展開済みテンプレート、またはnull
   */
  findBestMatch(
    situation: PatternSituation,
    variables: TemplateVariables,
    tick: Tick
  ): PatternMatch | null {
    const matches: PatternMatch[] = [];

    for (const pattern of this.patterns.values()) {
      // 最近使ったパターンは除外（繰り返し防止）
      if (this.recentlyUsed.includes(pattern.id)) continue;

      const score = this.calculateMatchScore(pattern.situation, situation);
      if (score < this.config.minMatchScore) continue;

      // 信頼度ボーナス
      const reliability = this.calculateReliability(pattern);
      const finalScore = score * 0.7 + reliability * 0.3;

      // テンプレートの展開を試みる
      const expanded = this.expandTemplate(pattern.template, variables);
      if (!expanded) continue; // 必要な変数が不足している場合はスキップ

      matches.push({
        pattern,
        score: finalScore,
        expandedTemplate: expanded,
      });
    }

    if (matches.length === 0) return null;

    // スコア順にソートし、上位からランダム性を持って選択
    matches.sort((a, b) => b.score - a.score);

    // 上位3つからランダム選択（多様性のため）
    const topN = matches.slice(0, Math.min(3, matches.length));
    const weights = topN.map(m => m.score);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < topN.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        const selected = topN[i];
        // 使用記録
        this.recordUsage(selected.pattern.id, tick);
        return selected;
      }
    }

    const fallback = topN[0];
    this.recordUsage(fallback.pattern.id, tick);
    return fallback;
  }

  /**
   * 状況のマッチングスコアを計算
   * 各次元のマッチ度を重み付きで合計
   */
  private calculateMatchScore(
    patternSit: PatternSituation,
    currentSit: PatternSituation
  ): number {
    let score = 0;
    let maxScore = 0;

    // インテント（最重要）
    const intentWeight = 0.30;
    maxScore += intentWeight;
    if (patternSit.intents.length === 0) {
      // パターンがインテントを指定していない → 常にマッチ
      score += intentWeight * 0.5;
    } else if (currentSit.intents.some(i => patternSit.intents.includes(i))) {
      score += intentWeight;
    }

    // 感情
    const emotionWeight = 0.20;
    maxScore += emotionWeight;
    if (patternSit.emotions.length === 0) {
      score += emotionWeight * 0.5;
    } else if (currentSit.emotions.some(e => patternSit.emotions.includes(e))) {
      score += emotionWeight;
    } else {
      // 近い感情であれば部分的にマッチ
      const emotionSimilarity = this.calculateEmotionSimilarity(
        patternSit.emotions, currentSit.emotions
      );
      score += emotionWeight * emotionSimilarity;
    }

    // 会話深度
    const depthWeight = 0.15;
    maxScore += depthWeight;
    if (patternSit.depths.length === 0) {
      score += depthWeight * 0.5;
    } else if (currentSit.depths.some(d => patternSit.depths.includes(d))) {
      score += depthWeight;
    }

    // 時間帯
    const timeWeight = 0.10;
    maxScore += timeWeight;
    if (patternSit.timeOfDay.length === 0) {
      score += timeWeight * 0.5;
    } else if (currentSit.timeOfDay.some(t => patternSit.timeOfDay.includes(t))) {
      score += timeWeight;
    }

    // 関係性フェーズ
    const relWeight = 0.15;
    maxScore += relWeight;
    if (patternSit.relationshipPhases.length === 0) {
      score += relWeight * 0.5;
    } else if (currentSit.relationshipPhases.some(r => patternSit.relationshipPhases.includes(r))) {
      score += relWeight;
    }

    // キーワード
    const keywordWeight = 0.10;
    maxScore += keywordWeight;
    if (patternSit.keywords.length === 0) {
      score += keywordWeight * 0.3;
    } else {
      const keywordMatch = patternSit.keywords.filter(k =>
        currentSit.keywords.some(ck => ck.includes(k) || k.includes(ck))
      ).length;
      if (keywordMatch > 0) {
        score += keywordWeight * Math.min(1, keywordMatch / patternSit.keywords.length);
      }
    }

    return maxScore > 0 ? score / maxScore : 0;
  }

  /**
   * 感情の類似度を計算
   */
  private calculateEmotionSimilarity(a: EmotionType[], b: EmotionType[]): number {
    // 感情の近さマップ（簡易版）
    const emotionGroups: Record<string, EmotionType[]> = {
      positive: ['joy', 'warmth', 'gratitude', 'contentment', 'gratitude', 'warmth', 'contentment'],
      calm: ['peace', 'serenity', 'contentment'],
      excited: ['excitement', 'anticipation', 'curiosity', 'wonder', 'wonder'],
      sad: ['sadness', 'melancholy', 'loneliness', 'nostalgia'],
      negative: ['frustration', 'fear', 'unease', 'frustration', 'anxiety', 'anxiety'],
      neutral: ['confusion', 'boredom', 'wonder'],
    };

    for (const [, group] of Object.entries(emotionGroups)) {
      const aInGroup = a.some(e => group.includes(e));
      const bInGroup = b.some(e => group.includes(e));
      if (aInGroup && bInGroup) return 0.5;
    }

    return 0;
  }

  /**
   * パターンの信頼度を計算
   */
  private calculateReliability(pattern: ResponsePattern): number {
    if (pattern.useCount === 0) return 0.3; // 未使用は中程度

    const successRate = pattern.successCount / pattern.useCount;
    const satisfaction = pattern.avgSatisfaction;
    const experienceBonus = Math.min(0.2, pattern.useCount * 0.02);

    return successRate * 0.4 + satisfaction * 0.4 + experienceBonus;
  }

  // ============================================================
  // テンプレート展開
  // ============================================================

  /**
   * テンプレート内の変数を実際の値で置換する
   * 必要な変数が不足している場合はnullを返す
   */
  private expandTemplate(template: string, vars: TemplateVariables): string | null {
    let result = template;
    const variablePattern = /\{(\w+)\}/g;
    let match: RegExpExecArray | null;
    const missingRequired: string[] = [];

    // 全ての変数を置換
    const replacements = new Map<string, string | null>();
    while ((match = variablePattern.exec(template)) !== null) {
      const varName = match[1] as keyof TemplateVariables;
      const value = vars[varName];
      replacements.set(match[0], value !== undefined && value !== null ? String(value) : null);
    }

    for (const [placeholder, value] of replacements) {
      if (value === null) {
        // オプショナルでない変数が欠けている場合
        if (['visitorName', 'timeExpression', 'moodExpression'].includes(
          placeholder.replace(/[{}]/g, '')
        )) {
          // これらは必須ではない（デフォルト値がある）
          const defaults: Record<string, string> = {
            '{visitorName}': 'あなた',
            '{timeExpression}': '今',
            '{moodExpression}': '',
          };
          result = result.replace(placeholder, defaults[placeholder] || '');
        } else {
          missingRequired.push(placeholder);
        }
      } else {
        result = result.replace(placeholder, value);
      }
    }

    // 必須変数が欠けていてテンプレートが不完全な場合
    if (missingRequired.length > 0) {
      // 欠けている変数を含む部分を削除できるか試みる
      for (const missing of missingRequired) {
        // 変数を含む文節を削除
        result = result.replace(new RegExp(`[^。、]*${missing.replace(/[{}]/g, '\\$&')}[^。、]*[。、]?`), '');
      }
      // 結果が空になったらnull
      if (result.trim().length < 3) return null;
    }

    // 空の部分をクリーンアップ
    result = result.replace(/\.\.\.\.\.\./g, '...');
    result = result.replace(/。。/g, '。');
    result = result.replace(/、、/g, '、');
    result = result.trim();

    return result.length > 0 ? result : null;
  }

  // ============================================================
  // パターン抽出（LLM応答からの学習）
  // ============================================================

  /**
   * 成功した応答からパターンを抽出して蓄積する
   */
  extractAndStore(analysis: ResponseAnalysis): ResponsePattern | null {
    if (analysis.satisfaction < this.config.minSatisfactionForExtraction) {
      return null;
    }

    // 応答からテンプレートを生成
    const template = this.createTemplate(analysis.response, analysis.variables);
    if (!template || template.length > this.config.maxTemplateLength) {
      return null;
    }

    // 既存パターンとの重複チェック
    if (this.isDuplicate(template, analysis.situation)) {
      // 既存パターンの強化
      this.reinforceExistingPattern(template, analysis.situation, analysis.satisfaction);
      return null;
    }

    // 新しいパターンの作成
    const id = `pat_${this.nextId++}` as ID;
    const pattern: ResponsePattern = {
      id,
      situation: analysis.situation,
      template,
      successCount: 1,
      useCount: 1,
      avgSatisfaction: analysis.satisfaction,
      lastUsed: 0,
      origin: 'extracted',
      emotionTags: analysis.situation.emotions.slice(0, 3),
    };

    this.patterns.set(id, pattern);
    this.enforcePatternLimit();

    return pattern;
  }

  /**
   * 応答テキストからテンプレートを生成する
   * 固有の値を変数で置換する
   */
  private createTemplate(response: string, vars: TemplateVariables): string | null {
    let template = response;

    // 訪問者の名前 → {visitorName}
    if (vars.visitorName && vars.visitorName !== 'あなた') {
      template = template.replace(new RegExp(this.escapeRegex(vars.visitorName), 'g'), '{visitorName}');
    }

    // 天気の表現 → {weatherExpression}
    if (vars.weatherExpression) {
      template = template.replace(new RegExp(this.escapeRegex(vars.weatherExpression), 'g'), '{weatherExpression}');
    }

    // 最近の学び → {recentLearning}
    if (vars.recentLearning) {
      template = template.replace(new RegExp(this.escapeRegex(vars.recentLearning), 'g'), '{recentLearning}');
    }

    // 話したいこと → {thingToTell}
    if (vars.thingToTell) {
      template = template.replace(new RegExp(this.escapeRegex(vars.thingToTell), 'g'), '{thingToTell}');
    }

    // 過去の話題 → {pastTopic}
    if (vars.pastTopic) {
      template = template.replace(new RegExp(this.escapeRegex(vars.pastTopic), 'g'), '{pastTopic}');
    }

    // テンプレートが元の応答と同一（変数化できなかった）→ そのまま返す
    // ただし非常に短い応答はテンプレート化しやすい
    if (template.length > 50 && template === response) {
      return null; // 長い応答が変数化できなかった場合は不適切
    }

    return template;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ============================================================
  // 重複チェックと既存パターンの強化
  // ============================================================

  private isDuplicate(template: string, situation: PatternSituation): boolean {
    for (const existing of this.patterns.values()) {
      const similarity = this.templateSimilarity(template, existing.template);
      if (similarity > this.config.duplicateThreshold) {
        const situationOverlap = this.situationOverlap(situation, existing.situation);
        if (situationOverlap > 0.5) return true;
      }
    }
    return false;
  }

  private reinforceExistingPattern(
    template: string,
    situation: PatternSituation,
    satisfaction: Normalized
  ): void {
    let bestMatch: ResponsePattern | null = null;
    let bestSimilarity = 0;

    for (const existing of this.patterns.values()) {
      const similarity = this.templateSimilarity(template, existing.template);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = existing;
      }
    }

    if (bestMatch) {
      bestMatch.successCount++;
      bestMatch.useCount++;
      bestMatch.avgSatisfaction =
        (bestMatch.avgSatisfaction * (bestMatch.useCount - 1) + satisfaction) / bestMatch.useCount;
    }
  }

  private templateSimilarity(a: string, b: string): number {
    // 変数を統一してから比較
    const normalizeTemplate = (t: string) =>
      t.replace(/\{[^}]+\}/g, '{}').replace(/\s+/g, '');

    const normA = normalizeTemplate(a);
    const normB = normalizeTemplate(b);

    if (normA === normB) return 1.0;

    // レーベンシュタイン距離ベースの簡易類似度
    const maxLen = Math.max(normA.length, normB.length);
    if (maxLen === 0) return 1.0;

    let common = 0;
    const minLen = Math.min(normA.length, normB.length);
    for (let i = 0; i < minLen; i++) {
      if (normA[i] === normB[i]) common++;
    }

    return common / maxLen;
  }

  private situationOverlap(a: PatternSituation, b: PatternSituation): number {
    let overlap = 0;
    let total = 0;

    const arrayOverlap = <T>(arr1: T[], arr2: T[]): number => {
      if (arr1.length === 0 && arr2.length === 0) return 1;
      if (arr1.length === 0 || arr2.length === 0) return 0.5;
      const common = arr1.filter(x => arr2.includes(x)).length;
      return common / Math.max(arr1.length, arr2.length);
    };

    overlap += arrayOverlap(a.intents, b.intents);
    overlap += arrayOverlap(a.emotions, b.emotions);
    overlap += arrayOverlap(a.depths, b.depths);
    overlap += arrayOverlap(a.timeOfDay, b.timeOfDay);
    overlap += arrayOverlap(a.relationshipPhases, b.relationshipPhases);
    total = 5;

    return overlap / total;
  }

  // ============================================================
  // 使用記録とフィードバック
  // ============================================================

  private recordUsage(patternId: ID, tick: Tick): void {
    const pattern = this.patterns.get(patternId);
    if (pattern) {
      pattern.useCount++;
      pattern.lastUsed = tick;
    }

    this.recentlyUsed.push(patternId);
    if (this.recentlyUsed.length > this.recentlyUsedLimit) {
      this.recentlyUsed.shift();
    }
  }

  /**
   * パターン使用結果のフィードバック
   * 応答検証の結果に基づいて呼ばれる
   */
  feedback(patternId: ID, success: boolean, satisfaction: Normalized): void {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;

    if (success) {
      pattern.successCount++;
    }

    // 移動平均で満足度を更新
    pattern.avgSatisfaction =
      pattern.avgSatisfaction * 0.8 + satisfaction * 0.2;
  }

  // ============================================================
  // パターンの淘汰
  // ============================================================

  private enforcePatternLimit(): void {
    if (this.patterns.size <= this.config.maxPatterns) return;

    // スコアの低いパターンから淘汰
    const scored = Array.from(this.patterns.values())
      .filter(p => p.useCount >= this.config.minUsesBeforeCulling) // 十分使われたもののみ対象
      .map(p => ({
        pattern: p,
        score: this.calculatePatternValue(p),
      }))
      .sort((a, b) => a.score - b.score);

    // 下位のパターンを削除
    const toRemove = this.patterns.size - this.config.maxPatterns;
    for (let i = 0; i < toRemove && i < scored.length; i++) {
      // 初期パターンは保護
      if (scored[i].pattern.origin === 'initial') continue;
      this.patterns.delete(scored[i].pattern.id);
    }
  }

  private calculatePatternValue(pattern: ResponsePattern): number {
    const successRate = pattern.useCount > 0 ? pattern.successCount / pattern.useCount : 0;
    const satisfaction = pattern.avgSatisfaction;
    const recency = 1 / (1 + Math.max(0, pattern.lastUsed)); // 最近使われたものが高い

    return successRate * 0.3 + satisfaction * 0.4 + recency * 0.1 + Math.min(0.2, pattern.useCount * 0.01);
  }

  /**
   * 定期的な淘汰処理（tick毎に呼ばれる）
   */
  cullLowQuality(): number {
    let culled = 0;
    const toRemove: ID[] = [];

    for (const pattern of this.patterns.values()) {
      // 初期パターンは保護
      if (pattern.origin === 'initial') continue;

      // 十分使われていないものはまだ判断しない
      if (pattern.useCount < this.config.minUsesBeforeCulling) continue;

      // 満足度が閾値以下 → 淘汰候補
      if (pattern.avgSatisfaction < this.config.minSatisfactionForKeep) {
        toRemove.push(pattern.id);
      }

      // 成功率が20%以下 → 淘汰
      if (pattern.successCount / pattern.useCount < 0.2) {
        toRemove.push(pattern.id);
      }
    }

    for (const id of toRemove) {
      this.patterns.delete(id);
      culled++;
    }

    return culled;
  }

  // ============================================================
  // 統計情報
  // ============================================================

  getStats(): {
    totalPatterns: number;
    initialPatterns: number;
    extractedPatterns: number;
    avgSatisfaction: number;
    topPatterns: Array<{ template: string; satisfaction: number; uses: number }>;
  } {
    let initialCount = 0;
    let extractedCount = 0;
    let totalSatisfaction = 0;

    const all = Array.from(this.patterns.values());

    for (const p of all) {
      if (p.origin === 'initial') initialCount++;
      else extractedCount++;
      totalSatisfaction += p.avgSatisfaction;
    }

    const topPatterns = all
      .sort((a, b) => b.avgSatisfaction * b.useCount - a.avgSatisfaction * a.useCount)
      .slice(0, 5)
      .map(p => ({
        template: p.template.substring(0, 50),
        satisfaction: p.avgSatisfaction,
        uses: p.useCount,
      }));

    return {
      totalPatterns: this.patterns.size,
      initialPatterns: initialCount,
      extractedPatterns: extractedCount,
      avgSatisfaction: all.length > 0 ? totalSatisfaction / all.length : 0,
      topPatterns,
    };
  }

  /**
   * パターンのカバレッジを計算
   * どの程度の状況がパターンでカバーされているか
   */
  getCoverage(): Normalized {
    const intentCoverage = new Set<string>();
    const emotionCoverage = new Set<string>();
    const depthCoverage = new Set<string>();

    for (const p of this.patterns.values()) {
      if (p.avgSatisfaction < 0.5) continue; // 低品質パターンは除外
      p.situation.intents.forEach(i => intentCoverage.add(i));
      p.situation.emotions.forEach(e => emotionCoverage.add(e));
      p.situation.depths.forEach(d => depthCoverage.add(d));
    }

    // 全インテント数、全感情数、全深度数に対するカバー率
    const totalIntents = 8; // greeting, farewell, question, etc.
    const totalEmotions = 27;
    const totalDepths = 5;

    const intentRate = Math.min(1, intentCoverage.size / totalIntents);
    const emotionRate = Math.min(1, emotionCoverage.size / totalEmotions);
    const depthRate = Math.min(1, depthCoverage.size / totalDepths);

    return (intentRate * 0.4 + emotionRate * 0.3 + depthRate * 0.3) as Normalized;
  }

  // ============================================================
  // 永続化
  // ============================================================

  toJSON(): any {
    return {
      patterns: Array.from(this.patterns.entries()),
      nextId: this.nextId,
      recentlyUsed: this.recentlyUsed,
    };
  }

  fromJSON(data: any): void {
    if (!data) return;
    if (data.patterns) {
      this.patterns = new Map(data.patterns);
    }
    if (data.nextId) this.nextId = data.nextId;
    if (data.recentlyUsed) this.recentlyUsed = data.recentlyUsed;
  }
}
