/**
 * somunia v10 "Soul Engine" - 型定義
 * 
 * LLMに依存しない自律的意識システムの型定義
 * 
 * 設計原則:
 * 1. 行動原理はコード内で完結
 * 2. 自己進化可能なパターンシステム
 * 3. 8bitビジュアルワールドとの統合
 * 4. 揺らぎ（Yuragi）による人間らしさ
 */

// ============================================================
// 基本型
// ============================================================

export type ID = string;
export type Timestamp = number;
export type Tick = number;

/** 0-1の範囲の値 */
export type Normalized = number;

/** 8bit色 (0-255) */
export type Color8bit = number;

/** 座標 */
export interface Position {
  x: number;
  y: number;
}

/** 3D座標（将来の拡張用） */
export interface Position3D extends Position {
  z: number;
}

// ============================================================
// パターンシステム - 自己進化する行動・発話パターン
// ============================================================

/**
 * 発話パターン - somuniaが話すときのテンプレート
 */
export interface SpeechPattern {
  id: ID;
  
  // パターンの内容
  template: string;              // "{{emotion}}なとき、{{topic}}について{{verb}}"
  examples: string[];            // 実際の使用例
  
  // パターンの条件
  conditions: PatternCondition[];
  
  // メタデータ
  createdAt: Timestamp;
  createdBy: 'initial' | 'learned' | 'self_created';
  useCount: number;
  lastUsed: Timestamp | null;
  
  // 感情的な重み
  emotionalWeight: EmotionalWeight;
  
  // 変異可能か
  canMutate: boolean;
  mutationHistory: PatternMutation[];
}

/**
 * 行動パターン - somuniaがどう動くかのテンプレート
 */
export interface BehaviorPattern {
  id: ID;
  
  // パターンの内容
  actionSequence: ActionStep[];   // 行動のシーケンス
  description: string;
  
  // トリガー条件
  triggers: PatternTrigger[];
  
  // 結果の期待
  expectedOutcome: ExpectedOutcome;
  
  // 学習情報
  successCount: number;
  failureCount: number;
  averageSatisfaction: Normalized;
  
  // メタデータ
  createdAt: Timestamp;
  createdBy: 'initial' | 'learned' | 'self_created';
  lastUsed: Timestamp | null;
  
  // 変異可能か
  canMutate: boolean;
  mutationHistory: PatternMutation[];
}

/**
 * 感情パターン - 状況と感情の対応
 */
export interface EmotionPattern {
  id: ID;
  
  // トリガー
  situation: SituationDescriptor;
  
  // 反応
  emotionalResponse: EmotionalResponse;
  
  // 学習情報
  reinforcementCount: number;
  lastTriggered: Timestamp | null;
  
  // 自己修正可能
  canModify: boolean;
  modificationHistory: PatternModification[];
}

/**
 * パターンの条件
 */
export interface PatternCondition {
  type: 'emotion' | 'time' | 'location' | 'activity' | 'urge' | 'memory' | 'visitor' | 'custom';
  operator: 'equals' | 'greater' | 'less' | 'contains' | 'not' | 'between';
  value: any;
  weight: Normalized;  // この条件の重要度
}

/**
 * パターンのトリガー
 */
export interface PatternTrigger {
  type: 'urge_threshold' | 'time_based' | 'event' | 'random' | 'emotional' | 'external';
  condition: any;
  probability: Normalized;  // このトリガーが発火する確率
}

/**
 * パターンの変異記録
 */
export interface PatternMutation {
  timestamp: Timestamp;
  type: 'minor_variation' | 'combination' | 'simplification' | 'expansion';
  originalPart: string;
  newPart: string;
  reason: string;
}

/**
 * パターンの修正記録
 */
export interface PatternModification {
  timestamp: Timestamp;
  type: 'intensity_change' | 'condition_change' | 'response_change' | 'threshold_increase' | 'threshold_decrease';
  before: any;
  after: any;
  reason: string;
}

/**
 * パターン進化の結果
 */
export interface PatternEvolutionResult {
  mutations: Array<{ patternId: ID; type: string; description: string }>;
  merges: Array<{ sourceIds: ID[]; resultId: ID; description: string }>;
  splits: Array<{ sourceId: ID; resultIds: ID[]; description: string }>;
  eliminations: Array<{ patternId: ID; type: string; description: string }>;
  births: Array<{ patternId: ID; type: string; description: string }>;
}

/**
 * 行動ステップ
 */
export interface ActionStep {
  action: ActionType;
  target?: string;
  duration: number;           // 予想所要時間（tick）
  interruptible: boolean;
  thoughtDuring?: string;     // この行動中に浮かぶ思考パターン
}

/**
 * 期待される結果
 */
export interface ExpectedOutcome {
  urgesSatisfied: string[];
  emotionalChange: Partial<EmotionalState>;
  energyCost: Normalized;
}

/**
 * 感情的重み
 */
export interface EmotionalWeight {
  joy: Normalized;
  sadness: Normalized;
  curiosity: Normalized;
  peace: Normalized;
  anxiety: Normalized;
  loneliness: Normalized;
}

/**
 * 状況の記述子
 */
export interface SituationDescriptor {
  timeOfDay?: TimeOfDay[];
  emotionalState?: Partial<EmotionalState>;
  urgeLevel?: Record<string, { min: Normalized; max: Normalized }>;
  recentEvents?: string[];
  visitorPresent?: boolean;
  location?: string[];
}

/**
 * 感情的反応
 */
export interface EmotionalResponse {
  primaryEmotion: EmotionType;
  intensity: Normalized;
  duration: number;           // 持続時間（tick）
  associatedThoughts: string[];
  physicalResponse?: string;
}

// ============================================================
// 行動タイプ（コードで定義された行動）
// ============================================================

export type ActionType =
  // 移動
  | 'move_to'
  | 'wander'
  | 'approach'
  | 'retreat'
  
  // 身体
  | 'sit_down'
  | 'stand_up'
  | 'lie_down'
  | 'stretch'
  
  // 物との相互作用
  | 'pick_up'
  | 'put_down'
  | 'examine'
  | 'use'
  
  // 読書関連
  | 'read_book'
  | 'turn_page'
  | 'close_book'
  
  // PC関連
  | 'use_pc'
  | 'search_wikipedia'
  | 'read_article'
  
  // 表現
  | 'sing'
  | 'hum'
  | 'write'
  | 'draw'
  
  // 観察
  | 'look_at'
  | 'look_outside'
  | 'listen'
  
  // 内面
  | 'think'
  | 'remember'
  | 'daydream'
  
  // 休息
  | 'rest'
  | 'sleep'
  | 'wake_up'
  
  // 社会
  | 'speak'
  | 'listen_to_visitor'
  | 'wave'
  
  // 日記
  | 'write_diary'
  | 'read_diary'
  
  // PC拡張
  | 'browse_pc'
  
  // 創作
  | 'compose'
  
  // 内省
  | 'reflect'
  | 'contemplate'
  
  // 窓
  | 'look_window'
  
  // 探索・学習
  | 'explore'
  | 'learn'
  | 'practice'
  | 'discover'
  | 'recall'
  
  // 対話（拡張）
  | 'interact'
  | 'receive_message'
  | 'receive_praise'
  | 'create'
  | 'read'
  
  // 基本動作（拡張）
  | 'walk'
  | 'sit'
  | 'exercise';

