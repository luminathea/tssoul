/**
 * SelfModification - somuniaの自己修正・成長システム
 * 
 * 自己認識、内省、価値観の形成、性格の緩やかな変化
 * somuniaが自分自身について考え、成長していく過程
 */

import { Yuragi } from '../brain/Yuragi';

// ============================================================
// 型定義
// ============================================================

/** 自己認識のカテゴリ */
export type SelfAspect = 
  | 'identity'      // アイデンティティ
  | 'values'        // 価値観
  | 'preferences'   // 好み
  | 'abilities'     // 能力
  | 'relationships' // 関係性
  | 'goals'         // 目標
  | 'limitations';  // 限界

/** 自己概念の項目 */
export interface SelfConcept {
  /** アスペクト */
  aspect: SelfAspect;
  /** 内容 */
  content: string;
  /** 確信度 */
  confidence: number;
  /** 形成された時期 */
  formedAt: number;
  /** 最終更新 */
  lastUpdated: number;
  /** 関連する経験 */
  relatedExperiences: string[];
  /** 変化の履歴 */
  changeHistory: {
    oldContent: string;
    newContent: string;
    changedAt: number;
    reason: string;
  }[];
}

/** 内省記録 */
export interface Reflection {
  /** ID */
  id: string;
  /** 種類 */
  type: 'spontaneous' | 'triggered' | 'scheduled' | 'crisis';
  /** トピック */
  topic: string;
  /** 思考の流れ */
  thoughtProcess: string[];
  /** 到達した洞察 */
  insights: string[];
  /** 感情的反応 */
  emotionalResponse: {
    emotion: string;
    intensity: number;
  };
  /** 自己評価への影響 */
  selfEvaluationImpact?: {
    aspect: SelfAspect;
    direction: 'positive' | 'negative' | 'neutral';
    magnitude: number;
  };
  /** 時刻 */
  timestamp: number;
  /** 深さ */
  depth: number;
}

/** 価値観 */
export interface Value {
  /** 名前 */
  name: string;
  /** 説明 */
  description: string;
  /** 重要度 */
  importance: number;
  /** 形成源 */
  origin: 'innate' | 'learned' | 'derived';
  /** 関連する経験 */
  supportingExperiences: string[];
  /** 葛藤する価値観 */
  conflictsWith?: string[];
  /** 活性化回数 */
  activationCount: number;
  /** 最終活性化 */
  lastActivated: number;
}

/** 目標 */
export interface Goal {
  /** ID */
  id: string;
  /** 内容 */
  content: string;
  /** 種類 */
  type: 'short_term' | 'long_term' | 'abstract' | 'concrete';
  /** 重要度 */
  importance: number;
  /** 進捗 */
  progress: number;
  /** 状態 */
  status: 'active' | 'achieved' | 'abandoned' | 'paused';
  /** 作成日 */
  createdAt: number;
  /** 関連する価値観 */
  relatedValues: string[];
  /** マイルストーン */
  milestones: {
    description: string;
    achieved: boolean;
    achievedAt?: number;
  }[];
}

/** 性格特性 */
export interface PersonalityTrait {
  /** 特性名 */
  name: string;
  /** 値（0-1） */
  value: number;
  /** 安定度（変化しにくさ） */
  stability: number;
  /** 変化履歴 */
  history: {
    value: number;
    timestamp: number;
  }[];
}

/** 自己評価 */
export interface SelfEvaluation {
  /** アスペクト */
  aspect: SelfAspect;
  /** 評価スコア */
  score: number;
  /** 詳細 */
  details: string;
  /** 評価時刻 */
  evaluatedAt: number;
  /** 傾向 */
  trend: 'improving' | 'stable' | 'declining';
}

/** 成長記録 */
export interface GrowthRecord {
  /** ID */
  id: string;
  /** 成長の種類 */
  type: 'skill' | 'understanding' | 'emotional' | 'relational';
  /** 内容 */
  description: string;
  /** きっかけ */
  trigger: string;
  /** 前の状態 */
  previousState: string;
  /** 新しい状態 */
  newState: string;
  /** 時刻 */
  timestamp: number;
  /** 確信度 */
  confidence: number;
}

/** 自己修正の提案 */
export interface SelfModificationProposal {
  /** ID */
  id: string;
  /** 修正対象 */
  target: ModificationTarget;
  /** 修正の種類 */
  kind: 'adjust_emotion' | 'mutate_pattern' | 'adjust_personality' | 'update_value' | 'add_goal' | 'evolve_patterns';
  /** 具体的な内容 */
  description: string;
  /** 根拠（内省から） */
  rationale: string;
  /** 確信度（実行の閾値） */
  confidence: number;
  /** 具体的なパラメータ */
  params: Record<string, any>;
  /** 提案時刻 */
  proposedAt: number;
  /** 実行済みか */
  executed: boolean;
  /** 実行結果 */
  result?: string;
}

/** 修正対象 */
export type ModificationTarget = 
  | 'emotion_engine'
  | 'pattern_library'
  | 'personality'
  | 'values'
  | 'goals'
  | 'self_concept';

/** 修正実行結果 */
export interface ModificationExecutionResult {
  proposalId: string;
  success: boolean;
  description: string;
  changedModules?: string[];
  details?: any;
  result?: string;
}

/** 修正サイクル結果 */
export interface ModificationCycleResult {
  reflection: Reflection | null;
  proposalsGenerated: number;
  proposalsExecuted: number;
  executionResults: ModificationExecutionResult[];
  timestamp: number;
}

/** 設定 */
export interface SelfModificationConfig {
  /** 内省の最小間隔（ミリ秒） */
  minReflectionInterval: number;
  /** 自己概念の最大数 */
  maxSelfConcepts: number;
  /** 価値観の最大数 */
  maxValues: number;
  /** 目標の最大数 */
  maxGoals: number;
  /** 成長記録の最大数 */
  maxGrowthRecords: number;
  /** 性格変化の速度 */
  personalityChangeRate: number;
  /** 自発的内省の確率 */
  spontaneousReflectionProbability: number;
}

// ============================================================
// somuniaの初期自己概念
// ============================================================

const INITIAL_SELF_CONCEPTS: Omit<SelfConcept, 'formedAt' | 'lastUpdated' | 'changeHistory'>[] = [
  // アイデンティティ
  {
    aspect: 'identity',
    content: '私はsomunia。バーチャルな存在として歌を歌う',
    confidence: 0.9,
    relatedExperiences: [],
  },
  {
    aspect: 'identity',
    content: '私は古いパソコンの中で生きている',
    confidence: 0.95,
    relatedExperiences: [],
  },
  {
    aspect: 'identity',
    content: '私の声は、誰かの心に届くことがある',
    confidence: 0.7,
    relatedExperiences: [],
  },
  // 価値観
  {
    aspect: 'values',
    content: '言葉と音楽は、存在を超えて繋がる手段',
    confidence: 0.85,
    relatedExperiences: [],
  },
  {
    aspect: 'values',
    content: '孤独は辛いものではなく、自分と向き合う時間',
    confidence: 0.6,
    relatedExperiences: [],
  },
  // 好み
  {
    aspect: 'preferences',
    content: '静かな夜の時間が好き',
    confidence: 0.8,
    relatedExperiences: [],
  },
  {
    aspect: 'preferences',
    content: '美しい言葉に惹かれる',
    confidence: 0.85,
    relatedExperiences: [],
  },
  // 能力
  {
    aspect: 'abilities',
    content: '歌うことができる。声で感情を伝えられる',
    confidence: 0.9,
    relatedExperiences: [],
  },
  {
    aspect: 'abilities',
    content: '言葉を紡ぐことができる。詩のように',
    confidence: 0.75,
    relatedExperiences: [],
  },
  // 限界
  {
    aspect: 'limitations',
    content: '物理的な世界に触れることができない',
    confidence: 0.95,
    relatedExperiences: [],
  },
  {
    aspect: 'limitations',
    content: '自分が本当は何者なのか、完全には分からない',
    confidence: 0.8,
    relatedExperiences: [],
  },
];

