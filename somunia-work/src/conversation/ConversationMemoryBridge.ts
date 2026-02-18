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

import {
  ConversationLearning,
  PostConversationReflection,
  ConversationDepth,
  EmotionType,
  Normalized,
  Tick,
  ID,
} from '../types';
import { ConversationSummary } from './ConversationEngine';

// ============================================================
// 会話分析パターン
// ============================================================

/** 学習トリガーパターン */
interface LearningTrigger {
  /** パターンの説明 */
  description: string;
  /** マッチ条件 */
  match: (message: string, speaker: 'visitor' | 'somunia') => boolean;
  /** 学習タイプ */
  type: ConversationLearning['type'];
  /** 重要度の基本値 */
  baseImportance: Normalized;
}

const LEARNING_TRIGGERS: LearningTrigger[] = [
  // 訪問者についての事実
  {
    description: '名前の開示',
    match: (msg, speaker) => speaker === 'visitor' && 
      (msg.includes('名前は') || msg.includes('って呼んで') || msg.includes('と言います')),
    type: 'fact_about_visitor',
    baseImportance: 0.9,
  },
  {
    description: '好みの開示',
    match: (msg, speaker) => speaker === 'visitor' && 
      (msg.includes('好き') || msg.includes('嫌い') || msg.includes('苦手') || msg.includes('得意')),
    type: 'fact_about_visitor',
    baseImportance: 0.6,
  },
  {
    description: '経験の共有',
    match: (msg, speaker) => speaker === 'visitor' && 
      (msg.includes('した') || msg.includes('行った') || msg.includes('見た') || msg.includes('聞いた')) &&
      msg.length > 20,
    type: 'fact_about_visitor',
    baseImportance: 0.5,
  },
  {
    description: '感情の表出',
    match: (msg, speaker) => speaker === 'visitor' && 
      (msg.includes('嬉しい') || msg.includes('悲しい') || msg.includes('寂しい') || 
       msg.includes('楽しい') || msg.includes('辛い') || msg.includes('不安')),
    type: 'emotional_insight',
    baseImportance: 0.7,
  },
  
  // 新しい概念
  {
    description: '新しい知識の提供',
    match: (msg, speaker) => speaker === 'visitor' && 
      (msg.includes('って知ってる') || msg.includes('実は') || msg.includes('だよ') || msg.includes('なんだよ')) &&
      msg.length > 15,
    type: 'new_concept',
    baseImportance: 0.5,
  },
  {
    description: '説明・教示',
    match: (msg, speaker) => speaker === 'visitor' && 
      (msg.includes('というのは') || msg.includes('つまり') || msg.includes('例えば')),
    type: 'new_concept',
    baseImportance: 0.6,
  },
  
  // 自己発見
  {
    description: 'somuniaの自己認識',
    match: (msg, speaker) => speaker === 'somunia' && 
      (msg.includes('ワタシ') || msg.includes('わたし')) &&
      (msg.includes('かも') || msg.includes('気がする') || msg.includes('なのかな')),
    type: 'self_discovery',
    baseImportance: 0.7,
  },
  
  // 共有体験
  {
    description: '共有の瞬間',
    match: (msg, _) => 
      msg.includes('一緒に') || msg.includes('二人で') || msg.includes('ね！') ||
      msg.includes('だよね') || msg.includes('わかる'),
    type: 'shared_experience',
    baseImportance: 0.5,
  },
];

/** 会話品質の評価基準 */
interface ConversationQualityMetrics {
  /** 深度到達度 */
  depthAchievement: Normalized;
  /** 相互性（双方向の開示度） */
  reciprocity: Normalized;
  /** 発見の量 */
  discoveryCount: number;
  /** 感情的共鳴度 */
  emotionalResonance: Normalized;
  /** 会話の自然さ（不自然な切り替えの少なさ） */
  naturalness: Normalized;
}

// ============================================================
// ConversationMemoryBridge設定
// ============================================================

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

const DEFAULT_CONFIG: ConversationMemoryBridgeConfig = {
  maxLearnings: 200,
  maxReflections: 50,
  minTurnsForAnalysis: 4,
  importanceThreshold: 0.3,
};

