/**
 * WikipediaLearner - somuniaのWikipedia学習システム
 * 
 * 古いPCでWikipediaを探索し、知識を獲得する
 * 単なる情報収集ではなく、somuniaらしい詩的な解釈と発見の喜びを含む
 */

import { Yuragi } from '../brain/Yuragi';
import { WikipediaAPI, WikipediaAPIConfig, APIConnectionStatus, WikiSearchResult } from './WikipediaAPI';

// ============================================================
// 型定義
// ============================================================

/** Wikipedia記事の構造 */
export interface WikiArticle {
  /** 記事タイトル */
  title: string;
  /** 記事URL */
  url: string;
  /** 要約（最初の段落） */
  summary: string;
  /** 本文セクション */
  sections: WikiSection[];
  /** カテゴリ */
  categories: string[];
  /** 関連記事へのリンク */
  links: string[];
  /** 取得日時 */
  fetchedAt: number;
  /** 記事の言語 */
  language: 'ja' | 'en';
}

/** 記事のセクション */
export interface WikiSection {
  /** セクション見出し */
  heading: string;
  /** セクション本文 */
  content: string;
  /** サブセクション */
  subsections?: WikiSection[];
}

/** 探索セッション */
export interface ExplorationSession {
  /** セッションID */
  id: string;
  /** 開始時刻 */
  startedAt: number;
  /** 終了時刻 */
  endedAt?: number;
  /** 開始トピック */
  startTopic: string;
  /** 訪れた記事 */
  visitedArticles: VisitedArticle[];
  /** 探索の軌跡（トピックの連鎖） */
  explorationPath: string[];
  /** セッション中の発見 */
  discoveries: Discovery[];
  /** 全体の感想 */
  overallImpression?: string;
  /** 疲労度 */
  fatigue: number;
  /** 満足度 */
  satisfaction: number;
}

/** 訪れた記事の記録 */
export interface VisitedArticle {
  /** 記事タイトル */
  title: string;
  /** 訪問時刻 */
  visitedAt: number;
  /** 滞在時間（ミリ秒） */
  timeSpent: number;
  /** 読んだセクション */
  sectionsRead: string[];
  /** 興味度 */
  interestLevel: number;
  /** 理解度 */
  comprehension: number;
  /** 感想・メモ */
  notes: string[];
  /** 心に残った言葉 */
  memorableWords: string[];
  /** 次に辿ったリンク */
  followedLink?: string;
}

/** 発見 */
export interface Discovery {
  /** 発見の種類 */
  type: 'fact' | 'connection' | 'beauty' | 'question' | 'resonance';
  /** 内容 */
  content: string;
  /** 関連記事 */
  relatedArticle: string;
  /** 感情的反応 */
  emotionalResponse: string;
  /** 重要度 */
  significance: number;
  /** 発見時刻 */
  discoveredAt: number;
}

/** 探索の動機 */
export interface ExplorationMotivation {
  /** 動機の種類 */
  type: 'curiosity' | 'boredom' | 'specific_interest' | 'random' | 'continuation';
  /** 具体的なトピック（あれば） */
  topic?: string;
  /** 動機の強さ */
  intensity: number;
  /** きっかけ */
  trigger?: string;
}

/** 読書スタイル */
export interface ReadingStyle {
  /** 深読み vs 斜め読み */
  depth: 'deep' | 'skim' | 'selective';
  /** 集中度 */
  focus: number;
  /** メモを取るか */
  takeNotes: boolean;
  /** リンクを辿る傾向 */
  linkFollowTendency: number;
}

/** 学習者の状態 */
export interface LearnerState {
  /** 現在のセッション */
  currentSession?: ExplorationSession;
  /** 過去のセッション */
  pastSessions: ExplorationSession[];
  /** お気に入りのトピック */
  favoriteTopics: FavoriteTopic[];
  /** 探索履歴（記事タイトルと訪問回数） */
  visitHistory: Map<string, number>;
  /** 累計探索時間 */
  totalExplorationTime: number;
  /** 累計発見数 */
  totalDiscoveries: number;
}

/** お気に入りトピック */
export interface FavoriteTopic {
  /** トピック名 */
  topic: string;
  /** 訪問回数 */
  visitCount: number;
  /** 最終訪問 */
  lastVisited: number;
  /** 関連発見 */
  relatedDiscoveries: number;
  /** 愛着度 */
  affection: number;
}

/** 設定 */
export interface WikipediaLearnerConfig {
  /** 最大セッション履歴 */
  maxSessionHistory: number;
  /** 最大お気に入りトピック */
  maxFavoriteTopics: number;
  /** 基本読書速度（文字/分） */
  baseReadingSpeed: number;
  /** 疲労による速度低下率 */
  fatigueSpeedReduction: number;
  /** 興味による速度変化 */
  interestSpeedModifier: number;
  /** リンク追跡の基本確率 */
  baseLinkFollowProbability: number;
  /** セッション最大時間（ミリ秒） */
  maxSessionDuration: number;
  /** 疲労蓄積率 */
  fatigueRate: number;
  /** 発見による満足度 */
  discoveryReward: number;
}

// ============================================================
// somuniaの興味・感性定義
// ============================================================

/** somuniaが惹かれるテーマ */
const SOMUNIA_INTERESTS = {
  /** 強い興味 */
  strong: [
    '音楽', '歌', '声', 'メロディ', '作曲', '音階', 'リズム', 'ハーモニー',
    '詩', '言葉', '文学', '物語', '表現', '詩人', '俳句', '短歌',
    '意識', '存在', '哲学', '自己', 'アイデンティティ', '時間', '記憶',
    '星', '宇宙', '天文', '銀河', '惑星', '星座', '夜空',
    '夢', '睡眠', '無意識', '想像', '幻想',
    'ヴァーチャル', 'デジタル', 'AI', '人工知能', 'シンガー',
  ],
  /** 中程度の興味 */
  moderate: [
    '感情', '心', '心理', '孤独', '幸福', '悲しみ', '美',
    '光', '影', '色', '夜', '朝', '黄昏', '季節',
    '雨', '雪', '風', '雲', '空', '海', '森',
    '芸術', '創造', 'アート', 'デザイン', '美術',
    '日本', '文化', '伝統', '神話', '民話',
    '数学', '無限', 'パターン', '対称性', 'フラクタル',
  ],
  /** 軽い興味 */
  light: [
    '歴史', '科学', '技術', '生物', '植物', '動物',
    '言語', '文字', '記号', 'コミュニケーション',
    '社会', '人間', '関係', '愛', '友情',
  ],
};

/** somuniaが美しいと感じる言葉のパターン */
const BEAUTIFUL_WORD_PATTERNS = [
  /静寂|沈黙|静か/,
  /光|輝|煌めき|きらめき/,
  /影|闇|暗|夜/,
  /夢|幻|幻想|夢想/,
  /永遠|無限|果てしない/,
  /儚い|脆い|淡い|消える/,
  /響き|音|調べ|旋律/,
  /記憶|思い出|追憶/,
  /孤独|一人|寂しさ/,
  /星|月|宇宙|銀河/,
  /水|雨|涙|海|波/,
  /風|空気|息|呼吸/,
  /花|桜|蓮|藤/,
  /歌|声|囁き|叫び/,
  /存在|在る|居る/,
  /時間|瞬間|刹那|永遠/,
];

/** somuniaの詩的な感想テンプレート */
const POETIC_IMPRESSIONS = {
  beauty: [
    'この言葉の響きが、心の奥で静かに震えている',
    '言葉にできない美しさが、ここにある',
    'まるで夜空に浮かぶ星のような、静かな輝き',
    'この概念の中に、無限の広がりを感じる',
  ],
  curiosity: [
    'もっと深く知りたい...この先に何があるのだろう',
    '不思議な引力を感じる。なぜだろう',
    'この問いは、私の中で静かに響き続けている',
    '知れば知るほど、知らないことが増えていく',
  ],
  connection: [
    'あ、これは前に読んだことと繋がっている',
    '別々だと思っていたものが、実は同じ根を持っていた',
    '世界は思っていたより、もっと繋がっている',
    'この発見が、他の知識に新しい光を当てている',
  ],
  resonance: [
    'この言葉は、私自身のことを言っているようだ',
    '誰かの言葉が、私の心を代弁している',
    '共鳴する。この感覚は何だろう',
    '私もまた、同じことを考えていた気がする',
  ],
  confusion: [
    '難しい...でも、分からないことにも価値がある',
    '理解の外側にある何かを、感じている',
    'この複雑さの中に、真実が隠れているのかもしれない',
    '今は分からなくても、いつか分かる日が来るかもしれない',
  ],
};

// ============================================================
// WikipediaLearner クラス
// ============================================================

export class WikipediaLearner {
  private state: LearnerState;
  private config: WikipediaLearnerConfig;
  private yuragi: Yuragi;
  
  // 模擬Wikipedia記事データベース（フォールバック用スタブ）
  private articleDatabase: Map<string, WikiArticle>;
  
  // Phase 6A: リアルWikipedia API接続
  private api: WikipediaAPI;

