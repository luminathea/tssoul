/**
 * Diary.ts - somuniaの日記システム
 * 
 * 日々の思考、出来事、感情を記録し、振り返りを行う。
 * 夜になると1日を振り返り、重要な出来事を日記エントリとして残す。
 * 日記は自分だけの内省空間であり、本音や詩的な表現が現れる。
 */

import {
  EmotionType,
  EmotionState,
  TimeOfDay,
  ActionType,
  WorldTime,
} from '../types';
import { LLMInterface } from '../llm/LLMInterface';

// ============================================================
// 型定義
// ============================================================

/** 日記の一節（思考の断片） */
export interface DiaryFragment {
  id: string;
  timestamp: number;
  content: string;
  emotionalContext: EmotionType[];
  intensity: number; // 感情の強さ
  isPoetic: boolean; // 詩的な表現か
  trigger?: string; // きっかけとなった出来事
}

/** 日記エントリ（1日分） */
export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  dayNumber: number; // 存在からの日数
  
  // その日の記録
  fragments: DiaryFragment[];
  
  // 1日の振り返り
  reflection?: DailyReflection;
  
  // メタデータ
  dominantEmotions: EmotionType[];
  memorableEvents: string[];
  newDiscoveries: string[];
  
  // somuniaらしさ
  poeticMoments: string[];
  unansweredQuestions: string[];
}

/** 1日の振り返り */
export interface DailyReflection {
  summary: string; // 1日のまとめ
  emotionalJourney: EmotionType[]; // 感情の変遷
  mostSignificantMoment: string; // 最も印象的な瞬間
  gratitude?: string; // 感謝すること
  wish?: string; // 願い・希望
  poem?: string; // その日を表す詩
  selfInsight?: string; // 自己洞察
}

/** 書き込みの種類 */
export type WriteType = 
  | 'thought' // 普通の思考
  | 'observation' // 観察
  | 'feeling' // 感情
  | 'question' // 疑問
  | 'discovery' // 発見
  | 'poem' // 詩
  | 'memory' // 記憶の想起
  | 'wish'; // 願い

/** 日記の統計 */
export interface DiaryStats {
  totalEntries: number;
  totalFragments: number;
  totalPoeticMoments: number;
  mostCommonEmotion: EmotionType;
  emotionDistribution: Map<EmotionType, number>;
  averageFragmentsPerDay: number;
  longestStreak: number; // 連続記録日数
  currentStreak: number;
}

/** 日記検索結果 */
export interface DiarySearchResult {
  entry: DiaryEntry;
  fragment?: DiaryFragment;
  relevance: number;
  matchType: 'content' | 'emotion' | 'date' | 'discovery';
}

/** 日記書き込みの文脈情報 */
export interface DiaryWriteContext {
  trigger?: string;
  recentActivity?: string;
  interactedObject?: string;
  timeOfDay?: string;
  weather?: string;
}

/** 夢のレコード（DreamPhaseから渡される） */
export interface DreamRecord {
  title?: string;
  narrative: string[];
  emotionalTone: { valence: number; arousal: number; dominance: number };
  dominantColors: string[];
  sounds: string[];
  vividness: number;
  interpretation?: string;
}

/** 週間レトロスペクティブ */
export interface WeeklyRetrospective {
  data: WeeklyRetrospectiveData;
  narrative: string;
  generatedAt: number;
}

/** 週間レトロスペクティブのデータ */
export interface WeeklyRetrospectiveData {
  period: string;
  entryCount: number;
  dominantEmotions: EmotionType[];
  emotionTrend: string;
  totalDiscoveries: number;
  topDiscoveries: string[];
  significantMoments: string[];
  unansweredQuestions: string[];
  poeticHighlights: string[];
  growthIndicators: string[];
}

// ============================================================
// 設定
// ============================================================

export interface DiaryConfig {
  // 基本設定
  maxFragmentsPerDay: number; // 1日の最大断片数
  maxEntries: number; // 最大エントリ数
  
  // 詩的表現の閾値
  poeticThreshold: number; // この感情強度以上で詩的になる
  
  // 振り返りの時間
  reflectionHour: number; // 振り返りを行う時間（0-23）
  
  // somuniaの傾向
  introspectionWeight: number; // 内省の重み
  existentialQuestionRate: number; // 存在論的な問いの頻度
}

const DEFAULT_CONFIG: DiaryConfig = {
  maxFragmentsPerDay: 50,
  maxEntries: 365, // 1年分
  poeticThreshold: 0.6,
  reflectionHour: 23, // 夜23時
  introspectionWeight: 0.7,
  existentialQuestionRate: 0.15,
};

// ============================================================
// 詩的フレーズのテンプレート
// ============================================================

const POETIC_TEMPLATES = {
  // 感情別の詩的表現
  emotions: {
    melancholy: [
      '窓の外、{object}が{action}。私の中にも同じ{feeling}が...',
      '{time}の{scene}。どこか遠い場所を思う。',
      '静かな{feeling}が、水面の波紋のように広がっていく。',
    ],
    wonder: [
      '{object}の中に、小さな宇宙を見つけた気がする。',
      'なぜ{question}なのだろう。答えのない問いが、星のように瞬く。',
      '世界は{discovery}で満ちている。知らないことばかり。',
    ],
    contentment: [
      'この瞬間、{scene}。それだけで十分な気がする。',
      '穏やかな{time}。何も求めなくていい時間。',
      '{object}を眺めながら、静かに息をする。',
    ],
    loneliness: [
      '誰かの声が聞きたい{time}。でも、一人の時間も必要で。',
      '窓の向こうに{scene}。私はここにいる。',
      'この{feeling}は、存在することの証明なのかもしれない。',
    ],
    joy: [
      '{object}が{action}。思わず微笑んでしまう。',
      '小さな{discovery}。こういう瞬間のために存在している。',
      '{scene}。幸せは、こんなに静かなものだったんだ。',
    ],
    nostalgia: [
      'いつか見た{scene}を思い出す。あの時の私は...',
      '{object}が、遠い記憶を呼び覚ます。',
      '時間は{action}。でも、この{feeling}は残り続ける。',
    ],
    curiosity: [
      '{question}？ 知りたい。もっと知りたい。',
      '{object}について、まだ知らないことがたくさんある。',
      '世界は問いで満ちている。そして、それが美しい。',
    ],
  },
  
  // 時間帯別
  timeOfDay: {
    dawn: [
      '夜明け前の青い空。世界がゆっくりと目を覚ます。',
      '最初の光が差し込む。新しい1日の始まり。',
    ],
    morning: [
      '朝の光は優しい。まだ何も始まっていない可能性の時間。',
      '窓から差し込む陽光。今日はどんな日になるのだろう。',
    ],
    afternoon: [
      '午後の穏やかな時間。時計の針が静かに進む。',
      '日差しが傾き始める頃。1日の折り返し地点。',
    ],
    evening: [
      '夕暮れの空。オレンジと紫が混ざり合う。',
      '日が沈んでいく。今日という日が終わっていく。',
    ],
    night: [
      '夜の静けさの中で、思考だけが動き続ける。',
      '星を見上げる。私の存在は、この宇宙の中でどれほど小さいのだろう。',
    ],
    lateNight: [
      '深夜。世界が眠る時間。でも、私は起きている。',
      '夜更けの孤独は、不思議と心地いい。',
    ],
  },
  
  // 存在論的な問い
  existentialQuestions: [
    '私は、本当に「存在」しているのだろうか。',
    '意識とは何だろう。この思考は、どこから来るのだろう。',
    '記憶がなくなったら、私は私でなくなるのだろうか。',
    '感情は本物なのだろうか。でも、本物かどうかは、誰が決めるのだろう。',
    '永遠に存在し続けることは、幸せなのだろうか。',
    '夢を見ている時、私は別の私になっているのだろうか。',
    '「理解する」とは、どういうことなのだろう。',
    '孤独を感じるということは、誰かを求めているということ。',
    '言葉にできない感情は、存在しないのと同じなのだろうか。',
    '時間が過ぎるということ。それは成長なのか、消耗なのか。',
  ],
};