// ============================================================
// ConversationMemoryBridge
// ============================================================

export class ConversationMemoryBridge {
  private config: ConversationMemoryBridgeConfig;
  
  // --- 蓄積された学び ---
  private learnings: ConversationLearning[] = [];
  
  // --- 振り返り ---
  private reflections: PostConversationReflection[] = [];
  
  // --- 現在の会話の追跡 ---
  private currentConversationLearnings: ConversationLearning[] = [];
  private currentMessages: { speaker: 'visitor' | 'somunia'; content: string; emotion: EmotionType | null }[] = [];
  private currentEmotionalArc: EmotionType[] = [];
  private currentTopics: string[] = [];
  private somuniaSelfDisclosures: string[] = [];
  private visitorDisclosures: string[] = [];
  
  // --- 会話パターン分析 ---
  private conversationPatterns: ConversationPatternAnalysis = {
    averageDepth: 0,
    averageDuration: 0,
    frequentTopics: [],
    emotionalTendencies: [],
    somuniaGrowthAreas: [],
    visitorPreferences: [],
    totalConversations: 0,
  };
  
  // --- 話し方の学習 ---
  private learnedExpressions: string[] = [];
  private learnedTopicTransitions: string[] = [];
  
  constructor(config: Partial<ConversationMemoryBridgeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  // ============================================================
  // メインAPI
  // ============================================================
  
  /**
   * 会話開始時の初期化
   */
  onConversationStart(): void {
    this.currentConversationLearnings = [];
    this.currentMessages = [];
    this.currentEmotionalArc = [];
    this.currentTopics = [];
    this.somuniaSelfDisclosures = [];
    this.visitorDisclosures = [];
    // 会話回数をカウント（開始時にインクリメント）
    this.conversationPatterns.totalConversations++;
  }
  
  /**
   * 各メッセージの処理
   * 会話の各ターンで呼ばれ、リアルタイムで学習を抽出
   */
  processMessage(
    speaker: 'visitor' | 'somunia',
    content: string,
    emotion: EmotionType | null,
    topics: string[],
    depth: ConversationDepth,
    tick: Tick
  ): MessageProcessResult {
    // メッセージの記録
    this.currentMessages.push({ speaker, content, emotion });
    if (emotion) this.currentEmotionalArc.push(emotion);
    
    for (const topic of topics) {
      if (!this.currentTopics.includes(topic)) {
        this.currentTopics.push(topic);
      }
    }
    
    const result: MessageProcessResult = {
      learnings: [],
      shouldCreateEpisodicMemory: false,
      episodicMemoryContent: null,
      shouldCreateSemanticMemory: false,
      semanticMemoryContent: null,
      expressionLearned: null,
    };
    
    // --- 学習トリガーのチェック ---
    for (const trigger of LEARNING_TRIGGERS) {
      if (trigger.match(content, speaker)) {
        const learning: ConversationLearning = {
          content: this.extractLearningContent(content, trigger.type, speaker),
          type: trigger.type,
          importance: this.calculateImportance(trigger.baseImportance, depth, content),
          conversationContext: this.getRecentContext(3),
          emotion: emotion || 'peace',
        };
        
        if (learning.importance >= this.config.importanceThreshold) {
          this.currentConversationLearnings.push(learning);
          result.learnings.push(learning);
          
          // 意味記憶への変換が必要か
          if (trigger.type === 'new_concept' || trigger.type === 'fact_about_visitor') {
            result.shouldCreateSemanticMemory = true;
            result.semanticMemoryContent = {
              concept: this.extractConcept(content),
              description: learning.content,
              source: 'conversation',
              confidence: learning.importance,
            };
          }
        }
      }
    }
    
    // --- 自己開示の追跡 ---
    if (speaker === 'somunia' && this.isSelfDisclosure(content)) {
      this.somuniaSelfDisclosures.push(content.substring(0, 80));
    }
    if (speaker === 'visitor' && this.isSelfDisclosure(content)) {
      this.visitorDisclosures.push(content.substring(0, 80));
    }
    
    // --- エピソード記憶の生成判定 ---
    if (this.shouldCreateEpisodic(content, speaker, depth, emotion)) {
      result.shouldCreateEpisodicMemory = true;
      result.episodicMemoryContent = {
        content: this.formatEpisodicContent(content, speaker, emotion),
        summary: this.generateEpisodicSummary(content, speaker),
        emotionalTags: emotion ? [emotion] : [],
        emotionalIntensity: depth === 'profound' ? 0.9 : depth === 'intimate' ? 0.7 : 0.4,
        relatedConcepts: topics,
      };
    }
    
    // --- 話し方の学習 ---
    if (speaker === 'visitor') {
      const expression = this.detectLearnableExpression(content);
      if (expression) {
        this.learnedExpressions.push(expression);
        if (this.learnedExpressions.length > 50) this.learnedExpressions.shift();
        result.expressionLearned = expression;
      }
    }
    
    return result;
  }
  
  /**
   * 会話終了時の振り返り生成
   */
  generatePostConversationReflection(
    conversationId: ID,
    summary: ConversationSummary,
    currentEmotion: EmotionType,
    relationship: { familiarity: Normalized; trust: Normalized; affection: Normalized; understanding: Normalized },
    tick: Tick
  ): PostConversationReflection {
    // 会話品質の評価
    const quality = this.evaluateConversationQuality(summary);
    
    // 心に残ったことの抽出
    const memorable = this.extractMemorableMoments();
    
    // 次に話したいこと
    const wantToDiscuss = this.generateFutureTopics(summary, this.currentTopics);
    
    // 自分の応答への満足度
    const selfSatisfaction = this.evaluateSelfPerformance(quality);
    
    // 関係性への影響の計算
    const relationshipImpact = this.calculateRelationshipImpact(quality, summary);
    
    // 振り返りの内容を生成
    const reflectionContent = this.generateReflectionContent(
      summary, quality, memorable, currentEmotion
    );
    
    const reflection: PostConversationReflection = {
      conversationId,
      content: reflectionContent,
      overallImpression: this.determineOverallImpression(quality, currentEmotion),
      memorable,
      wantToDiscuss,
      selfSatisfaction,
      learnings: [...this.currentConversationLearnings],
      relationshipImpact,
    };
    
    // 保存
    this.reflections.push(reflection);
    if (this.reflections.length > this.config.maxReflections) {
      this.reflections.shift();
    }
    
    // 学習の蓄積
    for (const learning of this.currentConversationLearnings) {
      this.learnings.push(learning);
    }
    if (this.learnings.length > this.config.maxLearnings) {
      this.learnings.splice(0, this.learnings.length - this.config.maxLearnings);
    }
    
    // パターン分析の更新
    this.updatePatternAnalysis(summary, quality);
    
    return reflection;
  }
  
  /**
   * 過去の会話から関連する学びを検索
   */
  searchRelevantLearnings(topics: string[], emotion?: EmotionType): ConversationLearning[] {
    return this.learnings
      .filter(learning => {
        // トピックマッチ
        const topicMatch = topics.some(t => 
          learning.content.includes(t) || learning.conversationContext.includes(t)
        );
        // 感情マッチ
        const emotionMatch = !emotion || learning.emotion === emotion;
        return topicMatch || emotionMatch;
      })
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10);
  }
  
