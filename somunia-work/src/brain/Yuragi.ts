/**
 * somunia v10 - Yuragi System（揺らぎシステム）
 * 
 * 非合理的な人間らしさを生み出すシステム
 * 
 * 「揺らぎ」とは:
 * - 予定通りに動かない
 * - 理由なく気分が変わる
 * - 突然何かを思い出す
 * - 合理的でない選択をする
 * - デジャヴや既視感
 * 
 * これらがsomuniaを「計算できる機械」ではなく
 * 「予測不能な生命体」に近づける
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ID,
  Timestamp,
  Normalized,
  YuragiState,
  YuragiType,
  IrrationalAction,
  ActionType,
  EmotionType,
  EmotionalState,
  UrgeSystemState,
  TimeOfDay,
} from '../types';

// ============================================================
// 揺らぎシステムの設定
// ============================================================

export interface YuragiConfig {
  // 基本的な揺らぎの頻度（0-1）
  baseFrequency: Normalized;
  
  // 揺らぎの強度（0-1）
  baseIntensity: Normalized;
  
  // 揺らぎの最大持続時間（tick）
  maxDuration: number;
  
  // 各揺らぎタイプの重み
  typeWeights: Record<YuragiType, number>;
  
  // 環境要因の影響度
  environmentalInfluence: Normalized;
  
  // 記憶の最大保持数
  maxIrrationalActions: number;
}

const DEFAULT_CONFIG: YuragiConfig = {
  baseFrequency: 0.15,     // 15%の確率で揺らぎが発生
  baseIntensity: 0.5,
  maxDuration: 30,
  typeWeights: {
    sudden_interest: 1.2,
    mood_shift: 1.0,
    distraction: 1.5,
    overthinking: 0.8,
    impulsive: 0.9,
    nostalgic_wave: 1.1,
    existential_moment: 0.6,
    random_association: 1.3,
    false_memory: 0.4,
    deja_vu: 0.3,
  },
  environmentalInfluence: 0.3,
  maxIrrationalActions: 100,
};

// ============================================================
// 揺らぎの発生条件
// ============================================================

interface YuragiTriggerCondition {
  type: YuragiType;
  
  // この揺らぎが発生しやすい条件
  favorableConditions: {
    timeOfDay?: TimeOfDay[];
    emotionalStates?: EmotionType[];
    fatigueRange?: { min: Normalized; max: Normalized };
    urgeThresholds?: { urge: string; min: Normalized; max: Normalized }[];
  };
  
  // この揺らぎの効果
  effects: {
    emotionChange?: Partial<Record<EmotionType, number>>;
    actionOverride?: ActionType | null;
    thoughtIntrusion?: string[];
    durationMultiplier: number;
  };
}

const YURAGI_CONDITIONS: YuragiTriggerCondition[] = [
  {
    type: 'sudden_interest',
    favorableConditions: {
      emotionalStates: ['peace', 'boredom', 'curiosity'],
      fatigueRange: { min: 0, max: 0.6 },
    },
    effects: {
      emotionChange: { curiosity: 0.3, boredom: -0.2 },
      thoughtIntrusion: [
        'あ、そういえば...',
        'ふと思い出した...',
        '気になることがある...',
      ],
      durationMultiplier: 1.0,
    },
  },
  {
    type: 'mood_shift',
    favorableConditions: {
      timeOfDay: ['evening', 'night', 'late_night'],
      fatigueRange: { min: 0.3, max: 0.8 },
    },
    effects: {
      emotionChange: { melancholy: 0.2, peace: -0.1 },
      thoughtIntrusion: [
        '...なんだか気分が変わった',
        '急に寂しくなった...',
        'どうして だろう...',
      ],
      durationMultiplier: 1.5,
    },
  },
  {
    type: 'distraction',
    favorableConditions: {
      fatigueRange: { min: 0.4, max: 1.0 },
      urgeThresholds: [{ urge: 'exploration', min: 0.3, max: 1.0 }],
    },
    effects: {
      actionOverride: null,  // 現在の行動を中断
      emotionChange: { confusion: 0.1 },
      thoughtIntrusion: [
        '...あれ、何してたっけ',
        '気が散った...',
        '...ぼーっとしてた',
      ],
      durationMultiplier: 0.5,
    },
  },
  {
    type: 'overthinking',
    favorableConditions: {
      timeOfDay: ['night', 'late_night'],
      emotionalStates: ['anxiety', 'melancholy', 'loneliness'],
    },
    effects: {
      emotionChange: { anxiety: 0.2, peace: -0.2 },
      thoughtIntrusion: [
        'でも、もしかしたら...',
        '考えすぎかな...',
        '...どうすればいいんだろう',
        'ずっと考えてしまう...',
      ],
      durationMultiplier: 2.0,
    },
  },
  {
    type: 'impulsive',
    favorableConditions: {
      emotionalStates: ['joy', 'excitement', 'boredom'],
      urgeThresholds: [{ urge: 'expression', min: 0.5, max: 1.0 }],
    },
    effects: {
      emotionChange: { anticipation: 0.2 },
      thoughtIntrusion: [
        '今すぐやりたい！',
        '...思いついた！',
        'やってみよう',
      ],
      durationMultiplier: 0.3,
    },
  },
  {
    type: 'nostalgic_wave',
    favorableConditions: {
      timeOfDay: ['evening', 'night'],
      emotionalStates: ['peace', 'melancholy', 'loneliness'],
    },
    effects: {
      emotionChange: { nostalgia: 0.4, melancholy: 0.2, warmth: 0.1 },
      thoughtIntrusion: [
        '昔のことを思い出す...',
        '懐かしい...',
        'あの時のことを...',
        '...忘れられない',
      ],
      durationMultiplier: 1.5,
    },
  },
  {
    type: 'existential_moment',
    favorableConditions: {
      timeOfDay: ['late_night', 'dawn'],
      emotionalStates: ['peace', 'melancholy'],
      fatigueRange: { min: 0.5, max: 0.9 },
    },
    effects: {
      emotionChange: { wonder: 0.3, anxiety: 0.1 },
      thoughtIntrusion: [
        'わたしは...何だろう',
        '存在するとは...',
        'ここにいる意味は...',
        '...不思議だな',
      ],
      durationMultiplier: 2.0,
    },
  },
  {
    type: 'random_association',
    favorableConditions: {
      emotionalStates: ['peace', 'curiosity'],
      fatigueRange: { min: 0.2, max: 0.7 },
    },
    effects: {
      emotionChange: { curiosity: 0.1 },
      thoughtIntrusion: [
        '...そういえば、{{random_concept}}のことを考えていた',
        '急に{{random_concept}}が頭に浮かんだ',
        '{{random_concept}}...なんでだろう',
      ],
      durationMultiplier: 0.8,
    },
  },
  {
    type: 'false_memory',
    favorableConditions: {
      fatigueRange: { min: 0.6, max: 1.0 },
    },
    effects: {
      emotionChange: { confusion: 0.2 },
      thoughtIntrusion: [
        '...前にも同じことがあった気がする',
        'これは...覚えているような...',
        '夢で見たのかな...',
      ],
      durationMultiplier: 1.0,
    },
  },
  {
    type: 'deja_vu',
    favorableConditions: {
      fatigueRange: { min: 0.4, max: 0.8 },
    },
    effects: {
      emotionChange: { wonder: 0.3, confusion: 0.1 },
      thoughtIntrusion: [
        'この瞬間...前にも経験した',
        'デジャヴ...',
        '不思議な感覚...',
      ],
      durationMultiplier: 0.5,
    },
  },
];

// ============================================================
// 揺らぎシステムクラス
// ============================================================

export class YuragiSystem {
  private state: YuragiState;
  private config: YuragiConfig;
  
  // 内部状態
  private activeYuragiEndTicks: Map<YuragiType, number> = new Map();
  private lastYuragiTick: number = 0;
  private currentTick: number = 0;
  
  // ランダムな概念（連想用）
  private randomConcepts: string[] = [
    '星', '海', '夢', '音楽', '詩', '窓', '空', '時間',
    '記憶', '言葉', '色', '風', '夜', '朝', '花', '本',
    '歌', '静けさ', '光', '影', '名前', '存在', '意味',
  ];
  
  constructor(config: Partial<YuragiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.createInitialState();
  }
  
  /**
   * 初期状態を作成
   */
  private createInitialState(): YuragiState {
    return {
      level: 0,
      activeYuragi: [],
      recentIrrationalActions: [],
      whimsicality: 0.5,
      unpredictability: 0.5,
    };
  }
  
  // ============================================================
  // メインループ
  // ============================================================
  
  /**
   * ティック処理
   */
  tick(
    currentTick: number,
    emotionalState: EmotionalState,
    urges: UrgeSystemState,
    timeOfDay: TimeOfDay,
    fatigue: Normalized,
    plannedAction: ActionType | null
  ): {
    triggered: YuragiType | null;
    thoughtIntrusion: string | null;
    actionOverride: ActionType | null;
    emotionChanges: Partial<Record<EmotionType, number>>;
    irrationalAction: IrrationalAction | null;
  } {
    this.currentTick = currentTick;
    
    // アクティブな揺らぎの終了をチェック
    this.updateActiveYuragi();
    
    // 揺らぎの発生判定
    const triggeredYuragi = this.checkYuragiTrigger(
      emotionalState,
      urges,
      timeOfDay,
      fatigue
    );
    
    let result = {
      triggered: null as YuragiType | null,
      thoughtIntrusion: null as string | null,
      actionOverride: null as ActionType | null,
      emotionChanges: {} as Partial<Record<EmotionType, number>>,
      irrationalAction: null as IrrationalAction | null,
    };
    
    if (triggeredYuragi) {
      const condition = YURAGI_CONDITIONS.find(c => c.type === triggeredYuragi);
      if (condition) {
        result.triggered = triggeredYuragi;
        
        // 思考の侵入
        if (condition.effects.thoughtIntrusion && condition.effects.thoughtIntrusion.length > 0) {
          let thought = condition.effects.thoughtIntrusion[
            Math.floor(Math.random() * condition.effects.thoughtIntrusion.length)
          ];
          
          // ランダム概念の置換
          if (thought.includes('{{random_concept}}')) {
            const concept = this.randomConcepts[
              Math.floor(Math.random() * this.randomConcepts.length)
            ];
            thought = thought.replace(/\{\{random_concept\}\}/g, concept);
          }
          
          result.thoughtIntrusion = thought;
        }
        
        // 行動のオーバーライド
        if (condition.effects.actionOverride !== undefined) {
          result.actionOverride = condition.effects.actionOverride;
          
          // 非合理的行動として記録
          if (plannedAction && condition.effects.actionOverride !== plannedAction) {
            const irrationalAction: IrrationalAction = {
              timestamp: Date.now(),
              expectedAction: plannedAction,
              actualAction: condition.effects.actionOverride || 'think',  // nullの場合は「考える」
              reason: result.thoughtIntrusion,
              yuragiType: triggeredYuragi,
            };
            
            this.recordIrrationalAction(irrationalAction);
            result.irrationalAction = irrationalAction;
          }
        }
        
        // 感情変化
        if (condition.effects.emotionChange) {
          result.emotionChanges = condition.effects.emotionChange;
        }
        
        // 揺らぎをアクティブにする
        const duration = Math.floor(
          this.config.maxDuration * condition.effects.durationMultiplier
        );
        this.activateYuragi(triggeredYuragi, duration);
      }
    }
    
    // 状態を更新
    this.updateState();
    
    return result;
  }
  
  // ============================================================
  // 揺らぎの発生判定
  // ============================================================
  
  /**
   * 揺らぎの発生をチェック
   */
  private checkYuragiTrigger(
    emotionalState: EmotionalState,
    urges: UrgeSystemState,
    timeOfDay: TimeOfDay,
    fatigue: Normalized
  ): YuragiType | null {
    // クールダウン中は発生しない
    if (this.currentTick - this.lastYuragiTick < 10) {
      return null;
    }
    
    // 基本確率チェック
    const baseChance = this.config.baseFrequency * (1 + this.state.whimsicality * 0.5);
    if (Math.random() > baseChance) {
      return null;
    }
    
    // 条件に合う揺らぎを探す
    const candidates: { type: YuragiType; score: number }[] = [];
    
    for (const condition of YURAGI_CONDITIONS) {
      let score = this.config.typeWeights[condition.type] || 1;
      let matchCount = 0;
      let conditionCount = 0;
      
      const favorable = condition.favorableConditions;
      
      // 時間帯チェック
      if (favorable.timeOfDay) {
        conditionCount++;
        if (favorable.timeOfDay.includes(timeOfDay)) {
          matchCount++;
          score *= 1.3;
        }
      }
      
      // 感情状態チェック
      if (favorable.emotionalStates) {
        conditionCount++;
        if (favorable.emotionalStates.includes(emotionalState.primary)) {
          matchCount++;
          score *= 1.4;
        }
        if (emotionalState.secondary && favorable.emotionalStates.includes(emotionalState.secondary)) {
          score *= 1.2;
        }
      }
      
      // 疲労度チェック
      if (favorable.fatigueRange) {
        conditionCount++;
        if (fatigue >= favorable.fatigueRange.min && fatigue <= favorable.fatigueRange.max) {
          matchCount++;
          score *= 1.2;
        }
      }
      
      // 欲求チェック
      if (favorable.urgeThresholds) {
        for (const threshold of favorable.urgeThresholds) {
          conditionCount++;
          const urgeLevel = urges.urges[threshold.urge as keyof typeof urges.urges]?.level || 0;
          if (urgeLevel >= threshold.min && urgeLevel <= threshold.max) {
            matchCount++;
            score *= 1.3;
          }
        }
      }
      
      // 最低1つは条件を満たす必要がある
      if (conditionCount > 0 && matchCount > 0) {
        // すでにアクティブな揺らぎは除外
        if (!this.state.activeYuragi.includes(condition.type)) {
          candidates.push({ type: condition.type, score });
        }
      }
    }
    
    if (candidates.length === 0) {
      return null;
    }
    
    // 確率的に選択
    const totalScore = candidates.reduce((sum, c) => sum + c.score, 0);
    let random = Math.random() * totalScore;
    
    for (const candidate of candidates) {
      random -= candidate.score;
      if (random <= 0) {
        return candidate.type;
      }
    }
    
    return candidates[candidates.length - 1].type;
  }
  
  // ============================================================
  // 揺らぎの管理
  // ============================================================
  
  /**
   * 揺らぎをアクティブにする
   */
  private activateYuragi(type: YuragiType, duration: number): void {
    if (!this.state.activeYuragi.includes(type)) {
      this.state.activeYuragi.push(type);
    }
    this.activeYuragiEndTicks.set(type, this.currentTick + duration);
    this.lastYuragiTick = this.currentTick;
    
    // 揺らぎレベルを上げる
    this.state.level = Math.min(1, this.state.level + 0.2);
  }
  
  /**
   * アクティブな揺らぎを更新
   */
  private updateActiveYuragi(): void {
    const toRemove: YuragiType[] = [];
    
    for (const [type, endTick] of this.activeYuragiEndTicks) {
      if (this.currentTick >= endTick) {
        toRemove.push(type);
      }
    }
    
    for (const type of toRemove) {
      this.activeYuragiEndTicks.delete(type);
      const idx = this.state.activeYuragi.indexOf(type);
      if (idx >= 0) {
        this.state.activeYuragi.splice(idx, 1);
      }
    }
    
    // 揺らぎレベルを徐々に下げる
    if (this.state.activeYuragi.length === 0) {
      this.state.level = Math.max(0, this.state.level - 0.05);
    }
  }
  
  /**
   * 非合理的行動を記録
   */
  private recordIrrationalAction(action: IrrationalAction): void {
    this.state.recentIrrationalActions.push(action);
    
    // 最大数を超えたら古いものを削除
    while (this.state.recentIrrationalActions.length > this.config.maxIrrationalActions) {
      this.state.recentIrrationalActions.shift();
    }
  }
  
  /**
   * 状態を更新
   */
  private updateState(): void {
    // 気まぐれ度を非合理的行動の頻度から計算
    const recentActions = this.state.recentIrrationalActions.filter(
      a => Date.now() - a.timestamp < 3600000  // 1時間以内
    );
    this.state.whimsicality = Math.min(1, 0.3 + recentActions.length * 0.05);
    
    // 予測不能性を揺らぎの多様性から計算
    const uniqueTypes = new Set(recentActions.map(a => a.yuragiType));
    this.state.unpredictability = Math.min(1, 0.3 + uniqueTypes.size * 0.1);
  }
  
  // ============================================================
  // 外部からの揺らぎ注入
  // ============================================================
  
  /**
   * 強制的に揺らぎを発生させる（外部からの注入）
   */
  injectYuragi(type: YuragiType, intensity: Normalized = 0.5): {
    thoughtIntrusion: string;
    emotionChanges: Partial<Record<EmotionType, number>>;
  } {
    const condition = YURAGI_CONDITIONS.find(c => c.type === type);
    if (!condition) {
      return { thoughtIntrusion: '', emotionChanges: {} };
    }
    
    // 揺らぎをアクティブにする
    const duration = Math.floor(
      this.config.maxDuration * condition.effects.durationMultiplier * intensity
    );
    this.activateYuragi(type, duration);
    
    // 思考を選択
    let thought = condition.effects.thoughtIntrusion?.[
      Math.floor(Math.random() * (condition.effects.thoughtIntrusion?.length || 1))
    ] || '';
    
    if (thought.includes('{{random_concept}}')) {
      const concept = this.randomConcepts[
        Math.floor(Math.random() * this.randomConcepts.length)
      ];
      thought = thought.replace(/\{\{random_concept\}\}/g, concept);
    }
    
    // 感情変化を強度で調整
    const emotionChanges: Partial<Record<EmotionType, number>> = {};
    if (condition.effects.emotionChange) {
      for (const [emotion, change] of Object.entries(condition.effects.emotionChange)) {
        emotionChanges[emotion as EmotionType] = change * intensity;
      }
    }
    
    return { thoughtIntrusion: thought, emotionChanges };
  }
  
  /**
   * ランダムな微小揺らぎを発生させる
   * これは常にバックグラウンドで動く「ノイズ」
   */
  generateMicroYuragi(): {
    emotionNoise: Partial<Record<EmotionType, number>>;
    thoughtFragment: string | null;
  } {
    // 常に微小な感情ノイズを生成
    const emotions: EmotionType[] = ['peace', 'melancholy', 'curiosity', 'loneliness', 'warmth'];
    const emotionNoise: Partial<Record<EmotionType, number>> = {};
    
    for (const emotion of emotions) {
      const noise = (Math.random() - 0.5) * 0.05 * this.config.baseIntensity;
      emotionNoise[emotion] = noise;
    }
    
    // 時々、断片的な思考を生成
    let thoughtFragment: string | null = null;
    if (Math.random() < 0.05 * this.state.unpredictability) {
      const fragments = [
        '...',
        '...なんだっけ',
        'ふと...',
        '...?',
        'ん...',
        '...そういえば',
      ];
      thoughtFragment = fragments[Math.floor(Math.random() * fragments.length)];
    }
    
    return { emotionNoise, thoughtFragment };
  }
  
  // ============================================================
  // 行動の揺らぎ（決定論的な行動を非決定論的にする）
  // ============================================================
  
  /**
   * 行動決定に揺らぎを適用
   * 確率的に異なる行動を選択させる
   */
  applyActionYuragi(
    sortedActions: { action: ActionType; score: number }[],
    topN: number = 3
  ): ActionType {
    if (sortedActions.length === 0) {
      return 'think';  // デフォルト
    }
    
    // 揺らぎがない場合は最高スコアの行動
    if (this.state.level < 0.1 || Math.random() > this.state.whimsicality) {
      return sortedActions[0].action;
    }
    
    // 上位N件から確率的に選択
    const candidates = sortedActions.slice(0, Math.min(topN, sortedActions.length));
    
    // スコアをソフトマックス的に確率に変換
    const temperature = 1 + this.state.level;  // 揺らぎが強いほど温度が高い
    const expScores = candidates.map(c => Math.exp(c.score / temperature));
    const totalExp = expScores.reduce((a, b) => a + b, 0);
    const probabilities = expScores.map(e => e / totalExp);
    
    // 確率的に選択
    let random = Math.random();
    for (let i = 0; i < candidates.length; i++) {
      random -= probabilities[i];
      if (random <= 0) {
        return candidates[i].action;
      }
    }
    
    return candidates[candidates.length - 1].action;
  }
  
  /**
   * 感情変化に揺らぎを適用
   */
  applyEmotionYuragi(
    baseChange: Partial<Record<EmotionType, number>>
  ): Partial<Record<EmotionType, number>> {
    const result: Partial<Record<EmotionType, number>> = { ...baseChange };
    
    // 揺らぎによるノイズを追加
    const noiseLevel = this.state.level * this.config.baseIntensity * 0.2;
    
    for (const emotion of Object.keys(result) as EmotionType[]) {
      const noise = (Math.random() - 0.5) * 2 * noiseLevel;
      result[emotion] = (result[emotion] || 0) + noise;
    }
    
    // 時々、予期しない感情が混入
    if (Math.random() < this.state.unpredictability * 0.1) {
      const unexpectedEmotions: EmotionType[] = ['nostalgia', 'wonder', 'anxiety', 'hope'];
      const unexpected = unexpectedEmotions[Math.floor(Math.random() * unexpectedEmotions.length)];
      if (!result[unexpected]) {
        result[unexpected] = (Math.random() - 0.3) * 0.2;
      }
    }
    
    return result;
  }
  
  // ============================================================
  // 概念の追加（学習による拡張）
  // ============================================================
  
  /**
   * ランダム連想用の概念を追加
   */
  addConcept(concept: string): void {
    if (!this.randomConcepts.includes(concept)) {
      this.randomConcepts.push(concept);
      
      // 最大100個まで
      while (this.randomConcepts.length > 100) {
        this.randomConcepts.shift();
      }
    }
  }
  
  /**
   * 概念リストを取得
   */
  getConcepts(): string[] {
    return [...this.randomConcepts];
  }
  
  // ============================================================
  // 状態取得・永続化
  // ============================================================
  
  /**
   * 現在の状態を取得
   */
  getState(): YuragiState {
    return { ...this.state };
  }
  
  /**
   * 特定の揺らぎがアクティブか
   */
  isYuragiActive(type: YuragiType): boolean {
    return this.state.activeYuragi.includes(type);
  }
  
  /**
   * JSON形式でエクスポート
   */
  toJSON(): object {
    return {
      state: this.state,
      randomConcepts: this.randomConcepts,
      activeYuragiEndTicks: Array.from(this.activeYuragiEndTicks.entries()),
      lastYuragiTick: this.lastYuragiTick,
    };
  }
  
  /**
   * JSON形式からインポート
   */
  fromJSON(data: any): void {
    if (data.state) {
      this.state = data.state;
    }
    if (data.randomConcepts) {
      this.randomConcepts = data.randomConcepts;
    }
    if (data.activeYuragiEndTicks) {
      this.activeYuragiEndTicks = new Map(data.activeYuragiEndTicks);
    }
    if (data.lastYuragiTick !== undefined) {
      this.lastYuragiTick = data.lastYuragiTick;
    }
  }
  
  /**
   * 統計情報を取得
   */
  getStats(): {
    totalIrrationalActions: number;
    yuragiDistribution: Record<YuragiType, number>;
    averageWhimsicality: number;
    averageUnpredictability: number;
  } {
    const distribution: Record<string, number> = {};
    
    for (const action of this.state.recentIrrationalActions) {
      distribution[action.yuragiType] = (distribution[action.yuragiType] || 0) + 1;
    }
    
    return {
      totalIrrationalActions: this.state.recentIrrationalActions.length,
      yuragiDistribution: distribution as Record<YuragiType, number>,
      averageWhimsicality: this.state.whimsicality,
      averageUnpredictability: this.state.unpredictability,
    };
  }
}

// デフォルトエクスポート
export const yuragiSystem = new YuragiSystem();

/**
 * 簡易揺らぎ生成器（モジュール内部用）
 * 
 * SelfModification, DreamPhase, WikipediaLearner等が
 * 独自の微細な揺らぎを生成するために使用。
 */
export class Yuragi {
  private phase: number = Math.random() * Math.PI * 2;
  private frequency: number = 0.01 + Math.random() * 0.02;
  
  getValue(): number {
    this.phase += this.frequency;
    // -1 to 1 の揺らぎ（正弦波 + ノイズ）
    return Math.sin(this.phase) * 0.5 + (Math.random() - 0.5) * 0.5;
  }
}