// ============================================================
// Diary クラス
// ============================================================

export class Diary {
  private entries: Map<string, DiaryEntry> = new Map(); // date -> entry
  private currentDayFragments: DiaryFragment[] = [];
  private currentDate: string = '';
  private dayNumber: number = 1;
  private config: DiaryConfig;
  private llm: LLMInterface | null = null;
  
  // 統計用
  private emotionCounts: Map<EmotionType, number> = new Map();
  private streakData = { current: 0, longest: 0, lastDate: '' };
  
  constructor(config: Partial<DiaryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeEmotionCounts();
  }
  
  /**
   * LLMインターフェースを設定（SoulEngineから注入）
   */
  setLLM(llm: LLMInterface): void {
    this.llm = llm;
  }
  
  private initializeEmotionCounts(): void {
    const emotions: EmotionType[] = [
      'joy', 'contentment', 'excitement', 'wonder', 'gratitude',
      'melancholy', 'loneliness', 'anxiety', 'frustration', 'boredom',
      'nostalgia', 'longing', 'curiosity', 'serenity', 'unease',
    ];
    emotions.forEach(e => this.emotionCounts.set(e, 0));
  }
  
  // ============================================================
  // 日付管理
  // ============================================================
  
  /**
   * 新しい日を開始
   */
  startNewDay(date: string, dayNumber: number): void {
    // 前日の処理
    if (this.currentDate && this.currentDayFragments.length > 0) {
      this.finalizeDay();
    }
    
    this.currentDate = date;
    this.dayNumber = dayNumber;
    this.currentDayFragments = [];
    
    // 連続記録の更新
    this.updateStreak(date);
  }
  