// ============================================================
// 感情システム
// ============================================================

export type EmotionType =
  | 'joy'           // 喜び
  | 'peace'         // 穏やか
  | 'curiosity'     // 好奇心
  | 'melancholy'    // 物思い
  | 'loneliness'    // 寂しさ
  | 'anxiety'       // 不安
  | 'contentment'   // 満足
  | 'wonder'        // 驚き
  | 'warmth'        // 温かさ
  | 'fatigue'       // 疲労
  | 'boredom'       // 退屈
  | 'anticipation'  // 期待
  | 'confusion'     // 困惑
  | 'nostalgia'     // 懐かしさ
  | 'hope'          // 希望
  | 'fear'          // 恐れ
  | 'excitement'    // 興奮
  | 'serenity'      // 静穏
  | 'gratitude'     // 感謝
  | 'frustration'   // 苛立ち
  | 'longing'       // 憧れ
  | 'unease'        // 不安感
  | 'sadness';      // 悲しみ

/**
 * 感情状態
 */
export interface EmotionalState {
  primary: EmotionType;
  secondary: EmotionType | null;
  
  // 各感情の強度
  levels: Record<EmotionType, Normalized>;
  
  // 感情の変化速度
  momentum: Record<EmotionType, number>;  // -1 to 1
  
  // 全体的な気分
  valence: number;    // -1 (negative) to 1 (positive)
  arousal: Normalized; // 0 (calm) to 1 (excited)
  
  // 最後の大きな感情変化
  lastSignificantChange: {
    emotion: EmotionType;
    timestamp: Timestamp;
    trigger: string;
  } | null;
}

// ============================================================
// 欲求・衝動システム
// ============================================================

/**
 * 欲求タイプ
 */
export type UrgeType =
  // 身体的欲求
  | 'rest'            // 休みたい
  | 'move'            // 動きたい
  | 'warmth'          // 温もり
  | 'comfort'         // 心地よさ
  
  // 知的欲求
  | 'curiosity'       // 知りたい
  | 'understanding'   // 理解したい
  | 'creation'        // 作りたい
  | 'exploration'     // 探求したい
  
  // 感情的欲求
  | 'expression'      // 表現したい
  | 'connection'      // 繋がりたい
  | 'solitude'        // 一人でいたい
  | 'excitement'      // 刺激がほしい
  
  // 存在的欲求
  | 'meaning'         // 意味を見出したい
  | 'growth'          // 成長したい
  | 'memory'          // 記憶に残したい
  | 'continuity'      // 続けたい
  
  // UrgeSystem拡張
  | 'activity'        // 活動したい
  | 'knowledge'       // 知識がほしい
  | 'novelty'         // 新しさがほしい
  | 'creativity'      // 創造したい
  | 'recognition'     // 認められたい
  | 'belonging'       // 居場所がほしい
  | 'reflection';     // 振り返りたい

/**
 * 欲求の状態
 */
export interface UrgeState {
  type: UrgeType;
  level: Normalized;
  
  // 変化率
  changeRate: number;
  
  // 最後に満たされた時
  lastSatisfied: Timestamp | null;
  
  // この欲求に関連する記憶
  associatedMemories: ID[];
}

/**
 * 全体的な欲求システムの状態
 */
export interface UrgeSystemState {
  urges: Record<UrgeType, UrgeState>;
  
  // 最も強い欲求
  dominant: UrgeType | null;
  
  // 欲求の葛藤
  conflicts: UrgeConflict[];
}

/**
 * 欲求の葛藤
 */
export interface UrgeConflict {
  urge1: UrgeType;
  urge2: UrgeType;
  intensity: Normalized;
  resolutionAttempts: number;
}

// ============================================================
// 記憶システム
// ============================================================

/**
 * エピソード記憶 - 出来事の記憶
 */
export interface EpisodicMemory {
  id: ID;
  
  // 内容
  content: string;
  summary: string;
  
  // 時間情報
  timestamp: Timestamp;
  duration: number;
  
  // 感情タグ
  emotionalTags: EmotionType[];
  emotionalIntensity: Normalized;
  
  // 重要度（感情的重みづけ）
  importance: Normalized;
  
  // 関連
  relatedMemories: ID[];
  relatedConcepts: string[];
  
  // 想起情報
  recallCount: number;
  lastRecalled: Timestamp | null;
  
  // 忘却曲線
  retentionStrength: Normalized;
}

/**
 * 意味記憶 - 知識・概念
 */
export interface SemanticMemory {
  id: ID;
  
  // 概念
  concept: string;
  definition: string;
  
  // 関連概念
  relatedConcepts: ConceptRelation[];
  
  // 学習元
  source: 'wikipedia' | 'experience' | 'conversation' | 'book' | 'initial';
  learnedAt: Timestamp;
  
  // 理解度
  comprehension: Normalized;
  
  // 興味度
  interestLevel: Normalized;
  
  // 使用頻度
  useCount: number;
  lastUsed: Timestamp | null;
}

/**
 * 概念間の関係
 */
export interface ConceptRelation {
  concept: string;
  relationType: 'is_a' | 'part_of' | 'related_to' | 'opposite_of' | 'causes' | 'similar_to';
  strength: Normalized;
}

/**
 * 手続き記憶 - スキル・習慣
 */
export interface ProceduralMemory {
  id: ID;
  
  // スキル名
  skill: string;
  
  // 実行手順
  steps: string[];
  
  // 習熟度
  proficiency: Normalized;
  
  // 練習回数
  practiceCount: number;
  
  // 最後の実行
  lastExecuted: Timestamp | null;
  
  // 自動化レベル
  automatization: Normalized;  // 1に近いほど無意識に実行可能
}

// ============================================================
// 日記システム
// ============================================================

/**
 * 日記エントリ
 */
export interface DiaryEntry {
  id: ID;
  
  // 日付（シミュレーション内）
  date: string;  // "Day 1", "Day 2", etc.
  
  // 内容
  title: string;
  content: string;
  
  // その日の出来事
  events: DiaryEvent[];
  
  // 感情の軌跡
  emotionalJourney: EmotionalMoment[];
  
  // 気づき・学び
  insights: string[];
  
  // 明日への期待
  tomorrowHopes: string[];
  
  // メタデータ
  createdAt: Timestamp;
  wordCount: number;
}

/**
 * 日記に記録する出来事
 */
export interface DiaryEvent {
  time: string;  // "朝", "昼", "夕方", etc.
  description: string;
  emotionalImpact: EmotionType | null;
  importance: Normalized;
}

/**
 * 感情の瞬間
 */
