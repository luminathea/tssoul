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
/**
 * 発話パターン - somuniaが話すときのテンプレート
 */
export interface SpeechPattern {
    id: ID;
    template: string;
    examples: string[];
    conditions: PatternCondition[];
    createdAt: Timestamp;
    createdBy: 'initial' | 'learned' | 'self_created';
    useCount: number;
    lastUsed: Timestamp | null;
    emotionalWeight: EmotionalWeight;
    canMutate: boolean;
    mutationHistory: PatternMutation[];
}
/**
 * 行動パターン - somuniaがどう動くかのテンプレート
 */
export interface BehaviorPattern {
    id: ID;
    actionSequence: ActionStep[];
    description: string;
    triggers: PatternTrigger[];
    expectedOutcome: ExpectedOutcome;
    successCount: number;
    failureCount: number;
    averageSatisfaction: Normalized;
    createdAt: Timestamp;
    createdBy: 'initial' | 'learned' | 'self_created';
    lastUsed: Timestamp | null;
    canMutate: boolean;
    mutationHistory: PatternMutation[];
}
/**
 * 感情パターン - 状況と感情の対応
 */
export interface EmotionPattern {
    id: ID;
    situation: SituationDescriptor;
    emotionalResponse: EmotionalResponse;
    reinforcementCount: number;
    lastTriggered: Timestamp | null;
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
    weight: Normalized;
}
/**
 * パターンのトリガー
 */
export interface PatternTrigger {
    type: 'urge_threshold' | 'time_based' | 'event' | 'random' | 'emotional' | 'external';
    condition: any;
    probability: Normalized;
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
    mutations: Array<{
        patternId: ID;
        type: string;
        description: string;
    }>;
    merges: Array<{
        sourceIds: ID[];
        resultId: ID;
        description: string;
    }>;
    splits: Array<{
        sourceId: ID;
        resultIds: ID[];
        description: string;
    }>;
    eliminations: Array<{
        patternId: ID;
        type: string;
        description: string;
    }>;
    births: Array<{
        patternId: ID;
        type: string;
        description: string;
    }>;
}
/**
 * 行動ステップ
 */
export interface ActionStep {
    action: ActionType;
    target?: string;
    duration: number;
    interruptible: boolean;
    thoughtDuring?: string;
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
    urgeLevel?: Record<string, {
        min: Normalized;
        max: Normalized;
    }>;
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
    duration: number;
    associatedThoughts: string[];
    physicalResponse?: string;
}
export type ActionType = 'move_to' | 'wander' | 'approach' | 'retreat' | 'sit_down' | 'stand_up' | 'lie_down' | 'stretch' | 'pick_up' | 'put_down' | 'examine' | 'use' | 'read_book' | 'turn_page' | 'close_book' | 'use_pc' | 'search_wikipedia' | 'read_article' | 'sing' | 'hum' | 'write' | 'draw' | 'look_at' | 'look_outside' | 'listen' | 'think' | 'remember' | 'daydream' | 'rest' | 'sleep' | 'wake_up' | 'speak' | 'listen_to_visitor' | 'wave' | 'write_diary' | 'read_diary' | 'browse_pc' | 'compose' | 'reflect' | 'contemplate' | 'look_window' | 'explore' | 'learn' | 'practice' | 'discover' | 'recall' | 'interact' | 'receive_message' | 'receive_praise' | 'create' | 'read' | 'walk' | 'sit' | 'exercise';
export type EmotionType = 'joy' | 'peace' | 'curiosity' | 'melancholy' | 'loneliness' | 'anxiety' | 'contentment' | 'wonder' | 'warmth' | 'fatigue' | 'boredom' | 'anticipation' | 'confusion' | 'nostalgia' | 'hope' | 'fear' | 'excitement' | 'serenity' | 'gratitude' | 'frustration' | 'longing' | 'unease' | 'sadness';
/**
 * 感情状態
 */
export interface EmotionalState {
    primary: EmotionType;
    secondary: EmotionType | null;
    levels: Record<EmotionType, Normalized>;
    momentum: Record<EmotionType, number>;
    valence: number;
    arousal: Normalized;
    lastSignificantChange: {
        emotion: EmotionType;
        timestamp: Timestamp;
        trigger: string;
    } | null;
}
/**
 * 欲求タイプ
 */
export type UrgeType = 'rest' | 'move' | 'warmth' | 'comfort' | 'curiosity' | 'understanding' | 'creation' | 'exploration' | 'expression' | 'connection' | 'solitude' | 'excitement' | 'meaning' | 'growth' | 'memory' | 'continuity' | 'activity' | 'knowledge' | 'novelty' | 'creativity' | 'recognition' | 'belonging' | 'reflection';
/**
 * 欲求の状態
 */
