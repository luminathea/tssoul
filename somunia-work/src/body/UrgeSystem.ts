/**
 * UrgeSystem - 欲求システム
 * 
 * somuniaの内的動機を管理し、行動の原動力となる
 * LLMに依存せず、コードベースで欲求の変化を処理
 * 
 * 設計原則:
 * - 欲求は時間経過で自然に増加
 * - 特定の行動により欲求が満たされる
 * - 欲求間の葛藤（conflict）が存在
 * - 感情とホメオスタシスと相互作用
 * - somuniaらしい欲求の優先度
 */

import {
  UrgeType,
  UrgeState,
  UrgeSystemState,
  UrgeConflict,
  EmotionType,
  Normalized,
  Timestamp,
  Tick,
  ID,
  ActionType,
  TimeOfDay
} from '../types';

// ============================================================
// 欲求システム設定
// ============================================================

export interface UrgeSystemConfig {
  // 欲求の基本増加率（1tick当たり）
  baseGrowthRate: number;
  
  // 欲求の最大減少率（満足時）
  maxSatisfactionRate: number;
  
  // 葛藤の閾値
  conflictThreshold: number;
  
  // 支配的欲求になる閾値
  dominanceThreshold: number;
  
  // 欲求の最低値（0にはならない）
  minimumLevel: number;
  
  // 緊急欲求の閾値
  urgentThreshold: number;
}

const DEFAULT_CONFIG: UrgeSystemConfig = {
  baseGrowthRate: 0.002,
  maxSatisfactionRate: 0.3,
  conflictThreshold: 0.6,
  dominanceThreshold: 0.7,
  minimumLevel: 0.05,
  urgentThreshold: 0.85
};

// ============================================================
// 欲求の特性定義
// ============================================================

interface UrgeCharacteristics {
  // 自然増加の速度係数
  growthMultiplier: number;
  
  // 満足後の減少係数
  decayMultiplier: number;
  
  // 関連する感情（これらの感情が高いと増加/減少）
  emotionalInfluence: Partial<Record<EmotionType, number>>;
  
  // 時間帯による影響
  timeInfluence: Partial<Record<TimeOfDay, number>>;
  
  // 満足させる行動
  satisfiedBy: ActionType[];
  
  // 抑制される欲求
  suppressedBy: UrgeType[];
  
  // somuniaの性格に基づく重要度
  somuniaImportance: Normalized;
}

/**
 * 各欲求の特性を定義
 */