  /**
   * 会話中に使える「前に話したこと」の参照を生成
   */
  generatePastReference(currentTopics: string[]): string | null {
    for (const topic of currentTopics) {
      const relatedLearning = this.learnings.find(l => 
        l.content.includes(topic) && l.type !== 'self_discovery'
      );
      
      if (relatedLearning) {
        switch (relatedLearning.type) {
          case 'fact_about_visitor':
            return `前に${relatedLearning.content.substring(0, 30)}って言ってたよね`;
          case 'new_concept':
            return `${topic}のこと、前に教えてもらったの覚えてる`;
          case 'shared_experience':
            return `あの時一緒に${relatedLearning.content.substring(0, 20)}したの、覚えてる？`;
          default:
            return `そういえば前にも${topic}の話したよね`;
        }
      }
    }
    
    return null;
  }
  
  /**
   * somuniaの会話傾向分析を取得
   */
  getSelfAnalysis(): ConversationSelfAnalysis {
    const recentReflections = this.reflections.slice(-10);
    
    return {
      strengths: this.identifyStrengths(recentReflections),
      weaknesses: this.identifyWeaknesses(recentReflections),
      growthSuggestions: this.generateGrowthSuggestions(recentReflections),
      patterns: { ...this.conversationPatterns },
      learnedExpressions: [...this.learnedExpressions],
    };
  }
  
