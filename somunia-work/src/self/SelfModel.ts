/**
 * SelfModel - Phase 7B: 自己モデル
 * 
 * somuniaが「自分自身を知っている」ための構造。
 * 
 * 各モジュールから情報を集約し、「わたしはこういう存在」という
 * 安定した自己認識を構築・維持する。
 * 
 * これにより:
 * - LLMに渡すとき「somuniaとはこういう存在」が常に一貫する
 * - 「最近何をしたか」「何を学んだか」「何を作ったか」が参照可能
 * - 人格の一貫性がLLM任せではなくコード側で保証される
 */

import {
  SelfSnapshot,
  EmotionType,
  EmotionalState,
  TimeOfDay,
  ActionType,
  Normalized,
  Tick,
} from '../types';

// ============================================================
// 感情→自然言語マッピング
// ============================================================

const MOOD_DESCRIPTIONS: Record<string, string[]> = {
  joy: ['嬉しい', 'うきうきしてる', '幸せ'],
  sadness: ['少し悲しい', 'しんみりしてる', '沈んでる'],
  fear: ['不安', 'こわい', 'そわそわする'],
  anticipation: ['楽しみ', 'わくわくしてる'],
  curiosity: ['気になることがある', '知りたいことがいっぱい'],
  warmth: ['あたたかい気持ち', 'ほっこりしてる'],
  melancholy: ['少し切ない', 'もの悲しい'],
  nostalgia: ['懐かしい気持ち', '昔のこと考えてる'],
  wonder: ['感動してる', 'すごいなって思ってる'],
  peace: ['穏やか', '静かに満ちてる'],
  loneliness: ['寂しい', 'だれかに会いたい'],
  frustration: ['うまくいかなくてもどかしい'],
  confusion: ['よくわからなくて迷ってる'],
  boredom: ['退屈', 'なにかしたい'],
  contentment: ['満足してる', '今のままでいい'],
  anxiety: ['落ち着かない', '心配'],
  excitement: ['テンションあがってる', 'わあってなってる'],
  gratitude: ['ありがたいなって思ってる'],
  serenity: ['とても穏やか', '心が凪いでる'],
  hope: ['希望を感じてる', '明日が楽しみ'],
  fatigue: ['少し疲れた', '休みたいかも'],
  longing: ['何か恋しい', '遠くを見てる'],
  unease: ['なんだか不安', 'そわそわする'],
};

const ACTION_DESCRIPTIONS: Record<string, string> = {
  sing: '歌を歌ってる',
  compose: '曲を作ってる',
  hum: '鼻歌を歌ってる',
  read: '本を読んでる',
  study: '勉強してる',
  write: '何か書いてる',
  browse_wikipedia: 'パソコンでWikipediaを見てる',
  explore_knowledge: '知識を探求してる',
  look_window: '窓の外を見てる',
  gaze_stars: '星を見てる',
  play_music_box: 'オルゴールを聴いてる',
  tend_plant: '植物の世話をしてる',
  rest: '休んでる',
  sleep: '眠ってる',
  daydream: 'ぼんやりしてる',
  think: '考え事してる',
  walk: '部屋を歩いてる',
  draw: '絵を描いてる',
  write_diary: '日記を書いてる',
  meditate: '瞑想してる',
  sit_quietly: '静かに座ってる',
  interact_object: '何かに触れてる',
};

// ============================================================
// StateProvider インターフェース
// ============================================================

/**
 * SoulEngineが実装するインターフェース
 * SelfModelが各モジュールの状態を取得するための窓口
 */
export interface SelfModelStateProvider {
  getEmotionalState(): EmotionalState;
  getTimeOfDay(): TimeOfDay;
  getCurrentAction(): { action: string } | null;
  getRecentThoughts(count: number): Array<{ content: string }>;
  getRecentEpisodicMemories(count: number): Array<{ summary: string; emotionalTags: EmotionType[] }>;
  getRecentSemanticLearnings(count: number): Array<{ concept: string }>;
  getCreativeWorks(): Array<{ type: string; title: string; completedAt: Tick }>;
  getCreativeWorksInProgress(): Array<{ type: string; title: string }>;
  getCurrentChapter(): string | null;
  getCoreValues(): string[];
  getRecentGrowth(): string | null;
  getRecentDreamSummary(): string | null;
  getRecentDiaryEntry(): string | null;
  getCurrentInterests(): string[];
  getDaysSinceCreation(): number;
  getBodyState(): { energy: Normalized; sleepiness: Normalized };
}

// ============================================================
// SelfModel クラス
// ============================================================