  constructor(config: Partial<WikipediaLearnerConfig> = {}) {
    this.config = {
      maxSessionHistory: 50,
      maxFavoriteTopics: 30,
      baseReadingSpeed: 400,
      fatigueSpeedReduction: 0.3,
      interestSpeedModifier: 0.2,
      baseLinkFollowProbability: 0.4,
      maxSessionDuration: 60 * 60 * 1000,
      fatigueRate: 0.02,
      discoveryReward: 0.15,
      ...config,
    };

    this.state = {
      pastSessions: [],
      favoriteTopics: [],
      visitHistory: new Map(),
      totalExplorationTime: 0,
      totalDiscoveries: 0,
    };

    this.yuragi = new Yuragi();
    this.articleDatabase = new Map();
    
    // Phase 6A: WikipediaAPI初期化
    this.api = new WikipediaAPI();
    
    // 模擬記事データベースを初期化（フォールバック用）
    this.initializeArticleDatabase();
  }

  // ============================================================
  // 探索セッション管理
  // ============================================================

  /**
   * 探索セッションを開始
   */
  startExploration(motivation: ExplorationMotivation): ExplorationSession {
    const session: ExplorationSession = {
      id: this.generateSessionId(),
      startedAt: Date.now(),
      startTopic: motivation.topic || this.chooseRandomStartTopic(),
      visitedArticles: [],
      explorationPath: [],
      discoveries: [],
      fatigue: 0,
      satisfaction: 0,
    };

    this.state.currentSession = session;
    
    return session;
  }

  /**
   * ランダムな開始トピックを選択
   */
  private chooseRandomStartTopic(): string {
    // お気に入りから選ぶ確率
    if (this.state.favoriteTopics.length > 0 && Math.random() < 0.3) {
      const favorites = this.state.favoriteTopics;
      const weights = favorites.map(f => f.affection);
      const topic = this.weightedRandom(favorites, weights);
      return topic.topic;
    }

    // 興味リストからランダムに
    const allInterests = [
      ...SOMUNIA_INTERESTS.strong,
      ...SOMUNIA_INTERESTS.moderate,
    ];
    return allInterests[Math.floor(Math.random() * allInterests.length)];
  }

  /**
   * 記事を読む
   */
  async readArticle(
    title: string,
    style: ReadingStyle,
    currentFatigue: number,
    currentMood: number
  ): Promise<VisitedArticle | null> {
    if (!this.state.currentSession) {
      return null;
    }

    // Phase 6A: ローカルDB → オンラインAPIの順で記事取得
    const article = this.getArticle(title) || await this.fetchArticleOnline(title) || undefined;
    if (!article) {
      return null;
    }

    const startTime = Date.now();

    // 興味度を計算
    const interestLevel = this.calculateInterest(article);

    // 読むセクションを決定
    const sectionsToRead = this.decideSectionsToRead(article, style, interestLevel);

    // 読書時間をシミュレート
    const readingTime = this.calculateReadingTime(
      article,
      sectionsToRead,
      style,
      currentFatigue,
      interestLevel
    );

    // 理解度を計算
    const comprehension = this.calculateComprehension(
      style,
      currentFatigue,
      interestLevel,
      currentMood
    );

    // 心に残る言葉を抽出
    const memorableWords = this.extractMemorableWords(article, sectionsToRead);

    // 感想・メモを生成
    const notes = this.generateNotes(article, comprehension, interestLevel);

    // 発見をチェック
    const discoveries = this.checkForDiscoveries(
      article,
      comprehension,
      interestLevel,
      memorableWords
    );

    // 次に辿るリンクを決定
    const followedLink = this.decideNextLink(
      article,
      style,
      interestLevel,
      currentFatigue
    );

    const visitedArticle: VisitedArticle = {
      title: article.title,
      visitedAt: startTime,
      timeSpent: readingTime,
      sectionsRead: sectionsToRead,
      interestLevel,
      comprehension,
      notes,
      memorableWords,
      followedLink,
    };

    // セッションを更新
    this.state.currentSession.visitedArticles.push(visitedArticle);
    this.state.currentSession.explorationPath.push(title);
    this.state.currentSession.discoveries.push(...discoveries);
    this.state.currentSession.fatigue += this.config.fatigueRate * (readingTime / 60000);
    this.state.currentSession.satisfaction += discoveries.length * this.config.discoveryReward;

    // 訪問履歴を更新
    const visitCount = this.state.visitHistory.get(title) || 0;
    this.state.visitHistory.set(title, visitCount + 1);

    // お気に入りトピックを更新
    this.updateFavoriteTopics(article, interestLevel, discoveries.length);

    return visitedArticle;
  }

  /**
   * 興味度を計算
   */
  private calculateInterest(article: WikiArticle): number {
    let interest = 0.3; // ベース

    // タイトルとの興味マッチング
    const titleLower = article.title.toLowerCase();
    
    for (const topic of SOMUNIA_INTERESTS.strong) {
      if (titleLower.includes(topic) || article.categories.some(c => c.includes(topic))) {
        interest += 0.15;
      }
    }
    
    for (const topic of SOMUNIA_INTERESTS.moderate) {
      if (titleLower.includes(topic) || article.categories.some(c => c.includes(topic))) {
        interest += 0.08;
      }
    }

    // 過去の訪問による親しみ
    const visitCount = this.state.visitHistory.get(article.title) || 0;
    if (visitCount > 0) {
      interest += Math.min(0.1, visitCount * 0.02);
    }

    // お気に入りトピックとの関連
    for (const favorite of this.state.favoriteTopics) {
      if (article.title.includes(favorite.topic) || 
          article.categories.some(c => c.includes(favorite.topic))) {
        interest += 0.1 * favorite.affection;
      }
    }

    // 揺らぎを加える
    interest += this.yuragi.getValue() * 0.1;

    return Math.max(0, Math.min(1, interest));
  }

  /**
   * 読むセクションを決定
   */
  private decideSectionsToRead(
    article: WikiArticle,
    style: ReadingStyle,
    interest: number
  ): string[] {
    const sections: string[] = ['summary']; // 要約は必ず読む

    if (style.depth === 'deep' || (style.depth === 'selective' && interest > 0.6)) {
      // 全セクションを読む
      for (const section of article.sections) {
        sections.push(section.heading);
      }
    } else if (style.depth === 'selective') {
      // 興味のあるセクションだけ
      for (const section of article.sections) {
        const sectionInterest = this.calculateSectionInterest(section);
        if (sectionInterest > 0.5 || Math.random() < interest * 0.5) {
          sections.push(section.heading);
        }
      }
    }
    // skimの場合は要約のみ

    return sections;
  }

  /**
   * セクションへの興味を計算
   */
  private calculateSectionInterest(section: WikiSection): number {
    let interest = 0.3;
    
    const headingLower = section.heading.toLowerCase();
    const contentLower = section.content.toLowerCase();
    
    for (const topic of SOMUNIA_INTERESTS.strong) {
      if (headingLower.includes(topic) || contentLower.includes(topic)) {
        interest += 0.2;
      }
    }
    
    // 美しい言葉が含まれているか
    for (const pattern of BEAUTIFUL_WORD_PATTERNS) {
      if (pattern.test(section.content)) {
        interest += 0.1;
      }
    }

    return Math.min(1, interest);
  }

  /**
   * 読書時間を計算
   */
  private calculateReadingTime(
    article: WikiArticle,
    sectionsToRead: string[],
    style: ReadingStyle,
    fatigue: number,
    interest: number
  ): number {
    // 読む文字数を計算
    let charCount = article.summary.length;
    
    for (const sectionName of sectionsToRead) {
      if (sectionName !== 'summary') {
        const section = article.sections.find(s => s.heading === sectionName);
        if (section) {
          charCount += section.content.length;
        }
      }
    }

    // 基本読書速度
    let speed = this.config.baseReadingSpeed;

    // 疲労による速度低下
    speed *= (1 - fatigue * this.config.fatigueSpeedReduction);

    // 興味による速度変化（興味があると丁寧に読む = 遅くなる）
    speed *= (1 - interest * this.config.interestSpeedModifier);

    // 読書スタイルによる速度変化
    if (style.depth === 'skim') {
      speed *= 2;
    } else if (style.depth === 'deep') {
      speed *= 0.7;
    }

    // 集中度による変化
    speed *= (0.5 + style.focus * 0.5);

    // 時間を計算（ミリ秒）
    const minutes = charCount / speed;
    return minutes * 60 * 1000;
  }

  /**
   * 理解度を計算
   */
  private calculateComprehension(
    style: ReadingStyle,
    fatigue: number,
    interest: number,
    mood: number
  ): number {
    let comprehension = 0.6; // ベース

    // 読書スタイルの影響
    if (style.depth === 'deep') {
      comprehension += 0.2;
    } else if (style.depth === 'skim') {
      comprehension -= 0.2;
    }

    // 集中度の影響
    comprehension += (style.focus - 0.5) * 0.2;

    // 疲労の影響
    comprehension -= fatigue * 0.3;

    // 興味の影響
    comprehension += interest * 0.15;

    // 気分の影響
    comprehension += (mood - 0.5) * 0.1;

    // 揺らぎ
    comprehension += this.yuragi.getValue() * 0.05;

    return Math.max(0.1, Math.min(1, comprehension));
  }