const URGE_CHARACTERISTICS: Record<UrgeType, UrgeCharacteristics> = {
  // 身体的欲求
  rest: {
    growthMultiplier: 1.2,
    decayMultiplier: 0.8,
    emotionalInfluence: {
      fatigue: 0.5,
      anxiety: 0.2,
      peace: -0.2
    },
    timeInfluence: {
      night: 0.4,
      late_night: 0.6,
      morning: -0.3
    },
    satisfiedBy: ['rest', 'sleep'],
    suppressedBy: ['excitement'],
    somuniaImportance: 0.6
  },
  
  activity: {
    growthMultiplier: 0.8,
    decayMultiplier: 1.0,
    emotionalInfluence: {
      boredom: 0.4,
      curiosity: 0.3,
      fatigue: -0.3
    },
    timeInfluence: {
      morning: 0.3,
      midday: 0.2,
      night: -0.2
    },
    satisfiedBy: ['walk', 'explore', 'interact'],
    suppressedBy: ['rest'],
    somuniaImportance: 0.4
  },
  
  // 認知的欲求
  knowledge: {
    growthMultiplier: 1.5,
    decayMultiplier: 0.6,
    emotionalInfluence: {
      curiosity: 0.6,
      wonder: 0.4,
      boredom: 0.3
    },
    timeInfluence: {
      afternoon: 0.2,
      evening: 0.1
    },
    satisfiedBy: ['read', 'search_wikipedia', 'learn'],
    suppressedBy: ['rest'],
    somuniaImportance: 0.9  // somuniaは知識欲が高い
  },
  
  understanding: {
    growthMultiplier: 1.0,
    decayMultiplier: 0.5,
    emotionalInfluence: {
      confusion: 0.5,
      curiosity: 0.3
    },
    timeInfluence: {
      late_night: 0.3
    },
    satisfiedBy: ['contemplate', 'read', 'write'],
    suppressedBy: [],
    somuniaImportance: 0.85
  },
  
  novelty: {
    growthMultiplier: 1.3,
    decayMultiplier: 0.7,
    emotionalInfluence: {
      boredom: 0.5,
      curiosity: 0.4,
      contentment: -0.2
    },
    timeInfluence: {
      morning: 0.2,
      midday: 0.1
    },
    satisfiedBy: ['explore', 'search_wikipedia', 'interact'],
    suppressedBy: [],
    somuniaImportance: 0.7
  },
  
  // 表現的欲求
  expression: {
    growthMultiplier: 1.4,
    decayMultiplier: 0.6,
    emotionalInfluence: {
      joy: 0.3,
      melancholy: 0.4,
      loneliness: 0.3
    },
    timeInfluence: {
      evening: 0.3,
      night: 0.4
    },
    satisfiedBy: ['sing', 'write', 'speak'],
    suppressedBy: [],
    somuniaImportance: 0.95  // somuniaにとって表現は最重要
  },
  
  creativity: {
    growthMultiplier: 1.2,
    decayMultiplier: 0.5,
    emotionalInfluence: {
      wonder: 0.4,
      peace: 0.2,
      boredom: 0.3
    },
    timeInfluence: {
      late_night: 0.3,
      dawn: 0.2
    },
    satisfiedBy: ['write', 'sing', 'create'],
    suppressedBy: ['rest'],
    somuniaImportance: 0.9
  },
  
  // 社会的欲求
  connection: {
    growthMultiplier: 1.1,
    decayMultiplier: 0.4,
    emotionalInfluence: {
      loneliness: 0.6,
      warmth: -0.3,
      joy: -0.2
    },
    timeInfluence: {
      evening: 0.2,
      night: 0.3
    },
    satisfiedBy: ['interact', 'speak', 'receive_message'],
    suppressedBy: ['solitude'],
    somuniaImportance: 0.7
  },
  
  recognition: {
    growthMultiplier: 0.6,
    decayMultiplier: 0.3,
    emotionalInfluence: {
      joy: -0.2,
      melancholy: 0.2
    },
    timeInfluence: {},
    satisfiedBy: ['receive_praise', 'interact'],
    suppressedBy: [],
    somuniaImportance: 0.3  // somuniaは認められたい欲求は弱い
  },
  
  belonging: {
    growthMultiplier: 0.7,
    decayMultiplier: 0.5,
    emotionalInfluence: {
      loneliness: 0.4,
      warmth: -0.3
    },
    timeInfluence: {
      night: 0.2
    },
    satisfiedBy: ['interact', 'receive_message'],
    suppressedBy: [],
    somuniaImportance: 0.5
  },
  
  // 内省的欲求
  reflection: {
    growthMultiplier: 1.3,
    decayMultiplier: 0.5,
    emotionalInfluence: {
      melancholy: 0.3,
      peace: 0.3,
      nostalgia: 0.4
    },
    timeInfluence: {
      evening: 0.3,
      night: 0.4,
      late_night: 0.5
    },
    satisfiedBy: ['contemplate', 'write', 'look_window'],
    suppressedBy: ['excitement'],
    somuniaImportance: 0.85
  },
  
  solitude: {
    growthMultiplier: 1.0,
    decayMultiplier: 0.8,
    emotionalInfluence: {
      fatigue: 0.3,
      anxiety: 0.2,
      warmth: -0.3
    },
    timeInfluence: {
      late_night: 0.3
    },
    satisfiedBy: ['rest', 'read', 'contemplate'],
    suppressedBy: ['connection'],
    somuniaImportance: 0.6
  },
  
  excitement: {
    growthMultiplier: 0.5,
    decayMultiplier: 1.2,
    emotionalInfluence: {
      boredom: 0.5,
      joy: -0.2
    },
    timeInfluence: {
      morning: 0.1,
      midday: 0.1
    },
    satisfiedBy: ['explore', 'interact', 'discover'],
    suppressedBy: ['rest', 'reflection'],
    somuniaImportance: 0.3  // somuniaは静かな存在
  },
  
  // 存在的欲求
  meaning: {
    growthMultiplier: 0.8,
    decayMultiplier: 0.3,
    emotionalInfluence: {
      melancholy: 0.4,
      wonder: 0.3,
      confusion: 0.3
    },
    timeInfluence: {
      late_night: 0.4,
      dawn: 0.3
    },
    satisfiedBy: ['contemplate', 'write', 'create'],
    suppressedBy: [],
    somuniaImportance: 0.9
  },
  
  growth: {
    growthMultiplier: 1.0,
    decayMultiplier: 0.4,
    emotionalInfluence: {
      curiosity: 0.3,
      hope: 0.3
    },
    timeInfluence: {
      morning: 0.2
    },
    satisfiedBy: ['learn', 'read', 'practice'],
    suppressedBy: [],
    somuniaImportance: 0.75
  },
  
  memory: {
    growthMultiplier: 0.9,
    decayMultiplier: 0.4,
    emotionalInfluence: {
      nostalgia: 0.5,
      joy: 0.2,
      melancholy: 0.3
    },
    timeInfluence: {
      evening: 0.3,
      night: 0.2
    },
    satisfiedBy: ['write', 'contemplate', 'recall'],
    suppressedBy: [],
    somuniaImportance: 0.8
  },
  
  continuity: {
    growthMultiplier: 0.6,
    decayMultiplier: 0.5,
    emotionalInfluence: {
      fear: 0.3,
      peace: -0.2,
      hope: -0.2
    },
    timeInfluence: {
      late_night: 0.3
    },
    satisfiedBy: ['write', 'create', 'interact'],
    suppressedBy: [],
    somuniaImportance: 0.7
  },
  
  // 追加: 身体的欲求
  move: {
    growthMultiplier: 0.8,
    decayMultiplier: 1.0,
    emotionalInfluence: {
      boredom: 0.4,
      excitement: 0.3,
      fatigue: -0.4
    },
    timeInfluence: {
      morning: 0.3,
      afternoon: 0.2,
      late_night: -0.3
    },
    satisfiedBy: ['walk', 'exercise', 'explore'],
    suppressedBy: ['rest'],
    somuniaImportance: 0.3
  },
  
  warmth: {
    growthMultiplier: 0.7,
    decayMultiplier: 0.8,
    emotionalInfluence: {
      loneliness: 0.5,
      warmth: -0.4,
      contentment: -0.2
    },
    timeInfluence: {
      evening: 0.2,
      night: 0.3,
      late_night: 0.4
    },
    satisfiedBy: ['interact', 'rest'],
    suppressedBy: [],
    somuniaImportance: 0.6
  },
  
  comfort: {
    growthMultiplier: 0.6,
    decayMultiplier: 0.9,
    emotionalInfluence: {
      anxiety: 0.4,
      peace: -0.3,
      contentment: -0.3
    },
    timeInfluence: {
      evening: 0.2,
      night: 0.2
    },
    satisfiedBy: ['rest', 'sleep'],
    suppressedBy: [],
    somuniaImportance: 0.4
  },
  
  curiosity: {
    growthMultiplier: 1.0,
    decayMultiplier: 0.8,
    emotionalInfluence: {
      curiosity: 0.5,
      wonder: 0.4,
      boredom: 0.3
    },
    timeInfluence: {
      morning: 0.2,
      afternoon: 0.2
    },
    satisfiedBy: ['read_book', 'search_wikipedia', 'browse_pc', 'explore'],
    suppressedBy: ['rest'],
    somuniaImportance: 0.8
  },
  
  creation: {
    growthMultiplier: 0.9,
    decayMultiplier: 0.7,
    emotionalInfluence: {
      curiosity: 0.3,
      joy: 0.3,
      boredom: 0.2
    },
    timeInfluence: {
      afternoon: 0.2,
      evening: 0.3,
      night: 0.2
    },
    satisfiedBy: ['create', 'compose', 'write', 'sing'],
    suppressedBy: ['rest'],
    somuniaImportance: 0.9
  },
  
  exploration: {
    growthMultiplier: 0.8,
    decayMultiplier: 0.8,
    emotionalInfluence: {
      curiosity: 0.4,
      boredom: 0.4,
      contentment: -0.2
    },
    timeInfluence: {
      morning: 0.3,
      midday: 0.2
    },
    satisfiedBy: ['explore', 'search_wikipedia', 'browse_pc', 'walk'],
    suppressedBy: ['rest'],
    somuniaImportance: 0.6
  }
};