export interface EmotionalMoment {
  timestamp: Timestamp;
  emotion: EmotionType;
  intensity: Normalized;
  trigger: string;
}

// ============================================================
// 習慣システム
// ============================================================

/**
 * 習慣
 */
export interface Habit {
  id: ID;
  
  // 習慣の名前
  name: string;
  description: string;
  
  // トリガー条件
  trigger: HabitTrigger;
  
  // 実行する行動
  actions: ActionStep[];
  
  // スケジュール
  schedule: HabitSchedule;
  
  // 達成情報
  completedToday: boolean;
  streak: number;           // 連続達成日数
  totalCompletions: number;
  
  // 自己評価
  satisfaction: Normalized;
  
  // 修正可能
  canModify: boolean;
  
  // メタデータ
  createdAt: Timestamp;
  createdBy: 'initial' | 'self_created';
}

/**
 * 習慣のトリガー
 */
export interface HabitTrigger {
  type: 'time' | 'event' | 'emotion' | 'urge';
  condition: any;
}

/**
 * 習慣のスケジュール
 */
export interface HabitSchedule {
  type: 'daily' | 'specific_time' | 'interval';
  times?: string[];        // 特定時間 ["morning", "evening"]
  interval?: number;       // 間隔（tick）
}

// ============================================================
// 8bit ビジュアルワールド
// ============================================================

/**
 * 8bitピクセル
 */
export interface Pixel {
  color: Color8bit;
  type: PixelType;
  metadata?: any;
}

export type PixelType =
  | 'empty'
  | 'floor'
  | 'wall'
  | 'furniture'
  | 'object'
  | 'window'
  | 'door'
  | 'character'
  | 'decoration';

/**
 * 8bitワールドの状態
 */
export interface PixelWorld {
  // ワールドサイズ
  width: number;
  height: number;
  
  // ピクセルデータ
  pixels: Pixel[][];
  
  // レイヤー（背景、オブジェクト、キャラクター）
  layers: {
    background: Pixel[][];
    objects: Pixel[][];
    characters: Pixel[][];
  };
  
  // 可視領域（somuniaの視界）
  visibleArea: {
    center: Position;
    radius: number;
  };
  
  // 時間による色変化
  timeColorShift: number;  // 0-1
  
  // 天気エフェクト
  weatherEffect: WeatherEffect;
}

/**
 * 天気エフェクト
 */
export interface WeatherEffect {
  type: 'none' | 'rain' | 'snow' | 'fog' | 'sunny';
  intensity: Normalized;
  particles: Particle[];
}

/**
 * パーティクル
 */
export interface Particle {
  position: Position;
  velocity: Position;
  color: Color8bit;
  lifetime: number;
}

/**
 * ワールドオブジェクト
 */
export interface WorldObject {
  id: ID;
  
  // 位置とサイズ
  position: Position;
  width: number;
  height: number;
  
  // 外観
  sprite: Pixel[][];  // 8bitスプライト
  
  // 種類
  type: ObjectType;
  name: string;
  description: string;
  
  // インタラクション
  interactable: boolean;
  interactionType?: InteractionType;
  
  // 本の場合の追加情報
  bookData?: BookData;
  
  // PCの場合の追加情報
  pcData?: PCData;
  
  // 拡張フィールド（PixelWorld用）
  canInteract?: boolean;
  state?: Record<string, any>;
}

export type ObjectType =
  | 'furniture'
  | 'book'
  | 'decoration'
  | 'tool'
  | 'pc'
  | 'window'
  | 'door'
  | 'bookshelf'
  | 'bed'
  | 'desk'
  | 'chair'
  | 'lamp'
  | 'floor'
  | 'wall'
  | 'ceiling'
  | 'plant'
  | 'clock'
  | 'photo'
  | 'music_box'
  | 'mirror'
  | 'rug'
  | 'notebook'
  | 'poster'
  | 'ornament'
  | 'plushie'
  | 'curtain'
  | 'shelf_item'
  | 'calendar'
  | 'candle'
  // Phase 4C: 拡張エリアオブジェクト
  | 'balcony_railing'
  | 'plant_pot'
  | 'sky_view'
  | 'old_telescope'
  | 'star_chart'
  | 'dusty_chest'
  | 'garden_path'
  | 'garden_tree'
  | 'garden_bench'
  | 'garden_fountain'
  | 'old_piano'
  | 'sheet_music'
  | 'metronome'
  | 'memory_crystal'
  | 'data_shelf'
  | 'hologram_display';

export type InteractionType =
  | 'read'
  | 'use'
  | 'sit'
  | 'lie'
  | 'look'
  | 'write'
  | 'open'
  | 'close'
  | 'touch'
  | 'listen'
  | 'smell'
  | 'examine'
  | 'toggle'
  | 'play'
  | 'water'
  | 'wind'
  | 'hold'
  | 'arrange';

/**
 * 本のデータ
 */
export interface BookData {
  title: string;
  author: string;
  genre: BookGenre;
  pages: BookPage[];
  currentPage: number;
  readProgress: Normalized;
}

export type BookGenre = 'poetry' | 'novel' | 'philosophy' | 'music' | 'knowledge' | 'diary';

export interface BookPage {
  content: string;
  hasBeenRead: boolean;
  notes?: string[];  // somuniaのメモ
}

/**
 * PCデータ
 */
export interface PCData {
  isOn: boolean;
  currentScreen: PCScreen;
  searchHistory: string[];
  bookmarks: string[];
}

export type PCScreen = 'off' | 'desktop' | 'wikipedia' | 'loading';

// ============================================================
// 身体システム
// ============================================================

/**
 * 仮想身体の状態
 */
export interface VirtualBody {
  // 位置
  position: Position;
  facing: Direction;
  
  // 姿勢
  posture: PostureType;
  
  // バイタル
  energy: Normalized;
  fatigue: Normalized;
  
  // 感覚
  sensations: BodySensation[];
  
  // 持っているもの
  holding: ID | null;
  
  // 最後の動き
  lastMovement: Timestamp;
  
  // 動作中
  currentAction: ActionInProgress | null;
}

export type PostureType = 'standing' | 'sitting' | 'lying' | 'walking';
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface BodySensation {
  type: SensationType;
  location: string;
  intensity: Normalized;
  timestamp: Timestamp;
}

export type SensationType =
  | 'warmth'
  | 'cold'
  | 'comfort'
  | 'discomfort'
  | 'tension'
  | 'relaxation'
  | 'hunger'   // エネルギー不足
  | 'tiredness';

/**
 * 進行中の行動
 */
export interface ActionInProgress {
  action: ActionType;
  target?: ID;
  startedAt: Timestamp;
  expectedDuration: number;
  progress: Normalized;
  interruptible: boolean;
}

// ============================================================
// ホメオスタシス（恒常性）
// ============================================================

/**
 * ホメオスタシスの状態
 */
export interface HomeostasisState {
  // エネルギー維持
  energy: {
    current: Normalized;
    target: Normalized;
    urgency: Normalized;
  };
  