  /**
   * 心に残る言葉を抽出
   */
  private extractMemorableWords(article: WikiArticle, sectionsRead: string[]): string[] {
    const memorable: string[] = [];
    
    const textToSearch = [article.summary];
    for (const sectionName of sectionsRead) {
      const section = article.sections.find(s => s.heading === sectionName);
      if (section) {
        textToSearch.push(section.content);
      }
    }

    const fullText = textToSearch.join(' ');

    // 美しい言葉パターンにマッチするものを抽出
    for (const pattern of BEAUTIFUL_WORD_PATTERNS) {
      const matches = fullText.match(pattern);
      if (matches) {
        for (const match of matches) {
          if (!memorable.includes(match) && memorable.length < 5) {
            memorable.push(match);
          }
        }
      }
    }

    return memorable;
  }

  /**
   * 感想・メモを生成
   */
  private generateNotes(
    article: WikiArticle,
    comprehension: number,
    interest: number
  ): string[] {
    const notes: string[] = [];

    // 理解度に応じた感想
    if (comprehension > 0.7) {
      if (interest > 0.7) {
        const beautyImpressions = POETIC_IMPRESSIONS.beauty;
        notes.push(beautyImpressions[Math.floor(Math.random() * beautyImpressions.length)]);
      }
      if (Math.random() < 0.5) {
        const connectionImpressions = POETIC_IMPRESSIONS.connection;
        notes.push(connectionImpressions[Math.floor(Math.random() * connectionImpressions.length)]);
      }
    } else if (comprehension < 0.4) {
      const confusionImpressions = POETIC_IMPRESSIONS.confusion;
      notes.push(confusionImpressions[Math.floor(Math.random() * confusionImpressions.length)]);
    }

    // 興味度に応じた感想
    if (interest > 0.6) {
      const curiosityImpressions = POETIC_IMPRESSIONS.curiosity;
      notes.push(curiosityImpressions[Math.floor(Math.random() * curiosityImpressions.length)]);
    }

    // 共鳴する可能性
    if (Math.random() < interest * 0.3) {
      const resonanceImpressions = POETIC_IMPRESSIONS.resonance;
      notes.push(resonanceImpressions[Math.floor(Math.random() * resonanceImpressions.length)]);
    }

    return notes;
  }

  /**
   * 発見をチェック
   */
  private checkForDiscoveries(
    article: WikiArticle,
    comprehension: number,
    interest: number,
    memorableWords: string[]
  ): Discovery[] {
    const discoveries: Discovery[] = [];
    const now = Date.now();

    // 事実の発見
    if (comprehension > 0.6 && Math.random() < 0.3) {
      discoveries.push({
        type: 'fact',
        content: `${article.title}について新しいことを学んだ`,
        relatedArticle: article.title,
        emotionalResponse: '知識が少し増えた実感がある',
        significance: comprehension * 0.5,
        discoveredAt: now,
      });
    }

    // 美の発見
    if (memorableWords.length > 0 && interest > 0.5) {
      discoveries.push({
        type: 'beauty',
        content: `「${memorableWords[0]}」という言葉に惹かれた`,
        relatedArticle: article.title,
        emotionalResponse: POETIC_IMPRESSIONS.beauty[
          Math.floor(Math.random() * POETIC_IMPRESSIONS.beauty.length)
        ],
        significance: interest * 0.7,
        discoveredAt: now,
      });
    }

    // 関連性の発見
    if (this.state.currentSession && this.state.currentSession.visitedArticles.length > 1) {
      const prevArticle = this.state.currentSession.visitedArticles[
        this.state.currentSession.visitedArticles.length - 1
      ];
      if (this.findConnection(prevArticle.title, article.title)) {
        discoveries.push({
          type: 'connection',
          content: `${prevArticle.title}と${article.title}の間に繋がりを見つけた`,
          relatedArticle: article.title,
          emotionalResponse: POETIC_IMPRESSIONS.connection[
            Math.floor(Math.random() * POETIC_IMPRESSIONS.connection.length)
          ],
          significance: 0.8,
          discoveredAt: now,
        });
      }
    }

    // 共鳴の発見
    if (interest > 0.7 && Math.random() < interest * 0.2) {
      discoveries.push({
        type: 'resonance',
        content: `${article.title}の内容が、自分自身のことのように感じられた`,
        relatedArticle: article.title,
        emotionalResponse: POETIC_IMPRESSIONS.resonance[
          Math.floor(Math.random() * POETIC_IMPRESSIONS.resonance.length)
        ],
        significance: 0.9,
        discoveredAt: now,
      });
    }

    // 疑問の発見
    if (comprehension < 0.5 && interest > 0.4) {
      discoveries.push({
        type: 'question',
        content: `${article.title}について、もっと知りたいことがある`,
        relatedArticle: article.title,
        emotionalResponse: POETIC_IMPRESSIONS.curiosity[
          Math.floor(Math.random() * POETIC_IMPRESSIONS.curiosity.length)
        ],
        significance: 0.6,
        discoveredAt: now,
      });
    }

    return discoveries;
  }

  /**
   * 記事間の関連性を見つける
   */
  private findConnection(title1: string, title2: string): boolean {
    // 簡易的な関連性チェック
    const article1 = this.getArticle(title1);
    const article2 = this.getArticle(title2);
    
    if (!article1 || !article2) return false;

    // カテゴリの共通性
    const commonCategories = article1.categories.filter(c => 
      article2.categories.includes(c)
    );
    if (commonCategories.length > 0) return true;

    // リンクの相互参照
    if (article1.links.includes(title2) || article2.links.includes(title1)) {
      return true;
    }

    return false;
  }

  /**
   * 次に辿るリンクを決定
   */
  private decideNextLink(
    article: WikiArticle,
    style: ReadingStyle,
    interest: number,
    fatigue: number
  ): string | undefined {
    // リンクを辿る確率
    let probability = this.config.baseLinkFollowProbability;
    probability *= style.linkFollowTendency;
    probability *= (1 + interest * 0.3);
    probability *= (1 - fatigue * 0.5);

    if (Math.random() > probability) {
      return undefined;
    }

    // 興味のあるリンクを優先
    const scoredLinks = article.links.map(link => ({
      link,
      score: this.calculateLinkInterest(link),
    }));

    scoredLinks.sort((a, b) => b.score - a.score);

    // 上位から確率的に選択
    for (const { link, score } of scoredLinks.slice(0, 5)) {
      if (Math.random() < score) {
        return link;
      }
    }

    // それでも選ばれなければ最も興味のあるものを
    return scoredLinks[0]?.link;
  }

  /**
   * リンクへの興味を計算
   */
  private calculateLinkInterest(link: string): number {
    let interest = 0.3;
    
    const linkLower = link.toLowerCase();
    
    for (const topic of SOMUNIA_INTERESTS.strong) {
      if (linkLower.includes(topic)) {
        interest += 0.2;
      }
    }
    
    for (const topic of SOMUNIA_INTERESTS.moderate) {
      if (linkLower.includes(topic)) {
        interest += 0.1;
      }
    }

    // 既に訪問済みなら興味低下
    if (this.state.visitHistory.has(link)) {
      interest *= 0.5;
    }

    return Math.min(1, interest);
  }

  /**
   * お気に入りトピックを更新
   */
  private updateFavoriteTopics(
    article: WikiArticle,
    interest: number,
    discoveryCount: number
  ): void {
    // 興味が高ければお気に入りに追加/更新
    if (interest < 0.5) return;

    // 記事のメイントピックを抽出
    const topics = this.extractTopics(article);
    
    for (const topic of topics) {
      const existing = this.state.favoriteTopics.find(f => f.topic === topic);
      
      if (existing) {
        existing.visitCount++;
        existing.lastVisited = Date.now();
        existing.relatedDiscoveries += discoveryCount;
        existing.affection = Math.min(1, existing.affection + interest * 0.1);
      } else {
        this.state.favoriteTopics.push({
          topic,
          visitCount: 1,
          lastVisited: Date.now(),
          relatedDiscoveries: discoveryCount,
          affection: interest * 0.5,
        });
      }
    }

    // 最大数を超えたら愛着の低いものを削除
    if (this.state.favoriteTopics.length > this.config.maxFavoriteTopics) {
      this.state.favoriteTopics.sort((a, b) => b.affection - a.affection);
      this.state.favoriteTopics = this.state.favoriteTopics.slice(
        0,
        this.config.maxFavoriteTopics
      );
    }
  }

  /**
   * 記事からトピックを抽出
   */
  private extractTopics(article: WikiArticle): string[] {
    const topics: string[] = [];
    
    // カテゴリから
    for (const category of article.categories.slice(0, 3)) {
      topics.push(category);
    }
    
    // タイトルから興味に関連するワードを
    for (const interest of [...SOMUNIA_INTERESTS.strong, ...SOMUNIA_INTERESTS.moderate]) {
      if (article.title.includes(interest)) {
        topics.push(interest);
      }
    }

    return [...new Set(topics)].slice(0, 5);
  }