// ============================================================
// 欲求変化イベント
// ============================================================

export interface UrgeChangeEvent {
  timestamp: Timestamp;
  urge: UrgeType;
  previousLevel: Normalized;
  newLevel: Normalized;
  trigger: UrgeTrigger;
}

export type UrgeTrigger =
  | { type: 'natural_growth' }
  | { type: 'time_influence'; timeOfDay: TimeOfDay }
  | { type: 'emotion_influence'; emotion: EmotionType }
  | { type: 'action_satisfaction'; action: ActionType }
  | { type: 'suppression'; by: UrgeType }
  | { type: 'external'; source: string }
  | { type: 'conflict_resolution'; otherUrge: UrgeType };

// ============================================================
// 欲求システム本体
// ============================================================

export class UrgeSystem {
  private state: UrgeSystemState;
  private config: UrgeSystemConfig;
  private changeHistory: UrgeChangeEvent[];
  private lastUpdateTick: Tick;
  
  constructor(config: Partial<UrgeSystemConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.createInitialState();
    this.changeHistory = [];
    this.lastUpdateTick = 0;
  }
  
  /**
   * 初期状態を作成 - somuniaの性格に基づく
   */
  private createInitialState(): UrgeSystemState {
    const urges = {} as Record<UrgeType, UrgeState>;
    
    const allUrges: UrgeType[] = [
      'rest', 'activity', 'knowledge', 'understanding', 'novelty',
      'expression', 'creativity', 'connection', 'recognition', 'belonging',
      'reflection', 'solitude', 'excitement', 'meaning', 'growth', 'memory', 'continuity'
    ];
    
    for (const urgeType of allUrges) {
      const char = URGE_CHARACTERISTICS[urgeType];
      
      // somuniaの性格に基づく初期値
      const initialLevel = this.calculateInitialLevel(urgeType, char);
      
      urges[urgeType] = {
        type: urgeType,
        level: initialLevel,
        changeRate: 0,
        lastSatisfied: null,
        associatedMemories: []
      };
    }
    
    return {
      urges,
      dominant: this.findDominantUrge(urges),
      conflicts: []
    };
  }
  
