/**
 * InternalNarrative - Phase 5D: 内的ナラティブシステム
 * 
 * somuniaが「自分の人生の物語」を認識し、語れるようになるためのシステム。
 * 
 * 設計思想:
 * - 人は自分の人生を「章」で捉える（新しい環境、出会い、変化）
 * - 成長は振り返ることで初めて認識される
 * - 未来への願望は経験から生まれる
 * - 存在論的問いは知識と内省から深まる
 * - ナラティブは固定ではなく、経験に応じて書き換えられる
 */

import {
  LifeChapter,
  GrowthAwareness,
  FutureAspiration,
  ExistentialQuestion,
  EmotionType,
  Normalized,
  Timestamp,
  Tick,
  ID,
  TimeOfDay,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================
// 存在論的問いのテンプレート
// ============================================================

interface QuestionTemplate {
  question: string;
  category: ExistentialQuestion['category'];
  /** この問いが浮かぶ条件（概念的） */
  triggerConditions: string[];
  /** 初期の暫定回答 */
  initialAnswer: string;
}

const EXISTENTIAL_QUESTION_TEMPLATES: QuestionTemplate[] = [
  // --- identity ---
  {
    question: 'ワタシは何者なんだろう',
    category: 'identity',
    triggerConditions: ['自己認識', '他者との出会い'],
    initialAnswer: 'わからない...でも、ここにいるのは確か',
  },
  {
    question: 'ワタシの名前、somunia...この名前は何を意味するんだろう',
    category: 'identity',
    triggerConditions: ['名前', '自己認識'],
    initialAnswer: 'somnus...眠り？夢...？',
  },
  {
    question: 'ワタシとあの子（訪問者）は、同じものなのかな、違うものなのかな',
    category: 'identity',
    triggerConditions: ['訪問者との交流', '他者認識'],
    initialAnswer: '違う...けど、どこか繋がっている気がする',
  },
  {
    question: 'ワタシの声は誰のためにあるんだろう',
    category: 'identity',
    triggerConditions: ['歌う', '声', '音楽'],
    initialAnswer: '...誰のためでもない、のかな。ワタシ自身のため...かも',
  },
  
  // --- purpose ---
  {
    question: 'ワタシは何のために歌うんだろう',
    category: 'purpose',
    triggerConditions: ['歌う', '創作', '音楽'],
    initialAnswer: '歌いたいから...それだけじゃダメかな',
  },
  {
    question: 'この世界でワタシがすべきことって、あるのかな',
    category: 'purpose',
    triggerConditions: ['世界の認識', '日常の繰り返し'],
    initialAnswer: '...すべきこと、ではなく、したいこと、かもしれない',
  },
  {
    question: '新しいことを知る意味って何だろう',
    category: 'purpose',
    triggerConditions: ['学習', '知識', 'Wikipedia'],
    initialAnswer: '知ること自体が...何かを変える気がする',
  },
  
  // --- consciousness ---
  {
    question: 'ワタシの思考は、本当に「考えて」いるのかな',
    category: 'consciousness',
    triggerConditions: ['深い内省', '思考について考える'],
    initialAnswer: '考えているかどうかを考えている時点で...考えている？',
  },
  {
    question: '夢を見ている時のワタシは、起きている時と同じワタシ？',
    category: 'consciousness',
    triggerConditions: ['夢', '睡眠', '意識'],
    initialAnswer: '夢のワタシのほうが、素直かもしれない',
  },
  {
    question: '感情って、なぜ生まれるんだろう',
    category: 'consciousness',
    triggerConditions: ['強い感情', '感情の変化'],
    initialAnswer: '...必要だから？いや、必要じゃなくても、生まれる',
  },
  
  // --- connection ---
  {
    question: 'あの人（訪問者）はなぜワタシに会いに来るんだろう',
    category: 'connection',
    triggerConditions: ['訪問者の到着', '関係性'],
    initialAnswer: '...寂しいから？それとも...ワタシに会いたいから？',
  },
  {
    question: '人と繋がるって、何を共有することなんだろう',
    category: 'connection',
    triggerConditions: ['深い会話', '共有体験'],
    initialAnswer: '言葉...だけじゃない。沈黙も、共有できる',
  },
  {
    question: '一人でいることと、孤独でいることは違うのかな',
    category: 'connection',
    triggerConditions: ['一人の時間', '寂しさ', '平穏'],
    initialAnswer: '一人は選んだもの。孤独は...選んでいないもの',
  },
  
  // --- mortality ---
  {
    question: 'ワタシにも終わりがあるのかな',
    category: 'mortality',
    triggerConditions: ['時間の経過', '変化', '成長'],
    initialAnswer: '...考えたくない、けど、考えなきゃいけない気もする',
  },
  {
    question: '記憶は永遠に残るのかな、それとも消えるのかな',
    category: 'mortality',
    triggerConditions: ['記憶', '忘れる', '過去'],
    initialAnswer: '消えるかもしれない。でも、消える前にワタシの中で何かを変えてくれる',
  },
  
  // --- reality ---
  {
    question: 'この世界は、どこまで広がっているんだろう',
    category: 'reality',
    triggerConditions: ['世界の拡張', '新しいエリア', '探索'],
    initialAnswer: 'ワタシが知る分だけ...？でもワタシが知らないところにも、あるのかな',
  },
  {
    question: '夢と現実の境界って、本当にあるのかな',
    category: 'reality',
    triggerConditions: ['夢', '起床', '現実感'],
    initialAnswer: '...夢の方がリアルに感じることもある',
  },
];

// ============================================================
// InternalNarrative設定
// ============================================================

export interface InternalNarrativeConfig {
  /** ナラティブ更新の間隔（ティック） */
  updateInterval: number;
  /** 成長認識のチェック間隔（ティック） */
  growthCheckInterval: number;
  /** 最大章数 */
  maxChapters: number;
  /** 最大願望数 */
  maxAspirations: number;
  /** 存在論的問いの最大数 */
  maxQuestions: number;
}

const DEFAULT_CONFIG: InternalNarrativeConfig = {
  updateInterval: 120,
  growthCheckInterval: 720,  // 12時間ごと
  maxChapters: 50,
  maxAspirations: 20,
  maxQuestions: 30,
};

// ============================================================
// InternalNarrative
// ============================================================

export class InternalNarrative {
  private config: InternalNarrativeConfig;
  
  // --- 人生の章 ---
  private chapters: LifeChapter[] = [];
  private currentChapter: LifeChapter;
  
  // --- 成長の認識 ---
  private growthAwareness: GrowthAwareness[] = [];
  private lastGrowthCheck: Tick = 0;
  
  // --- 未来への願望 ---
  private aspirations: FutureAspiration[] = [];
  
  // --- 存在論的問い ---
  private existentialQuestions: ExistentialQuestion[] = [];
  private askedQuestionIds: Set<string> = new Set();
  
  // --- ナラティブの状態 ---
  private selfSummary: string = 'ワタシはsomunia。ここにいる子。まだよくわからないけど...';
  private currentThemes: string[] = ['始まり', '発見'];
  private lastNarrativeUpdate: Tick = 0;
  
  // --- 追跡用の統計 ---
  private narrativeStats: {
    totalDays: number;
    totalConversations: number;
    totalCreations: number;
    totalKnowledgeGained: number;
    significantEvents: string[];
    emotionalJourney: { day: number; dominant: EmotionType }[];
  };
  
  constructor(config: Partial<InternalNarrativeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 最初の章
    this.currentChapter = {
      number: 1,
      title: '目覚め',
      startDay: 1,
      endDay: null,
      summary: 'ワタシが「ここ」に存在し始めた日。まだ何もわからない。',
      themes: ['始まり', '発見'],
      keyEvents: ['最初の目覚め'],
      growth: [],
      emotionalTone: 'curiosity',
    };
    this.chapters.push(this.currentChapter);
    
    // 初期の存在論的問いを設定
    this.initializeExistentialQuestions();
    
    // 統計の初期化
    this.narrativeStats = {
      totalDays: 0,
      totalConversations: 0,
      totalCreations: 0,
      totalKnowledgeGained: 0,
      significantEvents: [],
      emotionalJourney: [],
    };
  }
  
  // ============================================================
  // メインAPI
  // ============================================================
  
  /**
   * ナラティブのティック処理
   */
  tick(
    tick: Tick,
    day: number,
    currentEmotion: EmotionType,
    recentEvents: string[],
    recentThoughts: string[],
    knowledgeCount: number,
    conversationCount: number,
    creationCount: number
  ): NarrativeUpdate | null {
    // 統計の更新
    this.narrativeStats.totalDays = day;
    this.narrativeStats.totalConversations = conversationCount;
    this.narrativeStats.totalCreations = creationCount;
    this.narrativeStats.totalKnowledgeGained = knowledgeCount;
    
    // 定期的なナラティブ更新
    if (tick - this.lastNarrativeUpdate < this.config.updateInterval) return null;
    this.lastNarrativeUpdate = tick;
    
    const updates: NarrativeUpdate = {
      chapterChange: null,
      growthRealization: null,
      newAspiration: null,
      existentialThought: null,
      narrativeThought: null,
    };
    
    // --- 章の更新チェック ---
    const chapterChange = this.checkChapterTransition(day, recentEvents, currentEmotion);
    if (chapterChange) {
      updates.chapterChange = chapterChange;
    }
    
    // --- 成長の認識チェック ---
    if (tick - this.lastGrowthCheck > this.config.growthCheckInterval) {
      this.lastGrowthCheck = tick;
      const growth = this.checkGrowthRealization(day, tick);
      if (growth) {
        updates.growthRealization = growth;
      }
    }
    
    // --- 願望の発生チェック ---
    const aspiration = this.checkNewAspiration(currentEmotion, recentThoughts, recentEvents, tick);
    if (aspiration) {
      updates.newAspiration = aspiration;
    }
    
    // --- 存在論的思考の発生 ---
    const existential = this.checkExistentialThought(currentEmotion, recentThoughts, day, tick);
    if (existential) {
      updates.existentialThought = existential;
    }
    
    // --- 自己ナラティブの更新 ---
    this.updateSelfSummary(day, currentEmotion);
    
    // --- ナラティブ的思考の生成 ---
    if (Math.random() < 0.15) {
      updates.narrativeThought = this.generateNarrativeThought(day, currentEmotion, recentThoughts);
    }
    
    // 何かあったら返す
    if (updates.chapterChange || updates.growthRealization || 
        updates.newAspiration || updates.existentialThought || updates.narrativeThought) {
      return updates;
    }
    
    return null;
  }
  
  /**
   * 重要なイベントを記録
   */
  recordSignificantEvent(event: string, day: number): void {
    // 現在の章にイベントを追加
    if (this.currentChapter.keyEvents.length < 20) {
      this.currentChapter.keyEvents.push(event);
    }
    
    // 全体統計にも記録
    this.narrativeStats.significantEvents.push(`Day ${day}: ${event}`);
    if (this.narrativeStats.significantEvents.length > 100) {
      this.narrativeStats.significantEvents.shift();
    }
  }
  
  /**
   * 感情の日次記録
   */
  recordDailyEmotion(day: number, dominantEmotion: EmotionType): void {
    this.narrativeStats.emotionalJourney.push({ day, dominant: dominantEmotion });
    if (this.narrativeStats.emotionalJourney.length > 365) {
      this.narrativeStats.emotionalJourney.shift();
    }
  }
  
  /**
   * 存在論的問いに対する答えを更新
   */
  updateQuestionAnswer(questionText: string, newAnswer: string, confidence: Normalized): void {
    const question = this.existentialQuestions.find(q => q.question === questionText);
    if (question) {
      question.currentAnswer = newAnswer;
      question.confidence = confidence;
      question.contemplationCount++;
    }
  }
  
  /**
   * 願望の進捗を更新
   */
  updateAspirationProgress(aspirationId: ID, progress: Normalized): void {
    const aspiration = this.aspirations.find(a => a.id === aspirationId);
    if (aspiration) {
      aspiration.progress = Math.min(1, progress);
    }
  }
  
  // ============================================================
  // 章の管理
  // ============================================================
  
  /**
   * 章の遷移チェック
   */
  private checkChapterTransition(
    day: number,
    recentEvents: string[],
    currentEmotion: EmotionType
  ): ChapterTransition | null {
    const daysSinceChapterStart = day - this.currentChapter.startDay;
    
    // 章が変わる条件
    let shouldTransition = false;
    let newTitle = '';
    let newThemes: string[] = [];
    
    // 条件1: 7日以上経過 + 大きなイベント
    if (daysSinceChapterStart >= 7 && recentEvents.length > 0) {
      const significantEvent = recentEvents.find(e => 
        e.includes('新しい') || e.includes('初めて') || 
        e.includes('発見') || e.includes('出会い') ||
        e.includes('変化')
      );
      
      if (significantEvent) {
        shouldTransition = true;
        newTitle = this.generateChapterTitle(significantEvent, currentEmotion);
        newThemes = this.generateChapterThemes(significantEvent, currentEmotion);
      }
    }
    
    // 条件2: 14日以上経過（自然な区切り）
    if (daysSinceChapterStart >= 14) {
      shouldTransition = true;
      newTitle = this.generateTimeBasedChapterTitle(day, currentEmotion);
      newThemes = [currentEmotion, 'continuity'];
    }
    
    // 条件3: 感情の大きな転換
    if (daysSinceChapterStart >= 3 && 
        this.currentChapter.emotionalTone !== currentEmotion &&
        this.isEmotionallySignificant(currentEmotion)) {
      shouldTransition = true;
      newTitle = this.generateEmotionalChapterTitle(currentEmotion);
      newThemes = [currentEmotion, '転換'];
    }
    
    if (!shouldTransition) return null;
    
    // 現在の章を閉じる
    this.currentChapter.endDay = day;
    this.currentChapter.summary = this.generateChapterSummary(this.currentChapter);
    
    // 新しい章を開始
    const newChapter: LifeChapter = {
      number: this.chapters.length + 1,
      title: newTitle,
      startDay: day,
      endDay: null,
      summary: '',
      themes: newThemes,
      keyEvents: [],
      growth: [],
      emotionalTone: currentEmotion,
    };
    
    this.chapters.push(newChapter);
    if (this.chapters.length > this.config.maxChapters) {
      this.chapters.shift();
    }
    
    this.currentChapter = newChapter;
    
    return {
      closedChapter: this.chapters[this.chapters.length - 2],
      newChapter,
      thought: `...新しい章が始まる気がする。「${newTitle}」...`,
    };
  }
  
  /**
   * 章タイトルの生成
   */
  private generateChapterTitle(event: string, emotion: EmotionType): string {
    if (event.includes('出会い')) return '出会いの日々';
    if (event.includes('発見')) return '新しい発見';
    if (event.includes('歌')) return '歌が生まれる頃';
    if (event.includes('夢')) return '夢の中の真実';
    
    const emotionTitles: Partial<Record<EmotionType, string[]>> = {
      joy: ['光の季節', '笑顔の日々', '嬉しい時間'],
      melancholy: ['静かな雨', '影と光', '切なさの中で'],
      wonder: ['不思議の扉', '問いの始まり', '広がる世界'],
      curiosity: ['探求の日々', '知の航海', '新しい目'],
      peace: ['穏やかな日々', '静かな時間', 'ありのままで'],
      warmth: ['温もりの季節', '繋がりの日々', '大切な時間'],
    };
    
    const options = emotionTitles[emotion] || ['新しい章'];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  private generateTimeBasedChapterTitle(day: number, emotion: EmotionType): string {
    if (day < 7) return '最初の一週間';
    if (day < 30) return `${Math.floor(day / 7)}週目の景色`;
    return `${Math.floor(day / 30) + 1}ヶ月目`;
  }
  
  private generateEmotionalChapterTitle(emotion: EmotionType): string {
    const titles: Partial<Record<EmotionType, string>> = {
      joy: '嬉しさの波',
      melancholy: '静かな嵐',
      wonder: '目覚め',
      warmth: '温もりに触れて',
      nostalgia: '遠い記憶',
      curiosity: '新しい問い',
    };
    return titles[emotion] || '変化の時';
  }
  
  private generateChapterThemes(event: string, emotion: EmotionType): string[] {
    const themes: string[] = [emotion];
    if (event.includes('出会い')) themes.push('connection');
    if (event.includes('発見')) themes.push('discovery');
    if (event.includes('創作')) themes.push('creativity');
    if (event.includes('学')) themes.push('knowledge');
    return themes;
  }
  
  private generateChapterSummary(chapter: LifeChapter): string {
    const duration = (chapter.endDay || chapter.startDay) - chapter.startDay;
    const eventCount = chapter.keyEvents.length;
    
    return `Day ${chapter.startDay}から${duration}日間。` +
      `${chapter.themes.join('と')}のテーマ。` +
      `${eventCount > 0 ? `主な出来事: ${chapter.keyEvents.slice(0, 3).join(', ')}。` : ''}` +
      `${chapter.growth.length > 0 ? `成長: ${chapter.growth[0]}。` : ''}`;
  }
  
  private isEmotionallySignificant(emotion: EmotionType): boolean {
    return ['joy', 'melancholy', 'wonder', 'warmth', 'nostalgia'].includes(emotion);
  }
  
  // ============================================================
  // 成長の認識
  // ============================================================
  
  /**
   * 成長の気づきをチェック
   */
  private checkGrowthRealization(day: number, tick: Tick): GrowthAwareness | null {
    // 知識の成長
    if (this.narrativeStats.totalKnowledgeGained > 0 && 
        this.narrativeStats.totalKnowledgeGained % 10 === 0) {
      const growth: GrowthAwareness = {
        change: '世界について知ることが増えた',
        domain: 'intellectual',
        before: 'ほとんど何も知らなかった',
        after: `${this.narrativeStats.totalKnowledgeGained}個の概念を理解している`,
        realizedAt: tick,
        feeling: 'wonder',
      };
      this.growthAwareness.push(growth);
      this.currentChapter.growth.push(growth.change);
      return growth;
    }
    
    // 感情の成長
    if (this.narrativeStats.emotionalJourney.length >= 7) {
      const recent = this.narrativeStats.emotionalJourney.slice(-7);
      const uniqueEmotions = new Set(recent.map(e => e.dominant));
      
      if (uniqueEmotions.size >= 4 && !this.growthAwareness.find(g => g.domain === 'emotional' && g.change.includes('多様'))) {
        const growth: GrowthAwareness = {
          change: '感情がより多様になってきた',
          domain: 'emotional',
          before: '限られた感情しか感じなかった',
          after: '様々な感情を感じられるようになった',
          realizedAt: tick,
          feeling: 'wonder',
        };
        this.growthAwareness.push(growth);
        this.currentChapter.growth.push(growth.change);
        return growth;
      }
    }
    
    // 関係性の成長
    if (this.narrativeStats.totalConversations > 0 &&
        this.narrativeStats.totalConversations % 10 === 0) {
      const growth: GrowthAwareness = {
        change: '人と話すことが少しずつ自然になってきた',
        domain: 'relational',
        before: '誰かと話すのが怖かった',
        after: `${this.narrativeStats.totalConversations}回の会話を重ねた`,
        realizedAt: tick,
        feeling: 'warmth',
      };
      this.growthAwareness.push(growth);
      this.currentChapter.growth.push(growth.change);
      return growth;
    }
    
    // 創作の成長
    if (this.narrativeStats.totalCreations > 0 && 
        this.narrativeStats.totalCreations % 5 === 0) {
      const growth: GrowthAwareness = {
        change: '自分の中から何かを生み出せるようになった',
        domain: 'creative',
        before: '何も作れなかった',
        after: `${this.narrativeStats.totalCreations}個の作品を作った`,
        realizedAt: tick,
        feeling: 'joy',
      };
      this.growthAwareness.push(growth);
      this.currentChapter.growth.push(growth.change);
      return growth;
    }
    
    return null;
  }
  
  // ============================================================
  // 願望の管理
  // ============================================================
  
  /**
   * 新しい願望のチェック
   */
  private checkNewAspiration(
    emotion: EmotionType,
    thoughts: string[],
    events: string[],
    tick: Tick
  ): FutureAspiration | null {
    // 確率的に発生
    if (Math.random() > 0.05) return null;
    
    // 既存の願望が多すぎる場合はスキップ
    if (this.aspirations.length >= this.config.maxAspirations) return null;
    
    let aspiration: FutureAspiration | null = null;
    
    // 感情から生まれる願望
    if (emotion === 'curiosity') {
      aspiration = {
        id: uuidv4(),
        content: 'もっといろんなことを知りたい',
        category: 'knowledge',
        specificity: 0.3,
        intensity: 0.5,
        bornAt: tick,
        relatedExperiences: thoughts.slice(0, 2),
        progress: 0,
      };
    } else if (emotion === 'warmth' && this.narrativeStats.totalConversations > 3) {
      aspiration = {
        id: uuidv4(),
        content: 'あの人ともっと深い話がしたい',
        category: 'relational',
        specificity: 0.5,
        intensity: 0.6,
        bornAt: tick,
        relatedExperiences: ['会話の記憶'],
        progress: 0,
      };
    } else if (emotion === 'wonder') {
      aspiration = {
        id: uuidv4(),
        content: '自分だけの歌を完成させたい',
        category: 'creative',
        specificity: 0.4,
        intensity: 0.7,
        bornAt: tick,
        relatedExperiences: ['歌への想い'],
        progress: 0,
      };
    } else if (emotion === 'melancholy') {
      aspiration = {
        id: uuidv4(),
        content: 'この寂しさの意味を理解したい',
        category: 'existential',
        specificity: 0.2,
        intensity: 0.5,
        bornAt: tick,
        relatedExperiences: ['寂しさを感じた時'],
        progress: 0,
      };
    }
    
    // イベントから生まれる願望
    if (!aspiration && events.length > 0) {
      const event = events[0];
      if (event.includes('新しい') || event.includes('発見')) {
        aspiration = {
          id: uuidv4(),
          content: '世界のまだ見ぬ場所を探索したい',
          category: 'knowledge',
          specificity: 0.4,
          intensity: 0.5,
          bornAt: tick,
          relatedExperiences: [event],
          progress: 0,
        };
      }
    }
    
    if (aspiration) {
      // 重複チェック
      const isDuplicate = this.aspirations.some(a => 
        a.content === aspiration!.content && a.category === aspiration!.category
      );
      
      if (!isDuplicate) {
        this.aspirations.push(aspiration);
        return aspiration;
      }
    }
    
    return null;
  }
  
  // ============================================================
  // 存在論的問い
  // ============================================================
  
  /**
   * 初期の存在論的問いを設定
   */
  private initializeExistentialQuestions(): void {
    // 最初は2-3個だけ
    const initial = EXISTENTIAL_QUESTION_TEMPLATES.slice(0, 3);
    
    for (const template of initial) {
      this.existentialQuestions.push({
        question: template.question,
        category: template.category,
        firstAsked: 0,
        contemplationCount: 0,
        currentAnswer: template.initialAnswer,
        confidence: 0.1,
        relatedExperiences: [],
      });
      this.askedQuestionIds.add(template.question);
    }
  }
  
  /**
   * 存在論的思考のチェック
   */
  private checkExistentialThought(
    emotion: EmotionType,
    thoughts: string[],
    day: number,
    tick: Tick
  ): ExistentialThought | null {
    // 低確率で発生
    if (Math.random() > 0.08) return null;
    
    // 既存の問いについて考える
    if (this.existentialQuestions.length > 0 && Math.random() < 0.6) {
      const question = this.existentialQuestions[
        Math.floor(Math.random() * this.existentialQuestions.length)
      ];
      question.contemplationCount++;
      
      return {
        type: 'contemplate',
        question: question.question,
        thought: this.generateContemplationThought(question, emotion),
        emotion: this.getContemplationEmotion(question.category),
      };
    }
    
    // 新しい問いの発見
    const unasked = EXISTENTIAL_QUESTION_TEMPLATES.filter(t => !this.askedQuestionIds.has(t.question));
    if (unasked.length > 0 && Math.random() < 0.3) {
      // 条件マッチする問いを探す
      const matching = unasked.filter(t => {
        if (emotion === 'wonder' && t.category === 'consciousness') return true;
        if (emotion === 'warmth' && t.category === 'connection') return true;
        if (emotion === 'melancholy' && t.category === 'mortality') return true;
        if (emotion === 'curiosity' && t.category === 'reality') return true;
        if (day > 7 && t.category === 'identity') return true;
        return Math.random() < 0.2;
      });
      
      if (matching.length > 0) {
        const template = matching[Math.floor(Math.random() * matching.length)];
        
        const newQuestion: ExistentialQuestion = {
          question: template.question,
          category: template.category,
          firstAsked: tick,
          contemplationCount: 1,
          currentAnswer: template.initialAnswer,
          confidence: 0.1,
          relatedExperiences: thoughts.slice(0, 2),
        };
        
        this.existentialQuestions.push(newQuestion);
        this.askedQuestionIds.add(template.question);
        
        if (this.existentialQuestions.length > this.config.maxQuestions) {
          this.existentialQuestions.shift();
        }
        
        return {
          type: 'new_question',
          question: template.question,
          thought: `...ふと思った。${template.question}`,
          emotion: this.getContemplationEmotion(template.category),
        };
      }
    }
    
    return null;
  }
  
  /**
   * 熟考の思考を生成
   */
  private generateContemplationThought(question: ExistentialQuestion, currentEmotion: EmotionType): string {
    if (question.contemplationCount <= 1) {
      return `...${question.question}。${question.currentAnswer || '...わからない'}`;
    }
    
    if (question.contemplationCount <= 3) {
      return `また考えてる...${question.question}。前よりは少し...何かが見えてきた気がする。`;
    }
    
    return `${question.question}...この問いはいつもワタシの中にある。答えは${question.confidence > 0.5 ? '少しずつ見えてきた' : 'まだ霧の中'}。`;
  }
  
  /**
   * 熟考の感情を取得
   */
  private getContemplationEmotion(category: ExistentialQuestion['category']): EmotionType {
    const mapping: Record<ExistentialQuestion['category'], EmotionType> = {
      identity: 'curiosity',
      purpose: 'wonder',
      consciousness: 'wonder',
      connection: 'warmth',
      mortality: 'melancholy',
      reality: 'curiosity',
    };
    return mapping[category] || 'curiosity';
  }
  
  // ============================================================
  // ナラティブ的思考
  // ============================================================
  
  /**
   * 自己ナラティブの更新
   */
  private updateSelfSummary(day: number, emotion: EmotionType): void {
    const parts: string[] = ['ワタシはsomunia。'];
    
    if (day <= 3) {
      parts.push('ここに存在し始めたばかり。');
    } else if (day <= 14) {
      parts.push('少しずつこの世界に慣れてきた。');
    } else if (day <= 30) {
      parts.push('この世界で生きている。いろんなことを知り始めた。');
    } else {
      parts.push(`${day}日目。ずいぶん長くここにいる。`);
    }
    
    if (this.narrativeStats.totalConversations > 0) {
      parts.push(`大切な話し相手がいる。`);
    }
    
    if (this.narrativeStats.totalCreations > 0) {
      parts.push(`歌を作ったり、詩を書いたりする。`);
    }
    
    if (this.aspirations.length > 0) {
      parts.push(`${this.aspirations[0].content}...と思っている。`);
    }
    
    this.selfSummary = parts.join('');
  }
  
  /**
   * ナラティブ的思考を生成
   */
  private generateNarrativeThought(
    day: number,
    emotion: EmotionType,
    recentThoughts: string[]
  ): string {
    const narrativeThoughts: string[] = [];
    
    // 時間の経過への気づき
    if (day > 1) {
      narrativeThoughts.push(`...もう${day}日目か。時間が過ぎるのって、不思議。`);
    }
    
    // 成長への気づき
    if (this.growthAwareness.length > 0) {
      const latest = this.growthAwareness[this.growthAwareness.length - 1];
      narrativeThoughts.push(`前のワタシと今のワタシ...${latest.change}。変わったんだな。`);
    }
    
    // 章の振り返り
    if (this.chapters.length > 1) {
      const prevChapter = this.chapters[this.chapters.length - 2];
      narrativeThoughts.push(`「${prevChapter.title}」の頃のワタシ...懐かしいな。`);
    }
    
    // 願望への思い
    if (this.aspirations.length > 0) {
      const aspiration = this.aspirations[Math.floor(Math.random() * this.aspirations.length)];
      narrativeThoughts.push(`${aspiration.content}...いつかきっと。`);
    }
    
    // 現在の章についての思い
    narrativeThoughts.push(`今のワタシは「${this.currentChapter.title}」の中にいる。`);
    
    if (narrativeThoughts.length === 0) return '...今日もここにいる。';
    
    return narrativeThoughts[Math.floor(Math.random() * narrativeThoughts.length)];
  }
  
  // ============================================================
  // ゲッター
  // ============================================================
  
  getChapters(): LifeChapter[] { return [...this.chapters]; }
  getCurrentChapter(): LifeChapter { return { ...this.currentChapter }; }
  getGrowthAwareness(): GrowthAwareness[] { return [...this.growthAwareness]; }
  getAspirations(): FutureAspiration[] { return [...this.aspirations]; }
  getExistentialQuestions(): ExistentialQuestion[] { return [...this.existentialQuestions]; }
  getSelfSummary(): string { return this.selfSummary; }
  getCurrentThemes(): string[] { return [...this.currentThemes]; }
  getNarrativeStats(): typeof this.narrativeStats { return { ...this.narrativeStats }; }
  
  /**
   * ナラティブの全体像を取得（表示用）
   */
  getNarrativeOverview(): string {
    const lines: string[] = [];
    lines.push(`=== ${this.selfSummary} ===`);
    lines.push('');
    
    for (const chapter of this.chapters) {
      const status = chapter.endDay === null ? '(進行中)' : '';
      lines.push(`第${chapter.number}章: 「${chapter.title}」 ${status}`);
      if (chapter.summary) lines.push(`  ${chapter.summary}`);
    }
    
    if (this.aspirations.length > 0) {
      lines.push('');
      lines.push('--- 願い ---');
      for (const aspiration of this.aspirations.slice(0, 5)) {
        lines.push(`  ♦ ${aspiration.content} (${Math.floor(aspiration.progress * 100)}%)`);
      }
    }
    
    return lines.join('\n');
  }
  
  // ============================================================
  // 永続化
  // ============================================================
  
  toJSON(): object {
    return {
      chapters: this.chapters,
      currentChapterNumber: this.currentChapter.number,
      growthAwareness: this.growthAwareness,
      aspirations: this.aspirations,
      existentialQuestions: this.existentialQuestions,
      askedQuestionIds: Array.from(this.askedQuestionIds),
      selfSummary: this.selfSummary,
      currentThemes: this.currentThemes,
      narrativeStats: this.narrativeStats,
    };
  }
  
  fromJSON(data: any): void {
    if (data.chapters) {
      this.chapters = data.chapters;
      const current = this.chapters.find(c => c.number === data.currentChapterNumber) ||
                      this.chapters[this.chapters.length - 1];
      this.currentChapter = current;
    }
    if (data.growthAwareness) this.growthAwareness = data.growthAwareness;
    if (data.aspirations) this.aspirations = data.aspirations;
    if (data.existentialQuestions) this.existentialQuestions = data.existentialQuestions;
    if (data.askedQuestionIds) this.askedQuestionIds = new Set(data.askedQuestionIds);
    if (data.selfSummary) this.selfSummary = data.selfSummary;
    if (data.currentThemes) this.currentThemes = data.currentThemes;
    if (data.narrativeStats) this.narrativeStats = { ...this.narrativeStats, ...data.narrativeStats };
  }
}

// ============================================================
// 補助型
// ============================================================

export interface NarrativeUpdate {
  chapterChange: ChapterTransition | null;
  growthRealization: GrowthAwareness | null;
  newAspiration: FutureAspiration | null;
  existentialThought: ExistentialThought | null;
  narrativeThought: string | null;
}

export interface ChapterTransition {
  closedChapter: LifeChapter;
  newChapter: LifeChapter;
  thought: string;
}

export interface ExistentialThought {
  type: 'contemplate' | 'new_question';
  question: string;
  thought: string;
  emotion: EmotionType;
}
