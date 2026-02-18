/**
 * VisitorMemorySystem - Phase 7C: 訪問者記憶システム
 * 
 * somuniaが訪問者を「ちゃんと覚える」ためのシステム。
 * 
 * 以前の問題:
 * - 名前を聞いても忘れていた
 * - 過去の会話内容を参照しなかった
 * - 「この人に話したいこと」が蓄積されなかった
 * 
 * 解決:
 * 1. 名前検出（自己紹介パターンマッチング）
 * 2. 訪問者ごとのプロファイル（永続保存）
 * 3. 会話からの情報自動抽出
 * 4. 関連記憶の検索と表面化
 * 5. 「話したいこと」リストの管理
 */

import {
  VisitorProfile,
  VisitorFact,
  VisitorContext7,
  EmotionType,
  ConversationDepth,
  RelationshipPhase,
  Normalized,
  Tick,
  Timestamp,
  ID,
} from '../types';

// ============================================================
// 名前検出パターン
// ============================================================

const NAME_PATTERNS: Array<{ regex: RegExp; group: number }> = [
  // 「〇〇って呼んで」
  { regex: /(.{1,10})(?:って?|と)呼んで/, group: 1 },
  // 「名前は〇〇」「わたしは〇〇」
  { regex: /(?:わたし|私|僕|俺|自分)(?:の名前)?(?:は|って)\s*(.{1,10})(?:です|だよ|って言う|と申し|っていう|。|！|!|$)/, group: 1 },
  { regex: /(?:名前は|呼んで|呼ぶなら)\s*(.{1,10})(?:で|って|に|。|！|$)/, group: 1 },
  // 「〇〇です、よろしく」
  { regex: /(.{1,10})(?:です|だよ)\s*[、。！!]?\s*(?:よろしく|どうぞ|はじめまして)/, group: 1 },
  // 英語パターン
  { regex: /(?:I'm|I am|my name is|call me)\s+(\w{1,20})/i, group: 1 },
  // シンプルに名乗る
  { regex: /^(.{1,8})(?:です|だよ|!|！)$/, group: 1 },
];

const INVALID_NAMES = new Set([
  'よろしく', 'はじめまして', 'こんにちは', 'こんばんは', 'おはよう',
  'ありがとう', 'さようなら', 'バイバイ', 'うん', 'そう', 'はい',
  'いいえ', 'ううん', 'それ', 'これ', 'あれ', 'なに', 'どう',
  'すごい', 'すき', 'きらい', 'わかる', 'いい', 'だめ', 'おけ',
  'somunia', 'そむにあ', 'ソムニア',
]);

// ============================================================
// 情報抽出パターン
// ============================================================

interface ExtractionRule {
  regex: RegExp;
  category: VisitorFact['category'];
  format: (match: RegExpMatchArray) => string;
}

const EXTRACTION_RULES: ExtractionRule[] = [
  { regex: /(.{2,15})(?:が好き|がすき|が大好き)/, category: 'preference', format: (m) => `${m[1]}が好き` },
  { regex: /(.{2,15})(?:が嫌い|がきらい|が苦手)/, category: 'preference', format: (m) => `${m[1]}が苦手` },
  { regex: /(?:趣味は|趣味が)(.{2,20})/, category: 'interest', format: (m) => `趣味: ${m[1]}` },
  { regex: /(?:仕事は|仕事で|働いて)(.{2,20})/, category: 'situation', format: (m) => `仕事: ${m[1]}` },
  { regex: /(.{2,15})(?:を始めた|をはじめた|に挑戦)/, category: 'experience', format: (m) => `${m[1]}を始めた` },
  { regex: /(.{2,15})(?:に興味|が気になる|を知りたい)/, category: 'interest', format: (m) => `${m[1]}に興味がある` },
  { regex: /(?:最近|さいきん)(.{2,30})(?:している|してる|した)/, category: 'situation', format: (m) => `最近${m[1]}` },
  { regex: /(?:今日|きょう)(.{2,25})(?:した|だった|があった)/, category: 'situation', format: (m) => `今日${m[1]}` },
  { regex: /(.{2,15})(?:が得意|が上手)/, category: 'personality', format: (m) => `${m[1]}が得意` },
  { regex: /(.{2,15})(?:に行った|に行ってきた)/, category: 'experience', format: (m) => `${m[1]}に行った` },
];

// ============================================================
// VisitorMemorySystem クラス
// ============================================================

export interface VisitorMemoryConfig {
  maxProfiles: number;
  maxFactsPerVisitor: number;
  maxSpecialMemories: number;
  maxThingsToTell: number;
  maxTopicHistory: number;
}

const DEFAULT_CONFIG: VisitorMemoryConfig = {
  maxProfiles: 50,
  maxFactsPerVisitor: 100,
  maxSpecialMemories: 50,
  maxThingsToTell: 20,
  maxTopicHistory: 200,
};

export class VisitorMemorySystem {
  private config: VisitorMemoryConfig;
  private profiles: Map<ID, VisitorProfile> = new Map();
  private currentVisitorId: ID | null = null;
  private defaultVisitorId: ID = 'visitor_default';

  constructor(config?: Partial<VisitorMemoryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ============================================================
  // 訪問者の到着・退出
  // ============================================================

  onVisitorArrival(visitorId?: ID): VisitorProfile {
    const id = visitorId || this.defaultVisitorId;
    this.currentVisitorId = id;

    let profile = this.profiles.get(id);
    if (profile) {
      profile.visitCount++;
      profile.lastVisitAt = Date.now();
    } else {
      profile = this.createProfile(id);
      this.profiles.set(id, profile);
    }

    return profile;
  }

  onVisitorDeparture(summary?: {
    topics: string[];
    depth: ConversationDepth;
    impression: EmotionType;
    memorable?: string;
  }): void {
    if (!this.currentVisitorId) return;
    const profile = this.profiles.get(this.currentVisitorId);
    if (!profile || !summary) { this.currentVisitorId = null; return; }

    // 話題履歴
    for (const topic of summary.topics) {
      profile.topicHistory.push({
        topic, discussedAt: Date.now(), depth: summary.depth,
      });
    }
    if (profile.topicHistory.length > this.config.maxTopicHistory) {
      profile.topicHistory = profile.topicHistory.slice(-this.config.maxTopicHistory);
    }

    // 特別な記憶
    if (summary.memorable && (summary.depth === 'intimate' || summary.depth === 'profound')) {
      profile.specialMemories.push({
        content: summary.memorable, emotion: summary.impression,
        importance: summary.depth === 'profound' ? 0.9 : 0.7,
        timestamp: Date.now(),
      });
      if (profile.specialMemories.length > this.config.maxSpecialMemories) {
        profile.specialMemories.sort((a, b) => b.importance - a.importance);
        profile.specialMemories = profile.specialMemories.slice(0, this.config.maxSpecialMemories);
      }
    }

    // 話したことをマーク
    for (const t of profile.thingsToTell) {
      if (!t.told && summary.topics.some(topic => t.content.includes(topic))) {
        t.told = true;
      }
    }

    this.currentVisitorId = null;
  }

  // ============================================================
  // メッセージ処理
  // ============================================================

  processMessage(
    message: string,
    emotions: EmotionType[],
    topics: string[],
    depth: ConversationDepth,
    tick: Tick
  ): { extractedName: string | null; extractedFacts: VisitorFact[]; hasNameIntroduction: boolean } {
    if (!this.currentVisitorId) {
      return { extractedName: null, extractedFacts: [], hasNameIntroduction: false };
    }
    const profile = this.profiles.get(this.currentVisitorId);
    if (!profile) {
      return { extractedName: null, extractedFacts: [], hasNameIntroduction: false };
    }

    // 名前検出
    const detectedName = this.detectName(message);
    let hasNameIntroduction = false;
    if (detectedName) {
      hasNameIntroduction = true;
      profile.name = detectedName;
      if (!profile.callName) profile.callName = detectedName;

      this.addFact(profile, {
        category: 'name', content: `名前は${detectedName}`,
        confidence: 0.9, learnedAt: Date.now(), source: 'direct_statement',
      });
    }

    // 情報抽出
    const extractedFacts = this.extractFacts(message, profile);

    // コミュニケーションスタイル更新
    this.updateComStyle(profile, message);

    // 感情関連更新
    if (emotions.length > 0 && depth !== 'surface') {
      const ea = profile.emotionalAssociations.find(a => a.emotion === emotions[0]);
      if (ea) {
        ea.strength = Math.min(1, ea.strength + 0.05) as Normalized;
      } else if (profile.emotionalAssociations.length < 10) {
        profile.emotionalAssociations.push({
          emotion: emotions[0],
          reason: topics[0] ? `${topics[0]}の話をした時` : '会話中に',
          strength: 0.3 as Normalized,
        });
      }
    }

    return { extractedName: detectedName, extractedFacts, hasNameIntroduction };
  }

  // ============================================================
  // 名前検出
  // ============================================================

  private detectName(message: string): string | null {
    for (const { regex, group } of NAME_PATTERNS) {
      const match = message.match(regex);
      if (match && match[group]) {
        const name = match[group].trim();
        if (name.length < 1 || name.length > 20) continue;
        if (INVALID_NAMES.has(name) || INVALID_NAMES.has(name.toLowerCase())) continue;
        if (/^[\s\u3000]+$/.test(name)) continue;
        return name;
      }
    }
    return null;
  }

  // ============================================================
  // 情報抽出
  // ============================================================

  private extractFacts(message: string, profile: VisitorProfile): VisitorFact[] {
    const facts: VisitorFact[] = [];
    for (const rule of EXTRACTION_RULES) {
      const match = message.match(rule.regex);
      if (match) {
        const content = rule.format(match);
        const dup = profile.knownFacts.some(f =>
          f.content === content || (f.category === rule.category && this.similar(f.content, content))
        );
        if (!dup) {
          const fact: VisitorFact = {
            category: rule.category, content,
            confidence: 0.8, learnedAt: Date.now(), source: 'direct_statement',
          };
          this.addFact(profile, fact);
          facts.push(fact);
        }
      }
    }
    return facts;
  }

  private similar(a: string, b: string): boolean {
    const wa = new Set(a.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]{2,}/g) || []);
    const wb = new Set(b.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]{2,}/g) || []);
    let overlap = 0;
    for (const w of wa) { if (wb.has(w)) overlap++; }
    return overlap >= 2;
  }

  private addFact(profile: VisitorProfile, fact: VisitorFact): void {
    profile.knownFacts.push(fact);
    if (profile.knownFacts.length > this.config.maxFactsPerVisitor) {
      profile.knownFacts.sort((a, b) => b.confidence - a.confidence);
      profile.knownFacts = profile.knownFacts.slice(0, this.config.maxFactsPerVisitor);
    }
  }

  // ============================================================
  // コミュニケーションスタイル分析
  // ============================================================

  private updateComStyle(profile: VisitorProfile, message: string): void {
    const s = profile.communicationStyle;
    const hasKeigo = /です|ます|ございます|いただ|くださ/.test(message);
    s.formality = s.formality * 0.8 + (hasKeigo ? 0.8 : 0.2) * 0.2;
    s.verbosity = s.verbosity * 0.8 + (message.length > 80 ? 0.8 : message.length > 30 ? 0.5 : 0.2) * 0.2;
    const hasEmoExpr = /[！!？?♪♡]|w{2,}|笑|嬉しい|悲しい|楽しい/.test(message);
    s.emotionalExpressiveness = s.emotionalExpressiveness * 0.8 + (hasEmoExpr ? 0.8 : 0.3) * 0.2;

    // 特徴的フレーズ
    const phrases = message.match(/(?:だね|かもね|よね|じゃん|なう|だお|にゃ|ぜ|ですわ|ござる)(?:[。！?\s]|$)/g);
    if (phrases) {
      for (const p of phrases) {
        const cleaned = p.replace(/[。！?\s]/g, '');
        if (cleaned && !s.characteristicPhrases.includes(cleaned)) {
          s.characteristicPhrases.push(cleaned);
          if (s.characteristicPhrases.length > 8) s.characteristicPhrases.shift();
        }
      }
    }
  }

  // ============================================================
  // コンテキスト生成（LLMに渡す）
  // ============================================================

  generateVisitorContext(
    currentTopics: string[],
    currentMessage: string,
    relationshipPhase: RelationshipPhase,
  ): VisitorContext7 | null {
    if (!this.currentVisitorId) return null;
    const profile = this.profiles.get(this.currentVisitorId);
    if (!profile) return null;

    const relevantFacts = this.selectRelevantFacts(profile, currentTopics, currentMessage);
    const pastTopics = this.getRecentTopics(profile, 8);
    const thingsToTell = profile.thingsToTell
      .filter(t => !t.told)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3)
      .map(t => t.content);
    const relevantMemories = profile.specialMemories
      .filter(m => currentTopics.some(t => m.content.includes(t)) || m.importance > 0.8)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 3)
      .map(m => m.content);

    return {
      name: profile.name,
      callName: profile.callName || profile.name || 'あなた',
      relationshipPhase,
      visitCount: profile.visitCount,
      relevantFacts: relevantFacts.map(f => f.content),
      pastTopics,
      thingsToTell,
      timeSinceLastVisit: profile.visitCount > 1 ? this.describeTimeSince(profile.lastVisitAt) : null,
      relevantMemories,
    };
  }

  // ============================================================
  // 「話したいこと」の管理
  // ============================================================

  addThingToTell(content: string, priority: Normalized = 0.5): void {
    if (!this.currentVisitorId && this.defaultVisitorId) {
      // 訪問者が不在時でも追加できる（次回会った時に話す）
      const profile = this.profiles.get(this.defaultVisitorId);
      if (profile) {
        this.addThingToProfile(profile, content, priority);
      }
      return;
    }
    if (!this.currentVisitorId) return;
    const profile = this.profiles.get(this.currentVisitorId);
    if (profile) {
      this.addThingToProfile(profile, content, priority);
    }
  }

  private addThingToProfile(profile: VisitorProfile, content: string, priority: Normalized): void {
    const dup = profile.thingsToTell.some(t => t.content === content);
    if (dup) return;
    profile.thingsToTell.push({
      content, addedAt: Date.now(), priority, told: false,
    });
    if (profile.thingsToTell.length > this.config.maxThingsToTell) {
      profile.thingsToTell = profile.thingsToTell
        .filter(t => !t.told)
        .sort((a, b) => b.priority - a.priority)
        .slice(0, this.config.maxThingsToTell);
    }
  }

  getUntoldThings(): string[] {
    const id = this.currentVisitorId || this.defaultVisitorId;
    const profile = this.profiles.get(id);
    if (!profile) return [];
    return profile.thingsToTell
      .filter(t => !t.told)
      .sort((a, b) => b.priority - a.priority)
      .map(t => t.content);
  }

  // ============================================================
  // ヘルパー
  // ============================================================

  getCurrentVisitorName(): string | null {
    const id = this.currentVisitorId;
    if (!id) return null;
    return this.profiles.get(id)?.name || null;
  }

  getCurrentVisitorCallName(): string {
    const id = this.currentVisitorId;
    if (!id) return 'あなた';
    const p = this.profiles.get(id);
    return p?.callName || p?.name || 'あなた';
  }

  getCurrentProfile(): VisitorProfile | null {
    if (!this.currentVisitorId) return null;
    return this.profiles.get(this.currentVisitorId) || null;
  }

  isVisitorPresent(): boolean {
    return this.currentVisitorId !== null;
  }

  private selectRelevantFacts(
    profile: VisitorProfile, topics: string[], message: string
  ): VisitorFact[] {
    return profile.knownFacts
      .map(f => {
        let score = f.confidence * 0.3;
        if (f.category === 'name') score += 0.5;
        for (const t of topics) { if (f.content.includes(t)) score += 0.3; }
        const words = f.content.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]{2,}/g) || [];
        for (const w of words) { if (message.includes(w)) score += 0.15; }
        return { fact: f, score };
      })
      .filter(s => s.score > 0.25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.fact);
  }

  private getRecentTopics(profile: VisitorProfile, count: number): string[] {
    const seen = new Set<string>();
    return profile.topicHistory.slice(-count * 2).reverse()
      .filter(t => { if (seen.has(t.topic)) return false; seen.add(t.topic); return true; })
      .slice(0, count)
      .map(t => t.topic);
  }

  private describeTimeSince(timestamp: Timestamp): string {
    const diff = Date.now() - timestamp;
    const hours = diff / (1000 * 60 * 60);
    if (hours < 1) return 'さっき';
    if (hours < 24) return `${Math.floor(hours)}時間前`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '昨日';
    if (days < 7) return `${days}日前`;
    return `${Math.floor(days / 7)}週間前`;
  }

  private createProfile(id: ID): VisitorProfile {
    return {
      id, name: null, nickname: null, callName: null,
      firstVisitAt: Date.now(), lastVisitAt: Date.now(), visitCount: 1,
      knownFacts: [], topicHistory: [],
      emotionalAssociations: [],
      thingsToTell: [],
      communicationStyle: {
        formality: 0.5, verbosity: 0.5,
        emotionalExpressiveness: 0.5, characteristicPhrases: [],
      },
      specialMemories: [],
    };
  }

  // ============================================================
  // 永続化
  // ============================================================

  toJSON(): any {
    return {
      profiles: Array.from(this.profiles.entries()),
      defaultVisitorId: this.defaultVisitorId,
    };
  }

  fromJSON(data: any): void {
    if (!data) return;
    this.profiles.clear();
    if (data.profiles) {
      for (const [id, profile] of data.profiles) {
        this.profiles.set(id, profile);
      }
    }
    if (data.defaultVisitorId) this.defaultVisitorId = data.defaultVisitorId;
  }
}