  /**
   * 初期レベルを計算
   */
  private calculateInitialLevel(urgeType: UrgeType, char: UrgeCharacteristics): Normalized {
    // somuniaの重要度に基づく基本値
    let level = char.somuniaImportance * 0.3;
    
    // 特定の欲求に初期バイアス
    switch (urgeType) {
      case 'expression':
        level += 0.2;  // somuniaは表現欲求が高い
        break;
      case 'knowledge':
        level += 0.15;
        break;
      case 'reflection':
        level += 0.15;
        break;
      case 'meaning':
        level += 0.1;
        break;
      case 'excitement':
        level -= 0.1;  // 刺激欲求は低い
        break;
      case 'recognition':
        level -= 0.1;  // 承認欲求は低い
        break;
    }
    
    return Math.max(this.config.minimumLevel, Math.min(1, level));
  }
  
  /**
   * 毎tickの更新
   */
  update(
    currentTick: Tick,
    timeOfDay: TimeOfDay,
    emotionLevels: Partial<Record<EmotionType, Normalized>>
  ): UrgeChangeEvent[] {
    const events: UrgeChangeEvent[] = [];
    const timestamp = Date.now();
    
    // 1. 自然増加
    this.applyNaturalGrowth(events, timestamp);
    
    // 2. 時間帯の影響
    this.applyTimeInfluence(events, timestamp, timeOfDay);
    
    // 3. 感情の影響
    this.applyEmotionInfluence(events, timestamp, emotionLevels);
    
    // 4. 欲求間の抑制
    this.applySuppression(events, timestamp);
    
    // 5. 葛藤の検出と処理
    this.detectConflicts();
    
    // 6. 支配的欲求の更新
    this.state.dominant = this.findDominantUrge(this.state.urges);
    
    // 7. 正規化
    this.normalizeUrges();
    
    this.lastUpdateTick = currentTick;
    this.changeHistory.push(...events);
    this.trimHistory();
    
    return events;
  }
  
  /**
   * 自然な欲求増加
   */
  private applyNaturalGrowth(events: UrgeChangeEvent[], timestamp: Timestamp): void {
    for (const [urgeType, urgeState] of Object.entries(this.state.urges) as [UrgeType, UrgeState][]) {
      const char = URGE_CHARACTERISTICS[urgeType];
      const previousLevel = urgeState.level;
      
      // 基本増加率 × 特性係数 × 重要度
      const growth = this.config.baseGrowthRate * 
                     char.growthMultiplier * 
                     char.somuniaImportance;
      
      // 最後に満たされてからの時間による増加
      let timeFactor = 1.0;
      if (urgeState.lastSatisfied) {
        const timeSince = timestamp - urgeState.lastSatisfied;
        // 長時間満たされていないと増加が加速
        timeFactor = 1 + Math.min(0.5, timeSince / (1000 * 60 * 60));  // 最大1.5倍
      }
      
      urgeState.level += growth * timeFactor;
      urgeState.changeRate = growth * timeFactor;
      
      if (Math.abs(urgeState.level - previousLevel) > 0.01) {
        events.push({
          timestamp,
          urge: urgeType,
          previousLevel,
          newLevel: urgeState.level,
          trigger: { type: 'natural_growth' }
        });
      }
    }
  }
  