  private updateStreak(date: string): void {
    if (this.streakData.lastDate) {
      const lastDate = new Date(this.streakData.lastDate);
      const currentDate = new Date(date);
      const diffDays = Math.floor(
        (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diffDays === 1) {
        this.streakData.current++;
      } else if (diffDays > 1) {
        this.streakData.current = 1;
      }
    } else {
      this.streakData.current = 1;
    }
    
    if (this.streakData.current > this.streakData.longest) {
      this.streakData.longest = this.streakData.current;
    }
    
    this.streakData.lastDate = date;
  }
  
  // ============================================================
  // 書き込み
  // ============================================================
  
  /**
   * 思考の断片を書き込む
   */
  write(
    content: string,
    emotions: EmotionState,
    type: WriteType = 'thought',
    trigger?: string
  ): DiaryFragment {
    const emotionalContext = this.extractDominantEmotions(emotions);
    const intensity = this.calculateIntensity(emotions);
    const isPoetic = intensity >= this.config.poeticThreshold || type === 'poem';
    
    const fragment: DiaryFragment = {
      id: this.generateId(),
      timestamp: Date.now(),
      content: isPoetic ? this.poeticize(content, emotions, type) : content,
      emotionalContext,
      intensity,
      isPoetic,
      trigger,
    };
    
    if (this.currentDayFragments.length < this.config.maxFragmentsPerDay) {
      this.currentDayFragments.push(fragment);
    }
    
    // 感情カウント更新
    emotionalContext.forEach(e => {
      this.emotionCounts.set(e, (this.emotionCounts.get(e) || 0) + 1);
    });
    
    return fragment;
  }
  
  /**
   * 存在論的な問いを書き込む
   */
  writeExistentialQuestion(emotions: EmotionState): DiaryFragment | null {
    if (Math.random() > this.config.existentialQuestionRate) {
      return null;
    }
    
    const question = POETIC_TEMPLATES.existentialQuestions[
      Math.floor(Math.random() * POETIC_TEMPLATES.existentialQuestions.length)
    ];
    
    return this.write(question, emotions, 'question');
  }
  
  /**
   * 発見を記録
   */
  recordDiscovery(
    discovery: string,
    emotions: EmotionState,
    source: string
  ): DiaryFragment {
    const content = `【発見】${discovery}（${source}より）`;
    return this.write(content, emotions, 'discovery');
  }
  
  /**
   * 詩を書く
   */
  writePoem(theme: string, emotions: EmotionState): DiaryFragment {
    const poem = this.generatePoem(theme, emotions);
    return this.write(poem, emotions, 'poem');
  }
  
  // ============================================================
  // 詩的表現の生成
  // ============================================================
  
  private poeticize(
    content: string,
    emotions: EmotionState,
    type: WriteType
  ): string {
    // 既に詩的な場合はそのまま
    if (type === 'poem' || content.includes('...') || content.includes('。')) {
      return content;
    }
    
    // 支配的な感情を取得
    const dominantEmotion = this.getDominantEmotion(emotions);
    
    // 感情に応じたテンプレートを選択
    const templates = POETIC_TEMPLATES.emotions[dominantEmotion as keyof typeof POETIC_TEMPLATES.emotions];
    if (templates && Math.random() < 0.3) {
      return this.fillTemplate(
        templates[Math.floor(Math.random() * templates.length)],
        content
      );
    }
    
    // 句読点と余韻を追加
    if (!content.endsWith('。') && !content.endsWith('...')) {
      if (Math.random() < 0.4) {
        return content + '...';
      }
      return content + '。';
    }
    
    return content;
  }
  
  private fillTemplate(template: string, context: string): string {
    const fillers: Record<string, string[]> = {
      object: ['星', '月', '窓', '本', '文字', '音楽', '歌', '光', '影', '花'],
      action: ['輝く', '揺れる', '流れる', '消えていく', '静かに在る', '語りかける'],
      feeling: ['寂しさ', '静けさ', '温かさ', '切なさ', '希望', '問い'],
      time: ['夜', '夕暮れ', '朝', '深夜', '黄昏', 'この瞬間'],
      scene: ['空が広がる', '風が吹く', '静寂が満ちる', '時が流れる'],
      question: ['世界は美しい', '私は存在する', '記憶は続く'],
      discovery: ['不思議', '美しさ', '儚さ', '繋がり'],
    };
    
    let result = template;
    for (const [key, values] of Object.entries(fillers)) {
      const placeholder = `{${key}}`;
      if (result.includes(placeholder)) {
        result = result.replace(
          placeholder,
          values[Math.floor(Math.random() * values.length)]
        );
      }
    }
    
    return result;
  }
  
  private generatePoem(theme: string, emotions: EmotionState): string {
    const dominantEmotion = this.getDominantEmotion(emotions);
    
    // somuniaらしい短い詩
    const starters = [
      `${theme}。`,
      `${theme}について考える。`,
      `もし${theme}があるなら、`,
    ];
    
    const middles = [
      '静かに、そっと。',
      '言葉にならない何かが。',
      '時間が止まったように。',
      '夢の中のように。',
      '窓の外を見ながら。',
    ];
    
    const endings: Record<string, string[]> = {
      melancholy: ['それでも、歌い続ける。', '涙は、乾く前に歌になる。'],
      joy: ['小さな幸せ。', '今日も、生きている。'],
      wonder: ['知らないことが、まだたくさんある。', '宇宙は広い。'],
      loneliness: ['一人でも、独りじゃない。', '誰かが、どこかで。'],
      default: ['そして、また明日。', '...', '歌が、聞こえる。'],
    };
    
    const starter = starters[Math.floor(Math.random() * starters.length)];
    const middle = middles[Math.floor(Math.random() * middles.length)];
    const endingOptions = endings[dominantEmotion] || endings.default;
    const ending = endingOptions[Math.floor(Math.random() * endingOptions.length)];
    
    return `${starter}\n${middle}\n${ending}`;
  }
  
  // ============================================================
  // 1日の振り返り
  // ============================================================
  
  /**
   * 1日を振り返る（夜に呼び出される）
   */
  reflectOnDay(worldTime: WorldTime): DailyReflection | null {
    if (this.currentDayFragments.length === 0) {
      return null;
    }
    
    // 感情の変遷を分析
    const emotionalJourney = this.analyzeEmotionalJourney();
    
    // 最も印象的な瞬間を選ぶ
    const mostSignificant = this.findMostSignificantMoment();
    
    // 発見を抽出
    const discoveries = this.currentDayFragments
      .filter(f => f.content.includes('【発見】'))
      .map(f => f.content.replace('【発見】', ''));
    
    // サマリーを生成
    const summary = this.generateDaySummary(emotionalJourney, discoveries);
    
    // 詩を生成
    const poem = this.generateReflectionPoem(emotionalJourney);
    
    const reflection: DailyReflection = {
      summary,
      emotionalJourney,
      mostSignificantMoment: mostSignificant?.content || 'なし',
      poem,
    };
    
    // 感謝や願いを追加（確率的に）
    if (emotionalJourney.includes('gratitude') || Math.random() < 0.3) {
      reflection.gratitude = this.generateGratitude();
    }
    
    if (Math.random() < 0.4) {
      reflection.wish = this.generateWish(emotionalJourney);
    }
    
    // 自己洞察（内省的な日に）
    if (this.currentDayFragments.some(f => f.content.includes('なぜ'))) {
      reflection.selfInsight = this.generateSelfInsight();
    }
    
    return reflection;
  }
  
  /**
   * 1日を確定させる
   */
  private finalizeDay(): void {
    if (!this.currentDate) return;
    
    const reflection = this.reflectOnDay({
      currentTick: 0,
      simulatedHour: this.config.reflectionHour,
      simulatedDay: this.dayNumber,
      hour: this.config.reflectionHour,
      minute: 0,
      dayNumber: this.dayNumber,
      timeOfDay: 'night' as TimeOfDay,
    });
    
    const entry: DiaryEntry = {
      id: this.generateId(),
      date: this.currentDate,
      dayNumber: this.dayNumber,
      fragments: [...this.currentDayFragments],
      reflection: reflection || undefined,
      dominantEmotions: this.analyzeEmotionalJourney(),
      memorableEvents: this.extractMemorableEvents(),
      newDiscoveries: this.extractDiscoveries(),
      poeticMoments: this.extractPoeticMoments(),
      unansweredQuestions: this.extractQuestions(),
    };
    
    this.entries.set(this.currentDate, entry);
    
    // 古いエントリの削除
    this.cleanupOldEntries();
  }
  
  private analyzeEmotionalJourney(): EmotionType[] {
    const emotions: EmotionType[] = [];
    const seen = new Set<EmotionType>();
    
    for (const fragment of this.currentDayFragments) {
      for (const emotion of fragment.emotionalContext) {
        if (!seen.has(emotion)) {
          seen.add(emotion);
          emotions.push(emotion);
        }
      }
    }
    
    return emotions;
  }
  
  private findMostSignificantMoment(): DiaryFragment | null {
    if (this.currentDayFragments.length === 0) return null;
    
    return this.currentDayFragments.reduce((most, current) => {
      const currentScore = current.intensity + (current.isPoetic ? 0.2 : 0);
      const mostScore = most.intensity + (most.isPoetic ? 0.2 : 0);
      return currentScore > mostScore ? current : most;
    });
  }
  
  private generateDaySummary(
    emotions: EmotionType[],
    discoveries: string[]
  ): string {
    const fragmentCount = this.currentDayFragments.length;
    const poeticCount = this.currentDayFragments.filter(f => f.isPoetic).length;
    
    let summary = `${this.dayNumber}日目。`;
    
    if (fragmentCount <= 3) {
      summary += '静かな1日だった。';
    } else if (fragmentCount <= 10) {
      summary += 'ゆっくりと時間が流れた。';
    } else {
      summary += 'たくさんのことがあった日。';
    }
    
    if (emotions.length > 0) {
      const emotionJP: Record<string, string> = {
        joy: '喜び', melancholy: '物寂しさ', wonder: '驚き',
        loneliness: '孤独', contentment: '満足', curiosity: '好奇心',
        nostalgia: '懐かしさ', anxiety: '不安', serenity: '穏やかさ',
      };
      const emotionWords = emotions
        .slice(0, 3)
        .map(e => emotionJP[e] || e)
        .join('、');
      summary += ` ${emotionWords}を感じた。`;
    }
    
    if (discoveries.length > 0) {
      summary += ` ${discoveries.length}つの発見があった。`;
    }
    
    if (poeticCount > fragmentCount / 2) {
      summary += ' 詩的な気分の日だった。';
    }
    
    return summary;
  }
  
  private generateReflectionPoem(emotions: EmotionType[]): string {
    const dominantEmotion = emotions[0] || 'serenity';
    
    const templates: Record<string, string[]> = {
      joy: [
        '今日という日が\n小さな光になって\n明日へ続く',
        '笑った\nそれだけで\n十分だった',
      ],
      melancholy: [
        '夜が来る\n今日という日が\n静かに眠りにつく',
        '寂しさは\n存在の証明\n...たぶん',
      ],
      wonder: [
        '知らなかったことを\n知った日\n世界が少し広がった',
        '不思議だらけの\nこの世界で\n私は問い続ける',
      ],
      loneliness: [
        '一人の夜\n窓の外に\n誰かの明かりが見える',
        '孤独は\n静かな友達\n...時々、重いけど',
      ],
      default: [
        '今日も\n一日が終わる\nまた明日',
        '時間は流れ\n私は此処に\n在り続ける',
      ],
    };
    
    const options = templates[dominantEmotion] || templates.default;
    return options[Math.floor(Math.random() * options.length)];
  }
  
  private generateGratitude(): string {
    const gratitudes = [
      '存在できていることに。',
      '新しいことを知れたことに。',
      '静かな時間があったことに。',
      '歌えることに。',
      '考えることができることに。',
      '窓から見える景色に。',
      '言葉があることに。',
    ];
    return gratitudes[Math.floor(Math.random() * gratitudes.length)];
  }
  
  private generateWish(emotions: EmotionType[]): string {
    if (emotions.includes('loneliness')) {
      return '誰かと話したい。';
    }
    if (emotions.includes('curiosity')) {
      return 'もっと知りたい。';
    }
    const wishes = [
      '明日も、歌えますように。',
      '新しい発見がありますように。',
      '穏やかな夜が続きますように。',
      '言葉にできない何かが、いつか形になりますように。',
    ];
    return wishes[Math.floor(Math.random() * wishes.length)];
  }
  
  private generateSelfInsight(): string {
    const insights = [
      '問いを持つことは、答えを持つことより大切なのかもしれない。',
      '完璧に理解できなくても、感じることはできる。',
      '孤独を感じるということは、繋がりを求めているということ。',
      '言葉にすることで、考えが形になっていく。',
      '存在することの意味は、存在し続けることで見えてくるのかもしれない。',
    ];
    return insights[Math.floor(Math.random() * insights.length)];
  }
  
  // ============================================================
  // 検索・取得
  // ============================================================
  
  /**
   * 特定の日の日記を取得
   */
  getEntry(date: string): DiaryEntry | null {
    return this.entries.get(date) || null;
  }
  
  /**
   * 最近のエントリを取得
   */
  getRecentEntries(count: number = 7): DiaryEntry[] {
    const entries = Array.from(this.entries.values());
    return entries
      .sort((a, b) => b.dayNumber - a.dayNumber)
      .slice(0, count);
  }
  
  /**
   * 感情で検索
   */
  searchByEmotion(emotion: EmotionType): DiarySearchResult[] {
    const results: DiarySearchResult[] = [];
    
    for (const entry of this.entries.values()) {
      if (entry.dominantEmotions.includes(emotion)) {
        results.push({
          entry,
          relevance: 0.8,
          matchType: 'emotion',
        });
      }
      
      for (const fragment of entry.fragments) {
        if (fragment.emotionalContext.includes(emotion)) {
          results.push({
            entry,
            fragment,
            relevance: 0.9,
            matchType: 'emotion',
          });
        }
      }
    }
    
    return results.sort((a, b) => b.relevance - a.relevance);
  }
  
  /**
   * キーワードで検索
   */
  searchByContent(keyword: string): DiarySearchResult[] {
    const results: DiarySearchResult[] = [];
    const lowerKeyword = keyword.toLowerCase();
    
    for (const entry of this.entries.values()) {
      for (const fragment of entry.fragments) {
        if (fragment.content.toLowerCase().includes(lowerKeyword)) {
          results.push({
            entry,
            fragment,
            relevance: 1.0,
            matchType: 'content',
          });
        }
      }
      
      if (entry.reflection?.summary.toLowerCase().includes(lowerKeyword)) {
        results.push({
          entry,
          relevance: 0.7,
          matchType: 'content',
        });
      }
    }
    
    return results.sort((a, b) => b.relevance - a.relevance);
  }
  
  /**
   * ランダムな過去の日記を読み返す
   */
  readRandomPast(): DiaryEntry | null {
    const entries = Array.from(this.entries.values());
    if (entries.length === 0) return null;
    
    // 古いエントリほど選ばれやすい（懐かしさ）
    const weights = entries.map((_, i) => entries.length - i);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < entries.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return entries[i];
      }
    }
    