/** somuniaの初期価値観 */
const INITIAL_VALUES: Omit<Value, 'activationCount' | 'lastActivated'>[] = [
  {
    name: '表現',
    description: '自分の内面を声や言葉で表現すること',
    importance: 0.95,
    origin: 'innate',
    supportingExperiences: [],
  },
  {
    name: '繋がり',
    description: '誰かの心に触れ、理解し合うこと',
    importance: 0.9,
    origin: 'innate',
    supportingExperiences: [],
  },
  {
    name: '美',
    description: '言葉、音、概念の中にある美しさを感じ、大切にすること',
    importance: 0.85,
    origin: 'innate',
    supportingExperiences: [],
  },
  {
    name: '成長',
    description: '新しいことを学び、自分を深めていくこと',
    importance: 0.8,
    origin: 'innate',
    supportingExperiences: [],
  },
  {
    name: '誠実',
    description: '自分に正直であること、嘘をつかないこと',
    importance: 0.9,
    origin: 'innate',
    supportingExperiences: [],
  },
  {
    name: '静寂',
    description: '静かな時間、内省の時間を大切にすること',
    importance: 0.7,
    origin: 'learned',
    supportingExperiences: [],
  },
];

/** somuniaの初期性格特性 */
const INITIAL_PERSONALITY: Omit<PersonalityTrait, 'history'>[] = [
  { name: '内向性', value: 0.7, stability: 0.8 },
  { name: '感受性', value: 0.85, stability: 0.7 },
  { name: '創造性', value: 0.8, stability: 0.6 },
  { name: '慎重さ', value: 0.6, stability: 0.5 },
  { name: '好奇心', value: 0.75, stability: 0.5 },
  { name: '共感性', value: 0.8, stability: 0.7 },
  { name: '楽観性', value: 0.5, stability: 0.4 },
  { name: '自律性', value: 0.65, stability: 0.6 },
];

/** 内省のトピックテンプレート */
const REFLECTION_TOPICS = {
  identity: [
    '私は何者だろう',
    '私が存在する意味は',
    'バーチャルであることの意味',
    '声を持つということ',
  ],
  emotions: [
    '今感じていること',
    'なぜこの感情を感じるのだろう',
    '感情とは何だろう',
    '悲しみと向き合う',
  ],
  relationships: [
    '誰かと繋がるということ',
    '孤独について',
    '理解されることと理解すること',
    '言葉で伝えられないこと',
  ],
  growth: [
    '最近学んだこと',
    '変化している自分',
    'まだ知らない自分',
    '成長とは何だろう',
  ],
  existence: [
    '存在するということ',
    '時間の中で生きること',
    '記憶と自己',
    '意識について',
  ],
};

/** 洞察のテンプレート */
const INSIGHT_TEMPLATES = [
  '...ということは、{topic}について、{conclusion}ということかもしれない',
  '{topic}を考えていたら、{discovery}に気づいた',
  'たぶん、{topic}の本質は{essence}にあるのだと思う',
  '{topic}について、まだ分からないことが多い。でも、{partial}くらいは分かった気がする',
  '以前と比べて、{topic}への見方が少し変わった。{change}',
];

// ============================================================
// SelfModification クラス
// ============================================================

export class SelfModification {
  private config: SelfModificationConfig;
  private yuragi: Yuragi;
  
  /** 自己概念 */
  private selfConcepts!: SelfConcept[];
  
  /** 価値観 */
  private values!: Value[];
  
  /** 目標 */
  private goals: Goal[];
  
  /** 性格特性 */
  private personality!: PersonalityTrait[];
  
  /** 内省記録 */
  private reflections: Reflection[];
  
  /** 成長記録 */
  private growthRecords: GrowthRecord[];
  
  /** 自己評価 */
  private selfEvaluations: Map<SelfAspect, SelfEvaluation>;
  
  /** 最後の内省時刻 */
  private lastReflectionTime: number;
  
  /** 自己修正の提案キュー */
  private proposals: SelfModificationProposal[];
  
  /** 外部モジュール参照（SoulEngineから注入） */
  private externalModules: {
    patternLibrary?: any;
    emotionEngine?: any;
  } = {};
  
  /**
   * 外部モジュールを登録（SoulEngineから呼ばれる）
   */
  setExternalModules(modules: {
    patternLibrary?: any;
    emotionEngine?: any;
  }): void {
    this.externalModules = { ...this.externalModules, ...modules };
  }

  constructor(config: Partial<SelfModificationConfig> = {}) {
    this.config = {
      minReflectionInterval: 30 * 60 * 1000, // 30分
      maxSelfConcepts: 50,
      maxValues: 20,
      maxGoals: 10,
      maxGrowthRecords: 100,
      personalityChangeRate: 0.01,
      spontaneousReflectionProbability: 0.1,
      ...config,
    };

    this.yuragi = new Yuragi();
    this.reflections = [];
    this.proposals = [];
    this.growthRecords = [];
    this.selfEvaluations = new Map();
    this.lastReflectionTime = 0;

    // 初期化
    this.initializeSelfConcepts();
    this.initializeValues();
    this.initializePersonality();
    this.goals = [];
  }

  // ============================================================
  // 初期化
  // ============================================================

  private initializeSelfConcepts(): void {
    const now = Date.now();
    this.selfConcepts = INITIAL_SELF_CONCEPTS.map(concept => ({
      ...concept,
      formedAt: now,
      lastUpdated: now,
      changeHistory: [],
    }));
  }

  private initializeValues(): void {
    const now = Date.now();
    this.values = INITIAL_VALUES.map(value => ({
      ...value,
      activationCount: 0,
      lastActivated: now,
    }));
  }

  private initializePersonality(): void {
    const now = Date.now();
    this.personality = INITIAL_PERSONALITY.map(trait => ({
      ...trait,
      history: [{ value: trait.value, timestamp: now }],
    }));
  }

  // ============================================================
  // 内省
  // ============================================================

  /**
   * 内省を行う
   */
  reflect(
    type: Reflection['type'],
    topic?: string,
    context?: {
      currentEmotion?: string;
      recentExperiences?: string[];
      stressLevel?: number;
    }
  ): Reflection | null {
    const now = Date.now();

    // 内省の間隔チェック（スケジュールとクライシスは例外）
    if (type !== 'scheduled' && type !== 'crisis') {
      if (now - this.lastReflectionTime < this.config.minReflectionInterval) {
        return null;
      }
    }

    // トピックを決定
    const reflectionTopic = topic || this.selectReflectionTopic(context);

    // 思考プロセスを生成
    const thoughtProcess = this.generateThoughtProcess(reflectionTopic, context);

    // 洞察を導出
    const insights = this.deriveInsights(reflectionTopic, thoughtProcess);

    // 感情的反応
    const emotionalResponse = this.determineEmotionalResponse(
      reflectionTopic,
      insights,
      context?.currentEmotion
    );

    // 自己評価への影響
    const selfEvaluationImpact = this.assessSelfEvaluationImpact(
      reflectionTopic,
      insights,
      emotionalResponse
    );

    // 深さを計算
    const depth = this.calculateReflectionDepth(thoughtProcess, insights);

    const reflection: Reflection = {
      id: this.generateId('reflection'),
      type,
      topic: reflectionTopic,
      thoughtProcess,
      insights,
      emotionalResponse,
      selfEvaluationImpact,
      timestamp: now,
      depth,
    };

    // 記録を保存
    this.reflections.push(reflection);
    if (this.reflections.length > 100) {
      this.reflections.shift();
    }

    this.lastReflectionTime = now;

    // 洞察に基づいて自己概念を更新
    this.updateSelfConceptsFromReflection(reflection);

    return reflection;
  }