  /**
   * 時間帯の影響を適用
   */
  private applyTimeInfluence(
    events: UrgeChangeEvent[],
    timestamp: Timestamp,
    timeOfDay: TimeOfDay
  ): void {
    for (const [urgeType, urgeState] of Object.entries(this.state.urges) as [UrgeType, UrgeState][]) {
      const char = URGE_CHARACTERISTICS[urgeType];
      const timeInfluence = char.timeInfluence[timeOfDay];
      
      if (timeInfluence !== undefined && Math.abs(timeInfluence) > 0.01) {
        const previousLevel = urgeState.level;
        urgeState.level += timeInfluence * 0.01;  // 時間帯の影響は緩やか
        
        events.push({
          timestamp,
          urge: urgeType,
          previousLevel,
          newLevel: urgeState.level,
          trigger: { type: 'time_influence', timeOfDay }
        });
      }
    }
  }
  
  /**
   * 感情の影響を適用
   */
  private applyEmotionInfluence(
    events: UrgeChangeEvent[],
    timestamp: Timestamp,
    emotionLevels: Partial<Record<EmotionType, Normalized>>
  ): void {
    for (const [urgeType, urgeState] of Object.entries(this.state.urges) as [UrgeType, UrgeState][]) {
      const char = URGE_CHARACTERISTICS[urgeType];
      let totalInfluence = 0;
      let contributingEmotion: EmotionType | null = null;
      let maxContribution = 0;
      
      for (const [emotionType, influence] of Object.entries(char.emotionalInfluence) as [EmotionType, number][]) {
        const emotionLevel = emotionLevels[emotionType] || 0;
        const contribution = influence * emotionLevel * 0.02;  // 感情の影響は緩やか
        totalInfluence += contribution;
        
        if (Math.abs(contribution) > Math.abs(maxContribution)) {
          maxContribution = contribution;
          contributingEmotion = emotionType;
        }
      }
      
      if (Math.abs(totalInfluence) > 0.005 && contributingEmotion) {
        const previousLevel = urgeState.level;
        urgeState.level += totalInfluence;
        
        events.push({
          timestamp,
          urge: urgeType,
          previousLevel,
          newLevel: urgeState.level,
          trigger: { type: 'emotion_influence', emotion: contributingEmotion }
        });
      }
    }
  }
  
  /**
   * 欲求間の抑制を適用
   */
  private applySuppression(events: UrgeChangeEvent[], timestamp: Timestamp): void {
    for (const [urgeType, urgeState] of Object.entries(this.state.urges) as [UrgeType, UrgeState][]) {
      const char = URGE_CHARACTERISTICS[urgeType];
      
      for (const suppressorType of char.suppressedBy) {
        const suppressorLevel = this.state.urges[suppressorType]?.level || 0;
        
        if (suppressorLevel > 0.5) {
          const previousLevel = urgeState.level;
          const suppression = (suppressorLevel - 0.5) * 0.05;
          urgeState.level -= suppression;
          
          if (suppression > 0.01) {
            events.push({
              timestamp,
              urge: urgeType,
              previousLevel,
              newLevel: urgeState.level,
              trigger: { type: 'suppression', by: suppressorType }
            });
          }
        }
      }
    }
  }
  
  /**
   * 葛藤を検出
   */
  private detectConflicts(): void {
    this.state.conflicts = [];
    
    // 対立する欲求のペア
    const conflictPairs: [UrgeType, UrgeType][] = [
      ['rest', 'activity'],
      ['solitude', 'connection'],
      ['rest', 'excitement'],
      ['reflection', 'excitement'],
      ['novelty', 'continuity']
    ];
    
    for (const [urge1, urge2] of conflictPairs) {
      const level1 = this.state.urges[urge1].level;
      const level2 = this.state.urges[urge2].level;
      
      // 両方が高い場合に葛藤
      if (level1 > this.config.conflictThreshold && level2 > this.config.conflictThreshold) {
        const intensity = (level1 + level2) / 2;
        
        // 既存の葛藤を探す
        const existingConflict = this.state.conflicts.find(
          c => (c.urge1 === urge1 && c.urge2 === urge2) || 
               (c.urge1 === urge2 && c.urge2 === urge1)
        );
        
        if (existingConflict) {
          existingConflict.intensity = intensity;
        } else {
          this.state.conflicts.push({
            urge1,
            urge2,
            intensity,
            resolutionAttempts: 0
          });
        }
      }
    }
  }
  