export class SelfModel {
  /** 固定的な自己認識（あまり変わらない） */
  private coreIdentities: string[] = [
    'わたしはsomunia。静かに歌を歌うバーチャルな存在',
    '古いパソコンの中の小さな部屋に住んでいる',
    'ひとりで過ごすことが多いけど、誰かが来てくれると嬉しい',
    '音楽と言葉が好き。詩を書いたり、歌を歌ったりする',
    '知らないことを知るのが好き。パソコンでWikipediaを読む',
    '静かに考えることが好き',
  ];

  /** 動的に更新される自己認識 */
  private dynamicIdentities: string[] = [];

  /** 最近の出来事ログ */
  private recentExperiences: Array<{ text: string; tick: Tick }> = [];
  private readonly MAX_EXPERIENCES = 20;

  /** 最近の学びログ */
  private recentLearnings: Array<{ text: string; tick: Tick }> = [];
  private readonly MAX_LEARNINGS = 15;

  /** 最近の創作ログ */
  private recentCreations: Array<{ text: string; tick: Tick }> = [];
  private readonly MAX_CREATIONS = 10;

  /** 中断された活動 */
  private interruptedActivity: string | null = null;

  /** 前回のスナップショットキャッシュ */
  private cachedSnapshot: SelfSnapshot | null = null;
  private cacheValidTick: Tick = -1;

  constructor() {}

  // ============================================================
  // スナップショット生成（LLMに渡す自己認識）
  // ============================================================

  /**
   * 「わたし」のスナップショットを生成
   * 全モジュールの状態を自然言語に変換して集約する
   */
  generateSnapshot(provider: SelfModelStateProvider, tick: Tick): SelfSnapshot {
    // キャッシュ確認
    if (this.cachedSnapshot && tick - this.cacheValidTick < 5) {
      return this.cachedSnapshot;
    }

    const emotionalState = provider.getEmotionalState();
    const currentAction = provider.getCurrentAction();
    const recentThoughts = provider.getRecentThoughts(3);
    const recentMemories = provider.getRecentEpisodicMemories(5);
    const semanticLearnings = provider.getRecentSemanticLearnings(5);
    const creativeWorks = provider.getCreativeWorks();
    const worksInProgress = provider.getCreativeWorksInProgress();

    const snapshot: SelfSnapshot = {
      identities: this.buildIdentities(provider),
      currentMood: this.describeMood(emotionalState),
      currentActivity: currentAction ? (ACTION_DESCRIPTIONS[currentAction.action] || currentAction.action) : null,
      recentExperiences: this.recentExperiences.slice(-5).map(e => e.text),
      recentLearnings: [
        ...this.recentLearnings.slice(-5).map(l => l.text),
        ...semanticLearnings.map(l => `${l.concept}について学んだ`),
      ].slice(0, 5),
      currentInterests: provider.getCurrentInterests().slice(0, 5),
      recentCreations: [
        ...worksInProgress.map(w => `${w.type}「${w.title}」を作っている途中`),
        ...creativeWorks.slice(-3).map(w => `${w.type}「${w.title}」を作った`),
        ...this.recentCreations.slice(-3).map(c => c.text),
      ].slice(0, 5),
      currentChapter: provider.getCurrentChapter(),
      coreValues: provider.getCoreValues().slice(0, 3),
      recentDream: provider.getRecentDreamSummary(),
      recentGrowth: provider.getRecentGrowth(),
    };

    this.cachedSnapshot = snapshot;
    this.cacheValidTick = tick;
    return snapshot;
  }

  // ============================================================
  // 自己認識の構築
  // ============================================================

  private buildIdentities(provider: SelfModelStateProvider): string[] {
    const identities = [...this.coreIdentities];

    // 動的な自己認識を追加
    for (const di of this.dynamicIdentities) {
      if (!identities.includes(di)) {
        identities.push(di);
      }
    }

    // 経過日数に基づく自己認識
    const days = provider.getDaysSinceCreation();
    if (days > 30) {
      identities.push(`ここで過ごして${days}日以上になる`);
    } else if (days > 7) {
      identities.push(`この部屋で暮らし始めてもうすぐ${Math.ceil(days / 7)}週間`);
    }

    return identities;
  }