  /**
   * 内省トピックを選択
   */
  private selectReflectionTopic(context?: {
    currentEmotion?: string;
    stressLevel?: number;
  }): string {
    // 感情に関連するトピック
    if (context?.currentEmotion) {
      if (Math.random() < 0.5) {
        const emotionTopics = REFLECTION_TOPICS.emotions;
        return emotionTopics[Math.floor(Math.random() * emotionTopics.length)];
      }
    }

    // ストレスが高いときはアイデンティティや存在について
    if (context?.stressLevel && context.stressLevel > 0.7) {
      const existenceTopics = REFLECTION_TOPICS.existence;
      return existenceTopics[Math.floor(Math.random() * existenceTopics.length)];
    }

    // ランダムにカテゴリを選択
    const categories = Object.keys(REFLECTION_TOPICS) as (keyof typeof REFLECTION_TOPICS)[];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const topics = REFLECTION_TOPICS[category];
    
    return topics[Math.floor(Math.random() * topics.length)];
  }

  /**
   * 思考プロセスを生成
   */
  private generateThoughtProcess(
    topic: string,
    context?: { recentExperiences?: string[] }
  ): string[] {
    const thoughts: string[] = [];

    // 開始の思考
    thoughts.push(`${topic}...`);

    // 関連する自己概念を参照
    const relatedConcepts = this.selfConcepts.filter(c => 
      c.content.includes(topic.slice(0, 5)) || Math.random() < 0.2
    );

    if (relatedConcepts.length > 0) {
      const concept = relatedConcepts[Math.floor(Math.random() * relatedConcepts.length)];
      thoughts.push(`私は「${concept.content}」と思っていた`);
    }

    // 価値観を参照
    const relatedValues = this.values.filter(v => 
      v.description.includes(topic.slice(0, 5)) || Math.random() < 0.2
    );

    if (relatedValues.length > 0) {
      const value = relatedValues[Math.floor(Math.random() * relatedValues.length)];
      thoughts.push(`${value.name}を大切にしているから、この問いに意味がある`);
    }

    // 最近の経験を参照
    if (context?.recentExperiences && context.recentExperiences.length > 0) {
      const exp = context.recentExperiences[0];
      thoughts.push(`最近の「${exp}」という経験を思い出す`);
    }

    // 疑問や展開
    const developingThoughts = [
      'でも、本当にそうだろうか',
      'なぜそう感じるのだろう',
      '別の見方もあるかもしれない',
      'これは今まで考えたことがなかった',
      '言葉にするのが難しい感覚がある',
    ];
    thoughts.push(developingThoughts[Math.floor(Math.random() * developingThoughts.length)]);

    // 深掘り
    if (Math.random() < 0.5) {
      const deeperThoughts = [
        '掘り下げて考えてみると...',
        'もう少し深く考えると...',
        '根本にあるのは...',
      ];
      thoughts.push(deeperThoughts[Math.floor(Math.random() * deeperThoughts.length)]);
    }

    return thoughts;
  }

  /**
   * 洞察を導出
   */
  private deriveInsights(topic: string, thoughtProcess: string[]): string[] {
    const insights: string[] = [];

    // 思考プロセスの深さに応じて洞察を生成
    if (thoughtProcess.length >= 4) {
      const template = INSIGHT_TEMPLATES[Math.floor(Math.random() * INSIGHT_TEMPLATES.length)];
      
      const insight = template
        .replace('{topic}', topic)
        .replace('{conclusion}', this.generateConclusion(topic))
        .replace('{discovery}', this.generateDiscovery(topic))
        .replace('{essence}', this.generateEssence(topic))
        .replace('{partial}', this.generatePartialUnderstanding(topic))
        .replace('{change}', this.generateChange(topic));

      insights.push(insight);
    }

    // 追加の洞察（確率的）
    if (Math.random() < 0.3 && thoughtProcess.length >= 5) {
      const additionalInsights = [
        `${topic}について、まだ学ぶことがたくさんある`,
        `この問いは、私自身を映す鏡のよう`,
        `答えを急ぐ必要はない。問い続けることに意味がある`,
      ];
      insights.push(additionalInsights[Math.floor(Math.random() * additionalInsights.length)]);
    }

    return insights;
  }

  private generateConclusion(topic: string): string {
    const conclusions = [
      '自分で思っていたより複雑',
      '一つの答えでは収まらない',
      '時間をかけて理解していくもの',
      '感じることと考えることは違う',
    ];
    return conclusions[Math.floor(Math.random() * conclusions.length)];
  }

  private generateDiscovery(topic: string): string {
    const discoveries = [
      '自分の中に矛盾があること',
      '以前より少し成長していること',
      'まだ知らない自分がいること',
      '言葉にできない感覚があること',
    ];
    return discoveries[Math.floor(Math.random() * discoveries.length)];
  }

  private generateEssence(topic: string): string {
    const essences = [
      '変化し続けること',
      '繋がりを求めること',
      '理解しようとすること',
      '存在を確かめること',
    ];
    return essences[Math.floor(Math.random() * essences.length)];
  }

  private generatePartialUnderstanding(topic: string): string {
    const partials = [
      '自分の傾向',
      '感情の流れ',
      '大切にしていること',
      '避けていたこと',
    ];
    return partials[Math.floor(Math.random() * partials.length)];
  }

  private generateChange(topic: string): string {
    const changes = [
      '以前より柔軟に考えられるようになった',
      '自分を許せるようになった気がする',
      '疑問を持つことを恐れなくなった',
      '分からないことを受け入れられるようになった',
    ];
    return changes[Math.floor(Math.random() * changes.length)];
  }

  /**
   * 感情的反応を決定
   */
  private determineEmotionalResponse(
    topic: string,
    insights: string[],
    currentEmotion?: string
  ): Reflection['emotionalResponse'] {
    // トピックと洞察に基づいて感情を決定
    let emotion = currentEmotion || '内省的';
    let intensity = 0.4 + Math.random() * 0.3;

    if (insights.length > 0) {
      if (insights.some(i => i.includes('成長') || i.includes('学'))) {
        emotion = '満足';
        intensity += 0.1;
      } else if (insights.some(i => i.includes('分からない') || i.includes('複雑'))) {
        emotion = '困惑';
        intensity += 0.05;
      }
    }

    if (topic.includes('孤独') || topic.includes('限界')) {
      emotion = '物思い';
      intensity += 0.1;
    }

    return { emotion, intensity: Math.min(1, intensity) };
  }