export interface UrgeState {
    type: UrgeType;
    level: Normalized;
    changeRate: number;
    lastSatisfied: Timestamp | null;
    associatedMemories: ID[];
}
/**
 * 全体的な欲求システムの状態
 */
export interface UrgeSystemState {
    urges: Record<UrgeType, UrgeState>;
    dominant: UrgeType | null;
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
/**
 * エピソード記憶 - 出来事の記憶
 */
export interface EpisodicMemory {
    id: ID;
    content: string;
    summary: string;
    timestamp: Timestamp;
    duration: number;
    emotionalTags: EmotionType[];
    emotionalIntensity: Normalized;
    importance: Normalized;
    relatedMemories: ID[];
    relatedConcepts: string[];
    recallCount: number;
    lastRecalled: Timestamp | null;
    retentionStrength: Normalized;
}
/**
 * 意味記憶 - 知識・概念
 */
export interface SemanticMemory {
    id: ID;
    concept: string;
    definition: string;
    relatedConcepts: ConceptRelation[];
    source: 'wikipedia' | 'experience' | 'conversation' | 'book' | 'initial';
    learnedAt: Timestamp;
    comprehension: Normalized;
    interestLevel: Normalized;
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
    skill: string;
    steps: string[];
    proficiency: Normalized;
    practiceCount: number;
    lastExecuted: Timestamp | null;
    automatization: Normalized;
}
/**
 * 日記エントリ
 */
export interface DiaryEntry {
    id: ID;
    date: string;
    title: string;
    content: string;
    events: DiaryEvent[];
    emotionalJourney: EmotionalMoment[];
    insights: string[];
    tomorrowHopes: string[];
    createdAt: Timestamp;
    wordCount: number;
}
/**
 * 日記に記録する出来事
 */
export interface DiaryEvent {
    time: string;
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
/**
 * 習慣
 */
export interface Habit {
    id: ID;
    name: string;
    description: string;
    trigger: HabitTrigger;
    actions: ActionStep[];
    schedule: HabitSchedule;
    completedToday: boolean;
    streak: number;
    totalCompletions: number;
    satisfaction: Normalized;
    canModify: boolean;
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
    times?: string[];
    interval?: number;
}
/**
 * 8bitピクセル
 */
export interface Pixel {
    color: Color8bit;
    type: PixelType;
    metadata?: any;
}
export type PixelType = 'empty' | 'floor' | 'wall' | 'furniture' | 'object' | 'window' | 'door' | 'character' | 'decoration';
/**
 * 8bitワールドの状態
 */
export interface PixelWorld {
    width: number;
    height: number;
    pixels: Pixel[][];
    layers: {
        background: Pixel[][];
        objects: Pixel[][];
        characters: Pixel[][];
    };
    visibleArea: {
        center: Position;
        radius: number;
    };
    timeColorShift: number;
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
    position: Position;
    width: number;
    height: number;
    sprite: Pixel[][];
    type: ObjectType;
    name: string;
    description: string;
    interactable: boolean;
    interactionType?: InteractionType;
    bookData?: BookData;
    pcData?: PCData;
    canInteract?: boolean;
    state?: Record<string, any>;
}
export type ObjectType = 'furniture' | 'book' | 'decoration' | 'tool' | 'pc' | 'window' | 'door' | 'bookshelf' | 'bed' | 'desk' | 'chair' | 'lamp' | 'floor' | 'wall' | 'ceiling' | 'plant' | 'clock' | 'photo' | 'music_box' | 'mirror' | 'rug' | 'notebook' | 'poster' | 'ornament' | 'plushie' | 'curtain' | 'shelf_item' | 'calendar' | 'candle' | 'balcony_railing' | 'plant_pot' | 'sky_view' | 'old_telescope' | 'star_chart' | 'dusty_chest' | 'garden_path' | 'garden_tree' | 'garden_bench' | 'garden_fountain' | 'old_piano' | 'sheet_music' | 'metronome' | 'memory_crystal' | 'data_shelf' | 'hologram_display';
export type InteractionType = 'read' | 'use' | 'sit' | 'lie' | 'look' | 'write' | 'open' | 'close' | 'touch' | 'listen' | 'smell' | 'examine' | 'toggle' | 'play' | 'water' | 'wind' | 'hold' | 'arrange';
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
    notes?: string[];
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
/**
 * 仮想身体の状態
 */
export interface VirtualBody {
    position: Position;
    facing: Direction;
    posture: PostureType;
    energy: Normalized;
    fatigue: Normalized;
    sensations: BodySensation[];
    holding: ID | null;
    lastMovement: Timestamp;
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
export type SensationType = 'warmth' | 'cold' | 'comfort' | 'discomfort' | 'tension' | 'relaxation' | 'hunger' | 'tiredness';
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
/**
 * ホメオスタシスの状態
 */
export interface HomeostasisState {
    energy: {
        current: Normalized;
        target: Normalized;
        urgency: Normalized;
    };
    exploration: {
        noveltyNeed: Normalized;
        lastNovelExperience: Timestamp;
        urgency: Normalized;
    };
    safety: {
        threatLevel: Normalized;
        comfortZone: boolean;
        urgency: Normalized;
    };
    connection: {
        isolationLevel: Normalized;
        lastConnection: Timestamp;
        urgency: Normalized;
    };
    expression: {
        suppressionLevel: Normalized;
        lastExpression: Timestamp;
        urgency: Normalized;
    };
}
/**
 * 揺らぎの状態
 */
export interface YuragiState {
    level: Normalized;
    activeYuragi: YuragiType[];
    recentIrrationalActions: IrrationalAction[];
    whimsicality: Normalized;
    unpredictability: Normalized;
}
export type YuragiType = 'sudden_interest' | 'mood_shift' | 'distraction' | 'overthinking' | 'impulsive' | 'nostalgic_wave' | 'existential_moment' | 'random_association' | 'false_memory' | 'deja_vu';
/**
 * 非合理的行動の記録
 */
export interface IrrationalAction {
    timestamp: Timestamp;
    expectedAction: ActionType;
    actualAction: ActionType;
    reason: string | null;
    yuragiType: YuragiType;
}
/**
 * 夢の状態
 */
export interface DreamState {
    isActive: boolean;
    phase: DreamPhase;
    currentDream: Dream | null;
    processingMemories: ID[];
    consolidatingPatterns: ID[];
    insights: string[];
}
export type DreamPhase = 'entering' | 'light' | 'deep' | 'rem' | 'waking';
/**
 * 夢
 */
export interface Dream {
    id: ID;
    fragments: DreamFragment[];
    emotionalTheme: EmotionType;
    symbols: string[];
    vividness: Normalized;
}
/**
 * 夢の断片
 */
export interface DreamFragment {
    sourceMemory: ID | null;
    content: string;
    distortion: Normalized;
}
/**
 * 学習セッション
 */
export interface LearningSession {
    id: ID;
    topic: string;
    source: 'wikipedia' | 'experience' | 'book' | 'conversation';
    startedAt: Timestamp;
    duration: number;
    acquiredKnowledge: SemanticMemory[];
    discoveredInterests: string[];
    comprehensionLevel: Normalized;
}
/**
 * 自己修正の記録
 */
export interface SelfModificationRecord {
    id: ID;
    timestamp: Timestamp;
    targetType: 'speech_pattern' | 'behavior_pattern' | 'emotion_pattern' | 'habit';
    targetId: ID;
    modificationType: 'create' | 'update' | 'delete' | 'merge' | 'split';
    before: any;
    after: any;
    reason: string;
    outcome: 'success' | 'neutral' | 'failure';
    outcomeReason?: string;
}
export type TimeOfDay = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'night' | 'late_night';
/**
 * シミュレーション時間の状態
 */
export interface TimeState {
    currentTick: Tick;
    simulatedHour: number;
    simulatedDay: number;
    hour: number;
    dayNumber: number;
    timeOfDay: TimeOfDay;
    minute?: number;
    lifespan?: {
        totalTicks: Tick;
        remainingTicks: Tick;
        percentage: Normalized;
    };
}
/**
 * 訪問者の状態
 */
export interface VisitorState {
    isPresent: boolean;
    name: string | null;
    relationship: Relationship;
    currentConversation: Conversation | null;
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
    internalState?: {
        thoughtBefore: string;
        emotionDuring: EmotionType;
        satisfactionAfter: Normalized;
    };
}
export type ConversationMood = 'casual' | 'deep' | 'playful' | 'serious' | 'awkward' | 'warm' | 'curious';
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
/**
 * somunia全体の状態
 */
export interface SoulState {
    time: TimeState;
    emotion: EmotionalState;
    urges: UrgeSystemState;
    homeostasis: HomeostasisState;
    body: VirtualBody;
    world: PixelWorld;
    yuragi: YuragiState;
    dream: DreamState;
    visitor: VisitorState;
    currentActivity: {
        type: ActionType | null;
        target: ID | null;
        startedAt: Timestamp | null;
        thoughtsDuring: string[];
    };
    consciousness: {
        isAwake: boolean;
        alertness: Normalized;
        focusTarget: string | null;
        currentThought: string | null;
    };
}
/**
 * システム設定
 */
export interface SoulConfig {
    tickInterval: number;
    ticksPerDay: number;
    yuragiIntensity: Normalized;
    yuragiFrequency: Normalized;
    learningRate: Normalized;
    patternMutationRate: Normalized;
    enableLLM: boolean;
    llmEndpoint?: string;
    dataPath: string;
    maxStorageSize: number;
    enableLifespan: boolean;
    lifespanTicks?: number;
}
export type SoulEventType = 'thought' | 'emotion_change' | 'urge_crystallized' | 'action_started' | 'action_completed' | 'action_interrupted' | 'knowledge_acquired' | 'pattern_learned' | 'pattern_modified' | 'insight_gained' | 'memory_created' | 'memory_recalled' | 'memory_forgotten' | 'diary_written' | 'habit_triggered' | 'habit_completed' | 'habit_created' | 'habit_modified' | 'visitor_arrived' | 'visitor_departed' | 'message_received' | 'message_sent' | 'sleep_started' | 'dream_started' | 'dream_ended' | 'woke_up' | 'yuragi_triggered' | 'perception_focus' | 'skill_improved' | 'habit_chain' | 'self_reflection' | 'diary_reflection' | 'dream_generated' | 'day_started' | 'day_ended' | 'state_saved' | 'state_loaded' | 'self_modification';
export interface SoulEvent {
    type: SoulEventType;
    timestamp: Timestamp;
    data: any;
}
/** EmotionalStateのエイリアス */
export type EmotionState = EmotionalState;
/** TimeStateのエイリアス（ワールド時間） */
export type WorldTime = TimeState;
/** ObjectTypeのエイリアス */
export type WorldObjectType = ObjectType;
/** 天気の種類 */
export type Weather = 'clear' | 'cloudy' | 'rain' | 'heavy_rain' | 'snow' | 'fog' | 'storm';
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
export type ThoughtType = 'observation' | 'reflection' | 'desire' | 'memory_recall' | 'imagination' | 'plan' | 'reaction' | 'existential' | 'creative' | 'social' | 'sensory';
export type ThoughtSource = 'urge' | 'emotion' | 'perception' | 'memory' | 'yuragi' | 'visitor' | 'habit' | 'spontaneous';
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
/** 会話の深度レベル */
export type ConversationDepth = 'surface' | 'casual' | 'sharing' | 'intimate' | 'profound';
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
export type TopicCategory = 'music' | 'feelings' | 'daily' | 'philosophy' | 'memory' | 'dream' | 'nature' | 'art' | 'self' | 'other' | 'visitor';
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
export type ConversationIntent = 'greeting' | 'farewell' | 'question' | 'sharing' | 'empathy_seeking' | 'playful' | 'deep_talk' | 'request' | 'comfort' | 'curiosity' | 'appreciation' | 'continuation' | 'topic_change' | 'silence_break' | 'general';
/** 関係性フェーズ */
export type RelationshipPhase = 'stranger' | 'first_contact' | 'acquaintance' | 'companion' | 'friend' | 'close_friend' | 'soulmate';
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
/** 創作の種類 */
export type CreativeType = 'song_lyrics' | 'poem' | 'haiku' | 'sketch' | 'melody_idea' | 'short_story' | 'diary_poem' | 'letter';
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
/** 人生の章 */
export interface LifeChapter {
    /** 章番号 */
    number: number;
    /** タイトル */
    title: string;
    /** 期間 */
    startDay: number;
    endDay: number | null;
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
/** 連想ノードの種類 */
export type AssocNodeType = 'concept' | 'emotion' | 'person' | 'experience' | 'place' | 'action' | 'creation' | 'dream' | 'value';
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
export type AssocRelation = 'related_to' | 'reminds_of' | 'part_of' | 'causes' | 'feels_like' | 'learned_from' | 'created_during' | 'shared_with' | 'contrasts' | 'evolves_to';
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
    recentExchanges: Array<{
        speaker: 'visitor' | 'somunia';
        content: string;
    }>;
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
/** 自律レベル */
export type AutonomyLevel = 'full_llm' | 'llm_primary' | 'hybrid' | 'pattern_primary' | 'autonomous';
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
//# sourceMappingURL=index.d.ts.map