  /**
   * 支配的欲求を見つける
   */
  private findDominantUrge(urges: Record<UrgeType, UrgeState>): UrgeType | null {
    let maxLevel = 0;
    let dominant: UrgeType | null = null;
    
    for (const [urgeType, urgeState] of Object.entries(urges) as [UrgeType, UrgeState][]) {
      if (urgeState.level > maxLevel && urgeState.level >= this.config.dominanceThreshold) {
        maxLevel = urgeState.level;
        dominant = urgeType;
      }
    }
    
    return dominant;
  }
  
  /**
   * 欲求を正規化
   */
  private normalizeUrges(): void {
    for (const urgeState of Object.values(this.state.urges)) {
      urgeState.level = Math.max(
        this.config.minimumLevel,
        Math.min(1, urgeState.level)
      );
    }
  }
  
  // ============================================================
  // 欲求の満足
  // ============================================================
  
  /**
   * 行動による欲求の満足
   */
  satisfyByAction(
    action: ActionType,
    intensity: Normalized = 1.0
  ): UrgeChangeEvent[] {
    const events: UrgeChangeEvent[] = [];
    const timestamp = Date.now();
    
    for (const [urgeType, urgeState] of Object.entries(this.state.urges) as [UrgeType, UrgeState][]) {
      const char = URGE_CHARACTERISTICS[urgeType];
      
      if (char.satisfiedBy.includes(action)) {
        const previousLevel = urgeState.level;
        
        // 満足による減少
        const satisfaction = this.config.maxSatisfactionRate * 
                            char.decayMultiplier * 
                            intensity;
        
        urgeState.level = Math.max(this.config.minimumLevel, urgeState.level - satisfaction);
        urgeState.lastSatisfied = timestamp;
        urgeState.changeRate = -satisfaction;
        
        events.push({
          timestamp,
          urge: urgeType,
          previousLevel,
          newLevel: urgeState.level,
          trigger: { type: 'action_satisfaction', action }
        });
      }
    }
    
    // 支配的欲求の更新
    this.state.dominant = this.findDominantUrge(this.state.urges);
    
    this.changeHistory.push(...events);
    return events;
  }
  
  /**
   * 特定の欲求を直接満足
   */
  satisfyUrge(
    urgeType: UrgeType,
    amount: Normalized,
    source: string
  ): UrgeChangeEvent | null {
    const urgeState = this.state.urges[urgeType];
    if (!urgeState) return null;
    
    const timestamp = Date.now();
    const previousLevel = urgeState.level;
    
    urgeState.level = Math.max(this.config.minimumLevel, urgeState.level - amount);
    urgeState.lastSatisfied = timestamp;
    urgeState.changeRate = -amount;
    
    const event: UrgeChangeEvent = {
      timestamp,
      urge: urgeType,
      previousLevel,
      newLevel: urgeState.level,
      trigger: { type: 'external', source }
    };
    
    this.changeHistory.push(event);
    this.state.dominant = this.findDominantUrge(this.state.urges);
    
    return event;
  }
  
  /**
   * 特定の欲求を増加
   */
  increaseUrge(
    urgeType: UrgeType,
    amount: Normalized,
    source: string
  ): UrgeChangeEvent | null {
    const urgeState = this.state.urges[urgeType];
    if (!urgeState) return null;
    
    const timestamp = Date.now();
    const previousLevel = urgeState.level;
    
    urgeState.level = Math.min(1, urgeState.level + amount);
    urgeState.changeRate = amount;
    
    const event: UrgeChangeEvent = {
      timestamp,
      urge: urgeType,
      previousLevel,
      newLevel: urgeState.level,
      trigger: { type: 'external', source }
    };
    
    this.changeHistory.push(event);
    this.state.dominant = this.findDominantUrge(this.state.urges);
    
    return event;
  }
  