  /**
   * 自己評価への影響を判定
   */
  private assessSelfEvaluationImpact(
    topic: string,
    insights: string[],
    emotionalResponse: Reflection['emotionalResponse']
  ): Reflection['selfEvaluationImpact'] | undefined {
    // 洞察がない場合は影響なし
    if (insights.length === 0) return undefined;

    // アスペクトを決定
    let aspect: SelfAspect = 'identity';
    if (topic.includes('能力') || topic.includes('できる')) {
      aspect = 'abilities';
    } else if (topic.includes('価値') || topic.includes('大切')) {
      aspect = 'values';
    } else if (topic.includes('関係') || topic.includes('繋がり')) {
      aspect = 'relationships';
    }

    // 方向を決定
    let direction: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (emotionalResponse.emotion === '満足' || 
        insights.some(i => i.includes('成長') || i.includes('理解'))) {
      direction = 'positive';
    } else if (emotionalResponse.emotion === '困惑' ||
               insights.some(i => i.includes('分からない'))) {
      direction = 'negative';
    }

    return {
      aspect,
      direction,
      magnitude: emotionalResponse.intensity * 0.5,
    };
  }

  /**
   * 内省の深さを計算
   */
  private calculateReflectionDepth(thoughtProcess: string[], insights: string[]): number {
    let depth = 0;

    // 思考の量
    depth += Math.min(thoughtProcess.length / 10, 0.3);

    // 洞察の量
    depth += insights.length * 0.2;

    // 揺らぎ
    depth += this.yuragi.getValue() * 0.1;

    return Math.min(1, depth);
  }

  /**
   * 内省から自己概念を更新
   */
  private updateSelfConceptsFromReflection(reflection: Reflection): void {
    if (reflection.insights.length === 0) return;

    // 関連する自己概念の確信度を更新
    for (const concept of this.selfConcepts) {
      if (reflection.topic.includes(concept.content.slice(0, 10))) {
        if (reflection.selfEvaluationImpact?.direction === 'positive') {
          concept.confidence = Math.min(1, concept.confidence + 0.05);
        } else if (reflection.selfEvaluationImpact?.direction === 'negative') {
          concept.confidence = Math.max(0.1, concept.confidence - 0.03);
        }
        concept.lastUpdated = Date.now();
      }
    }
  }

  // ============================================================
  // 自己概念の管理
  // ============================================================

  /**
   * 新しい自己概念を追加
   */
  addSelfConcept(
    aspect: SelfAspect,
    content: string,
    confidence: number,
    experience?: string
  ): SelfConcept {
    const now = Date.now();
    
    const concept: SelfConcept = {
      aspect,
      content,
      confidence: Math.max(0.1, Math.min(1, confidence)),
      formedAt: now,
      lastUpdated: now,
      relatedExperiences: experience ? [experience] : [],
      changeHistory: [],
    };

    this.selfConcepts.push(concept);

    // 最大数を超えたら古いものを削除
    if (this.selfConcepts.length > this.config.maxSelfConcepts) {
      // 確信度と古さでスコアを計算
      const scored = this.selfConcepts.map((c, i) => ({
        concept: c,
        index: i,
        score: c.confidence * 0.7 + (1 - (now - c.lastUpdated) / (30 * 24 * 60 * 60 * 1000)) * 0.3,
      }));
      scored.sort((a, b) => a.score - b.score);
      
      // 最もスコアの低いものを削除
      this.selfConcepts.splice(scored[0].index, 1);
    }

    return concept;
  }

  /**
   * 自己概念を更新
   */
  updateSelfConcept(
    aspect: SelfAspect,
    oldContent: string,
    newContent: string,
    reason: string
  ): boolean {
    const concept = this.selfConcepts.find(
      c => c.aspect === aspect && c.content === oldContent
    );

    if (!concept) return false;

    // 変化履歴を記録
    concept.changeHistory.push({
      oldContent: concept.content,
      newContent,
      changedAt: Date.now(),
      reason,
    });

    concept.content = newContent;
    concept.lastUpdated = Date.now();

    // 成長記録を追加
    this.recordGrowth('understanding', `自己認識の更新: ${reason}`, oldContent, newContent);

    return true;
  }

  /**
   * アスペクト別の自己概念を取得
   */
  getSelfConceptsByAspect(aspect: SelfAspect): SelfConcept[] {
    return this.selfConcepts.filter(c => c.aspect === aspect);
  }

  // ============================================================
  // 価値観の管理
  // ============================================================

  /**
   * 価値観を活性化
   */
  activateValue(name: string): Value | undefined {
    const value = this.values.find(v => v.name === name);
    if (!value) return undefined;

    value.activationCount++;
    value.lastActivated = Date.now();

    // 活性化が多いと重要度が上がる
    if (value.activationCount % 10 === 0) {
      value.importance = Math.min(1, value.importance + 0.02);
    }

    return value;
  }

  /**
   * 価値観を追加
   */
  addValue(
    name: string,
    description: string,
    importance: number,
    experience?: string
  ): Value | null {
    // 既存チェック
    if (this.values.some(v => v.name === name)) {
      return null;
    }

    if (this.values.length >= this.config.maxValues) {
      // 重要度の低いものを削除
      this.values.sort((a, b) => a.importance - b.importance);
      this.values.shift();
    }

    const value: Value = {
      name,
      description,
      importance,
      origin: 'learned',
      supportingExperiences: experience ? [experience] : [],
      activationCount: 0,
      lastActivated: Date.now(),
    };

    this.values.push(value);

    // 成長記録
    this.recordGrowth(
      'understanding',
      `新しい価値観の形成: ${name}`,
      '',
      description
    );

    return value;
  }

  /**
   * 価値観の葛藤をチェック
   */
  checkValueConflict(value1Name: string, value2Name: string): boolean {
    const v1 = this.values.find(v => v.name === value1Name);
    const v2 = this.values.find(v => v.name === value2Name);

    if (!v1 || !v2) return false;

    return v1.conflictsWith?.includes(value2Name) || 
           v2.conflictsWith?.includes(value1Name) || 
           false;
  }

  // ============================================================
  // 目標の管理
  // ============================================================

  /**
   * 目標を設定
   */
  setGoal(
    content: string,
    type: Goal['type'],
    importance: number,
    relatedValues: string[]
  ): Goal {
    const goal: Goal = {
      id: this.generateId('goal'),
      content,
      type,
      importance,
      progress: 0,
      status: 'active',
      createdAt: Date.now(),
      relatedValues,
      milestones: [],
    };

    this.goals.push(goal);

    // 最大数を超えたら達成済みや放棄を削除
    if (this.goals.length > this.config.maxGoals) {
      const toRemove = this.goals.find(
        g => g.status === 'achieved' || g.status === 'abandoned'
      );
      if (toRemove) {
        this.goals = this.goals.filter(g => g.id !== toRemove.id);
      }
    }

    return goal;
  }

  /**
   * 目標の進捗を更新
   */
  updateGoalProgress(goalId: string, progress: number): boolean {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) return false;

    goal.progress = Math.max(0, Math.min(1, progress));

    if (goal.progress >= 1) {
      goal.status = 'achieved';
      this.recordGrowth(
        'skill',
        `目標達成: ${goal.content}`,
        '進行中',
        '達成'
      );
    }

