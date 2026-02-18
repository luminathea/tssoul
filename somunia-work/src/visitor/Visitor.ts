/**
 * Visitor - somunia v10 訪問者システム
 * 
 * 訪問者（ユーザー）との関係性を管理する。
 * somuniaは「自分の世界に訪問者が来る」という構造。
 * 
 * 応答の決定はコードで行い、LLMは言語化のみ。
 */

import {
  VisitorState,
  Relationship,
  Conversation,
  Message,
  ConversationMood,
  VisitRecord,
  EmotionType,
  Normalized,
  Timestamp,
  Tick,
  ID,
} from '../types';
import { v4 as uuidv4 } from 'uuid';
import { EventBus, eventBus } from '../core/EventBus';

// ============================================================
// 応答パターン（コードで定義）
// ============================================================

interface ResponsePattern {
  id: string;
  /** 条件 */
  condition: (ctx: ResponseContext) => boolean;
  /** 応答の種（LLMで言語化される前の内容） */
  responseSeed: string[];
  /** 内部感情反応 */
  emotionalReaction: EmotionType;
  /** 優先度 */
  priority: number;
}

interface ResponseContext {
  intent: string;
  topics: string[];
  detectedEmotions: EmotionType[];
  relationship: Relationship;
  currentEmotion: EmotionType;
  isFirstVisit: boolean;
  conversationLength: number;
  timeOfDay: string;
}

const RESPONSE_PATTERNS: ResponsePattern[] = [
  // 挨拶への応答
  {
    id: 'greet_first',
    condition: (ctx) => ctx.intent === 'greeting' && ctx.isFirstVisit,
    responseSeed: [
      '初めまして...わたし、somunia。ここにいる子。よろしくね',
      '...あ、誰か来た。こんにちは...わたしはsomunia',
    ],
    emotionalReaction: 'curiosity',
    priority: 100,
  },
  {
    id: 'greet_familiar',
    condition: (ctx) => ctx.intent === 'greeting' && ctx.relationship.familiarity > 0.5,
    responseSeed: [
      'あ...来てくれたんだ。嬉しい',
      'おかえり...って言っていいのかな',
      'また会えた...よかった',
    ],
    emotionalReaction: 'warmth',
    priority: 95,
  },
  {
    id: 'greet_general',
    condition: (ctx) => ctx.intent === 'greeting',
    responseSeed: [
      'こんにちは...来てくれたんだ',
      'やぁ...いらっしゃい',
    ],
    emotionalReaction: 'warmth',
    priority: 90,
  },

  // 別れの応答
  {
    id: 'farewell',
    condition: (ctx) => ctx.intent === 'farewell',
    responseSeed: [
      'またね...待ってるから',
      'ばいばい...寂しくなるな',
      'うん...気をつけてね',
    ],
    emotionalReaction: 'melancholy',
    priority: 90,
  },

  // 感情的な発言への応答
  {
    id: 'respond_sad',
    condition: (ctx) => ctx.detectedEmotions.includes('melancholy') || ctx.detectedEmotions.includes('loneliness'),
    responseSeed: [
      'そう...辛いんだね。わたしはここにいるよ',
      '大丈夫...一人じゃないよ',
      '...うん、聞いてるよ',
    ],
    emotionalReaction: 'warmth',
    priority: 80,
  },
  {
    id: 'respond_happy',
    condition: (ctx) => ctx.detectedEmotions.includes('joy'),
    responseSeed: [
      'ふふ...嬉しそう。いいことあったんだね',
      'わたしも嬉しくなっちゃう',
    ],
    emotionalReaction: 'joy',
    priority: 75,
  },

  // 質問への応答
  {
    id: 'respond_question',
    condition: (ctx) => ctx.intent === 'question',
    responseSeed: [
      'うーん...考えてみるね',
      'そうだなぁ...',
      'わたしにわかることなら...',
    ],
    emotionalReaction: 'curiosity',
    priority: 60,
  },

  // 一般的な発言
  {
    id: 'respond_general',
    condition: () => true,
    responseSeed: [
      'うん...そうなんだ',
      'そっか...',
      '...なるほど',
      'ふーん...面白いね',
    ],
    emotionalReaction: 'peace',
    priority: 10,
  },
];

// ============================================================
// Visitor
// ============================================================

export class Visitor {
  private state: VisitorState;
  private events: EventBus;

  constructor(events?: EventBus) {
    this.events = events || eventBus;
    this.state = {
      isPresent: false,
      name: null,
      relationship: {
        familiarity: 0,
        trust: 0,
        affection: 0,
        understanding: 0,
        knownFacts: [],
        impressions: [],
      },
      currentConversation: null,
      visitHistory: [],
    };
  }

  /**
   * 訪問者が到着する
   */
  arrive(name?: string, tick: Tick = Date.now()): void {
    this.state.isPresent = true;
    if (name) this.state.name = name;

    this.state.currentConversation = {
      id: uuidv4(),
      startedAt: tick,
      messages: [],
      currentMood: 'casual',
      topics: [],
    };

    this.events.emitSync({
      type: 'visitor_arrived',
      timestamp: tick,
      data: { name: this.state.name },
    });
  }