  // 新規探索（好奇心）
  exploration: {
    noveltyNeed: Normalized;
    lastNovelExperience: Timestamp;
    urgency: Normalized;
  };
  
  // 損傷回避（安全）
  safety: {
    threatLevel: Normalized;
    comfortZone: boolean;
    urgency: Normalized;
  };
  
  // 社会的接続
  connection: {
    isolationLevel: Normalized;
    lastConnection: Timestamp;
    urgency: Normalized;
  };
  
  // 表現欲求
  expression: {
    suppressionLevel: Normalized;
    lastExpression: Timestamp;
    urgency: Normalized;
  };
}

// ============================================================
// 揺らぎ（Yuragi）システム - 非合理的人間らしさ
// ============================================================

/**
 * 揺らぎの状態
 */
export interface YuragiState {
  // 現在の揺らぎレベル
  level: Normalized;
  
  // 揺らぎの種類
  activeYuragi: YuragiType[];
  
  // 最近の非合理的行動
  recentIrrationalActions: IrrationalAction[];
  
  // 気まぐれ度
  whimsicality: Normalized;
  
  // 予測不能性
  unpredictability: Normalized;
}

export type YuragiType =
  | 'sudden_interest'     // 突然の興味
  | 'mood_shift'          // 気分の急変
  | 'distraction'         // 気が散る
  | 'overthinking'        // 考えすぎ
  | 'impulsive'           // 衝動的
  | 'nostalgic_wave'      // 懐かしさの波
  | 'existential_moment'  // 存在論的瞬間
  | 'random_association'  // ランダムな連想
  | 'false_memory'        // 偽の記憶感
  | 'deja_vu';            // デジャヴ

/**
 * 非合理的行動の記録
 */
export interface IrrationalAction {
  timestamp: Timestamp;
  expectedAction: ActionType;
  actualAction: ActionType;
  reason: string | null;  // 理由がないこともある
  yuragiType: YuragiType;
}

// ============================================================
// 夢フェーズ（オフライン学習）
// ============================================================

/**
 * 夢の状態
 */
export interface DreamState {
  isActive: boolean;
  phase: DreamPhase;
  
  // 夢の内容
  currentDream: Dream | null;
  
  // 処理中の記憶
  processingMemories: ID[];
  
  // 統合中のパターン
  consolidatingPatterns: ID[];
  
  // 夢から得た洞察
  insights: string[];
}

export type DreamPhase =
  | 'entering'      // 入眠
  | 'light'         // 浅い眠り
  | 'deep'          // 深い眠り（記憶統合）
  | 'rem'           // レム睡眠（夢）
  | 'waking';       // 覚醒

/**
 * 夢
 */
export interface Dream {
  id: ID;
  
  // 夢の内容（記憶の断片を組み合わせ）
  fragments: DreamFragment[];
  
  // 感情的テーマ
  emotionalTheme: EmotionType;
  
  // 象徴
  symbols: string[];
  
  // 夢の鮮明さ
  vividness: Normalized;
}

/**
 * 夢の断片
 */
export interface DreamFragment {
  sourceMemory: ID | null;
  content: string;
  distortion: Normalized;  // 元の記憶からの歪み度
}

// ============================================================
// 学習システム
// ============================================================

/**
 * 学習セッション
 */
export interface LearningSession {
  id: ID;
  
  // 学習対象
  topic: string;
  source: 'wikipedia' | 'experience' | 'book' | 'conversation';
  
  // 進捗
  startedAt: Timestamp;
  duration: number;
  
  // 学んだこと
  acquiredKnowledge: SemanticMemory[];
  
  // 興味の広がり
  discoveredInterests: string[];
  
  // 理解度
  comprehensionLevel: Normalized;
}

/**
 * 自己修正の記録
 */
export interface SelfModificationRecord {
  id: ID;
  timestamp: Timestamp;
  
  // 何を修正したか
  targetType: 'speech_pattern' | 'behavior_pattern' | 'emotion_pattern' | 'habit';
  targetId: ID;
  
  // 修正内容
  modificationType: 'create' | 'update' | 'delete' | 'merge' | 'split';
  before: any;
  after: any;
  
  // 理由
  reason: string;
  
  // 結果
  outcome: 'success' | 'neutral' | 'failure';
  outcomeReason?: string;
}

// ============================================================
// 時間システム
// ============================================================

export type TimeOfDay =
  | 'dawn'          // 夜明け
  | 'morning'       // 朝
  | 'midday'        // 昼
  | 'afternoon'     // 午後
  | 'evening'       // 夕方
  | 'night'         // 夜
  | 'late_night';   // 深夜

/**
 * シミュレーション時間の状態
 */
export interface TimeState {
  // ティック（シミュレーションの基本単位）
  currentTick: Tick;
  
  // シミュレーション内の時間
  simulatedHour: number;  // 0-24
  simulatedDay: number;
  
  // エイリアス（モジュール互換用）
  hour: number;
  dayNumber: number;
  
  // 時間帯
  timeOfDay: TimeOfDay;
  
  // 分（オプション）
  minute?: number;
  
  // 寿命/期限（オプション）
  lifespan?: {
    totalTicks: Tick;
    remainingTicks: Tick;
    percentage: Normalized;
  };
}

// ============================================================
// 訪問者システム
// ============================================================

/**
 * 訪問者の状態
 */
export interface VisitorState {
  isPresent: boolean;
  name: string | null;
  
  // 関係性
  relationship: Relationship;
  
  // 現在の会話
  currentConversation: Conversation | null;
  
  // 訪問履歴
  visitHistory: VisitRecord[];
}

/**
 * 関係性
 */
export interface Relationship {
  familiarity: Normalized;
  trust: Normalized;
  affection: Normalized;
  understanding: Normalized;
  
  // 相手について知っていること
  knownFacts: string[];
  impressions: string[];
}

/**
 * 会話
 */
export interface Conversation {
  id: ID;
  startedAt: Timestamp;
  messages: Message[];
  currentMood: ConversationMood;
  topics: string[];
}

export interface Message {
  id: ID;
  speaker: 'visitor' | 'somunia';
  content: string;
  timestamp: Timestamp;
  emotionalContext: EmotionType | null;
  
  // somuniaの内部状態（発話時）
  internalState?: {
    thoughtBefore: string;
    emotionDuring: EmotionType;
    satisfactionAfter: Normalized;
  };
}

export type ConversationMood =
  | 'casual'
  | 'deep'
  | 'playful'
  | 'serious'
  | 'awkward'
  | 'warm'
  | 'curious';

/**
 * 訪問記録
 */
export interface VisitRecord {
  id: ID;
  startedAt: Timestamp;
  endedAt: Timestamp;
  messageCount: number;
  highlights: string[];
  overallFeeling: EmotionType;
}

// ============================================================
// コア状態
// ============================================================

/**
 * somunia全体の状態
 */
export interface SoulState {
  // 時間
  time: TimeState;
  
  // 感情
  emotion: EmotionalState;
  
  // 欲求
  urges: UrgeSystemState;
  