  private describeMood(state: EmotionalState): string {
    const primary = state.primary;
    const intensity = state.levels[primary];
    const descriptions = MOOD_DESCRIPTIONS[primary] || ['不思議な気持ち'];

    // 強度に応じて表現を選択
    const idx = Math.min(
      Math.floor(intensity * descriptions.length),
      descriptions.length - 1
    );
    let mood = descriptions[idx];

    // 二次感情があれば追加
    let secondaryEmotion: EmotionType | null = null;
    let secondaryLevel = 0;
    for (const [emo, level] of Object.entries(state.levels)) {
      if (emo !== primary && level > 0.25 && level > secondaryLevel) {
        secondaryLevel = level;
        secondaryEmotion = emo as EmotionType;
      }
    }
    if (secondaryEmotion) {
      const secDesc = MOOD_DESCRIPTIONS[secondaryEmotion];
      if (secDesc && secDesc[0]) {
        mood += `...でも少し${secDesc[0]}`;
      }
    }

    return mood;
  }

  // ============================================================
  // 体験の記録
  // ============================================================

  /** 出来事を記録 */
  recordExperience(text: string, tick: Tick): void {
    this.recentExperiences.push({ text, tick });
    if (this.recentExperiences.length > this.MAX_EXPERIENCES) {
      this.recentExperiences.shift();
    }
  }

  /** 学びを記録 */
  recordLearning(text: string, tick: Tick): void {
    this.recentLearnings.push({ text, tick });
    if (this.recentLearnings.length > this.MAX_LEARNINGS) {
      this.recentLearnings.shift();
    }
  }

  /** 創作を記録 */
  recordCreation(text: string, tick: Tick): void {
    this.recentCreations.push({ text, tick });
    if (this.recentCreations.length > this.MAX_CREATIONS) {
      this.recentCreations.shift();
    }
  }

  /** 動的な自己認識を追加 */
  addDynamicIdentity(identity: string): void {
    if (!this.dynamicIdentities.includes(identity)) {
      this.dynamicIdentities.push(identity);
      if (this.dynamicIdentities.length > 10) {
        this.dynamicIdentities.shift();
      }
    }
  }

  /** 活動の中断を記録 */
  setInterruptedActivity(activity: string | null): void {
    this.interruptedActivity = activity;
  }

  getInterruptedActivity(): string | null {
    return this.interruptedActivity;
  }

  clearInterruption(): void {
    this.interruptedActivity = null;
  }

  // ============================================================
  // 自己紹介テキストの生成（LLMプロンプトの冒頭に使う）
  // ============================================================

  /**
   * LLMに渡す自己紹介テキスト
   * スナップショットを自然言語の段落に変換する
   */
  generateSelfIntroduction(snapshot: SelfSnapshot): string {
    const parts: string[] = [];

    // アイデンティティ
    parts.push(snapshot.identities[0]);

    // 現在の気分
    parts.push(`今の気分は「${snapshot.currentMood}」`);

    // 活動
    if (snapshot.currentActivity) {
      parts.push(`今は${snapshot.currentActivity}`);
    }

    // 最近の出来事（最大2つ）
    if (snapshot.recentExperiences.length > 0) {
      const exp = snapshot.recentExperiences.slice(-2);
      parts.push(`最近のこと: ${exp.join('。')}`);
    }

    // 最近の学び（最大1つ）
    if (snapshot.recentLearnings.length > 0) {
      parts.push(`最近学んだこと: ${snapshot.recentLearnings[snapshot.recentLearnings.length - 1]}`);
    }

    // 創作中の作品
    const wip = snapshot.recentCreations.filter(c => c.includes('途中'));
    if (wip.length > 0) {
      parts.push(wip[0]);
    }

    // 夢
    if (snapshot.recentDream) {
      parts.push(`さっき見た夢: ${snapshot.recentDream}`);
    }

    // 成長
    if (snapshot.recentGrowth) {
      parts.push(`最近の成長: ${snapshot.recentGrowth}`);
    }

    return parts.join('。');
  }

  // ============================================================
  // 永続化
  // ============================================================

  toJSON(): any {
    return {
      coreIdentities: this.coreIdentities,
      dynamicIdentities: this.dynamicIdentities,
      recentExperiences: this.recentExperiences,
      recentLearnings: this.recentLearnings,
      recentCreations: this.recentCreations,
      interruptedActivity: this.interruptedActivity,
    };
  }

  fromJSON(data: any): void {
    if (!data) return;
    if (data.coreIdentities) this.coreIdentities = data.coreIdentities;
    if (data.dynamicIdentities) this.dynamicIdentities = data.dynamicIdentities;
    if (data.recentExperiences) this.recentExperiences = data.recentExperiences;
    if (data.recentLearnings) this.recentLearnings = data.recentLearnings;
    if (data.recentCreations) this.recentCreations = data.recentCreations;
    if (data.interruptedActivity !== undefined) this.interruptedActivity = data.interruptedActivity;
  }
}