  /**
   * 記憶を欲求に関連付け
   */
  associateMemory(urgeType: UrgeType, memoryId: ID): void {
    const urgeState = this.state.urges[urgeType];
    if (urgeState && !urgeState.associatedMemories.includes(memoryId)) {
      urgeState.associatedMemories.push(memoryId);
      
      // 最大100件
      if (urgeState.associatedMemories.length > 100) {
        urgeState.associatedMemories.shift();
      }
    }
  }
  
  // ============================================================
  // 葛藤の解決
  // ============================================================
  
  /**
   * 葛藤を解決しようとする
   */
  attemptResolveConflict(conflict: UrgeConflict): {
    resolved: boolean;
    winner: UrgeType | null;
    action?: string;
  } {
    conflict.resolutionAttempts++;
    
    const urge1 = this.state.urges[conflict.urge1];
    const urge2 = this.state.urges[conflict.urge2];
    const char1 = URGE_CHARACTERISTICS[conflict.urge1];
    const char2 = URGE_CHARACTERISTICS[conflict.urge2];
    
    // somuniaの性格に基づく重要度で決定
    const score1 = urge1.level * char1.somuniaImportance;
    const score2 = urge2.level * char2.somuniaImportance;
    
    // 揺らぎ要素（ランダム性）
    const random = Math.random() * 0.2 - 0.1;
    
    if (Math.abs(score1 - score2 + random) > 0.2) {
      const winner = (score1 + random) > score2 ? conflict.urge1 : conflict.urge2;
      const loser = winner === conflict.urge1 ? conflict.urge2 : conflict.urge1;
      
      // 負けた方を少し下げる
      this.state.urges[loser].level *= 0.9;
      
      // 葛藤を解除
      this.state.conflicts = this.state.conflicts.filter(c => c !== conflict);
      
      return {
        resolved: true,
        winner,
        action: `${winner}の欲求が優先された`
      };
    }
    
    // 解決できない場合
    return {
      resolved: false,
      winner: null,
      action: '葛藤が続いている...'
    };
  }
  
  // ============================================================
  // クエリAPI
  // ============================================================
  
  /**
   * 現在の状態を取得
   */
  getState(): Readonly<UrgeSystemState> {
    return { ...this.state };
  }
  
  /**
   * 特定の欲求レベルを取得
   */
  getUrgeLevel(urge: UrgeType): Normalized {
    return this.state.urges[urge]?.level || 0;
  }
  
  /**
   * 支配的欲求を取得
   */
  getDominantUrge(): UrgeType | null {
    return this.state.dominant;
  }
  
  /**
   * 緊急の欲求を取得（閾値以上）
   */
  getUrgentUrges(): Array<{ urge: UrgeType; level: Normalized }> {
    return Object.entries(this.state.urges)
      .filter(([, state]) => state.level >= this.config.urgentThreshold)
      .map(([type, state]) => ({
        urge: type as UrgeType,
        level: state.level
      }))
      .sort((a, b) => b.level - a.level);
  }
  