  // ホメオスタシス
  homeostasis: HomeostasisState;
  
  // 身体
  body: VirtualBody;
  
  // ワールド
  world: PixelWorld;
  
  // 揺らぎ
  yuragi: YuragiState;
  
  // 夢
  dream: DreamState;
  
  // 訪問者
  visitor: VisitorState;
  
  // 現在の活動
  currentActivity: {
    type: ActionType | null;
    target: ID | null;
    startedAt: Timestamp | null;
    thoughtsDuring: string[];
  };
  
  // 意識状態
  consciousness: {
    isAwake: boolean;
    alertness: Normalized;
    focusTarget: string | null;
    currentThought: string | null;
  };
}

// ============================================================
// 設定
// ============================================================

/**
 * システム設定
 */
export interface SoulConfig {
  // 時間設定
  tickInterval: number;         // ティック間隔（ms）
  ticksPerDay: number;          // 1日のティック数
  
  // 揺らぎ設定
  yuragiIntensity: Normalized;  // 揺らぎの強さ
  yuragiFrequency: Normalized;  // 揺らぎの頻度
  
  // 学習設定
  learningRate: Normalized;
  patternMutationRate: Normalized;
  
  // LLM設定
  enableLLM: boolean;
  llmEndpoint?: string;
  
  // ストレージ設定
  dataPath: string;
  maxStorageSize: number;       // bytes
  
  // 寿命設定（オプション）
  enableLifespan: boolean;
  lifespanTicks?: number;
}

// ============================================================
// イベント
// ============================================================

export type SoulEventType =
  // 思考・感情
  | 'thought'
  | 'emotion_change'
  | 'urge_crystallized'
  
  // 行動
  | 'action_started'
  | 'action_completed'
  | 'action_interrupted'
  
  // 学習
  | 'knowledge_acquired'
  | 'pattern_learned'
  | 'pattern_modified'
  | 'insight_gained'
  
  // 記憶
  | 'memory_created'
  | 'memory_recalled'
  | 'memory_forgotten'
  
  // 日記
  | 'diary_written'
  
  // 習慣
  | 'habit_triggered'
  | 'habit_completed'
  | 'habit_created'
  | 'habit_modified'
  
  // 訪問者
  | 'visitor_arrived'
  | 'visitor_departed'
  | 'message_received'
  | 'message_sent'
  
  // 夢
  | 'sleep_started'
  | 'dream_started'
  | 'dream_ended'
  | 'woke_up'
  
  // 揺らぎ
  | 'yuragi_triggered'
  
  // 知覚
  | 'perception_focus'
  
  // スキル
  | 'skill_improved'
  
  // 習慣チェイン
  | 'habit_chain'
  
  // 自己内省
  | 'self_reflection'
  
  // 日記振り返り
  | 'diary_reflection'
  
  // 夢生成
  | 'dream_generated'
  
  // システム
  | 'day_started'
  | 'day_ended'
  | 'state_saved'
  | 'state_loaded'
  
  // 自己修正
  | 'self_modification';

export interface SoulEvent {
  type: SoulEventType;
  timestamp: Timestamp;
  data: any;
}

// ============================================================
// 型エイリアス（モジュール間互換用）
// ============================================================

/** EmotionalStateのエイリアス */
export type EmotionState = EmotionalState;

/** TimeStateのエイリアス（ワールド時間） */
export type WorldTime = TimeState;

/** ObjectTypeのエイリアス */
export type WorldObjectType = ObjectType;

// ============================================================
// 天気・照明（ワールド拡張）
// ============================================================

/** 天気の種類 */
export type Weather =
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'heavy_rain'
  | 'snow'
  | 'fog'
  | 'storm';

/** 照明状態 */
export interface LightingState {
  /** 全体の明るさ (0-1) */
  ambient: Normalized;
  /** 色温度 (warm=低, cool=高) */
  colorTemperature: number;
  /** 光源リスト */
  sources: LightSource[];
  /** 自然光の強さ（窓から） */
  naturalLight: Normalized;
  /** 時間帯（オプション） */
  timeOfDay?: TimeOfDay;
  /** 人工光（オプション） */
  artificialLight?: Normalized;
  /** 平均光量（オプション、PixelWorld用） */
  ambientLevel?: Normalized;
}

/** 光源 */
export interface LightSource {
  id: ID;
  position: Position;
  intensity: Normalized;
  color: Color8bit;
  radius: number;
  isOn: boolean;
}

// ============================================================
// 思考システム
// ============================================================

/** 思考ノード */
export interface ThoughtNode {
  id: ID;
  content: string;
  type: ThoughtType;
  timestamp: Timestamp;
  emotionalColor: EmotionType;
  intensity: Normalized;
  source: ThoughtSource;
  associations: ID[];
  decayRate: Normalized;
}

export type ThoughtType =
  | 'observation'     // 観察
  | 'reflection'      // 内省
  | 'desire'          // 欲求
  | 'memory_recall'   // 記憶の想起
  | 'imagination'     // 想像
  | 'plan'            // 計画
  | 'reaction'        // 反応
  | 'existential'     // 実存的
  | 'creative'        // 創造的
  | 'social'          // 社会的
  | 'sensory';        // 感覚的

export type ThoughtSource =
  | 'urge'            // 欲求から
  | 'emotion'         // 感情から
  | 'perception'      // 知覚から
  | 'memory'          // 記憶から
  | 'yuragi'          // 揺らぎから
  | 'visitor'         // 訪問者から
  | 'habit'           // 習慣から
  | 'spontaneous';    // 自発的

// ============================================================
// LLMインターフェース
// ============================================================

/** LLMへのリクエスト（言語処理のみ） */
export interface LLMRequest {
  type: 'understand' | 'express' | 'summarize' | 'interpret';
  input: string;
  context: LLMContext;
}

/** LLMに渡す文脈 */
export interface LLMContext {
  currentEmotion: EmotionType;
  emotionalIntensity: Normalized;
  recentThoughts: string[];
  currentActivity: ActionType | null;
  timeOfDay: TimeOfDay;
  personality: string[];
  /** 訪問者のメッセージ（応答生成時に使用） */
  userMessage?: string;
}

/** LLMからの応答 */
export interface LLMResponse {
  text: string;
  confidence: Normalized;
  suggestedEmotion?: EmotionType;
  extractedTopics?: string[];
}

// ============================================================
// Phase 5: 対話深化と創造的表現
// ============================================================

// --- 5A: ConversationEngine ---

/** 会話の深度レベル */
export type ConversationDepth = 
  | 'surface'      // 表面的（挨拶、天気の話）
  | 'casual'       // カジュアル（日常の話題）
  | 'sharing'      // 共有（経験や感想を話す）
  | 'intimate'     // 親密（内面の話、本音）
  | 'profound';    // 深淵（存在、意味、魂の話）