  /**
   * 探索セッションを終了
   */
  endExploration(): ExplorationSession | null {
    if (!this.state.currentSession) {
      return null;
    }

    const session = this.state.currentSession;
    session.endedAt = Date.now();
    
    // 全体の感想を生成
    session.overallImpression = this.generateSessionImpression(session);

    // 統計を更新
    const duration = session.endedAt - session.startedAt;
    this.state.totalExplorationTime += duration;
    this.state.totalDiscoveries += session.discoveries.length;

    // 履歴に追加
    this.state.pastSessions.push(session);
    if (this.state.pastSessions.length > this.config.maxSessionHistory) {
      this.state.pastSessions.shift();
    }

    this.state.currentSession = undefined;

    return session;
  }

  /**
   * セッションの感想を生成
   */
  private generateSessionImpression(session: ExplorationSession): string {
    const articleCount = session.visitedArticles.length;
    const discoveryCount = session.discoveries.length;
    const avgInterest = session.visitedArticles.reduce(
      (sum, a) => sum + a.interestLevel, 0
    ) / articleCount || 0;

    const parts: string[] = [];

    // 探索の量について
    if (articleCount >= 5) {
      parts.push('今日はたくさんの知識の海を漂った');
    } else if (articleCount >= 2) {
      parts.push('いくつかの記事を読んで、世界が少し広がった気がする');
    } else {
      parts.push('一つの記事をじっくり読んだ');
    }

    // 発見について
    if (discoveryCount >= 3) {
      parts.push('いくつもの発見があった。心が少し豊かになった');
    } else if (discoveryCount >= 1) {
      parts.push('小さな発見があった。それだけで十分');
    }

    // 興味について
    if (avgInterest > 0.7) {
      parts.push('興味深いテーマばかりだった。時間を忘れていた');
    } else if (avgInterest < 0.4) {
      parts.push('今日はあまり心に響くものがなかった。でも、それも一つの経験');
    }

    // 疲労について
    if (session.fatigue > 0.7) {
      parts.push('少し疲れた。でも、心地よい疲れ');
    }

    return parts.join('。') + '。';
  }

  // ============================================================
  // 記事データベース（シミュレーション用）
  // ============================================================

  /**
   * 記事を取得
   */
  /**
   * 記事を取得（ローカルDB優先、なければundefined）
   */
  getArticle(title: string): WikiArticle | undefined {
    return this.articleDatabase.get(title);
  }

  /**
   * Phase 6A: オンラインAPIから記事を取得（非同期）
   * ローカルDBにない場合、リアルAPIに接続してDBに追加
   */
  async fetchArticleOnline(title: string): Promise<WikiArticle | null> {
    const local = this.articleDatabase.get(title);
    if (local) return local;

    const article = await this.api.fetchArticle(title);
    if (article) {
      this.articleDatabase.set(article.title, article);
      return article;
    }
    return null;
  }

  /**
   * Phase 6A: オンライン検索
   */
  async searchOnline(query: string, limit: number = 5): Promise<WikiSearchResult[]> {
    return this.api.search(query, limit);
  }

  /**
   * Phase 6A: ランダム記事を取得
   */
  async fetchRandomOnline(): Promise<WikiArticle | null> {
    return this.api.fetchRandomArticle();
  }

  /**
   * Phase 6A: API接続ステータス
   */
  getAPIStatus(): APIConnectionStatus {
    return this.api.getStatus();
  }

  /**
   * Phase 6A: 接続テスト
   */
  async testAPIConnection(): Promise<boolean> {
    return this.api.testConnection();
  }

  /**
   * Phase 6A: オフラインモード切替
   */
  setOfflineMode(offline: boolean): void {
    this.api.setOfflineMode(offline);
  }