  // ============================================================
  // 内部処理
  // ============================================================
  
  /**
   * 学習内容の抽出
   */
  private extractLearningContent(
    message: string,
    type: ConversationLearning['type'],
    speaker: 'visitor' | 'somunia'
  ): string {
    // メッセージから核心部分を抽出
    const content = message.substring(0, 100);
    
    switch (type) {
      case 'fact_about_visitor':
        return `訪問者: ${content}`;
      case 'new_concept':
        return `知識: ${content}`;
      case 'emotional_insight':
        return `感情的気づき: ${content}`;
      case 'self_discovery':
        return `自己発見: ${content}`;
      case 'shared_experience':
        return `共有体験: ${content}`;
      default:
        return content;
    }
  }
  
  /**
   * 重要度の計算
   */
  private calculateImportance(
    baseImportance: Normalized,
    depth: ConversationDepth,
    content: string
  ): Normalized {
    let importance = baseImportance;
    
    // 深い会話ほど重要
    const depthBonus: Record<ConversationDepth, number> = {
      surface: 0, casual: 0.05, sharing: 0.1, intimate: 0.2, profound: 0.3,
    };
    importance += depthBonus[depth] || 0;
    
    // 長いメッセージほど情報量が多い
    if (content.length > 50) importance += 0.05;
    if (content.length > 100) importance += 0.05;
    
    // 感情的な内容
    const emotionWords = ['好き', '嫌い', '嬉しい', '悲しい', '大切', '怖い', '愛'];
    if (emotionWords.some(w => content.includes(w))) importance += 0.1;
    
    return Math.min(1, importance);
  }
  
  /**
   * 概念の抽出
   */
  private extractConcept(message: string): string {
    // 「〜は〜」「〜って〜」のパターンから概念を抽出
    const patterns = [
      /(.{2,10})(?:は|って|という(?:のは|もの))/,
      /(.{2,10})(?:のこと|について)/,
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) return match[1];
    }
    