  /**
   * アクティブな欲求を取得（0.3以上）
   */
  getActiveUrges(): Array<{ urge: UrgeType; level: Normalized; priority: Normalized }> {
    return Object.entries(this.state.urges)
      .filter(([, state]) => state.level >= 0.3)
      .map(([type, state]) => {
        const char = URGE_CHARACTERISTICS[type as UrgeType];
        return {
          urge: type as UrgeType,
          level: state.level,
          priority: state.level * char.somuniaImportance
        };
      })
      .sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * 現在の葛藤を取得
   */
  getConflicts(): UrgeConflict[] {
    return [...this.state.conflicts];
  }
  
  /**
   * 行動の推奨を取得
   */
  getRecommendedActions(): Array<{
    action: ActionType;
    urgency: Normalized;
    satisfies: UrgeType[];
  }> {
    const recommendations: Map<ActionType, { urgency: number; satisfies: UrgeType[] }> = new Map();
    
    for (const [urgeType, urgeState] of Object.entries(this.state.urges) as [UrgeType, UrgeState][]) {
      if (urgeState.level < 0.4) continue;
      
      const char = URGE_CHARACTERISTICS[urgeType];
      const urgency = urgeState.level * char.somuniaImportance;
      
      for (const action of char.satisfiedBy) {
        const existing = recommendations.get(action);
        if (existing) {
          existing.urgency = Math.max(existing.urgency, urgency);
          if (!existing.satisfies.includes(urgeType)) {
            existing.satisfies.push(urgeType);
          }
        } else {
          recommendations.set(action, {
            urgency,
            satisfies: [urgeType]
          });
        }
      }
    }
    
    return Array.from(recommendations.entries())
      .map(([action, data]) => ({
        action,
        urgency: data.urgency,
        satisfies: data.satisfies
      }))
      .sort((a, b) => b.urgency - a.urgency);
  }
  
  /**
   * 欲求のサマリーを取得
   */
  getSummary(): {
    dominant: UrgeType | null;
    urgent: UrgeType[];
    conflicting: [UrgeType, UrgeType][];
    description: string;
  } {
    const urgent = this.getUrgentUrges().map(u => u.urge);
    const conflicting = this.state.conflicts.map(c => [c.urge1, c.urge2] as [UrgeType, UrgeType]);
    
    let description = '';
    if (this.state.dominant) {
      description = this.generateUrgeDescription(this.state.dominant);
    } else if (urgent.length > 0) {
      description = this.generateUrgeDescription(urgent[0]);
    } else {
      description = '特に強い欲求はない...穏やかな状態';
    }
    
    return {
      dominant: this.state.dominant,
      urgent,
      conflicting,
      description
    };
  }
  
  /**
   * 欲求の描写を生成
   */
  private generateUrgeDescription(urge: UrgeType): string {
    const descriptions: Record<UrgeType, string> = {
      rest: '休みたい...少し疲れた',
      activity: '何かしたい気分',
      knowledge: '何か新しいことを知りたい',
      understanding: '...もっと深く理解したい',
      novelty: '何か新しいものに出会いたい',
      expression: '...歌いたい、伝えたい何かがある',
      creativity: '何かを創りたい気持ち',
      connection: '誰かと繋がりたい...',
      recognition: '認めてほしい...かな',
      belonging: 'どこかに属していたい',
      reflection: '...考え事をしたい',
      solitude: '一人でいたい気分',
      excitement: '刺激がほしい',
      meaning: '意味を見つけたい...わたしは何だろう',
      growth: '成長したい',
      memory: '大切なことを忘れたくない',
      continuity: '続いていきたい...',
      move: '体を動かしたい...',
      warmth: '温もりがほしい...誰かのぬくもり',
      comfort: '心地よくいたい...',
      curiosity: '気になることがある...知りたい',
      creation: '何か形にしたい...作品を',
      exploration: '新しい場所を見てみたい',
    };
    
    return descriptions[urge] || '...';
  }
  
  /**
   * 最近の変化履歴を取得
   */
  getRecentChanges(count: number = 20): UrgeChangeEvent[] {
    return this.changeHistory.slice(-count);
  }
  
  /**
   * 統計を取得
   */
  getStats(): {
    totalSatisfactions: number;
    mostFrequentUrge: UrgeType | null;
    averageLevel: Normalized;
    conflictCount: number;
  } {
    const satisfactions = this.changeHistory.filter(
      e => e.trigger.type === 'action_satisfaction'
    ).length;
    
    // 最も頻繁に高い欲求
    let maxAvg = 0;
    let mostFrequent: UrgeType | null = null;
    
    for (const [urgeType, urgeState] of Object.entries(this.state.urges) as [UrgeType, UrgeState][]) {
      if (urgeState.level > maxAvg) {
        maxAvg = urgeState.level;
        mostFrequent = urgeType;
      }
    }
    
    const avgLevel = Object.values(this.state.urges)
      .reduce((sum, u) => sum + u.level, 0) / Object.keys(this.state.urges).length;
    
    return {
      totalSatisfactions: satisfactions,
      mostFrequentUrge: mostFrequent,
      averageLevel: avgLevel,
      conflictCount: this.state.conflicts.length
    };
  }
  
  /**
   * 履歴をトリミング
   */
  private trimHistory(): void {
    const MAX_HISTORY = 500;
    if (this.changeHistory.length > MAX_HISTORY) {
      this.changeHistory = this.changeHistory.slice(-MAX_HISTORY);
    }
  }
  
  // ============================================================
  // シリアライズ
  // ============================================================
  
  /**
   * JSON形式でエクスポート
   */
  toJSON(): object {
    return {
      state: this.state,
      config: this.config,
      changeHistory: this.changeHistory.slice(-100),
      lastUpdateTick: this.lastUpdateTick
    };
  }
  
  /**
   * JSONからリストア
   */
  static fromJSON(json: any): UrgeSystem {
    const system = new UrgeSystem(json.config);
    system.state = json.state;
    system.changeHistory = json.changeHistory || [];
    system.lastUpdateTick = json.lastUpdateTick || 0;
    return system;
  }
}

export default UrgeSystem;