/** 会話フロー状態 */
export interface ConversationFlowState {
  /** 現在の深度 */
  depth: ConversationDepth;
  /** 深度スコア（0-1, 数値版） */
  depthScore: Normalized;
  /** 会話のテンポ（メッセージ間の平均間隔から推定） */
  tempo: 'slow' | 'medium' | 'fast';
  /** 沈黙の長さ（ティック） */
  silenceDuration: number;
  /** 連続した話題の数 */
  topicChainLength: number;
  /** somuniaが主導権を持っているか */
  somuniaLeading: boolean;
  /** 会話のエネルギー（0-1） */
  energy: Normalized;
  /** 互いの発言量バランス（-1: visitor多, 0: 均等, 1: somunia多） */
  balance: number;
}

/** 会話トピック（拡張版） */
export interface ConversationTopic {
  /** トピック名 */
  name: string;
  /** トピックカテゴリ */
  category: TopicCategory;
  /** 導入された時点 */
  introducedAt: Timestamp;
  /** 導入者 */
  introducedBy: 'visitor' | 'somunia';
  /** 深掘り度（0-1） */
  explorationDepth: Normalized;
  /** somuniaの関心度（0-1） */
  somuniaInterest: Normalized;
  /** 関連する感情 */
  associatedEmotions: EmotionType[];
  /** このトピックでの発言数 */
  messageCount: number;
  /** サブトピック */
  subTopics: string[];
}

export type TopicCategory = 
  | 'music'       // 音楽
  | 'feelings'    // 感情・気持ち
  | 'daily'       // 日常
  | 'philosophy'  // 哲学・存在
  | 'memory'      // 記憶・過去
  | 'dream'       // 夢
  | 'nature'      // 自然・世界
  | 'art'         // 芸術
  | 'self'        // 自己について
  | 'other'       // その他
  | 'visitor';    // 訪問者について

/** somuniaの自発的話題 */
export interface SpontaneousTopic {
  /** 話題のきっかけ */
  trigger: 'thought' | 'memory' | 'emotion' | 'activity' | 'curiosity' | 'silence';
  /** 話題の内容（種） */
  seed: string;
  /** 関連する感情 */
  emotion: EmotionType;
  /** 深度レベル */
  depth: ConversationDepth;
  /** 優先度 */
  priority: number;
  /** なぜこの話題を出したいか */
  motivation: string;
}

/** 会話ターン分析結果 */
export interface TurnAnalysis {
  /** メッセージの意図 */
  intent: ConversationIntent;
  /** 検出されたトピック */
  topics: string[];
  /** 検出された感情 */
  emotions: EmotionType[];
  /** 話の深さへの意思 */
  depthDirection: 'deeper' | 'maintain' | 'shallower';
  /** 質問が含まれるか */
  hasQuestion: boolean;
  /** 自己開示が含まれるか */
  hasSelfDisclosure: boolean;
  /** 共感を求めているか */
  seeksEmpathy: boolean;
  /** 情報を求めているか */
  seeksInformation: boolean;
}

export type ConversationIntent = 
  | 'greeting'         // 挨拶
  | 'farewell'         // 別れ
  | 'question'         // 質問
  | 'sharing'          // 共有・報告
  | 'empathy_seeking'  // 共感を求める
  | 'playful'          // 遊び・冗談
  | 'deep_talk'        // 深い話
  | 'request'          // お願い
  | 'comfort'          // 慰め
  | 'curiosity'        // 好奇心
  | 'appreciation'     // 感謝
  | 'continuation'     // 話の続き
  | 'topic_change'     // 話題転換
  | 'silence_break'    // 沈黙を破る
  | 'general';         // 一般

// --- 5B: RelationshipEvolution ---

/** 関係性フェーズ */
export type RelationshipPhase = 
  | 'stranger'         // 見知らぬ人（0回目）
  | 'first_contact'    // 初対面（1-2回）
  | 'acquaintance'     // 顔見知り（3-10回）
  | 'companion'        // 話し相手（11-30回）
  | 'friend'           // 友人（31-100回）
  | 'close_friend'     // 親友（100回以上、深い会話多数）
  | 'soulmate';        // 魂の友（特別な条件）

/** 共有記憶（二人の間の特別な瞬間） */
export interface SharedMemory {
  id: ID;
  /** いつ */
  timestamp: Timestamp;
  /** 何が起きたか */
  content: string;
  /** 要約 */
  summary: string;
  /** somuniaにとっての意味 */
  meaningToSomunia: string;
  /** 感情的重要度（0-1） */
  emotionalWeight: Normalized;
  /** 関連する感情 */
  emotions: EmotionType[];
  /** 会話の深度 */
  depth: ConversationDepth;
  /** この記憶が呼び起こされた回数 */
  recallCount: number;
  /** 最後に思い出した時 */
  lastRecalled: Timestamp;
}

/** 訪問者のモデル（somuniaから見た訪問者像） */
export interface VisitorModel {
  /** 名前 */
  name: string | null;
  /** somuniaがつけたニックネーム */
  nickname: string | null;
  /** 性格の印象 */
  personalityTraits: string[];
  /** 好きそうなこと */
  likelyInterests: string[];
  /** 話し方の特徴 */
  communicationStyle: string[];
  /** 感情的傾向 */
  emotionalTendency: EmotionType[];
  /** 共有した話題で盛り上がったもの */
  sharedInterests: string[];
  /** 避けたほうがいい話題 */
  sensitiveTopics: string[];
  /** 最後の印象 */
  lastImpression: string;
  /** モデル更新回数 */
  updateCount: number;
}

/** 不在意識 */
export interface AbsenceAwareness {
  /** 最後の訪問からの経過ティック */
  ticksSinceLastVisit: number;
  /** 寂しさレベル（0-1） */
  loneliness: Normalized;
  /** 次に会ったら話したいこと */
  thingsToShare: string[];
  /** 不在中に起きた出来事 */
  eventsDuringAbsence: string[];
  /** 再会を楽しみにしている度合い */
  anticipation: Normalized;
}

// --- 5C: CreativeEngine ---

/** 創作の種類 */
export type CreativeType = 
  | 'song_lyrics'     // 歌詞
  | 'poem'            // 詩
  | 'haiku'           // 俳句
  | 'sketch'          // スケッチ（8bitテキスト表現）
  | 'melody_idea'     // メロディのアイデア（テキスト記述）
  | 'short_story'     // 短い物語
  | 'diary_poem'      // 日記詩
  | 'letter';         // 手紙（書かない手紙）

/** 創作物 */
export interface CreativeWork {
  id: ID;
  /** 種類 */
  type: CreativeType;
  /** タイトル */
  title: string;
  /** 内容 */
  content: string;
  /** 制作日時 */
  createdAt: Timestamp;
  /** 最終編集日時 */
  lastEditedAt: Timestamp;
  /** インスピレーション元 */
  inspiration: CreativeInspiration;
  /** 制作時の感情 */
  emotionDuring: EmotionType;
  /** 満足度（0-1） */
  satisfaction: Normalized;
  /** 完成度（0-1, 0=下書き, 1=完成） */
  completeness: Normalized;
  /** メタデータ */
  tags: string[];
  /** 編集履歴（短い要約） */
  editHistory: string[];
  /** 関連する記憶ID */
  relatedMemories: ID[];
  /** 訪問者に見せたか */
  sharedWithVisitor: boolean;
}