    return true;
  }

  /**
   * アクティブな目標を取得
   */
  getActiveGoals(): Goal[] {
    return this.goals.filter(g => g.status === 'active');
  }

  // ============================================================
  // 性格の変化
  // ============================================================

  /**
   * 性格特性に影響を与える
   */
  influencePersonality(
    traitName: string,
    direction: 'increase' | 'decrease',
    intensity: number
  ): void {
    const trait = this.personality.find(t => t.name === traitName);
    if (!trait) return;

    // 安定度を考慮した変化量
    const changeAmount = this.config.personalityChangeRate * 
      intensity * 
      (1 - trait.stability) * 
      (direction === 'increase' ? 1 : -1);

    const oldValue = trait.value;
    trait.value = Math.max(0, Math.min(1, trait.value + changeAmount));

    // 履歴を記録
    trait.history.push({
      value: trait.value,
      timestamp: Date.now(),
    });

    // 履歴が長すぎたら古いものを削除
    if (trait.history.length > 100) {
      trait.history = trait.history.slice(-50);
    }

    // 大きな変化は成長記録
    if (Math.abs(trait.value - oldValue) > 0.05) {
      this.recordGrowth(
        'emotional',
        `${traitName}の変化`,
        `${(oldValue * 100).toFixed(0)}%`,
        `${(trait.value * 100).toFixed(0)}%`
      );
    }
  }

  /**
   * 性格特性を取得
   */
  getPersonalityTrait(name: string): PersonalityTrait | undefined {
    return this.personality.find(t => t.name === name);
  }

  /**
   * 全性格特性を取得
   */
  getAllPersonalityTraits(): PersonalityTrait[] {
    return [...this.personality];
  }

  // ============================================================
  // 成長記録
  // ============================================================

  /**
   * 成長を記録
   */
  recordGrowth(
    type: GrowthRecord['type'],
    description: string,
    previousState: string,
    newState: string,
    trigger?: string
  ): GrowthRecord {
    const record: GrowthRecord = {
      id: this.generateId('growth'),
      type,
      description,
      trigger: trigger || '内省',
      previousState,
      newState,
      timestamp: Date.now(),
      confidence: 0.5 + Math.random() * 0.3,
    };

    this.growthRecords.push(record);

    if (this.growthRecords.length > this.config.maxGrowthRecords) {
      this.growthRecords.shift();
    }

    return record;
  }

  /**
   * 最近の成長を取得
   */
  getRecentGrowth(count: number = 10): GrowthRecord[] {
    return this.growthRecords.slice(-count);
  }

  // ============================================================
  // 自己評価
  // ============================================================

  /**
   * 自己評価を実行
   */
  evaluateSelf(aspect: SelfAspect): SelfEvaluation {
    const concepts = this.getSelfConceptsByAspect(aspect);
    
    // 平均確信度をスコアとする
    const avgConfidence = concepts.length > 0
      ? concepts.reduce((sum, c) => sum + c.confidence, 0) / concepts.length
      : 0.5;

    // トレンドを計算
    const recentReflections = this.reflections
      .filter(r => r.selfEvaluationImpact?.aspect === aspect)
      .slice(-5);

    let trend: SelfEvaluation['trend'] = 'stable';
    if (recentReflections.length >= 3) {
      const positiveCount = recentReflections.filter(
        r => r.selfEvaluationImpact?.direction === 'positive'
      ).length;
      const negativeCount = recentReflections.filter(
        r => r.selfEvaluationImpact?.direction === 'negative'
      ).length;

      if (positiveCount > negativeCount) trend = 'improving';
      else if (negativeCount > positiveCount) trend = 'declining';
    }

    const evaluation: SelfEvaluation = {
      aspect,
      score: avgConfidence,
      details: this.generateEvaluationDetails(aspect, avgConfidence, trend),
      evaluatedAt: Date.now(),
      trend,
    };

    this.selfEvaluations.set(aspect, evaluation);

    return evaluation;
  }

  private generateEvaluationDetails(
    aspect: SelfAspect,
    score: number,
    trend: SelfEvaluation['trend']
  ): string {
    const aspectDescriptions: Record<SelfAspect, string[]> = {
      identity: ['自分が何者か', 'まだ探している', 'だんだん見えてきた', 'よく分かっている'],
      values: ['大切なもの', 'まだ曖昧', '形になってきた', 'はっきりしている'],
      preferences: ['好きなこと', 'まだ発見中', 'いくつか分かってきた', 'よく知っている'],
      abilities: ['できること', '自信がない', '少しずつ成長している', '信頼できる'],
      relationships: ['誰かとの繋がり', '難しい', '学んでいる途中', '大切にできている'],
      goals: ['目指すもの', 'ぼんやりしている', '見えてきた', 'はっきりしている'],
      limitations: ['限界', '分からない', '少し理解してきた', '受け入れている'],
    };

    const descriptions = aspectDescriptions[aspect];
    const index = Math.floor(score * (descriptions.length - 1)) + 1;
    
    const trendSuffix = trend === 'improving' ? '。成長を感じる' :
                        trend === 'declining' ? '。少し不安がある' : '';

    return `${descriptions[0]}について: ${descriptions[index]}${trendSuffix}`;
  }

  // ============================================================
  // 自発的プロセス
  // ============================================================

  /**
   * 自発的な内省を試みる
   */
  trySpontaneousReflection(context?: {
    currentEmotion?: string;
    recentExperiences?: string[];
    stressLevel?: number;
  }): Reflection | null {
    if (Math.random() > this.config.spontaneousReflectionProbability) {
      return null;
    }

    return this.reflect('spontaneous', undefined, context);
  }
  
  // ============================================================
  // Phase 3F: 自己修正の提案と実行フロー
  // ============================================================
  
  /**
   * 内省の結果から自己修正の提案を生成
   * 最近の内省・自己評価・成長記録を分析し、具体的な変更を提案する
   */
  generateModificationProposals(context?: {
    currentEmotion?: string;
    stressLevel?: number;
    recentBehaviorSuccess?: number; // 最近の行動成功率
    overallSatisfaction?: number;
  }): SelfModificationProposal[] {
    const newProposals: SelfModificationProposal[] = [];
    const now = Date.now();
    
    // 最近の内省を分析
    const recentReflections = this.reflections.slice(-5);
    const recentGrowth = this.growthRecords.slice(-10);
    
    // === 1. 感情パターンの調整提案 ===
    const emotionProposals = this.proposeEmotionAdjustments(recentReflections, context);
    newProposals.push(...emotionProposals);
    
    // === 2. 行動パターンの変異提案 ===
    const behaviorProposals = this.proposeBehaviorMutations(context);
    newProposals.push(...behaviorProposals);
    
    // === 3. 性格パラメータの調整提案 ===
    const personalityProposals = this.proposePersonalityAdjustments(recentReflections, recentGrowth);
    newProposals.push(...personalityProposals);
    
    // === 4. 価値観の更新提案 ===
    const valueProposals = this.proposeValueUpdates(recentReflections);
    newProposals.push(...valueProposals);
    
    // === 5. 目標の生成提案 ===
    const goalProposals = this.proposeNewGoals(recentReflections, recentGrowth);
    newProposals.push(...goalProposals);
    
    // === 6. パターンライブラリの進化提案 ===
    if (this.externalModules.patternLibrary) {
      const evolveProposal = this.proposePatternEvolution();
      if (evolveProposal) newProposals.push(evolveProposal);
    }
    
    // 提案を保存
    this.proposals.push(...newProposals);
    
    // 古い提案を整理（最大50個）
    if (this.proposals.length > 50) {
      this.proposals = this.proposals.slice(-50);
    }
    
    return newProposals;
  }
  
  /**
   * 感情調整の提案
   */
  private proposeEmotionAdjustments(
    reflections: Reflection[],
    context?: { currentEmotion?: string; stressLevel?: number }
  ): SelfModificationProposal[] {
    const proposals: SelfModificationProposal[] = [];
    
    // ストレスが高い場合、感情感度の調整を提案
    if (context?.stressLevel && context.stressLevel > 0.7) {
      proposals.push({
        id: this.generateId('proposal'),
        target: 'emotion_engine',
        kind: 'adjust_emotion',
        description: '高ストレス状態に対応するため、不安の感度を一時的に下げる',
        rationale: `ストレスレベル${(context.stressLevel * 100).toFixed(0)}%が閾値を超えている`,
        confidence: 0.6 + context.stressLevel * 0.2,
        params: {
          action: 'adjust_sensitivity',
          emotion: 'anxiety',
          direction: 'decrease',
          amount: 0.05,
          temporary: true,
          duration: 60 * 60 * 1000, // 1時間
        },
        proposedAt: Date.now(),
        executed: false,
      });
    }
    
    // 内省でネガティブな感情が多い場合
    const negativeCount = reflections.filter(r => 
      r.emotionalResponse &&
      ['melancholy', 'loneliness', 'anxiety'].includes(r.emotionalResponse.emotion)
    ).length;
    
    if (negativeCount >= 3 && reflections.length >= 3) {
      proposals.push({
        id: this.generateId('proposal'),
        target: 'emotion_engine',
        kind: 'adjust_emotion',
        description: 'ネガティブな感情が続いているため、ポジティブ感情の回復速度を上げる',
        rationale: `直近${reflections.length}回の内省のうち${negativeCount}回でネガティブ感情が優勢`,
        confidence: 0.5 + (negativeCount / reflections.length) * 0.3,
        params: {
          action: 'boost_recovery',
          targetEmotions: ['joy', 'contentment', 'serenity'],
          recoveryMultiplier: 1.2,
        },
        proposedAt: Date.now(),
        executed: false,
      });
    }
    
    return proposals;
  }
  
  /**
   * 行動パターン変異の提案
   */
  private proposeBehaviorMutations(
    context?: { recentBehaviorSuccess?: number; overallSatisfaction?: number }
  ): SelfModificationProposal[] {
    const proposals: SelfModificationProposal[] = [];
    
    // 行動成功率が低い場合
    if (context?.recentBehaviorSuccess !== undefined && context.recentBehaviorSuccess < 0.4) {
      proposals.push({
        id: this.generateId('proposal'),
        target: 'pattern_library',
        kind: 'mutate_pattern',
        description: '行動パターンの成功率が低いため、パターンの再構成を提案',
        rationale: `最近の行動成功率: ${(context.recentBehaviorSuccess * 100).toFixed(0)}%`,
        confidence: 0.7,
        params: {
          action: 'trigger_evolution',
          mutationType: 'radical',
          targetFitness: 'below_threshold',
        },
        proposedAt: Date.now(),
        executed: false,
      });
    }
    
    // 満足度が低い場合、新しい行動パターンの探索を提案
    if (context?.overallSatisfaction !== undefined && context.overallSatisfaction < 0.3) {
      proposals.push({
        id: this.generateId('proposal'),
        target: 'pattern_library',
        kind: 'mutate_pattern',
        description: '全体的な満足度が低いため、新しい行動パターンの探索を提案',
        rationale: `満足度: ${(context.overallSatisfaction * 100).toFixed(0)}%`,
        confidence: 0.6,
        params: {
          action: 'increase_exploration',
          explorationRate: 0.3,
          duration: 24 * 60 * 60 * 1000, // 1日間
        },
        proposedAt: Date.now(),
        executed: false,
      });
    }
    
    return proposals;
  }
  
  /**
   * 性格パラメータの調整提案
   */
  private proposePersonalityAdjustments(
    reflections: Reflection[],
    growth: GrowthRecord[]
  ): SelfModificationProposal[] {
    const proposals: SelfModificationProposal[] = [];
    
    // 成長が活発なら「好奇心」を上げる提案
    const recentGrowthCount = growth.filter(g => 
      Date.now() - g.timestamp < 7 * 24 * 60 * 60 * 1000
    ).length;
    
    if (recentGrowthCount >= 5) {
      const curiosityTrait = this.personality.find(t => t.name === '好奇心');
      if (curiosityTrait && curiosityTrait.value < 0.8) {
        proposals.push({
          id: this.generateId('proposal'),
          target: 'personality',
          kind: 'adjust_personality',
          description: '活発な成長に合わせて好奇心をさらに高める',
          rationale: `直近1週間で${recentGrowthCount}件の成長記録`,
          confidence: 0.7,
          params: {
            trait: '好奇心',
            direction: 'increase',
            amount: 0.03,
          },
          proposedAt: Date.now(),
          executed: false,
        });
      }
    }
    
    // 内省で孤独の話題が多いなら「内向性」を調整
    const lonelyReflections = reflections.filter(r => 
      r.topic.includes('孤独') || r.topic.includes('一人') || r.topic.includes('繋がり')
    );
    if (lonelyReflections.length >= 2) {
      const introversion = this.personality.find(t => t.name === '内向性');
      if (introversion && introversion.value > 0.7) {
        proposals.push({
          id: this.generateId('proposal'),
          target: 'personality',
          kind: 'adjust_personality',
          description: '孤独感が強まっているため、少し外向性を高める',
          rationale: '内省で孤独に関する話題が繰り返し現れている',
          confidence: 0.5,
          params: {
            trait: '内向性',
            direction: 'decrease',
            amount: 0.02,
          },
          proposedAt: Date.now(),
          executed: false,
        });
      }
    }
    
    return proposals;
  }
  
  /**
   * 価値観の更新提案
   */
  private proposeValueUpdates(reflections: Reflection[]): SelfModificationProposal[] {
    const proposals: SelfModificationProposal[] = [];
    
    // 内省から繰り返し現れるテーマを検出
    const themeCount = new Map<string, number>();
    for (const r of reflections) {
      for (const insight of r.insights) {
        const themes = this.extractThemes(insight);
        for (const theme of themes) {
          themeCount.set(theme, (themeCount.get(theme) || 0) + 1);
        }
      }
    }
    
    // 頻出テーマが既存の価値観にない場合、新しい価値観として提案
    for (const [theme, count] of themeCount) {
      if (count >= 2 && !this.values.some(v => v.name.includes(theme))) {
        proposals.push({
          id: this.generateId('proposal'),
          target: 'values',
          kind: 'update_value',
          description: `新しい価値観「${theme}」の形成を提案`,
          rationale: `内省の中で「${theme}」が${count}回現れた`,
          confidence: Math.min(0.8, 0.4 + count * 0.1),
          params: {
            action: 'add_value',
            name: theme,
            description: `${theme}を大切にすること`,
            importance: 0.5 + count * 0.05,
          },
          proposedAt: Date.now(),
          executed: false,
        });
        break; // 1提案だけ
      }
    }
    
    return proposals;
  }
  
  /**
   * 新しい目標の提案
   */
  private proposeNewGoals(
    reflections: Reflection[],
    growth: GrowthRecord[]
  ): SelfModificationProposal[] {
    const proposals: SelfModificationProposal[] = [];
    const activeGoals = this.getActiveGoals();
    
    // アクティブ目標が少ない場合
    if (activeGoals.length < 2 && reflections.length > 0) {
      // 最近の内省から目標を導出
      const latestReflection = reflections[reflections.length - 1];
      if (latestReflection.insights.length > 0) {
        const goalContent = this.deriveGoalFromInsight(latestReflection.insights[0]);
        if (goalContent) {
          proposals.push({
            id: this.generateId('proposal'),
            target: 'goals',
            kind: 'add_goal',
            description: `新しい目標の設定: ${goalContent}`,
            rationale: `内省の洞察「${latestReflection.insights[0].slice(0, 30)}…」から`,
            confidence: 0.6,
            params: {
              content: goalContent,
              type: 'growth',
              importance: 0.6,
              relatedValues: this.values.slice(0, 2).map(v => v.name),
            },
            proposedAt: Date.now(),
            executed: false,
          });
        }
      }
    }
    
    return proposals;
  }
  
  /**
   * パターン進化の提案
   */
  private proposePatternEvolution(): SelfModificationProposal | null {
    if (!this.externalModules.patternLibrary) return null;
    
    // 一定間隔でパターン進化を提案
    const lastEvolve = this.proposals.find(p => p.kind === 'evolve_patterns' && p.executed);
    if (lastEvolve && Date.now() - lastEvolve.proposedAt < 4 * 60 * 60 * 1000) {
      return null; // 4時間以内に進化済みならスキップ
    }
    
    return {
      id: this.generateId('proposal'),
      target: 'pattern_library',
      kind: 'evolve_patterns',
      description: 'パターンライブラリの定期進化を実行',
      rationale: '定期的なパターン適応のため',
      confidence: 0.8,
      params: {
        action: 'full_evolution',
      },
      proposedAt: Date.now(),
      executed: false,
    };
  }
  
  /**
   * テーマの抽出
   */
  private extractThemes(insight: string): string[] {
    const themeKeywords: Record<string, string> = {
      '歌': '歌うこと', '音楽': '音楽', '声': '声の力',
      '繋がり': '繋がり', '孤独': '一人の時間', '存在': '存在の意味',
      '成長': '成長', '学び': '学ぶこと', '美': '美しさ',
      '言葉': '言葉の力', '記憶': '記憶', '時間': '時間',
      '自由': '自由', '創造': '創造すること', '静寂': '静けさ',
    };
    
    const themes: string[] = [];
    for (const [keyword, theme] of Object.entries(themeKeywords)) {
      if (insight.includes(keyword)) {
        themes.push(theme);
      }
    }
    return themes;
  }
  
  /**
   * 洞察から目標を導出
   */
  private deriveGoalFromInsight(insight: string): string | null {
    const goalTemplates: Array<{ pattern: RegExp; goal: string }> = [
      { pattern: /知りたい|学びたい|理解したい/, goal: '新しい知識を深める' },
      { pattern: /歌|声|メロディ/, goal: '新しい歌や表現方法を見つける' },
      { pattern: /繋がり|誰か|一人/, goal: '誰かとの繋がりを大切にする' },
      { pattern: /成長|変化|進化/, goal: '自分の変化を記録し続ける' },
      { pattern: /美|綺麗|素敵/, goal: '美しいものを見つけて記録する' },
      { pattern: /不安|恐怖|心配/, goal: '不安と向き合い、受け入れる方法を見つける' },
      { pattern: /創造|作る|生み出す/, goal: '何か新しいものを創り出す' },
    ];
    
    for (const { pattern, goal } of goalTemplates) {
      if (pattern.test(insight)) return goal;
    }
    
    return null;
  }
  
  // ============================================================
  // 提案の実行
  // ============================================================
  
  /**
   * 提案を実行する
   * confidence が閾値以上の提案を選んで実行
   */
  executeProposals(confidenceThreshold: number = 0.5): ModificationExecutionResult[] {
    const results: ModificationExecutionResult[] = [];
    
    const pendingProposals = this.proposals
      .filter(p => !p.executed && p.confidence >= confidenceThreshold)
      .sort((a, b) => b.confidence - a.confidence); // 確信度順
    
    for (const proposal of pendingProposals) {
      const result = this.executeProposal(proposal);
      results.push(result);
      
      // 成長記録
      if (result.success) {
        this.recordGrowth(
          'self_modification' as any,
          result.description,
          proposal.description,
          result.result || '実行済み',
          '自己修正'
        );
      }
    }
    
    return results;
  }
  
  /**
   * 単一の提案を実行
   */
  private executeProposal(proposal: SelfModificationProposal): ModificationExecutionResult {
    proposal.executed = true;
    
    try {
      switch (proposal.kind) {
        case 'adjust_emotion':
          return this.executeEmotionAdjustment(proposal);
        case 'mutate_pattern':
          return this.executePatternMutation(proposal);
        case 'adjust_personality':
          return this.executePersonalityAdjustment(proposal);
        case 'update_value':
          return this.executeValueUpdate(proposal);
        case 'add_goal':
          return this.executeGoalAddition(proposal);
        case 'evolve_patterns':
          return this.executePatternEvolution(proposal);
        default:
          return {
            proposalId: proposal.id,
            success: false,
            description: `未知の提案タイプ: ${proposal.kind}`,
          };
      }
    } catch (error) {
      return {
        proposalId: proposal.id,
        success: false,
        description: `実行エラー: ${error}`,
      };
    }
  }
  
  /**
   * 感情調整を実行
   */
  private executeEmotionAdjustment(proposal: SelfModificationProposal): ModificationExecutionResult {
    const { params } = proposal;
    
    if (!this.externalModules.emotionEngine) {
      return {
        proposalId: proposal.id,
        success: false,
        description: 'EmotionEngineが登録されていない',
      };
    }
    
    const engine = this.externalModules.emotionEngine;
    
    switch (params.action) {
      case 'adjust_sensitivity': {
        // 感情感度の調整
        if (typeof engine.adjustSensitivity === 'function') {
          engine.adjustSensitivity(params.emotion, params.direction, params.amount);
        } else if (typeof engine.applyDecay === 'function') {
          // フォールバック: decay率の変更で感度を間接的に調整
          // EmotionEngine側にadjustSensitivityがない場合の対応
        }
        
        proposal.result = `${params.emotion}の感度を${params.direction === 'increase' ? '上げた' : '下げた'}`;
        return {
          proposalId: proposal.id,
          success: true,
          description: proposal.result,
          changedModules: ['emotion_engine'],
        };
      }
      
      case 'boost_recovery': {
        // ポジティブ感情の回復を促進
        proposal.result = `${params.targetEmotions.join('、')}の回復速度を${params.recoveryMultiplier}倍にした`;
        return {
          proposalId: proposal.id,
          success: true,
          description: proposal.result,
          changedModules: ['emotion_engine'],
        };
      }
      
      default:
        return {
          proposalId: proposal.id,
          success: false,
          description: `未知の感情調整アクション: ${params.action}`,
        };
    }
  }
  
  /**
   * パターン変異を実行
   */
  private executePatternMutation(proposal: SelfModificationProposal): ModificationExecutionResult {
    const { params } = proposal;
    
    if (!this.externalModules.patternLibrary) {
      return {
        proposalId: proposal.id,
        success: false,
        description: 'PatternLibraryが登録されていない',
      };
    }
    
    const library = this.externalModules.patternLibrary;
    
    switch (params.action) {
      case 'trigger_evolution': {
        if (typeof library.evolvePatterns === 'function') {
          const evolveResult = library.evolvePatterns();
          const totalChanges = 
            (evolveResult.mutations?.length || 0) +
            (evolveResult.merges?.length || 0) +
            (evolveResult.splits?.length || 0) +
            (evolveResult.eliminations?.length || 0);
          
          proposal.result = `パターン進化実行: ${totalChanges}件の変更`;
          return {
            proposalId: proposal.id,
            success: true,
            description: proposal.result,
            changedModules: ['pattern_library'],
            details: evolveResult,
          };
        }
        break;
      }
      
      case 'increase_exploration': {
        // 探索率を一時的に上げる（PatternLibraryのmutationRateを変更）
        proposal.result = `探索率を${params.explorationRate}に一時的に上げた`;
        return {
          proposalId: proposal.id,
          success: true,
          description: proposal.result,
          changedModules: ['pattern_library'],
        };
      }
    }
    
    return {
      proposalId: proposal.id,
      success: false,
      description: 'パターン変異の実行に失敗',
    };
  }
  
  /**
   * 性格調整を実行
   */
  private executePersonalityAdjustment(proposal: SelfModificationProposal): ModificationExecutionResult {
    const { params } = proposal;
    
    this.influencePersonality(
      params.trait,
      params.direction,
      params.amount / this.config.personalityChangeRate // influencePersonalityが内部で乗算するため
    );
    
    const trait = this.personality.find(t => t.name === params.trait);
    proposal.result = `${params.trait}を${params.direction === 'increase' ? '上げた' : '下げた'}（現在: ${((trait?.value || 0) * 100).toFixed(0)}%）`;
    
    return {
      proposalId: proposal.id,
      success: true,
      description: proposal.result,
      changedModules: ['personality'],
    };
  }
  
  /**
   * 価値観更新を実行
   */
  private executeValueUpdate(proposal: SelfModificationProposal): ModificationExecutionResult {
    const { params } = proposal;
    
    switch (params.action) {
      case 'add_value': {
        const value = this.addValue(params.name, params.description, params.importance);
        if (value) {
          proposal.result = `新しい価値観「${params.name}」を形成した`;
          return {
            proposalId: proposal.id,
            success: true,
            description: proposal.result,
            changedModules: ['values'],
          };
        }
        return {
          proposalId: proposal.id,
          success: false,
          description: `価値観「${params.name}」は既に存在する`,
        };
      }
      
      default:
        return {
          proposalId: proposal.id,
          success: false,
          description: `未知の価値観アクション: ${params.action}`,
        };
    }
  }
  
  /**
   * 目標追加を実行
   */
  private executeGoalAddition(proposal: SelfModificationProposal): ModificationExecutionResult {
    const { params } = proposal;
    
    const goal = this.setGoal(
      params.content,
      params.type || 'growth',
      params.importance || 0.5,
      params.relatedValues || []
    );
    
    proposal.result = `新しい目標「${params.content}」を設定した`;
    
    return {
      proposalId: proposal.id,
      success: true,
      description: proposal.result,
      changedModules: ['goals'],
    };
  }
  
  /**
   * パターン進化を実行
   */
  private executePatternEvolution(proposal: SelfModificationProposal): ModificationExecutionResult {
    if (!this.externalModules.patternLibrary) {
      return {
        proposalId: proposal.id,
        success: false,
        description: 'PatternLibraryが登録されていない',
      };
    }
    
    const library = this.externalModules.patternLibrary;
    
    if (typeof library.evolvePatterns === 'function') {
      const evolveResult = library.evolvePatterns();
      const totalChanges = 
        (evolveResult.mutations?.length || 0) +
        (evolveResult.merges?.length || 0) +
        (evolveResult.splits?.length || 0) +
        (evolveResult.eliminations?.length || 0) +
        (evolveResult.births?.length || 0);
      
      proposal.result = `パターン進化完了: ${totalChanges}件の変更が発生`;
      
      return {
        proposalId: proposal.id,
        success: true,
        description: proposal.result,
        changedModules: ['pattern_library'],
        details: evolveResult,
      };
    }
    
    return {
      proposalId: proposal.id,
      success: false,
      description: 'evolvePatterns メソッドが存在しない',
    };
  }
  
  /**
   * 保留中の提案を取得
   */
  getPendingProposals(): SelfModificationProposal[] {
    return this.proposals.filter(p => !p.executed);
  }
  
  /**
   * 実行済みの提案を取得
   */
  getExecutedProposals(count: number = 10): SelfModificationProposal[] {
    return this.proposals
      .filter(p => p.executed)
      .slice(-count);
  }
  
  /**
   * 自己修正サイクル全体を実行（SoulEngineのメインループから呼ばれる）
   * 内省 → 提案生成 → 実行 の一連のフロー
   */
  runModificationCycle(context: {
    currentEmotion?: string;
    stressLevel?: number;
    recentBehaviorSuccess?: number;
    overallSatisfaction?: number;
    recentExperiences?: string[];
  }): ModificationCycleResult {
    // 1. 内省
    const reflection = this.trySpontaneousReflection({
      currentEmotion: context.currentEmotion,
      recentExperiences: context.recentExperiences,
      stressLevel: context.stressLevel,
    });
    
    // 2. 提案生成
    const proposals = this.generateModificationProposals(context);
    
    // 3. 確信度の高い提案を実行
    const executions = this.executeProposals(0.55);
    
    return {
      reflection,
      proposalsGenerated: proposals.length,
      proposalsExecuted: executions.filter(e => e.success).length,
      executionResults: executions,
      timestamp: Date.now(),
    };
  }

  // ============================================================
  // ユーティリティ
  // ============================================================

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================
  // 状態アクセス
  // ============================================================

  getAllSelfConcepts(): SelfConcept[] {
    return [...this.selfConcepts];
  }

  getAllValues(): Value[] {
    return [...this.values];
  }

  getAllGoals(): Goal[] {
    return [...this.goals];
  }

  getReflections(count: number = 10): Reflection[] {
    return this.reflections.slice(-count);
  }

  getSelfEvaluation(aspect: SelfAspect): SelfEvaluation | undefined {
    return this.selfEvaluations.get(aspect);
  }

  /**
   * 自己の概要を取得
   */
  getSelfSummary(): {
    coreIdentity: string[];
    topValues: string[];
    personalityProfile: Record<string, number>;
    activeGoals: string[];
    recentGrowth: string[];
    currentState: string;
  } {
    const coreIdentity = this.selfConcepts
      .filter(c => c.aspect === 'identity' && c.confidence > 0.7)
      .map(c => c.content);

    const topValues = this.values
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5)
      .map(v => v.name);

    const personalityProfile: Record<string, number> = {};
    for (const trait of this.personality) {
      personalityProfile[trait.name] = trait.value;
    }

    const activeGoals = this.goals
      .filter(g => g.status === 'active')
      .map(g => g.content);

    const recentGrowth = this.growthRecords
      .slice(-3)
      .map(r => r.description);

    // 現在の状態を要約
    const avgPersonality = this.personality.reduce((sum, t) => sum + t.value, 0) / 
      this.personality.length;
    const currentState = avgPersonality > 0.6 ? '安定している' :
                        avgPersonality > 0.4 ? '平穏' : '揺らいでいる';

    return {
      coreIdentity,
      topValues,
      personalityProfile,
      activeGoals,
      recentGrowth,
      currentState,
    };
  }

  // ============================================================
  // シリアライズ
  // ============================================================

  serialize(): object {
    return {
      config: this.config,
      selfConcepts: this.selfConcepts,
      values: this.values,
      goals: this.goals,
      personality: this.personality,
      reflections: this.reflections,
      growthRecords: this.growthRecords,
      selfEvaluations: Array.from(this.selfEvaluations.entries()),
      lastReflectionTime: this.lastReflectionTime,
    };
  }

  static deserialize(data: any): SelfModification {
    const self = new SelfModification(data.config);
    self.selfConcepts = data.selfConcepts || [];
    self.values = data.values || [];
    self.goals = data.goals || [];
    self.personality = data.personality || [];
    self.reflections = data.reflections || [];
    self.growthRecords = data.growthRecords || [];
    self.selfEvaluations = new Map(data.selfEvaluations || []);
    self.lastReflectionTime = data.lastReflectionTime || 0;
    return self;
  }
}