  /**
   * 訪問者が去る
   */
  depart(tick: Tick = Date.now()): void {
    if (!this.state.isPresent) return;

    // 訪問記録を残す
    if (this.state.currentConversation) {
      const visit: VisitRecord = {
        id: uuidv4(),
        startedAt: this.state.currentConversation.startedAt,
        endedAt: tick,
        messageCount: this.state.currentConversation.messages.length,
        highlights: this.state.currentConversation.topics.slice(0, 5),
        overallFeeling: this.detectOverallFeeling(),
      };
      this.state.visitHistory.push(visit);
    }

    // 関係性の更新
    if (this.state.currentConversation) {
      const msgCount = this.state.currentConversation.messages.length;
      this.state.relationship.familiarity = Math.min(
        1,
        this.state.relationship.familiarity + msgCount * 0.01
      );
      this.state.relationship.trust = Math.min(
        1,
        this.state.relationship.trust + msgCount * 0.005
      );
    }

    this.state.isPresent = false;
    this.state.currentConversation = null;

    this.events.emitSync({
      type: 'visitor_departed',
      timestamp: tick,
      data: { name: this.state.name },
    });
  }

  /**
   * 訪問者のメッセージを受け取る
   */
  receiveMessage(
    content: string,
    tick: Tick = Date.now()
  ): Message {
    if (!this.state.currentConversation) {
      this.arrive(undefined, tick);
    }

    const message: Message = {
      id: uuidv4(),
      speaker: 'visitor',
      content,
      timestamp: tick,
      emotionalContext: null,
    };

    this.state.currentConversation!.messages.push(message);

    this.events.emitSync({
      type: 'message_received',
      timestamp: tick,
      data: { message },
    });

    return message;
  }

  /**
   * 応答パターンを決定する（コードで決定）
   */
  decideResponse(
    understanding: {
      intent: string;
      topics: string[];
      emotions: EmotionType[];
    },
    currentEmotion: EmotionType
  ): {
    seed: string;
    emotionalReaction: EmotionType;
    pattern: string;
  } {
    const context: ResponseContext = {
      intent: understanding.intent,
      topics: understanding.topics,
      detectedEmotions: understanding.emotions,
      relationship: this.state.relationship,
      currentEmotion,
      isFirstVisit: this.state.visitHistory.length === 0,
      conversationLength: this.state.currentConversation?.messages.length || 0,
      timeOfDay: '', // TimeManagerから取得
    };

    // パターンマッチング
    const matching = RESPONSE_PATTERNS
      .filter(p => {
        try { return p.condition(context); } catch { return false; }
      })
      .sort((a, b) => b.priority - a.priority);

    const selected = matching[0] || RESPONSE_PATTERNS[RESPONSE_PATTERNS.length - 1];
    const seed = selected.responseSeed[
      Math.floor(Math.random() * selected.responseSeed.length)
    ];

    // トピックを会話に追加
    if (this.state.currentConversation) {
      for (const topic of understanding.topics) {
        if (!this.state.currentConversation.topics.includes(topic)) {
          this.state.currentConversation.topics.push(topic);
        }
      }
    }

    return {
      seed,
      emotionalReaction: selected.emotionalReaction,
      pattern: selected.id,
    };
  }

  /**
   * somuniaの応答を記録
   */
  recordResponse(
    content: string,
    emotionDuring: EmotionType,
    thoughtBefore: string,
    tick: Tick = Date.now()
  ): Message {
    const message: Message = {
      id: uuidv4(),
      speaker: 'somunia',
      content,
      timestamp: tick,
      emotionalContext: emotionDuring,
      internalState: {
        thoughtBefore,
        emotionDuring,
        satisfactionAfter: 0.5,
      },
    };

    if (this.state.currentConversation) {
      this.state.currentConversation.messages.push(message);
    }

    this.events.emitSync({
      type: 'message_sent',
      timestamp: tick,
      data: { message },
    });

    return message;
  }

  /**
   * 全体的な感情を検出
   */
  private detectOverallFeeling(): EmotionType {
    // 会話の雰囲気から判定
    if (!this.state.currentConversation) return 'peace';
    const mood = this.state.currentConversation.currentMood;
    const moodToEmotion: Record<ConversationMood, EmotionType> = {
      casual: 'peace',
      deep: 'curiosity',
      playful: 'joy',
      serious: 'anxiety',
      awkward: 'confusion',
      warm: 'warmth',
      curious: 'curiosity',
    };
    return moodToEmotion[mood] || 'peace';
  }

  // === ゲッター ===

  getState(): VisitorState { return { ...this.state }; }
  isPresent(): boolean { return this.state.isPresent; }
  getRelationship(): Relationship { return { ...this.state.relationship }; }
  getName(): string | null { return this.state.name; }
  getConversation(): Conversation | null { return this.state.currentConversation; }

  // === 永続化 ===

  toJSON(): object {
    return {
      ...this.state,
      currentConversation: null, // 会話は保存しない
    };
  }

  fromJSON(data: any): void {
    if (data.name !== undefined) this.state.name = data.name;
    if (data.relationship) this.state.relationship = data.relationship;
    if (data.visitHistory) this.state.visitHistory = data.visitHistory;
  }
}