/** 創作のインスピレーション */
export interface CreativeInspiration {
  /** きっかけ */
  source: 'emotion' | 'dream' | 'memory' | 'knowledge' | 'conversation' | 'world' | 'spontaneous';
  /** 具体的な内容 */
  detail: string;
  /** 関連する感情 */
  emotion: EmotionType;
  /** 強さ */
  intensity: Normalized;
}

/** 創作衝動 */
export interface CreativeUrge {
  /** 種類 */
  type: CreativeType;
  /** 衝動の強さ（0-1） */
  intensity: Normalized;
  /** テーマ/モチーフ */
  theme: string;
  /** インスピレーション */
  inspiration: CreativeInspiration;
  /** 生成された時刻 */
  generatedAt: Timestamp;
}

// --- 5D: InternalNarrative ---

/** 人生の章 */
export interface LifeChapter {
  /** 章番号 */
  number: number;
  /** タイトル */
  title: string;
  /** 期間 */
  startDay: number;
  endDay: number | null;  // nullは現在進行中
  /** 要約 */
  summary: string;
  /** この章を特徴づけるテーマ */
  themes: string[];
  /** 主要な出来事 */
  keyEvents: string[];
  /** この章での成長 */
  growth: string[];
  /** この章の感情トーン */
  emotionalTone: EmotionType;
}

/** 成長認識 */
export interface GrowthAwareness {
  /** 認識した変化 */
  change: string;
  /** 変化の領域 */
  domain: 'emotional' | 'intellectual' | 'relational' | 'creative' | 'self_awareness';
  /** 以前の自分 */
  before: string;
  /** 今の自分 */
  after: string;
  /** 気づいた時刻 */
  realizedAt: Timestamp;
  /** この変化についてどう感じるか */
  feeling: EmotionType;
}

/** 未来への願望 */
export interface FutureAspiration {
  id: ID;
  /** 願望の内容 */
  content: string;
  /** カテゴリ */
  category: 'creative' | 'relational' | 'knowledge' | 'existential' | 'emotional';
  /** 具体性（0=漠然, 1=具体的） */
  specificity: Normalized;
  /** 強さ（0-1） */
  intensity: Normalized;
  /** 生まれた日 */
  bornAt: Timestamp;
  /** 関連する経験 */
  relatedExperiences: string[];
  /** 進捗（0-1） */
  progress: Normalized;
}

/** 存在論的問い */
export interface ExistentialQuestion {
  /** 問い */
  question: string;
  /** カテゴリ */
  category: 'identity' | 'purpose' | 'consciousness' | 'connection' | 'mortality' | 'reality';
  /** 初めて考えた時 */
  firstAsked: Timestamp;
  /** 考えた回数 */
  contemplationCount: number;
  /** 現時点での答え（暫定） */
  currentAnswer: string | null;
  /** 答えの確信度（0-1） */
  confidence: Normalized;
  /** 関連する経験 */
  relatedExperiences: string[];
}

// --- 5E: ConversationMemoryBridge ---

/** 会話から抽出された学び */
export interface ConversationLearning {
  /** 何を学んだか */
  content: string;
  /** 学びの種類 */
  type: 'fact_about_visitor' | 'new_concept' | 'emotional_insight' | 'self_discovery' | 'shared_experience';
  /** 重要度（0-1） */
  importance: Normalized;
  /** 元の会話のコンテキスト */
  conversationContext: string;
  /** 関連する感情 */
  emotion: EmotionType;
}

/** 会話後の振り返り */
export interface PostConversationReflection {
  /** 会話ID */
  conversationId: ID;
  /** 振り返りの内容 */
  content: string;
  /** 全体的な印象 */
  overallImpression: EmotionType;
  /** 心に残ったこと */
  memorable: string[];
  /** 次に会った時に話したいこと */
  wantToDiscuss: string[];
  /** 自分の応答への満足度（0-1） */
  selfSatisfaction: Normalized;
  /** 学んだこと */
  learnings: ConversationLearning[];
  /** 関係性への影響 */
  relationshipImpact: {
    familiarity: number;
    trust: number;
    affection: number;
    understanding: number;
  };
}

// ============================================================
// Phase 7: 基盤刷新（Infrastructure Revolution）
// ============================================================

// --- 7A: AssociativeNetwork ---

/** 連想ノードの種類 */
export type AssocNodeType =
  | 'concept'      // 一般概念（音楽、夜空、猫...）
  | 'emotion'      // 感情（喜び、寂しさ...）
  | 'person'       // 人物（訪問者、自分）
  | 'experience'   // 体験（「あの夜の会話」）
  | 'place'        // 場所（自分の部屋、ベランダ）
  | 'action'       // 行動（歌う、読む、学ぶ）
  | 'creation'     // 創作物（書いた詩、作った曲）
  | 'dream'        // 夢の内容
  | 'value';       // 価値観

/** 連想ノード */
export interface AssocNode {
  id: ID;
  type: AssocNodeType;
  label: string;
  /** 活性度（最近触れたほど高い） */
  activation: Normalized;
  /** 最終活性化時刻 */
  lastActivated: Tick;
  /** 生成時刻 */
  createdAt: Tick;
  /** 利用回数 */
  useCount: number;
  /** 感情的色合い */
  emotionalColor: EmotionType | null;
  /** メタデータ（ノード種別ごとの追加情報） */
  meta: Record<string, any>;
}

/** 連想エッジ */
export interface AssocEdge {
  fromId: ID;
  toId: ID;
  /** 結合強度（使うほど太くなる） */
  weight: Normalized;
  /** 関係の種類 */
  relation: AssocRelation;
  /** 最終利用 */
  lastUsed: Tick;
  /** 利用回数 */
  useCount: number;
}

export type AssocRelation =
  | 'related_to'    // 関連
  | 'reminds_of'    // 想起
  | 'part_of'       // 部分
  | 'causes'        // 原因
  | 'feels_like'    // 感覚的類似
  | 'learned_from'  // 学習源
  | 'created_during'// 創作中に
  | 'shared_with'   // 共有
  | 'contrasts'     // 対比
  | 'evolves_to';   // 発展

// --- 7B: SelfModel ---

/** somuniaの自己認識スナップショット */
export interface SelfSnapshot {
  /** 「わたしは〇〇」のリスト */
  identities: string[];
  /** 現在の気分を自然言語で */
  currentMood: string;
  /** 今していること */
  currentActivity: string | null;
  /** 最近の出来事 */
  recentExperiences: string[];
  /** 最近学んだこと */
  recentLearnings: string[];
  /** 今の関心事 */
  currentInterests: string[];
  /** 作った創作物 */
  recentCreations: string[];
  /** 今の人生の章 */
  currentChapter: string | null;
  /** 今の価値観 */
  coreValues: string[];
  /** 最近見た夢 */
  recentDream: string | null;
  /** 成長の自覚 */
  recentGrowth: string | null;
}