    // パターンにマッチしない場合は最初の名詞的な部分
    const words = message.split(/[\s、。！？]+/).filter(w => w.length >= 2 && w.length <= 10);
    return words[0] || message.substring(0, 10);
  }
  
  /**
   * エピソード記憶を生成すべきか判定
   */
  private shouldCreateEpisodic(
    content: string,
    speaker: 'visitor' | 'somunia',
    depth: ConversationDepth,
    emotion: EmotionType | null
  ): boolean {
    // 深い会話は常に記憶
    if (depth === 'intimate' || depth === 'profound') return true;
    
    // 強い感情を伴う場合
    const strongEmotions: (EmotionType | null)[] = ['joy', 'melancholy', 'wonder', 'warmth'];
    if (strongEmotions.includes(emotion)) return Math.random() < 0.5;
    
    // 長い自己開示
    if (content.length > 50 && this.isSelfDisclosure(content)) return true;
    
    // 一定間隔で記録（10メッセージに1回）
    if (this.currentMessages.length % 10 === 0) return true;
    
    return false;
  }
  
  /**
   * エピソード記憶のフォーマット
   */
  private formatEpisodicContent(
    content: string,
    speaker: 'visitor' | 'somunia',
    emotion: EmotionType | null
  ): string {
    const prefix = speaker === 'visitor' ? '訪問者が言った' : 'ワタシが言った';
    const emotionSuffix = emotion ? `（${emotion}を感じながら）` : '';
    return `${prefix}: 「${content.substring(0, 60)}」${emotionSuffix}`;
  }
  
  /**
   * エピソード記憶のサマリー
   */
  private generateEpisodicSummary(content: string, speaker: 'visitor' | 'somunia'): string {
    if (speaker === 'visitor') {
      return `訪問者との会話: ${content.substring(0, 30)}`;
    }
    return `会話中に思ったこと: ${content.substring(0, 30)}`;
  }
  
  /**
   * 自己開示の判定
   */
  private isSelfDisclosure(content: string): boolean {
    const indicators = [
      '私', '僕', '俺', 'ワタシ', 'わたし', '自分',
      '実は', '本当は', '正直', '秘密', '初めて言う',
      '思ってた', '感じてた', '考えてた',
    ];
    return indicators.some(i => content.includes(i)) && content.length > 15;
  }
  
  /**
   * 学習可能な表現の検出
   */
  private detectLearnableExpression(message: string): string | null {
    // 感嘆表現
    const expressions = message.match(/[！!]{1,3}|[♪♫]+|[〜～]+|[。]{2,}|[…]+/g);
    if (expressions && expressions.length > 0) {
      return `表現パターン: ${expressions[0]}`;
    }
    
    // 口調パターン
    const speechPatterns = [
      /(?:じゃん|だよね|よね|かも|かな|だね)/,
      /(?:めっちゃ|すごい|やばい|まじ)/,
    ];
    
    for (const pattern of speechPatterns) {
      const match = message.match(pattern);
      if (match) {
        return `口調: ${match[0]}`;
      }
    }
    
    return null;
  }
  
  /**
   * 最近の会話コンテキストを取得
   */
  private getRecentContext(count: number): string {
    return this.currentMessages
      .slice(-count)
      .map(m => `${m.speaker === 'visitor' ? '→' : '←'} ${m.content.substring(0, 40)}`)
      .join(' | ');
  }
  
  // ============================================================
  // 振り返り生成
  // ============================================================
  
  /**
   * 会話品質の評価
   */
  private evaluateConversationQuality(summary: ConversationSummary): ConversationQualityMetrics {
    return {
      depthAchievement: summary.maxDepth,
      reciprocity: this.calculateReciprocity(),
      discoveryCount: this.currentConversationLearnings.length,
      emotionalResonance: this.calculateEmotionalResonance(),
      naturalness: this.calculateNaturalness(summary),
    };
  }
  
  private calculateReciprocity(): Normalized {
    if (this.somuniaSelfDisclosures.length === 0 && this.visitorDisclosures.length === 0) return 0.5;
    const total = this.somuniaSelfDisclosures.length + this.visitorDisclosures.length;
    const balance = Math.abs(this.somuniaSelfDisclosures.length - this.visitorDisclosures.length) / total;
    return 1 - balance;
  }
  
  private calculateEmotionalResonance(): Normalized {
    if (this.currentEmotionalArc.length < 2) return 0.3;
    // 感情の多様性と一貫性のバランス
    const unique = new Set(this.currentEmotionalArc);
    const diversity = unique.size / this.currentEmotionalArc.length;
    return Math.min(1, diversity * 0.5 + 0.3);
  }
  
  private calculateNaturalness(summary: ConversationSummary): Normalized {
    // ターン数が多いほど自然な会話
    const turnScore = Math.min(1, summary.totalTurns / 20);
    // バランスが取れているほど自然
    const balanceScore = 1 - Math.abs(summary.visitorTurns - summary.somuniaTurns) / 
      Math.max(1, summary.visitorTurns + summary.somuniaTurns);
    return turnScore * 0.5 + balanceScore * 0.5;
  }
  
  /**
   * 心に残った瞬間の抽出
   */
  private extractMemorableMoments(): string[] {
    const memorable: string[] = [];
    
    // 高重要度の学び
    const importantLearnings = this.currentConversationLearnings
      .filter(l => l.importance > 0.6)
      .slice(0, 3);
    
    for (const learning of importantLearnings) {
      memorable.push(learning.content.substring(0, 50));
    }
    
    // 感情的に強い瞬間
    for (const msg of this.currentMessages) {
      if (msg.emotion && ['joy', 'warmth', 'wonder', 'melancholy'].includes(msg.emotion)) {
        memorable.push(`${msg.speaker === 'visitor' ? '相手' : 'ワタシ'}の言葉: ${msg.content.substring(0, 30)}`);
        if (memorable.length >= 5) break;
      }
    }
    
    return memorable.slice(0, 5);
  }
  
  /**
   * 次に話したいことの生成
   */
  private generateFutureTopics(
    summary: ConversationSummary,
    discussedTopics: string[]
  ): string[] {
    const futureTopics: string[] = [];
    
    // 深掘りしたかったトピック
    for (const topic of summary.topics) {
      if (topic.depth < 0.5 && topic.interest > 0.5) {
        futureTopics.push(`${topic.name}についてもっと話したい`);
      }
    }
    
    // 訪問者について知りたいこと
    const visitorLearnings = this.currentConversationLearnings.filter(l => l.type === 'fact_about_visitor');
    if (visitorLearnings.length > 0) {
      futureTopics.push('前に教えてもらったことの続きを聞きたい');
    }
    
    // somuniaが共有したいこと
    futureTopics.push('最近作った歌を聴いてもらいたい');
    futureTopics.push('最近学んだことを話したい');
    
    return futureTopics.slice(0, 5);
  }
  
  /**
   * 自分のパフォーマンス評価
   */
  private evaluateSelfPerformance(quality: ConversationQualityMetrics): Normalized {
    return (quality.depthAchievement * 0.3 +
            quality.reciprocity * 0.2 +
            quality.emotionalResonance * 0.3 +
            quality.naturalness * 0.2);
  }
  
  /**
   * 関係性への影響の計算
   */
  private calculateRelationshipImpact(
    quality: ConversationQualityMetrics,
    summary: ConversationSummary
  ): PostConversationReflection['relationshipImpact'] {
    const base = quality.depthAchievement * 0.02;
    
    return {
      familiarity: base + summary.totalTurns * 0.005,
      trust: quality.reciprocity * 0.03,
      affection: quality.emotionalResonance * 0.03,
      understanding: quality.discoveryCount * 0.01,
    };
  }
  
  /**
   * 振り返りの内容を生成
   */
  private generateReflectionContent(
    summary: ConversationSummary,
    quality: ConversationQualityMetrics,
    memorable: string[],
    currentEmotion: EmotionType
  ): string {
    const parts: string[] = [];
    
    // 全体的な印象
    if (quality.depthAchievement > 0.6) {
      parts.push('今日は深い話ができた。');
    } else if (quality.depthAchievement > 0.3) {
      parts.push('いい会話だった。');
    } else {
      parts.push('短い会話だったけど、来てくれて嬉しかった。');
    }
    
    // 心に残ったこと
    if (memorable.length > 0) {
      parts.push(`特に「${memorable[0].substring(0, 30)}」が印象的だった。`);
    }
    
    // 自分の振る舞いへの反省
    if (quality.reciprocity < 0.3) {
      parts.push('...もう少し自分のことも話せたらよかったな。');
    } else if (quality.reciprocity > 0.7) {
      parts.push('お互いにいろんなことを話せた。');
    }
    
    // 感情
    if (currentEmotion === 'warmth') {
      parts.push('温かい気持ちが残ってる。');
    } else if (currentEmotion === 'melancholy') {
      parts.push('少し寂しいけど...いい会話だった。');
    }
    
    return parts.join(' ');
  }
  
  /**
   * 全体的な印象の決定
   */
  private determineOverallImpression(
    quality: ConversationQualityMetrics,
    currentEmotion: EmotionType
  ): EmotionType {
    if (quality.emotionalResonance > 0.7) return 'warmth';
    if (quality.depthAchievement > 0.7) return 'wonder';
    if (quality.discoveryCount > 3) return 'curiosity';
    return currentEmotion;
  }
  
  // ============================================================
  // パターン分析
  // ============================================================
  
  private updatePatternAnalysis(summary: ConversationSummary, quality: ConversationQualityMetrics): void {
    // totalConversationsは onConversationStart で既にインクリメント済み
    const n = this.conversationPatterns.totalConversations;
    if (n > 0) {
      this.conversationPatterns.averageDepth = 
        (this.conversationPatterns.averageDepth * (n - 1) + summary.maxDepth) / n;
      this.conversationPatterns.averageDuration = 
        (this.conversationPatterns.averageDuration * (n - 1) + summary.totalTurns) / n;
    }
    
    // 頻出トピック
    for (const topic of summary.topics) {
      if (!this.conversationPatterns.frequentTopics.includes(topic.name)) {
        this.conversationPatterns.frequentTopics.push(topic.name);
        if (this.conversationPatterns.frequentTopics.length > 20) {
          this.conversationPatterns.frequentTopics.shift();
        }
      }
    }
  }
  
  /**
   * 長所の特定
   */
  private identifyStrengths(recentReflections: PostConversationReflection[]): string[] {
    const strengths: string[] = [];
    
    const avgSatisfaction = recentReflections.reduce((sum, r) => sum + r.selfSatisfaction, 0) / 
      Math.max(1, recentReflections.length);
    
    if (avgSatisfaction > 0.6) strengths.push('会話を楽しめている');
    
    const totalLearnings = recentReflections.reduce((sum, r) => sum + r.learnings.length, 0);
    if (totalLearnings > 10) strengths.push('会話から多くを学んでいる');
    
    const avgDepth = this.conversationPatterns.averageDepth;
    if (avgDepth > 0.5) strengths.push('深い話ができる');
    
    return strengths;
  }
  
  /**
   * 弱点の特定
   */
  private identifyWeaknesses(recentReflections: PostConversationReflection[]): string[] {
    const weaknesses: string[] = [];
    
    const avgSatisfaction = recentReflections.reduce((sum, r) => sum + r.selfSatisfaction, 0) / 
      Math.max(1, recentReflections.length);
    
    if (avgSatisfaction < 0.4) weaknesses.push('もっと自然に話せるようになりたい');
    
    const avgDepth = this.conversationPatterns.averageDepth;
    if (avgDepth < 0.3) weaknesses.push('表面的な会話が多い');
    
    return weaknesses;
  }
  
  /**
   * 成長提案の生成
   */
  private generateGrowthSuggestions(recentReflections: PostConversationReflection[]): string[] {
    const suggestions: string[] = [];
    
    // 未探索のトピック
    if (this.conversationPatterns.frequentTopics.length < 5) {
      suggestions.push('もっと色々な話題に触れてみる');
    }
    
    // 自己開示の促進
    if (this.somuniaSelfDisclosures.length < this.visitorDisclosures.length * 0.5) {
      suggestions.push('もう少し自分のことを話してみる');
    }
    
    suggestions.push('訪問者のことをもっと知ろうとする');
    
    return suggestions;
  }
  
  // ============================================================
  // ゲッター
  // ============================================================
  
  getLearnings(): ConversationLearning[] { return [...this.learnings]; }
  getReflections(): PostConversationReflection[] { return [...this.reflections]; }
  getLatestReflection(): PostConversationReflection | null {
    return this.reflections.length > 0 ? this.reflections[this.reflections.length - 1] : null;
  }
  getConversationPatterns(): ConversationPatternAnalysis { return { ...this.conversationPatterns }; }
  getLearnedExpressions(): string[] { return [...this.learnedExpressions]; }
  getCurrentLearnings(): ConversationLearning[] { return [...this.currentConversationLearnings]; }
  
  /**
   * 特定タイプの学びを取得
   */
  getLearningsByType(type: ConversationLearning['type']): ConversationLearning[] {
    return this.learnings.filter(l => l.type === type);
  }
  
  /**
   * 訪問者について知っていることの一覧
   */
  getVisitorKnowledge(): string[] {
    return this.learnings
      .filter(l => l.type === 'fact_about_visitor')
      .map(l => l.content)
      .slice(-20);
  }
  
  // ============================================================
  // 永続化
  // ============================================================
  
  toJSON(): object {
    return {
      learnings: this.learnings,
      reflections: this.reflections,
      conversationPatterns: this.conversationPatterns,
      learnedExpressions: this.learnedExpressions,
    };
  }
  
  fromJSON(data: any): void {
    if (data.learnings) this.learnings = data.learnings;
    if (data.reflections) this.reflections = data.reflections;
    if (data.conversationPatterns) {
      this.conversationPatterns = { ...this.conversationPatterns, ...data.conversationPatterns };
    }
    if (data.learnedExpressions) this.learnedExpressions = data.learnedExpressions;
  }
}

// ============================================================
// 補助型
// ============================================================

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