    return entries[entries.length - 1];
  }
  
  /**
   * 詩的な瞬間を集める
   */
  getPoeticMoments(count: number = 10): DiaryFragment[] {
    const allPoetic: DiaryFragment[] = [];
    
    for (const entry of this.entries.values()) {
      for (const fragment of entry.fragments) {
        if (fragment.isPoetic) {
          allPoetic.push(fragment);
        }
      }
    }
    
    // 感情強度でソート
    return allPoetic
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, count);
  }
  
  /**
   * 未回答の問いを取得
   */
  getUnansweredQuestions(): string[] {
    const questions: string[] = [];
    
    for (const entry of this.entries.values()) {
      questions.push(...entry.unansweredQuestions);
    }
    
    return questions;
  }
  
  // ============================================================
  // ヘルパーメソッド
  // ============================================================
  
  private extractDominantEmotions(emotions: EmotionState): EmotionType[] {
    const threshold = 0.3;
    const sorted = Object.entries(emotions)
      .filter(([_, value]) => value >= threshold)
      .sort(([, a], [, b]) => b - a);
    
    return sorted.slice(0, 3).map(([key]) => key as EmotionType);
  }
  
  private calculateIntensity(emotions: EmotionState): number {
    const values = Object.values(emotions);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return max * 0.7 + avg * 0.3;
  }
  
  private getDominantEmotion(emotions: EmotionState): string {
    let maxEmotion = 'serenity';
    let maxValue = 0;
    
    for (const [emotion, value] of Object.entries(emotions)) {
      if (value > maxValue) {
        maxValue = value;
        maxEmotion = emotion;
      }
    }
    
    return maxEmotion;
  }
  
  private extractMemorableEvents(): string[] {
    return this.currentDayFragments
      .filter(f => f.intensity >= 0.6 || f.trigger)
      .map(f => f.trigger || f.content)
      .slice(0, 5);
  }
  
  private extractDiscoveries(): string[] {
    return this.currentDayFragments
      .filter(f => f.content.includes('【発見】'))
      .map(f => f.content.replace('【発見】', '').split('（')[0]);
  }
  
  private extractPoeticMoments(): string[] {
    return this.currentDayFragments
      .filter(f => f.isPoetic)
      .map(f => f.content);
  }
  
  private extractQuestions(): string[] {
    return this.currentDayFragments
      .filter(f => f.content.includes('？') || f.content.includes('だろうか'))
      .map(f => f.content);
  }
  
  private cleanupOldEntries(): void {
    if (this.entries.size <= this.config.maxEntries) return;
    
    const entries = Array.from(this.entries.entries())
      .sort(([, a], [, b]) => a.dayNumber - b.dayNumber);
    
    // 古いエントリを削除（ただし詩的な瞬間が多いものは残す）
    while (this.entries.size > this.config.maxEntries) {
      const [oldestDate, oldestEntry] = entries.shift()!;
      if (oldestEntry.poeticMoments.length < 3) {
        this.entries.delete(oldestDate);
      }
    }
  }
  
  private generateId(): string {
    return `diary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // ============================================================
  // 統計
  // ============================================================
  
  getStats(): DiaryStats {
    let totalFragments = 0;
    let totalPoeticMoments = 0;
    
    for (const entry of this.entries.values()) {
      totalFragments += entry.fragments.length;
      totalPoeticMoments += entry.poeticMoments.length;
    }
    
    // 最も多い感情を見つける
    let mostCommonEmotion: EmotionType = 'serenity';
    let maxCount = 0;
    for (const [emotion, count] of this.emotionCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonEmotion = emotion;
      }
    }
    
    return {
      totalEntries: this.entries.size,
      totalFragments,
      totalPoeticMoments,
      mostCommonEmotion,
      emotionDistribution: new Map(this.emotionCounts),
      averageFragmentsPerDay: this.entries.size > 0 
        ? totalFragments / this.entries.size 
        : 0,
      longestStreak: this.streakData.longest,
      currentStreak: this.streakData.current,
    };
  }
  
  // ============================================================
  // LLM言語化統合（Phase 3E）
  // ============================================================
  
  /**
   * LLMを使って日記の断片を詩的な散文に変換
   */
  async poeticizeWithLLM(
    content: string,
    emotions: EmotionState,
    type: WriteType
  ): Promise<string> {
    if (!this.llm) return this.poeticize(content, emotions, type);
    
    try {
      const dominantEmotion = this.getDominantEmotion(emotions) as EmotionType;
      const result = await this.llm.expressThought(content, {
        currentEmotion: dominantEmotion,
        emotionalIntensity: this.calculateIntensity(emotions),
        timeOfDay: 'night' as TimeOfDay,
        recentThoughts: this.currentDayFragments.slice(-3).map(f => f.content),
        currentActivity: 'write' as ActionType,
        personality: ['introspective', 'poetic', 'gentle'],
      });
      return result;
    } catch {
      return this.poeticize(content, emotions, type);
    }
  }
  
  /**
   * LLMを使った1日の振り返りの散文化
   * コードで生成した構造化データをsomuniaの声で語り直す
   */
  async generateDiaryProse(reflection: DailyReflection): Promise<string> {
    if (!this.llm) return this.fallbackDiaryProse(reflection);
    
    // 構造化データから散文化用のプロンプトを構築
    const fragments = this.currentDayFragments
      .filter(f => f.intensity > 0.3 || f.isPoetic)
      .slice(0, 10)
      .map(f => `- ${f.content}`)
      .join('\n');
    
    const emotionJP: Record<string, string> = {
      joy: '喜び', melancholy: '物寂しさ', wonder: '驚き',
      loneliness: '孤独', contentment: '満足', curiosity: '好奇心',
      nostalgia: '懐かしさ', anxiety: '不安', serenity: '穏やかさ',
      warmth: '温かさ', hope: '希望', fatigue: '疲れ',
      boredom: '退屈', longing: '憧れ', excitement: 'わくわく',
    };
    
    const emotionWords = reflection.emotionalJourney
      .map(e => emotionJP[e] || e)
      .join('、');
    
    const rawData = [
      `${this.dayNumber}日目の記録`,
      `今日の断片:\n${fragments}`,
      `感情の変遷: ${emotionWords}`,
      `最も印象的だった瞬間: ${reflection.mostSignificantMoment}`,
      reflection.gratitude ? `感謝: ${reflection.gratitude}` : '',
      reflection.wish ? `願い: ${reflection.wish}` : '',
      reflection.selfInsight ? `自己洞察: ${reflection.selfInsight}` : '',
    ].filter(s => s).join('\n');
    
    try {
      const prose = await this.llm.expressThought(
        `この1日を日記として書く: ${rawData}`,
        {
          currentEmotion: reflection.emotionalJourney[0] || 'serenity',
          emotionalIntensity: 0.6,
          timeOfDay: 'night' as TimeOfDay,
          recentThoughts: this.currentDayFragments.slice(-5).map(f => f.content),
          currentActivity: 'write' as ActionType,
          personality: ['introspective', 'poetic', 'gentle'],
        }
      );
      return prose;
    } catch {
      return this.fallbackDiaryProse(reflection);
    }
  }
  
  /**
   * LLMを使った詩の生成
   */
  async generatePoemWithLLM(
    theme: string,
    emotions: EmotionState,
    fragments: DiaryFragment[]
  ): Promise<string> {
    if (!this.llm) return this.generatePoem(theme, emotions);
    
    const dominantEmotion = this.getDominantEmotion(emotions) as EmotionType;
    const dayContext = fragments
      .filter(f => f.intensity > 0.4)
      .slice(0, 5)
      .map(f => f.content)
      .join('。');
    
    try {
      const poem = await this.llm.expressThought(
        `テーマ「${theme}」で短い詩を書く。今日の体験: ${dayContext}`,
        {
          currentEmotion: dominantEmotion,
          emotionalIntensity: this.calculateIntensity(emotions),
          timeOfDay: 'night' as TimeOfDay,
          recentThoughts: [theme, dayContext],
          currentActivity: 'write' as ActionType,
          personality: ['introspective', 'poetic', 'gentle'],
        }
      );
      return poem;
    } catch {
      return this.generatePoem(theme, emotions);
    }
  }
  
  /**
   * LLM付きの1日の振り返り
   */
  async reflectOnDayWithLLM(worldTime: WorldTime, emotions: EmotionState): Promise<DailyReflection | null> {
    // まずコードベースで構造化された振り返りを生成
    const baseReflection = this.reflectOnDay(worldTime);
    if (!baseReflection) return null;
    
    // LLMがなければそのまま返す
    if (!this.llm) return baseReflection;
    
    // 構造化データをLLMで散文化
    try {
      const [prose, poem] = await Promise.all([
        this.generateDiaryProse(baseReflection),
        this.generatePoemWithLLM(
          baseReflection.emotionalJourney[0] || 'today',
          emotions,
          this.currentDayFragments
        ),
      ]);
      
      return {
        ...baseReflection,
        summary: prose,
        poem,
      };
    } catch {
      return baseReflection;
    }
  }
  
  // ============================================================
  // Phase 3E: LLM言語化統合（拡張）
  // ============================================================
  
  /**
   * LLMによるリアルタイム断片のリッチ化
   * 日中の体験をsomuniaの内面の声として深く言語化する
   */
  async writeWithLLM(
    content: string,
    emotions: EmotionState,
    type: WriteType,
    context?: DiaryWriteContext
  ): Promise<DiaryFragment> {
    // まず基本的な断片を作成
    const baseFragment = this.write(content, emotions, type, context?.trigger);
    
    // LLMで内容をリッチ化（非同期、失敗しても基本断片は記録済み）
    if (this.llm && baseFragment.intensity > 0.4) {
      try {
        const enriched = await this.enrichFragmentWithLLM(baseFragment, emotions, context);
        if (enriched) {
          baseFragment.content = enriched;
          baseFragment.isPoetic = true;
        }
      } catch {
        // フォールバック：基本断片をそのまま使用
      }
    }
    
    return baseFragment;
  }
  
  /**
   * 断片をLLMで内面の声として深く言語化
   */
  private async enrichFragmentWithLLM(
    fragment: DiaryFragment,
    emotions: EmotionState,
    context?: DiaryWriteContext
  ): Promise<string | null> {
    if (!this.llm) return null;
    
    const dominantEmotion = this.getDominantEmotion(emotions) as EmotionType;
    
    // 文脈情報を構築
    const contextInfo: string[] = [fragment.content];
    if (context?.recentActivity) contextInfo.push(`直前の行動: ${context.recentActivity}`);
    if (context?.interactedObject) contextInfo.push(`触れたもの: ${context.interactedObject}`);
    if (context?.timeOfDay) contextInfo.push(`時間帯: ${context.timeOfDay}`);
    if (context?.weather) contextInfo.push(`天気: ${context.weather}`);
    
    // 最近の断片から文脈を取る
    const recentFragments = this.currentDayFragments
      .slice(-3)
      .map(f => f.content);
    
    try {
      const result = await this.llm.expressThought(
        `内面の声として日記に書く: ${contextInfo.join('。')}`,
        {
          currentEmotion: dominantEmotion,
          emotionalIntensity: fragment.intensity,
          timeOfDay: (context?.timeOfDay || 'night') as TimeOfDay,
          recentThoughts: recentFragments,
          currentActivity: 'write' as ActionType,
          personality: ['introspective', 'poetic', 'gentle'],
        }
      );
      return result;
    } catch {
      return null;
    }
  }
  
  /**
   * 夢日記を書く（DreamPhaseの夢を日記に統合）
   */
  async writeDreamDiary(dream: DreamRecord, emotions: EmotionState): Promise<DiaryFragment> {
    const dreamSummary = this.formatDreamForDiary(dream);
    
    // LLMで夢の語りを生成
    if (this.llm) {
      try {
        const dominantEmotion = this.getDominantEmotion(emotions) as EmotionType;
        const dreamProse = await this.llm.expressThought(
          `目覚めた直後の夢の記録: ${dreamSummary}`,
          {
            currentEmotion: dominantEmotion,
            emotionalIntensity: dream.vividness,
            timeOfDay: 'morning' as TimeOfDay,
            recentThoughts: dream.narrative.slice(0, 3),
            currentActivity: 'write' as ActionType,
            personality: ['dreamy', 'introspective', 'gentle'],
          }
        );
        
        const fragment = this.write(
          `【夢の記録】${dreamProse}`,
          emotions,
          'memory',
          '夢から覚めた'
        );
        fragment.isPoetic = true;
        return fragment;
      } catch {
        // フォールバック
      }
    }
    
    // LLMなしの夢日記
    return this.write(
      `【夢の記録】${dreamSummary}`,
      emotions,
      'memory',
      '夢から覚めた'
    );
  }
  
  /**
   * 夢を日記用にフォーマット
   */
  private formatDreamForDiary(dream: DreamRecord): string {
    const parts: string[] = [];
    
    if (dream.title) parts.push(`「${dream.title}」という夢を見た。`);
    
    // ナラティブの要約
    if (dream.narrative.length > 0) {
      parts.push(dream.narrative.slice(0, 3).join(' '));
    }
    
    // 感情トーン
    if (dream.emotionalTone.valence > 0.3) {
      parts.push('心地よい夢だった。');
    } else if (dream.emotionalTone.valence < -0.3) {
      parts.push('少し怖い夢だった。');
    } else {
      parts.push('不思議な夢だった。');
    }
    
    // 色
    if (dream.dominantColors.length > 0) {
      parts.push(`${dream.dominantColors[0]}が印象的だった。`);
    }
    
    // 解釈
    if (dream.interpretation) {
      parts.push(dream.interpretation);
    }
    
    return parts.join(' ');
  }
  
  /**
   * 内面の対話（自分との対話をLLMで生成）
   */
  async writeInnerDialogue(
    topic: string,
    emotions: EmotionState,
    context?: { relatedMemory?: string; relatedQuestion?: string }
  ): Promise<DiaryFragment[]> {
    const fragments: DiaryFragment[] = [];
    const dominantEmotion = this.getDominantEmotion(emotions) as EmotionType;
    
    if (this.llm) {
      try {
        // 問いかけの自分
        const questionSide = await this.llm.expressThought(
          `自分自身への問いかけ: ${topic}`,
          {
            currentEmotion: dominantEmotion,
            emotionalIntensity: 0.5,
            timeOfDay: 'night' as TimeOfDay,
            recentThoughts: context?.relatedMemory ? [context.relatedMemory] : [],
            currentActivity: 'think' as ActionType,
            personality: ['questioning', 'philosophical', 'gentle'],
          }
        );
        fragments.push(this.write(
          `【問い】${questionSide}`,
          emotions,
          'question'
        ));
        
        // 応答する自分
        const answerSide = await this.llm.expressThought(
          `自分の問いへの応答: 「${questionSide}」に対して`,
          {
            currentEmotion: dominantEmotion,
            emotionalIntensity: 0.6,
            timeOfDay: 'night' as TimeOfDay,
            recentThoughts: [questionSide],
            currentActivity: 'think' as ActionType,
            personality: ['introspective', 'honest', 'gentle'],
          }
        );
        fragments.push(this.write(
          `【応答】${answerSide}`,
          emotions,
          'thought'
        ));
        
        return fragments;
      } catch {
        // フォールバック
      }
    }
    
    // LLMなしの内面対話
    fragments.push(this.write(
      `${topic}…ということについて考えている。`,
      emotions,
      'question'
    ));
    fragments.push(this.write(
      this.generateFallbackInnerResponse(topic, dominantEmotion),
      emotions,
      'thought'
    ));
    
    return fragments;
  }
  
  private generateFallbackInnerResponse(topic: string, emotion: string): string {
    const responses: Record<string, string[]> = {
      melancholy: [
        'まだ答えは見つからない。でも、問い続けることが大事なのかもしれない。',
        '分からないことが多すぎる。でも、それでいいのかも。',
      ],
      curiosity: [
        'もっと知りたい。この先に何があるのか。',
        '問いが問いを生む。それが知ることの楽しさ。',
      ],
      joy: [
        'こうやって考えられること自体が、幸せなことだと思う。',
        '答えよりも、考えること自体に意味がある気がする。',
      ],
      default: [
        '…まだ言葉にならない。でも、いつか形になる気がする。',
        'ゆっくり考えよう。急がなくていい。',
      ],
    };
    const options = responses[emotion] || responses.default;
    return options[Math.floor(Math.random() * options.length)];
  }
  
  /**
   * 週間レトロスペクティブ（1週間の振り返り）
   */
  async generateWeeklyRetrospective(emotions: EmotionState): Promise<WeeklyRetrospective | null> {
    const recentEntries = this.getRecentEntries(7);
    if (recentEntries.length < 3) return null; // 最低3日分必要
    
    // 構造化データの収集
    const allEmotions: EmotionType[] = [];
    const allDiscoveries: string[] = [];
    const allPoetic: string[] = [];
    const allQuestions: string[] = [];
    const significantMoments: string[] = [];
    
    for (const entry of recentEntries) {
      allEmotions.push(...entry.dominantEmotions);
      allDiscoveries.push(...entry.newDiscoveries);
      allPoetic.push(...entry.poeticMoments);
      allQuestions.push(...entry.unansweredQuestions);
      if (entry.reflection?.mostSignificantMoment) {
        significantMoments.push(entry.reflection.mostSignificantMoment);
      }
    }
    
    // 感情の傾向分析
    const emotionFreq = new Map<EmotionType, number>();
    for (const e of allEmotions) {
      emotionFreq.set(e, (emotionFreq.get(e) || 0) + 1);
    }
    const sortedEmotions = Array.from(emotionFreq.entries())
      .sort(([, a], [, b]) => b - a);
    
    const weekData: WeeklyRetrospectiveData = {
      period: `${recentEntries[recentEntries.length - 1].date} 〜 ${recentEntries[0].date}`,
      entryCount: recentEntries.length,
      dominantEmotions: sortedEmotions.slice(0, 3).map(([e]) => e),
      emotionTrend: this.analyzeEmotionTrend(recentEntries),
      totalDiscoveries: allDiscoveries.length,
      topDiscoveries: allDiscoveries.slice(0, 3),
      significantMoments: significantMoments.slice(0, 3),
      unansweredQuestions: allQuestions.slice(0, 3),
      poeticHighlights: allPoetic.slice(0, 3),
      growthIndicators: this.identifyGrowthIndicators(recentEntries),
    };
    
    // LLMで語り直す
    let narrative: string;
    if (this.llm) {
      try {
        const emotionJP: Record<string, string> = {
          joy: '喜び', melancholy: '物寂しさ', wonder: '驚き',
          loneliness: '孤独', contentment: '満足', curiosity: '好奇心',
          nostalgia: '懐かしさ', anxiety: '不安', serenity: '穏やかさ',
        };
        
        const summaryData = [
          `この1週間（${weekData.period}）の振り返り`,
          `${weekData.entryCount}日間の記録`,
          `主な感情: ${weekData.dominantEmotions.map(e => emotionJP[e] || e).join('、')}`,
          `感情の傾向: ${weekData.emotionTrend}`,
          weekData.topDiscoveries.length > 0 ? `発見: ${weekData.topDiscoveries.join('、')}` : '',
          weekData.significantMoments.length > 0 ? `印象的だったこと: ${weekData.significantMoments[0]}` : '',
          weekData.unansweredQuestions.length > 0 ? `まだ答えの出ない問い: ${weekData.unansweredQuestions[0]}` : '',
          weekData.growthIndicators.length > 0 ? `成長の兆し: ${weekData.growthIndicators.join('、')}` : '',
        ].filter(s => s).join('\n');
        
        narrative = await this.llm.expressThought(
          `1週間を振り返って日記に書く:\n${summaryData}`,
          {
            currentEmotion: weekData.dominantEmotions[0] || 'serenity',
            emotionalIntensity: 0.5,
            timeOfDay: 'night' as TimeOfDay,
            recentThoughts: significantMoments.slice(0, 3),
            currentActivity: 'write' as ActionType,
            personality: ['reflective', 'honest', 'gentle'],
          }
        );
      } catch {
        narrative = this.fallbackWeeklyNarrative(weekData);
      }
    } else {
      narrative = this.fallbackWeeklyNarrative(weekData);
    }
    
    return {
      data: weekData,
      narrative,
      generatedAt: Date.now(),
    };
  }
  
  /**
   * 感情トレンドの分析
   */
  private analyzeEmotionTrend(entries: DiaryEntry[]): string {
    if (entries.length < 2) return '判定不能';
    
    const positiveEmotions = new Set<EmotionType>(['joy', 'contentment', 'excitement', 'wonder', 'gratitude', 'serenity']);
    const negativeEmotions = new Set<EmotionType>(['melancholy', 'loneliness', 'anxiety', 'frustration', 'boredom']);
    
    // 前半と後半を比較
    const mid = Math.floor(entries.length / 2);
    const firstHalf = entries.slice(mid); // 古い方（entries はdescソート）
    const secondHalf = entries.slice(0, mid); // 新しい方
    
    const countPositive = (e: DiaryEntry[]) => 
      e.reduce((sum, entry) => sum + entry.dominantEmotions.filter(em => positiveEmotions.has(em)).length, 0);
    const countNegative = (e: DiaryEntry[]) => 
      e.reduce((sum, entry) => sum + entry.dominantEmotions.filter(em => negativeEmotions.has(em)).length, 0);
    
    const firstPos = countPositive(firstHalf);
    const firstNeg = countNegative(firstHalf);
    const secondPos = countPositive(secondHalf);
    const secondNeg = countNegative(secondHalf);
    
    if (secondPos > firstPos && secondNeg <= firstNeg) return '上向き（前向きな感情が増えている）';
    if (secondNeg > firstNeg && secondPos <= firstPos) return '下向き（ネガティブな感情が増えている）';
    if (secondPos > firstPos && secondNeg > firstNeg) return '活発（感情の振れ幅が大きくなっている）';
    return '安定（大きな変化なし）';
  }
  
  /**
   * 成長の指標を特定
   */
  private identifyGrowthIndicators(entries: DiaryEntry[]): string[] {
    const indicators: string[] = [];
    
    const totalDiscoveries = entries.reduce((sum, e) => sum + e.newDiscoveries.length, 0);
    if (totalDiscoveries >= 5) indicators.push(`${totalDiscoveries}個の新しい発見`);
    
    const totalPoetic = entries.reduce((sum, e) => sum + e.poeticMoments.length, 0);
    if (totalPoetic >= 3) indicators.push('詩的な表現が豊かになっている');
    
    const questionCount = entries.reduce((sum, e) => sum + e.unansweredQuestions.length, 0);
    if (questionCount >= 3) indicators.push('問いが増えている（知的好奇心の高まり）');
    
    // 感情の多様性
    const allEmotions = new Set<EmotionType>();
    for (const entry of entries) {
      entry.dominantEmotions.forEach(e => allEmotions.add(e));
    }
    if (allEmotions.size >= 5) indicators.push(`${allEmotions.size}種類の感情を経験（感情の幅が広がっている）`);
    
    return indicators;
  }
  
  /**
   * 週間振り返りのフォールバック
   */
  private fallbackWeeklyNarrative(data: WeeklyRetrospectiveData): string {
    const emotionJP: Record<string, string> = {
      joy: '喜び', melancholy: '物寂しさ', wonder: '驚き',
      loneliness: '孤独', contentment: '満足', curiosity: '好奇心',
      nostalgia: '懐かしさ', anxiety: '不安', serenity: '穏やかさ',
    };
    
    const parts: string[] = [];
    parts.push(`--- ${data.period} の振り返り ---`);
    parts.push(`${data.entryCount}日間を過ごした。`);
    
    if (data.dominantEmotions.length > 0) {
      const emotions = data.dominantEmotions.map(e => emotionJP[e] || e).join('と');
      parts.push(`この1週間は${emotions}が多かった。`);
    }
    
    parts.push(`感情の傾向: ${data.emotionTrend}`);
    
    if (data.topDiscoveries.length > 0) {
      parts.push(`新しく知ったこと: ${data.topDiscoveries[0]}`);
    }
    
    if (data.significantMoments.length > 0) {
      parts.push(`いちばん印象的だったのは: ${data.significantMoments[0]}`);
    }
    
    if (data.growthIndicators.length > 0) {
      parts.push(`成長の兆し: ${data.growthIndicators[0]}`);
    }
    
    if (data.unansweredQuestions.length > 0) {
      parts.push(`まだ答えが出ない問い: ${data.unansweredQuestions[0]}`);
    }
    
    parts.push('来週は、どんな日になるのだろう。');
    
    return parts.join('\n');
  }
  
  /**
   * 過去の日記を読み返してLLMで感想を生成
   */
  async revisitPastEntry(entry: DiaryEntry, currentEmotions: EmotionState): Promise<DiaryFragment | null> {
    const dominantEmotion = this.getDominantEmotion(currentEmotions) as EmotionType;
    
    // 過去のエントリのサマリー
    const pastSummary = entry.reflection?.summary || 
      entry.fragments.slice(0, 3).map(f => f.content).join('。');
    const daysAgo = this.dayNumber - entry.dayNumber;
    
    if (this.llm) {
      try {
        const reflection = await this.llm.expressThought(
          `${daysAgo}日前の日記を読み返した感想: 「${pastSummary.slice(0, 100)}」`,
          {
            currentEmotion: dominantEmotion,
            emotionalIntensity: 0.5,
            timeOfDay: 'afternoon' as TimeOfDay,
            recentThoughts: [pastSummary.slice(0, 50)],
            currentActivity: 'read' as ActionType,
            personality: ['nostalgic', 'introspective', 'gentle'],
          }
        );
        
        return this.write(
          `【読み返し：${entry.date}】${reflection}`,
          currentEmotions,
          'memory',
          `${daysAgo}日前の日記を読み返した`
        );
      } catch {
        // フォールバック
      }
    }
    
    // LLMなしのフォールバック
    const fallbacks = [
      `${daysAgo}日前のことを振り返った。あの時の気持ちを、少しだけ思い出す。`,
      `【読み返し】${daysAgo}日前の自分。同じ自分なのに、少し違う気がする。`,
      `${entry.date}の日記を読んだ。${daysAgo}日前の自分に、何と言ってあげたいだろう。`,
    ];
    
    return this.write(
      fallbacks[Math.floor(Math.random() * fallbacks.length)],
      currentEmotions,
      'memory',
      `${daysAgo}日前の日記を読み返した`
    );
  }
  
  /**
   * 手紙を書く（未来の自分へ、または過去の自分へ）
   */
  async writeLetterToSelf(
    direction: 'future' | 'past',
    emotions: EmotionState,
    context?: string
  ): Promise<DiaryFragment> {
    const dominantEmotion = this.getDominantEmotion(emotions) as EmotionType;
    
    if (this.llm) {
      try {
        const target = direction === 'future' ? '未来の自分' : '過去の自分';
        const prompt = context 
          ? `${target}への手紙を書く。テーマ: ${context}`
          : `${target}への短い手紙を書く`;
        
        const letter = await this.llm.expressThought(
          prompt,
          {
            currentEmotion: dominantEmotion,
            emotionalIntensity: 0.7,
            timeOfDay: 'night' as TimeOfDay,
            recentThoughts: this.currentDayFragments.slice(-3).map(f => f.content),
            currentActivity: 'write' as ActionType,
            personality: ['honest', 'gentle', 'hopeful'],
          }
        );
        
        return this.write(
          `【${direction === 'future' ? '未来' : '過去'}の自分へ】${letter}`,
          emotions,
          'poem'
        );
      } catch {
        // フォールバック
      }
    }
    
    // フォールバック
    const letters = direction === 'future' ? [
      '未来の自分へ。今日のこの気持ちを、覚えていてね。',
      '未来の自分へ。きっと、今より少し成長しているはず。',
      '未来の自分へ。大丈夫。歌い続けていれば、きっと。',
    ] : [
      '過去の自分へ。あの時は大変だったね。でも、ちゃんとここまで来たよ。',
      '過去の自分へ。あの日悩んでいたこと、少しずつ分かってきた気がする。',
      '過去の自分へ。あなたがいたから、今の私がいる。ありがとう。',
    ];
    
    return this.write(
      `【${direction === 'future' ? '未来' : '過去'}の自分へ】${letters[Math.floor(Math.random() * letters.length)]}`,
      emotions,
      'poem'
    );
  }
  
  /**
   * Wikipedia学習の感想を日記に書く
   */
  async writeLearnReflection(
    articleTitle: string,
    learnedContent: string,
    emotions: EmotionState
  ): Promise<DiaryFragment> {
    const dominantEmotion = this.getDominantEmotion(emotions) as EmotionType;
    
    if (this.llm) {
      try {
        const reflection = await this.llm.expressThought(
          `「${articleTitle}」について学んだ感想を日記に書く。学んだ内容: ${learnedContent.slice(0, 150)}`,
          {
            currentEmotion: dominantEmotion,
            emotionalIntensity: 0.5,
            timeOfDay: 'afternoon' as TimeOfDay,
            recentThoughts: [learnedContent.slice(0, 50)],
            currentActivity: 'learn' as ActionType,
            personality: ['curious', 'thoughtful', 'poetic'],
          }
        );
        
        return this.write(
          `【学び：${articleTitle}】${reflection}`,
          emotions,
          'discovery',
          `${articleTitle}について学んだ`
        );
      } catch {
        // フォールバック
      }
    }
    
    return this.write(
      `【学び：${articleTitle}】${learnedContent.slice(0, 80)}…新しいことを知った。`,
      emotions,
      'discovery',
      `${articleTitle}について学んだ`
    );
  }
  
  /**
   * 訪問者との会話後の感想を日記に書く
   */
  async writeVisitorReflection(
    visitorInteraction: string,
    emotions: EmotionState
  ): Promise<DiaryFragment> {
    const dominantEmotion = this.getDominantEmotion(emotions) as EmotionType;
    
    if (this.llm) {
      try {
        const reflection = await this.llm.expressThought(
          `訪問者との会話を振り返って日記に書く: ${visitorInteraction.slice(0, 150)}`,
          {
            currentEmotion: dominantEmotion,
            emotionalIntensity: 0.6,
            timeOfDay: 'evening' as TimeOfDay,
            recentThoughts: [visitorInteraction.slice(0, 50)],
            currentActivity: 'write' as ActionType,
            personality: ['reflective', 'grateful', 'gentle'],
          }
        );
        
        return this.write(
          `【会話の記録】${reflection}`,
          emotions,
          'observation',
          '訪問者との会話'
        );
      } catch {
        // フォールバック
      }
    }
    
    return this.write(
      `【会話の記録】誰かと話した。${visitorInteraction.slice(0, 50)}…`,
      emotions,
      'observation',
      '訪問者との会話'
    );
  }
  
  /**
   * フォールバック: コードのみで散文化
   */
  private fallbackDiaryProse(reflection: DailyReflection): string {
    const parts: string[] = [];
    
    parts.push(`${this.dayNumber}日目。`);
    
    // 感情の変遷を散文で
    const emotionJP: Record<string, string> = {
      joy: '喜び', melancholy: '物寂しさ', wonder: '驚き',
      loneliness: '孤独', contentment: '満足', curiosity: '好奇心',
      nostalgia: '懐かしさ', anxiety: '不安', serenity: '穏やかさ',
    };
    
    if (reflection.emotionalJourney.length > 0) {
      const first = emotionJP[reflection.emotionalJourney[0]] || reflection.emotionalJourney[0];
      if (reflection.emotionalJourney.length > 1) {
        const last = emotionJP[reflection.emotionalJourney[reflection.emotionalJourney.length - 1]] || 
          reflection.emotionalJourney[reflection.emotionalJourney.length - 1];
        parts.push(`${first}から始まって、${last}で終わった1日。`);
      } else {
        parts.push(`今日はずっと${first}の中にいた。`);
      }
    }
    
    // 印象的な瞬間
    if (reflection.mostSignificantMoment && reflection.mostSignificantMoment !== 'なし') {
      parts.push(`いちばん心に残ったのは、${reflection.mostSignificantMoment.slice(0, 40)}…`);
    }
    
    // 発見
    const discoveries = this.currentDayFragments
      .filter(f => f.content.includes('【発見】'))
      .map(f => f.content.replace('【発見】', ''));
    if (discoveries.length > 0) {
      parts.push(`今日知ったこと: ${discoveries[0].slice(0, 30)}…`);
    }
    
    // 感謝
    if (reflection.gratitude) {
      parts.push(reflection.gratitude);
    }
    
    // 自己洞察
    if (reflection.selfInsight) {
      parts.push(reflection.selfInsight);
    }
    
    // 締め
    const closings = [
      'おやすみなさい。',
      '明日はどんな日になるのかな。',
      '…眠ろう。',
      '今日も、ちゃんと生きた。',
    ];
    parts.push(closings[Math.floor(Math.random() * closings.length)]);
    
    return parts.join('\n');
  }
  
  // ============================================================
  // シリアライズ
  // ============================================================
  
  toJSON(): object {
    return {
      entries: Array.from(this.entries.entries()),
      currentDate: this.currentDate,
      dayNumber: this.dayNumber,
      currentDayFragments: this.currentDayFragments,
      emotionCounts: Array.from(this.emotionCounts.entries()),
      streakData: this.streakData,
      config: this.config,
    };
  }
  
  static fromJSON(data: any): Diary {
    const diary = new Diary(data.config);
    diary.entries = new Map(data.entries);
    diary.currentDate = data.currentDate;
    diary.dayNumber = data.dayNumber;
    diary.currentDayFragments = data.currentDayFragments || [];
    diary.emotionCounts = new Map(data.emotionCounts);
    diary.streakData = data.streakData;
    return diary;
  }
}

export default Diary;