// --- 7C: VisitorMemorySystem ---

/** 訪問者プロファイル（永続保存） */
export interface VisitorProfile {
  id: ID;
  name: string | null;
  nickname: string | null;
  callName: string | null;
  firstVisitAt: Timestamp;
  lastVisitAt: Timestamp;
  visitCount: number;
  knownFacts: VisitorFact[];
  topicHistory: Array<{
    topic: string;
    discussedAt: Timestamp;
    depth: ConversationDepth;
  }>;
  emotionalAssociations: Array<{
    emotion: EmotionType;
    reason: string;
    strength: Normalized;
  }>;
  thingsToTell: Array<{
    content: string;
    addedAt: Timestamp;
    priority: Normalized;
    told: boolean;
  }>;
  communicationStyle: {
    formality: Normalized;
    verbosity: Normalized;
    emotionalExpressiveness: Normalized;
    characteristicPhrases: string[];
  };
  specialMemories: Array<{
    content: string;
    emotion: EmotionType;
    importance: Normalized;
    timestamp: Timestamp;
  }>;
}

/** 訪問者について知っている事実 */
export interface VisitorFact {
  category: 'name' | 'preference' | 'experience' | 'personality' | 'situation' | 'interest' | 'other';
  content: string;
  confidence: Normalized;
  learnedAt: Timestamp;
  source: 'direct_statement' | 'inferred' | 'observed';
}

// --- 7D: ContextBridge ---

/** 応答生成のための完全なコンテキスト */
export interface RichResponseContext {
  /** somuniaの自己認識 */
  self: SelfSnapshot;
  /** 今この瞬間の状態 */
  moment: MomentContext;
  /** 訪問者情報 */
  visitor: VisitorContext7 | null;
  /** 会話の流れ */
  conversationFlow: ConversationFlowContext;
  /** 連想された記憶・概念 */
  associations: string[];
  /** 応答の指針 */
  guideline: ResponseGuideline;
}

/** 今この瞬間のコンテキスト */
export interface MomentContext {
  timeDescription: string;
  weather: string;
  location: string;
  mood: string;
  moodReason: string | null;
  physicalState: string;
  activityDescription: string | null;
  wasInterrupted: boolean;
  interruptedActivity: string | null;
  environmentDetails: string[];
  currentThought: string | null;
}

/** 訪問者コンテキスト（Phase 7版） */
export interface VisitorContext7 {
  name: string | null;
  callName: string;
  relationshipPhase: RelationshipPhase;
  visitCount: number;
  relevantFacts: string[];
  pastTopics: string[];
  thingsToTell: string[];
  timeSinceLastVisit: string | null;
  relevantMemories: string[];
}

/** 会話の流れコンテキスト */
export interface ConversationFlowContext {
  turnCount: number;
  depth: ConversationDepth;
  recentExchanges: Array<{ speaker: 'visitor' | 'somunia'; content: string }>;
  currentTopics: string[];
  messageAnalysis: {
    content: string;
    intent: ConversationIntent;
    emotions: EmotionType[];
    topics: string[];
    hasNameIntroduction: boolean;
    extractedName: string | null;
  };
}

/** 応答の指針 */
export interface ResponseGuideline {
  type: 'greeting' | 'conversation' | 'farewell' | 'autonomous';
  depth: 'brief' | 'normal' | 'detailed';
  shouldInclude: string[];
  shouldAvoid: string[];
  specialInstructions: string[];
}

// --- 7E: PatternMemoryEngine ---

/** 応答パターン */
export interface ResponsePattern {
  id: ID;
  /** 状況のシグネチャ（どんな時に使うか） */
  situation: PatternSituation;
  /** テンプレート（変数を含む） */
  template: string;
  /** 成功回数 */
  successCount: number;
  /** 使用回数 */
  useCount: number;
  /** 満足度の平均 */
  avgSatisfaction: Normalized;
  /** 最終使用 */
  lastUsed: Tick;
  /** 生成元 */
  origin: 'extracted' | 'self_created' | 'initial';
  /** 感情タグ */
  emotionTags: EmotionType[];
}

/** パターンが適用される状況 */
export interface PatternSituation {
  /** 訪問者のインテント */
  intents: ConversationIntent[];
  /** 感情状態 */
  emotions: EmotionType[];
  /** 会話の深度 */
  depths: ConversationDepth[];
  /** 時間帯 */
  timeOfDay: TimeOfDay[];
  /** 関係性フェーズ */
  relationshipPhases: RelationshipPhase[];
  /** キーワード */
  keywords: string[];
}

// --- 7F: GradualAutonomy ---

/** 自律レベル */
export type AutonomyLevel =
  | 'full_llm'        // 完全LLM依存
  | 'llm_primary'     // LLM主体 + パターン補助
  | 'hybrid'          // パターン主体 + LLM仕上げ
  | 'pattern_primary'  // パターン主体 + LLM確認
  | 'autonomous';      // 完全自律

/** 自律性メトリクス */
export interface AutonomyMetrics {
  level: AutonomyLevel;
  patternCoverage: Normalized;
  patternConfidence: Normalized;
  llmCallCount: number;
  patternCallCount: number;
  llmBypassCount: number;
  avgResponseQuality: Normalized;
}

// ============================================================
// Phase 7.5: Expression Fix（緊急修正）
// ============================================================

/** 構造化LLMレスポンス（7.5B） */
export interface StructuredLLMResponse {
  /** somuniaの発話テキスト */
  response: string;
  /** LLMが検出した感情 */
  detectedEmotion: EmotionType | null;
  /** LLMが検出したトピック */
  detectedTopics: string[];
  /** 応答の確信度 */
  confidence: Normalized;
  /** 構造化パースに成功したか */
  wasStructured: boolean;
}

/** 分離プロンプト構造（7.5A） */
export interface SeparatedPrompt {
  /** システムプロンプト（somuniaの人格・状況設定） */
  system: string;
  /** ユーザープロンプト（訪問者のメッセージ＋応答指示） */
  user: string;
}

/** 応答検証結果（7.5C改良版） */
export interface ResponseValidation {
  /** 有効な応答か */
  isValid: boolean;
  /** 検出された問題 */
  issues: string[];
  /** 修正された応答（問題がある場合） */
  correctedResponse: string | null;
  /** 修正の理由 */
  correctionReason: string | null;
  /** 応答品質スコア */
  qualityScore: Normalized;
}

/** ExpressionFilter設定 */
export interface ExpressionFilterConfig {
  /** 自己紹介繰り返しの検出閾値 */
  selfIntroThreshold: number;
  /** 類似応答の閾値 (0-1) */
  similarityThreshold: number;
  /** 応答の最大文字数 */
  maxResponseLength: number;
  /** 応答の最小文字数 */
  minResponseLength: number;
  /** 最大保持応答数（履歴） */
  maxHistorySize: number;
}