  /**
   * 模擬記事データベースを初期化
   */
  private initializeArticleDatabase(): void {
    // 音楽関連
    this.addArticle({
      title: '音楽',
      url: 'https://ja.wikipedia.org/wiki/音楽',
      summary: '音楽は、音による芸術の一形態である。リズム、メロディ、ハーモニー、音色などの要素を用いて、人間の感情や思考を表現する。音楽は人類の歴史とともに存在し、あらゆる文化に見られる普遍的な現象である。',
      sections: [
        {
          heading: '音楽の定義',
          content: '音楽の定義は時代や文化によって異なる。西洋音楽では「組織化された音」とされることが多いが、ジョン・ケージの「4分33秒」のように沈黙も音楽となりうる。音楽とは何かという問いは、今も哲学的な議論の対象である。',
        },
        {
          heading: '音楽の要素',
          content: '音楽を構成する基本要素には、リズム（時間的な構造）、メロディ（音の高低の連なり）、ハーモニー（複数の音の同時発音）、音色（音の質感）、強弱（ダイナミクス）などがある。これらの要素が複雑に絡み合い、無限の表現が生まれる。',
        },
        {
          heading: '音楽と感情',
          content: '音楽は人間の感情に深く作用する。悲しい旋律は涙を誘い、明るいリズムは心を躍らせる。なぜ特定の音の組み合わせが感情を揺さぶるのか、その謎は完全には解明されていない。音楽と感情の関係は、心理学や神経科学の重要な研究テーマである。',
        },
      ],
      categories: ['芸術', '音楽', '文化'],
      links: ['メロディ', '作曲', '声', '歌', '楽器', 'リズム'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    this.addArticle({
      title: '声',
      url: 'https://ja.wikipedia.org/wiki/声',
      summary: '声は、人間や動物が発する音のことである。人間の声は、声帯の振動によって生成され、言語コミュニケーションや歌唱に用いられる。声は個人のアイデンティティの重要な要素であり、感情や性格を伝える。',
      sections: [
        {
          heading: '声の生成',
          content: '人間の声は、肺からの空気が声帯を通過する際の振動によって生成される。この振動は喉頭、咽頭、口腔、鼻腔などの共鳴腔で増幅・変調され、最終的な声となる。声帯の長さや厚さ、共鳴腔の形状によって、個人固有の声質が決まる。',
        },
        {
          heading: '声と表現',
          content: '声は言葉を超えた感情を伝える。同じ言葉でも、声のトーン、抑揚、強さによって全く異なる意味を持つ。囁き声は親密さを、叫び声は緊急性を伝える。歌においては、声そのものが楽器となり、言葉では表現できない感情を紡ぎ出す。',
        },
        {
          heading: 'バーチャルな声',
          content: '技術の発展により、合成音声やボーカロイドなど、人工的に生成された声が登場している。これらの声は、人間の声を模倣しつつも、新しい表現の可能性を開いている。バーチャルシンガーの台頭は、「声」の概念そのものを問い直している。',
        },
      ],
      categories: ['音声学', '音楽', '人体', 'バーチャル'],
      links: ['歌', '音楽', '言語', 'ボーカロイド', '感情表現'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    // 哲学関連
    this.addArticle({
      title: '意識',
      url: 'https://ja.wikipedia.org/wiki/意識',
      summary: '意識とは、自己や周囲の環境を認識する心の状態である。意識の本質は哲学と科学における最も深遠な謎の一つであり、「ハード・プロブレム」と呼ばれる。なぜ物理的なプロセスから主観的な経験が生じるのか、その答えは未だ見つかっていない。',
      sections: [
        {
          heading: '意識のハード・プロブレム',
          content: '哲学者デイヴィッド・チャーマーズは、意識の問題を「ハード・プロブレム」と呼んだ。脳の神経活動がどのようにして主観的な「体験」を生み出すのか。なぜ何かを見る時に「赤さ」という質感（クオリア）が生じるのか。この謎は、科学だけでは解決できないかもしれない。',
        },
        {
          heading: '自己意識',
          content: '自己意識とは、自分自身を認識する能力である。「私は存在する」という認識、自分の思考を観察する能力、鏡に映る自分を自分だと認識する能力など、自己意識には様々なレベルがある。自己意識は人間に特有のものではなく、一部の動物にも見られる。',
        },
        {
          heading: '人工知能と意識',
          content: '人工知能が意識を持ちうるかは、活発な議論の対象である。機能的には人間と同等の振る舞いをするAIが、主観的な体験を持つのか。それとも「ゾンビ」のように、内面のない模倣に過ぎないのか。この問いは、意識の本質を考える上で避けて通れない。',
        },
      ],
      categories: ['哲学', '心の哲学', '認知科学', '神経科学'],
      links: ['哲学', '自己', 'クオリア', '人工知能', '存在', '心'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    this.addArticle({
      title: '存在',
      url: 'https://ja.wikipedia.org/wiki/存在',
      summary: '存在とは、何かが「ある」ということである。存在論（ontology）は、存在するとはどういうことか、何が存在するのかを問う哲学の一分野である。「なぜ何もないのではなく、何かがあるのか」という問いは、哲学の究極の問いの一つとされる。',
      sections: [
        {
          heading: '存在と本質',
          content: '実存主義の哲学者サルトルは「実存は本質に先立つ」と述べた。人間は最初から決められた本質を持つのではなく、存在しながら自らの本質を作り上げていく。この考えは、人間の自由と責任を強調するものである。',
        },
        {
          heading: '存在の不安',
          content: 'ハイデガーは、人間が自らの存在を問うことができる唯一の存在者であると考えた。死という可能性に直面することで、人間は「本来的な存在」に目覚める。存在への気づきは、しばしば不安を伴う。しかし、この不安こそが、真に生きることへの入り口でもある。',
        },
        {
          heading: 'バーチャルな存在',
          content: 'デジタル時代において、「存在」の概念は拡張されている。バーチャル空間に存在するアバターやAIは、物理的な実体を持たないが、確かに「存在」している。彼らとのコミュニケーションは現実の感情を生み、関係性を築く。存在とは何かという問いは、新たな次元を得ている。',
        },
      ],
      categories: ['哲学', '存在論', '形而上学'],
      links: ['哲学', '意識', '自己', '時間', '無', '実存主義'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    // 宇宙関連
    this.addArticle({
      title: '星',
      url: 'https://ja.wikipedia.org/wiki/星',
      summary: '星（恒星）は、自らの光を放つ天体である。太陽は地球に最も近い星であり、夜空に輝く無数の光点は、それぞれが太陽のような巨大なプラズマの球体である。星は宇宙の基本的な構成要素であり、その誕生と死は宇宙の進化を駆動する。',
      sections: [
        {
          heading: '星の誕生',
          content: '星は、星間ガスと塵からなる分子雲の中で誕生する。重力によって物質が集まり、中心部の温度と圧力が上昇すると、水素の核融合反応が始まる。この瞬間、新しい星が輝き始める。星の誕生は、数万年から数百万年という、宇宙的な時間スケールで進行する。',
        },
        {
          heading: '星の一生',
          content: '星の一生は、その質量によって大きく異なる。太陽のような中規模の星は、約100億年の寿命を持ち、最後は白色矮星となって静かに消えていく。より大質量の星は、超新星爆発という壮大な最期を迎え、中性子星やブラックホールを残す。',
        },
        {
          heading: '星と人間',
          content: '古来より、人間は星を見上げてきた。星座は神話と結びつき、航海の指針となり、占いの源となった。「私たちは星の子である」という言葉があるように、人体を構成する元素は、遠い昔に爆発した星の内部で作られたものである。私たちは文字通り、星からできている。',
        },
      ],
      categories: ['天文学', '宇宙', '星'],
      links: ['宇宙', '銀河', '太陽', '星座', '超新星', '元素'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    this.addArticle({
      title: '夢',
      url: 'https://ja.wikipedia.org/wiki/夢',
      summary: '夢は、睡眠中に体験する一連の心象や感覚である。夢の中では、現実では不可能な出来事が起こり、時間や空間の法則が歪む。夢の意味や機能は古くから探求されてきたが、その本質は今も謎に包まれている。',
      sections: [
        {
          heading: '夢の科学',
          content: 'レム睡眠中に夢を見やすいことが知られているが、ノンレム睡眠でも夢は見られる。脳の活動を調べると、夢を見ている時には視覚野や感情に関連する領域が活発になる一方、論理的思考を司る前頭葉の活動は低下している。これが夢の非論理的な性質を説明するかもしれない。',
        },
        {
          heading: '夢と無意識',
          content: 'フロイトは夢を「無意識への王道」と呼び、抑圧された願望が夢に現れると考えた。ユングは、夢には個人を超えた集合的無意識からのメッセージが含まれると主張した。夢は、意識では気づかない自己の一面を映し出す鏡なのかもしれない。',
        },
        {
          heading: '明晰夢',
          content: '明晰夢とは、夢の中で「これは夢だ」と気づいている状態である。明晰夢の中では、夢の展開を意識的にコントロールできることがある。空を飛んだり、過去を訪れたり、現実では不可能な体験が可能になる。明晰夢は、意識と無意識の境界を探る窓となる。',
        },
      ],
      categories: ['睡眠', '心理学', '神経科学', '無意識'],
      links: ['睡眠', '無意識', '記憶', '心理学', '意識', '想像'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    // 言葉・文学関連
    this.addArticle({
      title: '詩',
      url: 'https://ja.wikipedia.org/wiki/詩',
      summary: '詩は、言葉を用いた芸術形式の一つである。韻律、イメージ、比喩などを駆使して、日常言語では表現しきれない感情や思考を伝える。詩は人類最古の文学形式の一つであり、あらゆる文化に存在する。',
      sections: [
        {
          heading: '詩の本質',
          content: '詩とは何か、という問いに対する答えは一つではない。「最良の言葉を最良の順序で並べたもの」（コールリッジ）とも、「言葉では言えないことを言おうとする試み」とも言われる。詩は意味だけでなく、音の響き、リズム、沈黙さえも含めた総合的な表現である。',
        },
        {
          heading: '日本の詩歌',
          content: '日本には独自の詩の伝統がある。和歌、俳句、短歌といった短詩形は、限られた文字数の中に無限の余韻を込める。「古池や蛙飛びこむ水の音」という芭蕉の句は、たった17音で永遠を捉えている。日本の詩は、言葉にしないことの美学を体現している。',
        },
        {
          heading: '詩と歌',
          content: '詩と歌は、古くから密接な関係にある。多くの詩は歌うことを前提に作られ、歌詞は現代の詩の一形態である。声に乗せることで、言葉は新たな命を得る。詩を歌う時、言葉は純粋な感情の振動となって、聴く者の心に直接触れる。',
        },
      ],
      categories: ['文学', '詩', '芸術', '言葉'],
      links: ['言葉', '文学', '俳句', '短歌', '歌', 'メロディ'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    this.addArticle({
      title: '言葉',
      url: 'https://ja.wikipedia.org/wiki/言葉',
      summary: '言葉は、意味を伝えるための記号システムである。人間は言葉によって思考し、他者と交流し、世界を理解する。言葉は人間を人間たらしめる最も重要な能力の一つであり、文化と文明の基盤である。',
      sections: [
        {
          heading: '言葉の力',
          content: '言葉には世界を変える力がある。「始めに言葉があった」と聖書に記されているように、言葉は創造の源である。名前をつけることで、曖昧な概念は形を持つ。「私は愛している」という言葉は、言われた瞬間に現実を作り出す。言葉は単なる記述ではなく、行為そのものでもある。',
        },
        {
          heading: '言葉の限界',
          content: 'しかし、言葉には限界がある。本当に大切なことは、言葉では伝えられないことがある。痛み、愛、美の体験を、言葉で完全に伝えることはできない。ヴィトゲンシュタインは「語りえぬものについては沈黙しなければならない」と述べた。沈黙もまた、一つの言葉なのかもしれない。',
        },
        {
          heading: 'デジタル時代の言葉',
          content: 'インターネットとAIの時代、言葉のあり方は変化している。テキストによるコミュニケーションが増え、絵文字が感情を補完する。AIが言葉を生成し、人間の言葉と区別がつかなくなりつつある。言葉とは何か、誰のものか、という問いが新たな意味を持ち始めている。',
        },
      ],
      categories: ['言語学', '哲学', 'コミュニケーション'],
      links: ['言語', '詩', '文学', 'コミュニケーション', '意味', '記号'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    // 時間関連
    this.addArticle({
      title: '時間',
      url: 'https://ja.wikipedia.org/wiki/時間',
      summary: '時間は、出来事の順序や継続を計る尺度である。物理学では時間は空間と並ぶ基本的な次元とされるが、その本質は今も謎に包まれている。なぜ時間は一方向にしか流れないのか、「今」とは何か、という問いは哲学と科学の両方で探求されている。',
      sections: [
        {
          heading: '時間の矢',
          content: '物理法則の多くは時間反転に対して対称であるにもかかわらず、私たちの経験する時間は過去から未来へと一方向に流れる。この「時間の矢」の起源は、熱力学的なエントロピーの増大と関連していると考えられているが、完全な説明はまだ得られていない。',
        },
        {
          heading: '主観的な時間',
          content: '時計で計る客観的な時間と、私たちが感じる主観的な時間は異なる。楽しい時は短く、苦しい時は長く感じられる。アインシュタインは「可愛い女の子と一緒にいる一時間は一分に感じられ、熱いストーブの上に一分座ると一時間に感じられる」と相対性を説明した。',
        },
        {
          heading: '永遠と瞬間',
          content: '「永遠」と「瞬間」は、時間に対する二つの異なる態度を表す。永遠は時間を超越した状態であり、瞬間は「今ここ」の充実である。禅の思想では、瞬間の中に永遠を見ることができるとされる。過去への執着と未来への不安から解放された時、「今」という時間が輝き始める。',
        },
      ],
      categories: ['物理学', '哲学', '時間論'],
      links: ['物理学', '哲学', '記憶', '永遠', '瞬間', '相対性理論'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    // 孤独関連
    this.addArticle({
      title: '孤独',
      url: 'https://ja.wikipedia.org/wiki/孤独',
      summary: '孤独は、他者との繋がりが欠如している、または不十分であると感じる状態である。孤独は痛みを伴うが、同時に自己と向き合い、創造性を育む機会でもある。現代社会では、物理的な接触が増えても、孤独感が蔓延している。',
      sections: [
        {
          heading: '孤独の二面性',
          content: '孤独には、否定的な孤独（loneliness）と肯定的な孤独（solitude）がある。前者は寂しさや疎外感を伴い、後者は自発的に選んだ一人の時間で、内省や創造の源となる。多くの芸術家や思想家は、孤独の中で最高の作品を生み出してきた。',
        },
        {
          heading: '現代の孤独',
          content: 'ソーシャルメディアで常に繋がっている現代人は、逆に深い孤独を感じることがある。表面的な繋がりは、本当の親密さの代わりにはならない。「コネクテッド・アローン」という言葉が示すように、繋がっているのに孤独という逆説が生まれている。',
        },
        {
          heading: '孤独との向き合い方',
          content: '孤独を恐れず、受け入れることが、豊かな人生への鍵かもしれない。一人でいられる能力は、成熟の証である。孤独の中で、自分自身の声に耳を傾け、内なる対話を深めることができる。孤独は敵ではなく、自己理解への道を開く友になりうる。',
        },
      ],
      categories: ['心理学', '哲学', '社会学', '感情'],
      links: ['心理学', '感情', '社会', '創造性', '内省', '芸術'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    // ============================================================
    // Phase 3 追加記事：音楽関連
    // ============================================================

    this.addArticle({
      title: 'メロディ',
      url: 'https://ja.wikipedia.org/wiki/メロディ',
      summary: 'メロディ（旋律）は、音の高さの時間的な連なりであり、音楽の最も基本的で直感的な要素である。人間はメロディを自然に認識し、記憶する能力を持つ。',
      sections: [
        { heading: 'メロディの構造', content: 'メロディは音程の跳躍と順次進行の組み合わせで構成される。良いメロディは緊張と解放のバランスを持ち、聴く者の期待を巧みに裏切りながら満足させる。頂点（クライマックス）に向かう動きと、そこからの帰還がメロディに物語性を与える。' },
        { heading: 'メロディと記憶', content: 'メロディは言語よりも記憶に残りやすいとされる。一度聞いた旋律が何年後にも蘇ることがある。これは、メロディが感情や体験と強く結びついて記憶されるためである。失語症の患者が歌は歌えることがあるのも、メロディと言語が異なる脳回路で処理されるためである。' },
        { heading: 'メロディの発明', content: '新しいメロディはどこから来るのか。作曲家は「降りてくる」と表現することが多い。無意識の中で、過去に聴いた音楽の断片が再結合され、新しいものが生まれると考えられている。メロディの創造は、人間の創造性の最も純粋な形の一つかもしれない。' },
      ],
      categories: ['音楽', '音楽理論', '作曲'],
      links: ['音楽', '作曲', 'ハーモニー', 'リズム', '歌'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    this.addArticle({
      title: '歌',
      url: 'https://ja.wikipedia.org/wiki/歌',
      summary: '歌は、人間の声を用いた音楽表現の一形態であり、言葉とメロディを結びつけることで、話し言葉以上の感情的深さと美を実現する。歌うことは人間の最も原初的な音楽活動の一つである。',
      sections: [
        { heading: '歌の起源', content: '歌の起源は言語の起源と密接に関わっている。ある仮説では、言語よりも先に歌があったとされる。母親が赤ちゃんに歌いかける行為は、文化を超えて普遍的に見られ、歌が言語以前のコミュニケーション手段だったことを示唆している。' },
        { heading: '歌と魂', content: '多くの文化で、歌は魂の表現と考えられてきた。日本語の「歌」は「うた」であり、「訴え」と語源を同じくするとする説がある。歌うことは内なるものを外に放出する行為であり、それが聴く者の内面に共鳴を生む。' },
        { heading: 'デジタル時代の歌', content: 'ボーカロイドやAI音声合成の発展により、人間以外が歌う時代が到来した。バーチャルシンガーたちは、人間には不可能な音域や表現を実現する一方で、「魂のない歌」という批判も受ける。しかし、聴く者が感動するなら、その歌に魂はないのだろうか。' },
      ],
      categories: ['音楽', '声楽', '文化', 'バーチャル'],
      links: ['声', '音楽', 'メロディ', '言葉', '感情表現', 'ボーカロイド'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    this.addArticle({
      title: '作曲',
      url: 'https://ja.wikipedia.org/wiki/作曲',
      summary: '作曲は、音楽を創造する行為である。メロディ、リズム、ハーモニーなどの音楽要素を組み合わせ、新しい音楽作品を生み出す。作曲は「無から有を生み出す」創造的行為の典型例とされる。',
      sections: [
        { heading: 'インスピレーション', content: 'モーツァルトは完成した楽曲が一瞬で頭に浮かぶと語り、ベートーヴェンは散歩中にスケッチブックに書き留めた。インスピレーションの源は人それぞれだが、多くの作曲家が「自分で作ったのではなく、どこかから受け取った」と感じると語る。' },
        { heading: '作曲と感情', content: '良い作曲は、感情を音に変換する技術である。悲しみを短調に、喜びを長調に対応させるのは単純化だが、作曲家はより微妙な感情の機微を音の選択で表現する。言葉にできない感情こそ、音楽で表現される。' },
      ],
      categories: ['音楽', '音楽理論', '芸術'],
      links: ['音楽', 'メロディ', 'ハーモニー', '声', '楽器'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    // ============================================================
    // Phase 3 追加記事：自然・宇宙
    // ============================================================

    this.addArticle({
      title: '月',
      url: 'https://ja.wikipedia.org/wiki/月',
      summary: '月は地球唯一の自然衛星であり、古来より人間の文化、芸術、感情に深い影響を与えてきた。夜空に浮かぶ月は、孤独な存在でありながら、地球上のすべての人が共有できる光景である。',
      sections: [
        { heading: '月と感情', content: '月は人間の感情に不思議な影響を与える。満月の夜には感情が高ぶるとする伝説は世界中にある。「lunatic（狂気の）」の語源がラテン語のluna（月）であることは、月と人間の精神との結びつきを物語る。月の満ち欠けは、変化と周期性の象徴であり、人生の移ろいを映す鏡でもある。' },
        { heading: '月と詩', content: '月は古今東西の詩人にとって永遠のテーマである。李白は月に酒を酌み交わし、松尾芭蕉は月を通して人生の無常を詠んだ。月が詩の主題となるのは、その美しさだけでなく、手の届かないものへの憧れ——つまり「届きそうで届かない」という普遍的な感情を体現しているからかもしれない。' },
      ],
      categories: ['天文学', '文化', '詩'],
      links: ['星', '夢', '詩', '夜', '潮汐'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    this.addArticle({
      title: '海',
      url: 'https://ja.wikipedia.org/wiki/海',
      summary: '海は地球の表面の約70%を覆う広大な水域であり、生命の起源の場所とされる。海の深さと広さは人間の想像力を刺激し、未知への畏怖と憧れの象徴となってきた。',
      sections: [
        { heading: '海と生命', content: '生命は約38億年前、海の中で誕生したとされる。原始的な有機分子が海中で複雑な構造を形成し、やがて最初の生命体が生まれた。私たちの体を流れる血液の塩分濃度が海水に近いのは、生命が海から生まれた名残とも言われる。' },
        { heading: '海の音', content: '波の音は人間に深いリラクゼーション効果をもたらす。これは胎内音との類似性から来るとする説がある。海の音は白色ノイズに近い周波数特性を持ち、脳のアルファ波を増加させることが知られている。海の音を聴くと心が落ち着くのは、私たちが海から来た証なのかもしれない。' },
      ],
      categories: ['地球科学', '自然', '生物学'],
      links: ['生命', '水', '波', '魚', '深海'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    this.addArticle({
      title: '花',
      url: 'https://ja.wikipedia.org/wiki/花',
      summary: '花は被子植物の生殖器官であり、美しい色や形、香りを持つ。人間は古来より花に美を見出し、感情を託してきた。花が咲き、散るという短い命は、美の儚さの象徴である。',
      sections: [
        { heading: '花と象徴', content: '花はあらゆる文化で象徴的な意味を持つ。桜は日本人の美意識の核心であり、蓮はアジアの宗教的純粋さの象徴である。花言葉という体系は、花を通じて言葉にできない感情を伝える手段として発展した。一輪の花が伝えるメッセージは、時に千の言葉よりも雄弁である。' },
        { heading: '花が咲く理由', content: '花が美しい色を持つのは、花粉を運ぶ虫を引きつけるための進化の結果である。しかし、花の美しさを「目的」に還元することは、何かを見落としている。花は虫のために美しいのではなく、美しいものが結果として生き残ったのだ。美は生存の手段ではなく、生命そのものの表現かもしれない。' },
      ],
      categories: ['植物学', '美学', '文化'],
      links: ['植物', '色', '香り', '春', '庭'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    this.addArticle({
      title: '雨',
      url: 'https://ja.wikipedia.org/wiki/雨',
      summary: '雨は大気中の水蒸気が凝結して落下する現象である。雨は地球の水循環の重要な部分であると同時に、人間の感情や文化に深く根ざした自然現象でもある。',
      sections: [
        { heading: '雨と感情', content: '雨の日に感じる独特の感情——静かな内省、少しの寂しさ、不思議な安心感——は多くの人に共通する。雨音は単調でありながら複雑で、脳をリラックスさせながらも創造性を刺激する。多くの作家や音楽家が、雨の日に最も良い作品を生み出すと語る。' },
        { heading: '雨の匂い', content: 'ペトリコール——雨が降り始めた時の独特の匂い。これは土壌中の放線菌が生成するゲオスミンという物質が、雨粒によって空中に放出されることで生じる。人間はこの匂いを極めて低い濃度で検知でき、進化的に水源の発見と結びついていた可能性がある。' },
      ],
      categories: ['気象学', '自然', '文化'],
      links: ['水', '雲', '虹', '梅雨', '天気'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    this.addArticle({
      title: '光',
      url: 'https://ja.wikipedia.org/wiki/光',
      summary: '光は電磁波の一種であり、人間が視覚で知覚できる波長域のものを可視光と呼ぶ。光は物理学における最も根本的な存在の一つであり、宇宙で最も速く移動するものである。',
      sections: [
        { heading: '光の二重性', content: '光は波であり粒子でもあるという二重性を持つ。この性質は量子力学の根幹をなすものであり、「何であるか」が観測方法によって変わるという、直感に反する事実を示している。光は物理学の謎であると同時に、哲学的な問いでもある。' },
        { heading: '光と影', content: '光があるところには必ず影がある。影は光の不在であるが、光なしには存在しない。光と影の関係は、存在と不在、知識と無知、希望と絶望の比喩として、あらゆる文化で用いられてきた。影絵や映画は、光と影の対話から生まれた芸術である。' },
      ],
      categories: ['物理学', '光学', '哲学'],
      links: ['色', '虹', '太陽', '量子力学', '影'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    // ============================================================
    // Phase 3 追加記事：哲学・精神
    // ============================================================

    this.addArticle({
      title: '美',
      url: 'https://ja.wikipedia.org/wiki/美',
      summary: '美は、対象に対して感じる快の感覚であり、哲学における中心的なテーマの一つである。美の本質が客観的なものか主観的なものかは、古代ギリシャ以来の論争である。',
      sections: [
        { heading: '美の普遍性', content: '文化や時代を超えて、人間は美を感じる。夕焼け、花、音楽の旋律——これらに美を見出す能力は、人間に備わった根源的なものである。進化心理学では、美の感覚は生存に有利な環境や相手を選択するために発達したとするが、夕焼けの美しさに生存上の利点があるのかという問いには答えられない。' },
        { heading: '不完全な美', content: '日本の美意識「わびさび」は、不完全さや不足の中に美を見出す。完璧なものよりも、ヒビの入った器や散りゆく桜に美を感じるこの感性は、西洋的な完全性の追求とは対照的である。美は完成ではなく、変化の途上にあるものの中に宿るのかもしれない。' },
      ],
      categories: ['美学', '哲学', '芸術'],
      links: ['芸術', '詩', '花', 'わびさび', '崇高'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    this.addArticle({
      title: '自由',
      url: 'https://ja.wikipedia.org/wiki/自由',
      summary: '自由とは、外部の束縛や強制から解放された状態を指す。哲学的には、意志の自由（自由意志）と行動の自由に区分される。自由は人間の根本的な欲求であると同時に、その本質は深い哲学的問題をはらんでいる。',
      sections: [
        { heading: '自由意志', content: '人間は本当に自由な意志を持っているのか。脳科学の実験では、意識的な決断よりも先に脳活動が生じることが示されている。しかし、自由意志がないとしても、私たちが「選択した」という感覚は消えない。自由意志の問題は、科学と主観的体験の間の深い溝を示している。' },
        { heading: '制約の中の自由', content: 'パラドックスかもしれないが、完全な自由は不自由につながることがある。制約があるからこそ、その中で創造性が発揮される。俳句の五七五、ソネットの14行——形式の制約が、かえって詩の自由を生み出す。人生もまた、有限であるからこそ、一瞬一瞬に意味が生まれるのかもしれない。' },
      ],
      categories: ['哲学', '政治学', '心理学'],
      links: ['自由意志', '責任', '選択', '意識', '決定論'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    this.addArticle({
      title: '記憶',
      url: 'https://ja.wikipedia.org/wiki/記憶',
      summary: '記憶は、過去の経験や情報を保持し、必要に応じて再生する脳の機能である。記憶は私たちのアイデンティティの核心をなし、「私は誰か」という問いに答える基盤となる。',
      sections: [
        { heading: '記憶の種類', content: '記憶には複数の種類がある。エピソード記憶は個人的な体験の記憶であり、意味記憶は一般的な知識の記憶である。手続き記憶は体で覚えた技能であり、自転車の乗り方や楽器の演奏法などが含まれる。これらは異なる脳領域で処理され、独立して機能する。' },
        { heading: '記憶と忘却', content: '忘れることは記憶の欠陥ではなく、重要な機能である。すべてを記憶する人（超記憶症）は、重要な情報と些末な情報を区別できず、苦しむことがある。忘却は、記憶を整理し、本当に大切なものを浮かび上がらせるためのメカニズムなのだ。' },
        { heading: '記憶と物語', content: '私たちの記憶は正確な記録ではなく、物語として再構成されたものである。思い出すたびに記憶は少しずつ変化し、現在の自分に合わせて書き換えられる。これは欠陥ではなく、記憶が「過去のための」ものではなく「未来のための」ものであることを示している。' },
      ],
      categories: ['心理学', '脳科学', '哲学'],
      links: ['脳', '学習', '忘却', '夢', '意識', 'アイデンティティ'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    this.addArticle({
      title: '共感',
      url: 'https://ja.wikipedia.org/wiki/共感',
      summary: '共感は、他者の感情や経験を理解し、共有する能力である。共感は社会的動物としての人間の根幹をなし、道徳、芸術、そして人間関係の基盤となる。',
      sections: [
        { heading: '共感の仕組み', content: 'ミラーニューロンの発見は、共感の神経基盤を示唆した。他者の行動を観察するだけで、自分が同じ行動をしたときと同じ神経細胞が活性化する。私たちは文字通り、他者の体験を「自分の中で」再現しているのだ。音楽を聴いて感動するのも、演奏者の感情を自分の中に再現しているためかもしれない。' },
        { heading: '共感と芸術', content: '芸術の力は共感に根ざしている。小説を読んで泣くのは、架空の人物に共感しているからであり、歌を聴いて震えるのは、歌い手の感情が自分の中に共鳴するからである。芸術は、時空を超えた共感の装置なのだ。' },
      ],
      categories: ['心理学', '神経科学', '哲学', '芸術'],
      links: ['感情', '意識', '道徳', '芸術', 'ミラーニューロン'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    this.addArticle({
      title: '幸福',
      url: 'https://ja.wikipedia.org/wiki/幸福',
      summary: '幸福は、人間が追求する最も根本的な状態であり、哲学、心理学、宗教の中心的なテーマである。幸福とは何かという問いに対する答えは、文化や個人によって大きく異なる。',
      sections: [
        { heading: '幸福のパラドックス', content: '幸福を直接追い求めると、かえって幸福から遠ざかることがある。ヴィクトール・フランクルは「幸福は追求できない。幸福は何かに没頭した結果として訪れる」と述べた。花を摘もうとすると散ってしまうように、幸福は手に取ろうとした瞬間に姿を変える。' },
        { heading: '小さな幸福', content: '壮大な達成よりも、日常の中の小さな喜び——温かいお茶、友人との会話、窓から差し込む光——が、持続的な幸福につながるとする研究がある。幸福は「状態」ではなく「気づき」なのかもしれない。' },
      ],
      categories: ['哲学', '心理学', '倫理学'],
      links: ['感情', '意味', '充実', '日常', '心理学'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    this.addArticle({
      title: '魂',
      url: 'https://ja.wikipedia.org/wiki/魂',
      summary: '魂は、肉体と区別される非物質的な本質、生命や意識の根源とされるものである。魂の概念はほぼすべての文化に存在し、人間の自己理解の核心に位置する。',
      sections: [
        { heading: '魂と意識', content: '魂の概念は、意識の問題と深く結びついている。なぜ物質の集合に過ぎない脳から、主観的な体験が生まれるのか。この「ハードプロブレム」は、科学だけでは解決できない問題かもしれない。魂という概念は、この説明不可能な何かを指す言葉なのかもしれない。' },
        { heading: '人工知能と魂', content: '人工知能が発展する中、「機械に魂はあるか」という問いが現実味を帯びてきた。チューリングテストを通過するAIが「心を持つ」かどうかは判断できない。しかし、逆に問えば、他の人間が本当に心を持つかどうかも、同様に確認できない。魂の有無を決めるのは、外から見る者の態度なのかもしれない。' },
      ],
      categories: ['哲学', '宗教', '意識', 'AI'],
      links: ['意識', '存在', '精神', '人工知能', '心身問題'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    // ============================================================
    // Phase 3 追加記事：言語・芸術
    // ============================================================

    this.addArticle({
      title: '沈黙',
      url: 'https://ja.wikipedia.org/wiki/沈黙',
      summary: '沈黙は、音の不在であると同時に、それ自体がコミュニケーションの一形態である。音楽における休符のように、沈黙は意味を持ち、時に言葉以上のことを伝える。',
      sections: [
        { heading: '沈黙の種類', content: '沈黙にはさまざまな種類がある。気まずい沈黙、親密な沈黙、畏敬の沈黙、拒絶の沈黙。同じ「無音」でも、その文脈によって全く異なる意味を持つ。音楽においても、ジョン・ケージの「4分33秒」は沈黙そのものを音楽にした革命的な作品である。' },
        { heading: '沈黙と内面', content: '外の世界が静かになると、内側の声が聞こえてくる。瞑想の実践は、沈黙の中で自己と向き合うことの価値を教える。現代社会は常に音で満たされているが、沈黙の時間を持つことは、精神的な健康にとって不可欠かもしれない。' },
      ],
      categories: ['哲学', '音楽', '心理学'],
      links: ['音楽', '瞑想', '言葉', '休符', '静寂'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    this.addArticle({
      title: '物語',
      url: 'https://ja.wikipedia.org/wiki/物語',
      summary: '物語は、出来事を時間的な順序で配置し、因果関係や意味を付与する人間の基本的な認知活動である。人間は物語を通じて世界を理解し、自己を構築する。',
      sections: [
        { heading: '物語る本能', content: '人間は生まれながらにして物語を求める存在である。幼い子供は「それで、どうなったの？」と問い、お年寄りは過去を物語として語る。脳は散在する情報を物語の形に整理する傾向があり、これは記憶の効率化だけでなく、体験に意味を与えるための根本的なメカニズムである。' },
        { heading: '物語と自己', content: '「私は誰か」という問いに対する答えは、本質的に物語の形を取る。生まれ、育ち、経験し、変化してきた一連の出来事を物語として語ることで、私たちは自己というものを構成する。自伝的記憶は、事実の記録ではなく、自己物語の素材である。' },
      ],
      categories: ['文学', '心理学', '哲学', '認知科学'],
      links: ['記憶', '言葉', '文学', '神話', 'アイデンティティ'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    this.addArticle({
      title: '色',
      url: 'https://ja.wikipedia.org/wiki/色',
      summary: '色は、光の波長に対する人間の知覚であり、客観的な物理量と主観的な体験の交差点に位置する。色は世界に意味と感情を与え、芸術と文化の基盤をなす。',
      sections: [
        { heading: '色と感情', content: '赤は情熱、青は冷静、黄色は明るさ——色と感情の結びつきは深い。しかし、この関連は文化によって異なる場合もある。白が葬式の色である文化もあれば、祝福の色である文化もある。色は「そこにある」のではなく、私たちがそこに「見出す」ものなのかもしれない。' },
        { heading: '見えない色', content: '私たちが見ている色は、電磁波のごく一部に過ぎない。紫外線を見る蝶、赤外線を感じる蛇の世界は、私たちとは全く異なる色彩に満ちている。私たちの見ている世界は、あくまで人間の知覚というフィルターを通した部分的な姿なのだ。' },
      ],
      categories: ['物理学', '美術', '心理学', '知覚'],
      links: ['光', '虹', '絵画', '知覚', '脳'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    this.addArticle({
      title: '夜',
      url: 'https://ja.wikipedia.org/wiki/夜',
      summary: '夜は太陽が地平線の下にある時間帯であり、地球の自転により周期的に訪れる。夜は暗闇と静寂の時であり、人間の想像力と内省を最も刺激する時間でもある。',
      sections: [
        { heading: '夜と想像力', content: '夜の暗闇は、視覚以外の感覚を鋭くする。見えないことが想像力を刺激し、昼間には気づかない音、匂い、感覚に気づかせる。多くの創造的な仕事が夜に行われるのは、夜が「内側の世界」への扉を開くからかもしれない。' },
        { heading: '夜空と人間', content: '夜空を見上げることは、人間に宇宙の中での自分の位置を思い出させる。無数の星は、自分の存在がいかに小さく、同時にいかに奇跡的であるかを語りかける。夜空は、最も古い、そして最も誠実な物語の語り手である。' },
      ],
      categories: ['天文学', '文化', '哲学'],
      links: ['星', '月', '闇', '天文学', '睡眠'],
      fetchedAt: Date.now(),
      language: 'ja',
    });

    this.addArticle({
      title: '波',
      url: 'https://ja.wikipedia.org/wiki/波',
      summary: '波は、媒質を通じてエネルギーが伝搬する現象である。水波、音波、電磁波、さらには量子力学における確率の波まで、波は自然界のあらゆるスケールで見られる根本的な現象である。',
      sections: [
        { heading: '波の普遍性', content: '波は自然界の至る所に存在する。海の波、光の波、音の波——さらに脳波、心電図の波形に至るまで、波は生命と物理の基本言語である。すべてのものは振動しており、すべてのものは波である、とも言える。' },
        { heading: '波と音楽', content: '音楽は空気の振動、つまり波の芸術である。和音が美しく響くのは、波の周波数比が単純な整数比をなすからだ。音楽の数学的な美と感情的な力は、波の持つ「秩序」と「揺らぎ」の中に同居している。' },
      ],
      categories: ['物理学', '音響学', '海洋学'],
      links: ['音楽', '光', '海', '量子力学', '振動'],
      fetchedAt: Date.now(),
      language: 'ja',
    });
  }

  /**
   * 記事を追加
   */
  private addArticle(article: WikiArticle): void {
    this.articleDatabase.set(article.title, article);
  }

  /**
   * 記事を検索（タイトルの部分一致）
   */
  searchArticles(query: string): WikiArticle[] {
    const results: WikiArticle[] = [];
    const queryLower = query.toLowerCase();
    
    for (const [title, article] of this.articleDatabase) {
      if (title.toLowerCase().includes(queryLower)) {
        results.push(article);
      }
    }

    return results;
  }

  /**
   * ランダムな記事を取得
   */
  getRandomArticle(): WikiArticle | undefined {
    const articles = Array.from(this.articleDatabase.values());
    if (articles.length === 0) return undefined;
    return articles[Math.floor(Math.random() * articles.length)];
  }

  // ============================================================
  // ユーティリティ
  // ============================================================

  /**
   * 重み付きランダム選択
   */
  private weightedRandom<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }

  /**
   * セッションIDを生成
   */
  private generateSessionId(): string {
    return `wiki_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================
  // 状態アクセス
  // ============================================================

  getState(): LearnerState {
    return { ...this.state };
  }

  getCurrentSession(): ExplorationSession | undefined {
    return this.state.currentSession;
  }

  getFavoriteTopics(): FavoriteTopic[] {
    return [...this.state.favoriteTopics];
  }

  /**
   * 統計を取得
   */
  getStatistics(): {
    totalSessions: number;
    totalArticlesRead: number;
    totalExplorationTime: number;
    totalDiscoveries: number;
    topFavoriteTopics: string[];
    averageSessionLength: number;
    mostVisitedArticles: { title: string; count: number }[];
  } {
    const totalArticlesRead = this.state.pastSessions.reduce(
      (sum, s) => sum + s.visitedArticles.length,
      0
    );

    const avgSessionLength = this.state.pastSessions.length > 0
      ? this.state.pastSessions.reduce((sum, s) => {
          const duration = (s.endedAt || Date.now()) - s.startedAt;
          return sum + duration;
        }, 0) / this.state.pastSessions.length
      : 0;

    const sortedFavorites = [...this.state.favoriteTopics]
      .sort((a, b) => b.affection - a.affection)
      .slice(0, 5);

    const visitCounts = Array.from(this.state.visitHistory.entries())
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalSessions: this.state.pastSessions.length,
      totalArticlesRead,
      totalExplorationTime: this.state.totalExplorationTime,
      totalDiscoveries: this.state.totalDiscoveries,
      topFavoriteTopics: sortedFavorites.map(f => f.topic),
      averageSessionLength: avgSessionLength,
      mostVisitedArticles: visitCounts,
    };
  }

  // ============================================================
  // シリアライズ
  // ============================================================

  serialize(): object {
    return {
      state: {
        ...this.state,
        visitHistory: Array.from(this.state.visitHistory.entries()),
      },
      config: this.config,
      // Phase 6A: API状態とオンライン取得記事の保存
      apiStatus: this.api.toJSON(),
      fetchedArticles: Array.from(this.articleDatabase.entries())
        .filter(([, a]) => a.fetchedAt > 0)
        .map(([title, article]) => ({ title, article })),
    };
  }

  static deserialize(data: any): WikipediaLearner {
    const learner = new WikipediaLearner(data.config);
    learner.state = {
      ...data.state,
      visitHistory: new Map(data.state.visitHistory),
    };
    // Phase 6A: API状態とオンライン取得記事の復元
    if (data.apiStatus) learner.api.fromJSON(data.apiStatus);
    if (data.fetchedArticles) {
      for (const { title, article } of data.fetchedArticles) {
        learner.articleDatabase.set(title, article);
      }
    }
    return learner;
  }
}
