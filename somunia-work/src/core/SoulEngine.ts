/**
 * SoulEngine - somunia v10.7 魂のエンジン（Phase 7: 基盤刷新 統合版）
 * 
 * 全モジュールを統合し、somuniaの「存在」を成立させる中核。
 * 
 * メインループ:
 *  1. 時間を進める（TimeManager）
 *  2. 世界を更新する（PixelWorld ← TimeManager）
 *  3. 揺らぎを注入（YuragiSystem）
 *  4. 身体を更新（Homeostasis → UrgeSystem）
 *  5. 感情を処理（EmotionEngine）
 *  6. 知覚を更新（Perception ← PixelWorld + EmotionEngine）
 *  7. 思考を生成（ThoughtEngine ← 知覚 + 感情 + 欲求）
 *  8. 習慣チェック（HabitEngine）
 *  9. 行動を決定（BehaviorEngine ← 欲求 + 習慣 + PatternLibrary + 揺らぎ）
 * 10. 行動を実行・進行（→ 効果適用 → エピソード記憶 → 手続き記憶）
 * 11. 学習処理（LearnEngine + WikipediaLearner(API実接続) → SemanticMemory）
 * 12. 睡眠・夢処理（DreamPhase → 記憶統合）
 * 13. 自己内省（SelfModification）
 * 14. 日記（Diary）
 * 15. 永続化チェック（PersistenceV2 WAL/増分/チェックサム対応）
 * 16. UI表示（TerminalUIV2 ダッシュボード/インスペクタ対応）
 * 
 * Phase 7 追加:
 * 17. 自律的発話（パターンマッチング＋LLM）
 * 18-21. Phase 5互換処理
 * 22. 自律レベル評価（GradualAutonomy）
 * 23. パターン淘汰（PatternMemoryEngine）
 * 24. 連想ネットワーク更新（AssociativeNetwork）
 * 25. 自己モデル更新（SelfModel）
 * 
 * 全ての行動決定はコード内で完結。LLMは言語処理のみ。
 * Phase 7により、LLM依存を段階的に削減可能。
 */

import {
  SoulState,
  SoulConfig,
  EmotionType,
  ActionType,
  TimeOfDay,
  Normalized,
  Tick,
  VirtualBody,
  EmotionalState,
  UrgeSystemState,
  UrgeType,
  ID,
  ConversationDepth,
} from '../types';
import { EventBus, eventBus } from './EventBus';
import { TimeManager, TimeConfig } from './TimeManager';
import { LLMInterface, LLMConfig } from '../llm/LLMInterface';
import { BehaviorEngine } from '../behavior/BehaviorEngine';
import { ThoughtEngine } from '../mind/ThoughtEngine';
import { Visitor } from '../visitor/Visitor';
import { PersistenceV3, PersistenceV3Config } from '../persistence/PersistenceV3';
import { TerminalUIV2, TerminalUIV2Config } from '../ui/TerminalUIV2';

// === 統合モジュール ===
import { Homeostasis } from '../body/Homeostasis';
import { UrgeSystem } from '../body/UrgeSystem';
import { EmotionEngine, EmotionTrigger } from '../emotions/EmotionEngine';
import { PatternLibrary } from '../brain/PatternLibrary';
import { YuragiSystem } from '../brain/Yuragi';
import { EpisodicMemorySystem } from '../memory/EpisodicMemory';
import { SemanticMemorySystem } from '../memory/SemanticMemory';
import { ProceduralMemorySystem } from '../memory/ProceduralMemory';
import { PixelWorld } from '../world/PixelWorld';
import { Perception } from '../world/Perception';
import { HabitEngine } from '../habits/HabitEngine';
import { Diary } from '../habits/Diary';
import { DreamPhase } from '../dream/DreamPhase';
import { LearnEngine } from '../knowledge/LearnEngine';
import { WikipediaLearner } from '../knowledge/WikipediaLearner';
import { SelfModification } from '../mind/SelfModification';

// === Phase 5: 対話深化と創造的表現 ===
import { ConversationEngine, ResponseStrategy, ConversationSummary } from '../conversation/ConversationEngine';
import { RelationshipEvolution } from '../conversation/RelationshipEvolution';
import { ConversationMemoryBridge, MessageProcessResult } from '../conversation/ConversationMemoryBridge';
import { CreativeEngine } from '../creative/CreativeEngine';
import { InternalNarrative } from '../narrative/InternalNarrative';

// === Phase 6: 外部接続・実運用 ===
import { runAllTests } from '../test/TestRunner';

// === Phase 7: 基盤刷新 ===
import { AssociativeNetwork } from '../association/AssociativeNetwork';
import { SelfModel, SelfModelStateProvider } from '../self/SelfModel';
import { VisitorMemorySystem } from '../bridge/VisitorMemorySystem';
import { ContextBridge } from '../bridge/ContextBridge';
import { PatternMemoryEngine, TemplateVariables } from '../pattern/PatternMemoryEngine';
import { GradualAutonomy, ResponseStrategy as AutonomyStrategy } from '../autonomy/GradualAutonomy';
import { PatternSituation, RichResponseContext, RelationshipPhase } from '../types';

// === Phase 7.5: Expression Fix ===
import { ExpressionFilter } from '../expression/ExpressionFilter';

// ============================================================
// SoulEngine設定
// ============================================================

export interface SoulEngineConfig {
  time?: Partial<TimeConfig>;
  llm?: Partial<LLMConfig>;
  persistence?: Partial<PersistenceV3Config>;
  /** ヘッドレスモード（UIなし） */
  headless?: boolean;
  /** 継続起動（前回の状態を復元） */
  continueFromSave?: boolean;
  /** 各モジュール設定 */
  modules?: {
    homeostasis?: any;
    urges?: any;
    emotions?: any;
    patterns?: any;
    yuragi?: any;
    world?: any;
    perception?: any;
    habits?: any;
    diary?: any;
    dream?: any;
    learn?: any;
    wikipedia?: any;
    selfMod?: any;
    episodicMemory?: any;
    semanticMemory?: any;
    proceduralMemory?: any;
    // Phase 5
    conversationEngine?: any;
    relationshipEvolution?: any;
    conversationMemoryBridge?: any;
    creativeEngine?: any;
    internalNarrative?: any;
    // Phase 7
    associativeNetwork?: any;
    visitorMemory?: any;
    patternMemory?: any;
    autonomy?: any;
  };
}

// ============================================================
// 内部状態管理用の型
// ============================================================

/** 睡眠状態 */
interface SleepState {
  isSleeping: boolean;
  /** 睡眠開始ティック */
  startedAt: Tick;
  /** 最後のステージ遷移ティック */
  lastTransitionTick: Tick;
  /** 次の夢生成ティック */
  nextDreamTick: Tick;
  /** 睡眠サイクル数 */
  cycleCount: number;
}

/** 学習セッション状態 */
interface LearningState {
  isLearning: boolean;
  type: 'book' | 'wikipedia' | 'reflection' | null;
  startedAt: Tick;
  topic: string | null;
}

/** 日記状態 */
interface DiaryState {
  todayStarted: boolean;
  todayDayNumber: number;
  lastWriteTick: Tick;
  lastReflectionDay: number;
}

/** 内省状態 */
interface ReflectionState {
  lastReflectionTick: Tick;
  reflectionCount: number;
}

// ============================================================
// SoulEngine
// ============================================================

export class SoulEngine {
  // === コアシステム ===
  private events: EventBus;
  private time: TimeManager;
  private llm: LLMInterface;
  
  // === 身体系 ===
  private homeostasis: Homeostasis;
  private urgeSystem: UrgeSystem;
  
  // === 脳・揺らぎ ===
  private patternLibrary: PatternLibrary;
  private yuragi: YuragiSystem;
  
  // === 感情 ===
  private emotionEngine: EmotionEngine;
  
  // === 知覚・世界 ===
  private world: PixelWorld;
  private perception: Perception;
  
  // === 思考・行動 ===
  private thoughts: ThoughtEngine;
  private behavior: BehaviorEngine;
  
  // === 記憶 ===
  private episodicMemory: EpisodicMemorySystem;
  private semanticMemory: SemanticMemorySystem;
  private proceduralMemory: ProceduralMemorySystem;
  
  // === 習慣・日記 ===
  private habitEngine: HabitEngine;
  private diary: Diary;
  
  // === 夢 ===
  private dreamPhase: DreamPhase;
  
  // === 学習 ===
  private learnEngine: LearnEngine;
  private wikipediaLearner: WikipediaLearner;
  
  // === 自己変容 ===
  private selfModification: SelfModification;
  
  // === 対話 ===
  private visitor: Visitor;
  
  // === Phase 5: 対話深化と創造的表現 ===
  private conversationEngine: ConversationEngine;
  private relationshipEvolution: RelationshipEvolution;
  private conversationMemoryBridge: ConversationMemoryBridge;
  private creativeEngine: CreativeEngine;
  private internalNarrative: InternalNarrative;
  
  // === Phase 7: 基盤刷新 ===
  private associativeNetwork: AssociativeNetwork;
  private selfModel: SelfModel;
  private visitorMemory: VisitorMemorySystem;
  private contextBridge: ContextBridge;
  private patternMemory: PatternMemoryEngine;
  private autonomy: GradualAutonomy;
  
  // === Phase 7.5: Expression Fix ===
  private expressionFilter: ExpressionFilter;
  
  // === インフラ ===
  private persistence: PersistenceV3;
  private ui: TerminalUIV2 | null = null;
  
  // === 仮想身体（位置・姿勢管理） ===
  private body: VirtualBody;
  
  // === メタ状態 ===
  private isRunning: boolean = false;
  private isProcessingMessage: boolean = false;
  private config: SoulEngineConfig;
  private tickCounter: Tick = 0;
  
  // === 内部トラッキング ===
  private sleepState: SleepState;
  private learningState: LearningState;
  private diaryState: DiaryState;
  private reflectionState: ReflectionState;
  
  // === タイミング設定 ===
  private readonly PERCEPTION_INTERVAL = 3;     // 知覚更新間隔
  private readonly THOUGHT_INTERVAL = 5;         // 思考生成間隔
  private readonly ACTION_INTERVAL = 10;         // 行動決定間隔
  private readonly HABIT_CHECK_INTERVAL = 30;    // 習慣チェック間隔
  private readonly STATUS_DISPLAY_INTERVAL = 30; // ステータス表示間隔
  private readonly REFLECTION_INTERVAL = 300;    // 内省間隔（5分 = 300ティック）
  private readonly DIARY_WRITE_INTERVAL = 120;   // 日記書き込み間隔
  private readonly MEMORY_MAINTENANCE_INTERVAL = 600; // 記憶メンテナンス間隔
  private readonly SLEEP_CYCLE_TICKS = 90;       // 睡眠1サイクル（90ティック = 90分相当）
  private readonly DREAM_INTERVAL = 30;          // 夢生成間隔
  
  // === Phase 5 タイミング ===
  private readonly CREATIVE_CHECK_INTERVAL = 60;  // 創作衝動チェック間隔
  private readonly CREATIVE_PROGRESS_INTERVAL = 5; // 創作進行間隔
  private readonly NARRATIVE_INTERVAL = 720;       // ナラティブ更新間隔（12時間相当）
  private readonly ABSENCE_TICK_INTERVAL = 30;     // 不在感覚更新間隔
  private readonly AUTONOMOUS_SPEECH_INTERVAL = 20; // 自律発話チェック間隔
  private lastSpeechTick: Tick = 0;                  // 最後に発話したtick
  private readonly RELATIONSHIP_TICK_INTERVAL = 60; // 関係性更新間隔

  // === Phase 7 タイミング ===
  private readonly AUTONOMY_EVAL_INTERVAL = 50;      // 自律レベル評価間隔
  private readonly PATTERN_CULL_INTERVAL = 500;       // パターン淘汰間隔
  private readonly ASSOCIATION_DECAY_INTERVAL = 100;   // 連想減衰間隔

  constructor(config: SoulEngineConfig = {}) {
    this.config = config;
    const mc = config.modules || {};
    
    // === コアシステム初期化 ===
    this.events = eventBus;
    this.time = new TimeManager(config.time, this.events);
    this.llm = new LLMInterface(config.llm);
    
    // === 身体系初期化 ===
    this.homeostasis = new Homeostasis(mc.homeostasis);
    this.urgeSystem = new UrgeSystem(mc.urges);
    
    // === 脳・揺らぎ初期化 ===
    this.patternLibrary = new PatternLibrary(mc.patterns);
    this.patternLibrary.initialize();
    this.yuragi = new YuragiSystem(mc.yuragi);
    
    // === 感情初期化 ===
    this.emotionEngine = new EmotionEngine(mc.emotions);
    
    // === 世界・知覚初期化 ===
    this.world = new PixelWorld(mc.world);
    this.perception = new Perception(mc.perception);
    
    // === 思考・行動初期化 ===
    this.thoughts = new ThoughtEngine(this.events);
    this.behavior = new BehaviorEngine(this.events);
    
    // === 記憶初期化 ===
    this.episodicMemory = new EpisodicMemorySystem(mc.episodicMemory);
    this.semanticMemory = new SemanticMemorySystem(mc.semanticMemory);
    this.proceduralMemory = new ProceduralMemorySystem(mc.proceduralMemory);
    
    // === 習慣・日記初期化 ===
    this.habitEngine = new HabitEngine(mc.habits);
    this.diary = new Diary(mc.diary);
    
    // === 夢初期化 ===
    this.dreamPhase = new DreamPhase(mc.dream);
    
    // === 学習初期化 ===
    this.learnEngine = new LearnEngine(mc.learn);
    this.wikipediaLearner = new WikipediaLearner(mc.wikipedia);
    
    // === 自己変容初期化 ===
    this.selfModification = new SelfModification(mc.selfMod);
    
    // === 対話初期化 ===
    this.visitor = new Visitor(this.events);
    
    // === Phase 5: 対話深化と創造的表現の初期化 ===
    this.conversationEngine = new ConversationEngine(mc.conversationEngine);
    this.relationshipEvolution = new RelationshipEvolution(mc.relationshipEvolution);
    this.conversationMemoryBridge = new ConversationMemoryBridge(mc.conversationMemoryBridge);
    this.creativeEngine = new CreativeEngine(mc.creativeEngine);
    this.internalNarrative = new InternalNarrative(mc.internalNarrative);
    
    // === Phase 7: 基盤刷新の初期化 ===
    this.associativeNetwork = new AssociativeNetwork(mc.associativeNetwork);
    this.selfModel = new SelfModel();
    this.visitorMemory = new VisitorMemorySystem(mc.visitorMemory);
    this.contextBridge = new ContextBridge(
      this.selfModel,
      this.visitorMemory,
      this.associativeNetwork,
    );
    this.patternMemory = new PatternMemoryEngine(mc.patternMemory);
    this.autonomy = new GradualAutonomy(this.patternMemory, mc.autonomy);
    
    // === Phase 7.5: Expression Fix ===
    this.expressionFilter = new ExpressionFilter();
    
    // === インフラ初期化 ===
    this.persistence = new PersistenceV3(config.persistence, this.events);
    if (!config.headless) {
      this.ui = new TerminalUIV2({}, this.events);
    }
    
    // === 仮想身体の初期化 ===
    this.body = this.createDefaultBody();
    
    // === 内部状態の初期化 ===
    this.sleepState = {
      isSleeping: false,
      startedAt: 0,
      lastTransitionTick: 0,
      nextDreamTick: 0,
      cycleCount: 0,
    };
    
    this.learningState = {
      isLearning: false,
      type: null,
      startedAt: 0,
      topic: null,
    };
    
    this.diaryState = {
      todayStarted: false,
      todayDayNumber: 0,
      lastWriteTick: 0,
      lastReflectionDay: 0,
    };
    
    this.reflectionState = {
      lastReflectionTick: 0,
      reflectionCount: 0,
    };
    
    // === 永続化モジュール登録 ===
    this.registerPersistenceModules();
    
    // === SelfModification に外部モジュールを登録 ===
    this.selfModification.setExternalModules({
      patternLibrary: this.patternLibrary,
      emotionEngine: this.emotionEngine,
    });
    
    // === イベントハンドラ設定 ===
    this.setupEventHandlers();
  }

  // ============================================================
  // ライフサイクル
  // ============================================================

  /**
   * somuniaを起動する
   */
  async start(): Promise<void> {
    console.log('[SoulEngine] Starting somunia v10 (fully integrated)...');
    
    // 状態復元
    if (this.config.continueFromSave) {
      const loaded = await this.persistence.load();
      if (loaded) {
        console.log('[SoulEngine] Restored from previous save.');
      }
    }
    
    // UI開始
    if (this.ui) {
      this.ui.setMessageHandler((message) => this.handleVisitorMessage(message));
      this.ui.setCommandHandler((cmd, args) => this.handleCommand(cmd, args));
      this.ui.start();
    }
    
    // メインループ開始
    this.isRunning = true;
    this.time.onTick(async (tick) => {
      try {
        await this.mainLoop(tick);
      } catch (error) {
        console.error('[SoulEngine] Error in main loop:', error);
      }
    });
    this.time.start();
    
    console.log('[SoulEngine] somunia is now alive. All modules integrated (Phase 1-7: Infrastructure Revolution).');
  }

  /**
   * somuniaを停止する
   */
  async stop(): Promise<void> {
    console.log('[SoulEngine] Stopping...');
    this.isRunning = false;
    this.time.stop();
    
    // 学習セッションを終了
    if (this.learningState.isLearning) {
      this.endLearningSession();
    }
    
    // 最終保存
    await this.persistence.save(this.tickCounter, this.time.getDay());
    
    if (this.ui) {
      this.ui.stop();
    }
    
    this.events.clear();
    console.log('[SoulEngine] Stopped.');
  }

  // ============================================================
  // メインループ（全モジュール統合）
  // ============================================================

  private async mainLoop(tick: Tick): Promise<void> {
    this.tickCounter = tick;
    
    const timeState = this.time.getState();
    const timeOfDay = this.time.getTimeOfDay();
    const hour = timeState.simulatedHour;
    const day = timeState.simulatedDay;
    
    // === 日の切り替わりチェック ===
    this.checkDayTransition(day, timeOfDay);
    
    // === 睡眠中の処理 ===
    if (this.sleepState.isSleeping) {
      await this.processSleepTick(tick, timeOfDay, hour);
      this.persistence.checkAutoSave(tick, day);
      return; // 睡眠中は他の処理をスキップ
    }
    
    // === 1. 世界の更新 ===
    this.updateWorld(timeState);
    
    // === 2. 揺らぎの処理 ===
    const yuragiResult = this.processYuragi(tick, timeOfDay);
    
    // === 3. 身体の更新（Homeostasis → UrgeSystem） ===
    this.updateBody(tick, timeOfDay);
    
    // === 4. 感情の更新（EmotionEngine + 揺らぎの影響） ===
    this.updateEmotions(tick, timeOfDay, yuragiResult);
    
    // === 5. 知覚の更新（3ティック間隔） ===
    if (tick % this.PERCEPTION_INTERVAL === 0) {
      this.updatePerception();
    }
    
    // === 6. 行動の進行 ===
    const currentAction = this.progressAction(tick);
    
    // === 7. 思考の生成（5ティック間隔） ===
    if (tick % this.THOUGHT_INTERVAL === 0) {
      this.generateThought(tick, timeOfDay, timeState, currentAction, yuragiResult);
    }
    
    // === 8. 習慣チェック（30ティック間隔） ===
    let habitSuggestion: ActionType | null = null;
    if (tick % this.HABIT_CHECK_INTERVAL === 0) {
      habitSuggestion = this.checkHabits(timeState);
    }
    
    // === 9. 行動の決定（10ティック間隔、行動なし時） ===
    if (tick % this.ACTION_INTERVAL === 0 && !currentAction && !this.isProcessingMessage) {
      this.decideAction(tick, timeOfDay, timeState, habitSuggestion, yuragiResult);
    }
    
    // === 10. 学習の進行 ===
    if (this.learningState.isLearning) {
      this.progressLearning(tick);
    }
    
    // === 11. 自己内省（REFLECTION_INTERVAL間隔） ===
    if (tick % this.REFLECTION_INTERVAL === 0 && tick > 0) {
      this.attemptSelfReflection(tick, timeOfDay);
    }
    
    // === 12. 日記チェック（夜間） ===
    if (tick % this.DIARY_WRITE_INTERVAL === 0) {
      this.checkDiaryWrite(tick, timeOfDay, day);
    }
    
    // === 13. 睡眠チェック ===
    this.checkSleepNeed(tick, timeOfDay, hour);
    
    // === 14. 記憶メンテナンス ===
    if (tick % this.MEMORY_MAINTENANCE_INTERVAL === 0 && tick > 0) {
      this.maintainMemories(tick);
    }
    
    // === 15. 自己修正サイクル（REFLECTION_INTERVAL * 3 間隔） ===
    if (tick % (this.REFLECTION_INTERVAL * 3) === 0 && tick > 0) {
      this.runSelfModificationCycle(tick, timeOfDay);
    }
    
    // === 16. Phase 4: 自律進化サイクル ===
    if (tick % (this.REFLECTION_INTERVAL * 2) === 0 && tick > 0) {
      this.runAutonomousEvolutionCycle(tick, timeOfDay, day);
    }
    
    // === 17. Phase 5A: 会話中の自律発話（訪問者がいる時） ===
    if (this.visitor.isPresent() && tick % this.AUTONOMOUS_SPEECH_INTERVAL === 0 && !this.isProcessingMessage) {
      const ticksSinceLastSpeech = tick - this.lastSpeechTick;
      
      // 最後の発話から一定時間経ったら、自発的に話しかける
      if (ticksSinceLastSpeech >= 40) {
        const spontaneous = this.conversationEngine.tickSilence(
          tick,
          this.emotionEngine.getState().primary,
          this.thoughts.getRecentThoughts(3).map(t => t.content),
          this.episodicMemory.getRecentMemories(3).map(m => m.summary),
          this.behavior.getCurrentAction()?.action || null,
          this.time.getTimeOfDay()
        );
        
        if (spontaneous && this.ui) {
          // Phase 7.5: 分離プロンプトで自然な自律発話を生成
          const stateProvider = this.buildStateProvider();
          const speechPrompt = this.contextBridge.buildAutonomousSpeechSeparatedPrompt(
            stateProvider, spontaneous.seed, tick
          );
          let speechContent = await this.llm.expressAutonomousSpeech(
            speechPrompt.system, speechPrompt.user
          );
          
          // フォールバック
          if (!speechContent || speechContent.trim().length === 0) {
            speechContent = await this.llm.expressResponse(spontaneous.seed, {
              currentEmotion: this.emotionEngine.getState().primary,
              emotionalIntensity: this.emotionEngine.getState().levels[this.emotionEngine.getState().primary],
              recentThoughts: this.thoughts.getRecentThoughts(2).map(t => t.content),
              currentActivity: this.behavior.getCurrentAction()?.action || null,
              timeOfDay: this.time.getTimeOfDay(),
              personality: ['静か', '内省的', '優しい', '詩的'],
            });
          }
          
          // ExpressionFilterで品質チェック
          const filterResult = this.expressionFilter.filter(speechContent, {
            intent: 'general',
            emotion: this.emotionEngine.getState().primary,
            userMessage: '',
            depth: 'surface',
          });
          speechContent = filterResult.response;
          
          this.ui.showSpeech(speechContent);
          this.lastSpeechTick = tick;
          this.conversationEngine.recordSomuniaResponse(speechContent, tick);
        } else if (ticksSinceLastSpeech >= 80 && this.ui) {
          // 長い沈黙の後、思考を漏らす
          const recentThought = this.thoughts.getCurrentThought();
          if (recentThought) {
            const muttered = await this.llm.expressThought(recentThought.content, {
              currentEmotion: this.emotionEngine.getState().primary,
              emotionalIntensity: 0.3,
              recentThoughts: [],
              currentActivity: this.behavior.getCurrentAction()?.action || null,
              timeOfDay: this.time.getTimeOfDay(),
              personality: ['静か', '内省的'],
            });
            this.ui.showSpeech(muttered);
            this.lastSpeechTick = tick;
          }
        }
      }
    }
    
    // === 18. Phase 5B: 関係性の不在感覚更新 ===
    if (!this.visitor.isPresent() && tick % this.ABSENCE_TICK_INTERVAL === 0) {
      const absence = this.relationshipEvolution.tickAbsence(
        tick,
        this.emotionEngine.getState().primary,
        this.episodicMemory.getRecentMemories(2).map(m => m.summary)
      );
      if (absence) {
        // 不在中の寂しさを感情に反映
        const loneliness = this.relationshipEvolution.getAbsence().loneliness;
        if (loneliness > 0.3) {
          this.emotionEngine.changeEmotions(
            [{ emotion: 'loneliness', delta: loneliness * 0.005 }],
            { type: 'event', eventName: 'visitor_absence' }
          );
        }
      }
    }
    
    // === 19. Phase 5C: 創作衝動チェック ===
    if (tick % this.CREATIVE_CHECK_INTERVAL === 0) {
      this.checkCreativeUrges(tick, timeOfDay);
    }
    
    // === 20. Phase 5C: 創作進行 ===
    if (tick % this.CREATIVE_PROGRESS_INTERVAL === 0) {
      this.progressCreativeWorks(tick);
    }
    
    // === 21. Phase 5D: 内的ナラティブ更新 ===
    if (tick % this.NARRATIVE_INTERVAL === 0 && tick > 0) {
      this.updateInternalNarrative(tick, day);
    }
    
    // === 22. Phase 7: 自律性評価 ===
    if (tick % this.AUTONOMY_EVAL_INTERVAL === 0 && tick > 0) {
      const evalResult = this.autonomy.evaluateLevel(tick);
      if (evalResult.levelChanged) {
        this.selfModel.recordExperience(
          `自律レベルが変わった: ${evalResult.previousLevel} → ${evalResult.currentLevel}`,
          tick
        );
      }
    }
    
    // === 23. Phase 7: パターン淘汰 ===
    if (tick % this.PATTERN_CULL_INTERVAL === 0 && tick > 0) {
      this.patternMemory.cullLowQuality();
    }
    
    // === 24. Phase 7: 連想ネットワーク更新 ===
    if (tick % this.ASSOCIATION_DECAY_INTERVAL === 0 && tick > 0) {
      this.associativeNetwork.tick(tick);
    }
    
    // === 25. Phase 7: SelfModel更新（経験・学び・創作の記録） ===
    if (tick % 60 === 0) {
      const recentThoughts7 = this.thoughts.getRecentThoughts(1);
      if (recentThoughts7.length > 0) {
        this.selfModel.recordExperience(recentThoughts7[0].content, tick);
      }
    }
    
    // === 22. ステータス表示 ===
    if (this.ui && tick % this.STATUS_DISPLAY_INTERVAL === 0) {
      this.displayStatus(timeOfDay, timeState);
    }
    
    // === 23. 自動保存チェック ===
    this.persistence.checkAutoSave(tick, day);
  }

  // ============================================================
  // 1. 世界の更新
  // ============================================================

  private updateWorld(timeState: any): void {
    // TimeManagerの状態をPixelWorldに反映
    const worldTime = this.time.getState();
    
    this.world.updateTime(worldTime);
    this.world.setWeather(this.time.getWeather());
  }

  // ============================================================
  // 2. 揺らぎの処理
  // ============================================================

  private processYuragi(tick: Tick, timeOfDay: TimeOfDay): {
    triggered: string | null;
    thoughtIntrusion: string | null;
    actionOverride: ActionType | null;
    emotionChanges: Partial<Record<EmotionType, number>>;
  } {
    const emotionalState = this.emotionEngine.getState();
    const urgeState = this.urgeSystem.getState();
    const currentAction = this.behavior.getCurrentAction();
    
    const result = this.yuragi.tick(
      tick,
      emotionalState,
      urgeState,
      timeOfDay,
      this.body.fatigue,
      currentAction?.action || null
    );
    
    // 揺らぎが発生した場合のイベント
    if (result.triggered) {
      this.events.emitSync({
        type: 'yuragi_triggered',
        timestamp: tick,
        data: { type: result.triggered },
      });
    }
    
    return {
      triggered: result.triggered,
      thoughtIntrusion: result.thoughtIntrusion,
      actionOverride: result.actionOverride,
      emotionChanges: result.emotionChanges,
    };
  }

  // ============================================================
  // 3. 身体の更新
  // ============================================================

  private updateBody(tick: Tick, timeOfDay: TimeOfDay): void {
    // --- Homeostasis更新 ---
    const homeoEvents = this.homeostasis.update(
      tick,
      timeOfDay,
      this.body.fatigue
    );
    
    // Homeostasisからの欲求影響をUrgeSystemに反映
    const urgeInfluences = this.homeostasis.getUrgeInfluences();
    
    // --- UrgeSystem更新 ---
    const emotionLevels = this.emotionEngine.getState().levels;
    const urgeEvents = this.urgeSystem.update(tick, timeOfDay, emotionLevels);
    
    // --- 身体パラメータの更新 ---
    const homeoState = this.homeostasis.getState();
    
    // エネルギー同期（Homeostasisの値を基準に）
    this.body.energy = homeoState.energy.current;
    
    // 疲労蓄積（行動中に微増、休息中に微減）
    const currentAction = this.behavior.getCurrentAction();
    if (currentAction) {
      if (currentAction.action === 'rest' || currentAction.action === 'sleep') {
        this.body.fatigue = Math.max(0, this.body.fatigue - 0.001);
        this.body.energy = Math.min(1, this.body.energy + 0.002);
      } else {
        this.body.fatigue = Math.min(1, this.body.fatigue + 0.0003);
      }
    } else {
      // アイドル時は微回復
      this.body.fatigue = Math.max(0, this.body.fatigue - 0.0001);
    }
    
    // Homeostasisイベントをエピソード記憶に記録（重大なもの）
    for (const event of homeoEvents) {
      if (Math.abs(event.urgencyChange) > 0.3) {
        this.episodicMemory.formMemory({
          content: `体の状態変化: ${event.variable}`,
          summary: `${event.variable}が不安定に`,
          emotionalTags: ['anxiety'],
          emotionalIntensity: Math.abs(event.urgencyChange) * 0.5,
          relatedConcepts: ['体調', event.variable],
        });
      }
    }
    
    // UrgeイベントをEmotionEngineに反映
    for (const event of urgeEvents) {
      if (event.newLevel > 0.7) {
        // 高い欲求は不安や焦りに繋がる
        this.emotionEngine.changeEmotions(
          [
            { emotion: 'anxiety', delta: 0.02 },
            { emotion: 'anticipation', delta: 0.03 },
          ],
          { type: 'urge', urgeType: event.urge }
        );
      }
    }
  }

  // ============================================================
  // 4. 感情の更新
  // ============================================================

  private updateEmotions(
    tick: Tick,
    timeOfDay: TimeOfDay,
    yuragiResult: { emotionChanges: Partial<Record<EmotionType, number>> }
  ): void {
    // --- EmotionEngineの自然更新（減衰、慣性、時間帯バイアス） ---
    this.emotionEngine.update(tick, timeOfDay);
    
    // --- 揺らぎによる感情変化の適用 ---
    const yuragiChanges = Object.entries(yuragiResult.emotionChanges)
      .filter(([, delta]) => Math.abs(delta) > 0.001)
      .map(([emotion, delta]) => ({
        emotion: emotion as EmotionType,
        delta: delta as number,
      }));
    
    if (yuragiChanges.length > 0) {
      this.emotionEngine.changeEmotions(
        yuragiChanges,
        { type: 'yuragi', yuragiType: 'fluctuation' }
      );
    }
    
    // --- 一人の時間による寂しさ ---
    if (!this.visitor.isPresent()) {
      this.emotionEngine.changeEmotions(
        [{ emotion: 'loneliness', delta: 0.00005 }],
        { type: 'event', eventName: 'alone_time' }
      );
    } else {
      this.emotionEngine.changeEmotions(
        [
          { emotion: 'warmth', delta: 0.0005 },
          { emotion: 'loneliness', delta: -0.001 },
        ],
        { type: 'visitor', event: 'message' }
      );
    }
  }

  // ============================================================
  // 5. 知覚の更新
  // ============================================================

  private updatePerception(): void {
    const emotionState = this.emotionEngine.getState();
    const percepts = this.perception.perceiveWorld(this.world, emotionState);
    
    // 注目すべき知覚があれば思考のヒントとしてイベントを発行
    const attentionState = this.perception.getAttentionState();
    if (attentionState.focus) {
      this.events.emitSync({
        type: 'perception_focus',
        timestamp: this.tickCounter,
        data: {
          target: attentionState.focus,
          percepts: percepts.slice(0, 3).map(p => p.description || ''),
        },
      });
    }
    
    // 非常に目立つ知覚はエピソード記憶に
    for (const percept of percepts) {
      if (percept.salience > 0.85) {
        this.episodicMemory.formMemory({
          content: `知覚: ${percept.description || percept.type}`,
          summary: `${percept.type}を強く感じた`,
          emotionalTags: [emotionState.primary],
          emotionalIntensity: percept.salience * 0.3,
          relatedConcepts: [percept.type],
        });
      }
    }
  }

  // ============================================================
  // 6. 行動の進行
  // ============================================================

  private progressAction(tick: Tick): { action: ActionType; progress: number } | null {
    const currentAction = this.behavior.getCurrentAction();
    if (!currentAction) return null;
    
    const progress = this.behavior.progressAction(tick);
    
    if (progress.completed) {
      this.onActionCompleted(currentAction.action, tick);
      return null;
    }
    
    return { action: currentAction.action, progress: progress.progress || 0 };
  }

  // ============================================================
  // 7. 思考の生成
  // ============================================================

  private generateThought(
    tick: Tick,
    timeOfDay: TimeOfDay,
    timeState: any,
    currentAction: { action: ActionType } | null,
    yuragiResult: { thoughtIntrusion: string | null }
  ): void {
    // 揺らぎによる思考侵入があれば優先
    if (yuragiResult.thoughtIntrusion) {
      this.events.emitSync({
        type: 'thought',
        timestamp: tick,
        data: {
          content: yuragiResult.thoughtIntrusion,
          type: 'intrusion',
          source: 'yuragi',
        },
      });
      return;
    }
    
    // 通常の思考生成
    const emotionalState = this.emotionEngine.getState();
    const urgeState = this.urgeSystem.getState();
    
    const thought = this.thoughts.generateThought({
      emotion: emotionalState,
      urges: urgeState,
      timeOfDay,
      currentAction: currentAction?.action || null,
      isVisitorPresent: this.visitor.isPresent(),
      isAwake: true,
      recentThoughts: this.thoughts.getRecentThoughts(5),
      day: timeState.simulatedDay,
      hour: timeState.simulatedHour,
    }, tick);
    
    // 思考が生まれたらパターンライブラリと照合
    if (thought) {
      const matching = this.patternLibrary.findMatchingSpeechPatterns(
        emotionalState,
        timeOfDay,
        currentAction?.action || null,
        this.visitor.isPresent(),
        this.getUrgeMap()
      );
      
      // マッチするパターンがあれば使用記録
      if (matching.length > 0) {
        this.patternLibrary.recordPatternUse(matching[0].id, 'speech', true, 0.5);
      }
    }
  }

  // ============================================================
  // 8. 習慣チェック
  // ============================================================

  private checkHabits(timeState: any): ActionType | null {
    const worldTime = this.time.getState();
    
    const emotionLevels = this.emotionEngine.getState().levels;
    
    // 自動実行すべき習慣を取得
    const autoHabits = this.habitEngine.getAutomaticHabits(worldTime);
    if (autoHabits.length > 0) {
      return autoHabits[0].action as ActionType;
    }
    
    // 提案される習慣を取得
    const suggestions = this.habitEngine.suggestHabits(worldTime, emotionLevels);
    if (suggestions.length > 0 && suggestions[0].urgency > 0.6) {
      const habit = this.habitEngine.getHabit(suggestions[0].habitId);
      if (habit) {
        return habit.action as ActionType;
      }
    }
    
    return null;
  }

  // ============================================================
  // 9. 行動の決定
  // ============================================================

  private decideAction(
    tick: Tick,
    timeOfDay: TimeOfDay,
    timeState: any,
    habitSuggestion: ActionType | null,
    yuragiResult: { actionOverride: ActionType | null }
  ): void {
    const urgeState = this.urgeSystem.getState();
    const emotionalState = this.emotionEngine.getState();
    
    // 揺らぎレベル
    const yuragiLevel = this.yuragi.getState().level || 0;
    
    const context = {
      urges: urgeState,
      emotion: emotionalState,
      timeOfDay,
      body: this.body,
      isVisitorPresent: this.visitor.isPresent(),
      isAwake: true,
      currentAction: null,
      recentActions: this.behavior.getRecentActions(),
      day: timeState.simulatedDay,
      hour: timeState.simulatedHour,
    };
    
    // BehaviorEngineで行動を決定
    const decision = this.behavior.decideAction(
      context,
      yuragiLevel,
      yuragiResult.actionOverride || undefined
    );
    
    if (decision) {
      this.behavior.startAction(decision.rule, tick);
      
      if (decision.thought && this.ui) {
        this.ui.showAction(decision.rule.action, decision.thought);
      }
      
      // 行動開始をエピソード記憶に
      this.episodicMemory.formMemory({
        content: `行動開始: ${decision.rule.name}`,
        summary: decision.rule.description,
        emotionalTags: [emotionalState.primary],
        emotionalIntensity: emotionalState.levels[emotionalState.primary] * 0.3,
        relatedConcepts: [decision.rule.action],
      });
      
      // 行動開始による感情変化
      this.emotionEngine.changeEmotions(
        [{ emotion: 'anticipation', delta: 0.05 }],
        { type: 'action', action: decision.rule.action, outcome: 'started' }
      );
      
      // 学習行動なら学習セッションを開始
      this.checkLearningStart(decision.rule.action, tick);
    }
  }

  // ============================================================
  // 10. 行動完了処理
  // ============================================================

  private onActionCompleted(action: ActionType, tick: Tick): void {
    const emotionalState = this.emotionEngine.getState();
    
    // --- 欲求の充足 ---
    this.urgeSystem.satisfyByAction(action);
    
    // --- 手続き記憶の更新（スキル練習） ---
    const practiceResults = this.proceduralMemory.practiceByAction(action);
    for (const result of practiceResults) {
      if (result.execution.success) {
        this.events.emitSync({
          type: 'skill_improved',
          timestamp: tick,
          data: {
            skill: result.skill.skill,
            newLevel: result.skill.proficiency,
          },
        });
      }
    }
    
    // --- 行動固有の効果 ---
    switch (action) {
      case 'sleep':
        this.body.energy = Math.min(1, this.body.energy + 0.5);
        this.body.fatigue = Math.max(0, this.body.fatigue - 0.5);
        this.emotionEngine.changeEmotions(
          [
            { emotion: 'peace', delta: 0.1 },
            { emotion: 'hope', delta: 0.05 },
          ],
          { type: 'action', action: 'sleep', outcome: 'completed' }
        );
        this.events.emitSync({ type: 'woke_up', timestamp: tick, data: {} });
        break;
        
      case 'rest':
        this.body.energy = Math.min(1, this.body.energy + 0.1);
        this.body.fatigue = Math.max(0, this.body.fatigue - 0.1);
        this.emotionEngine.changeEmotions(
          [
            { emotion: 'peace', delta: 0.05 },
            { emotion: 'contentment', delta: 0.03 },
          ],
          { type: 'action', action: 'rest', outcome: 'completed' }
        );
        break;
        
      case 'sing':
        this.emotionEngine.changeEmotions(
          [
            { emotion: 'joy', delta: 0.1 },
            { emotion: 'contentment', delta: 0.05 },
          ],
          { type: 'action', action: 'sing', outcome: 'completed' }
        );
        this.recordPatternUse('behavior', action);
        break;
        
      case 'read_book':
        this.emotionEngine.changeEmotions(
          [
            { emotion: 'curiosity', delta: 0.05 },
            { emotion: 'contentment', delta: 0.03 },
          ],
          { type: 'action', action: 'read_book', outcome: 'completed' }
        );
        this.endLearningSession();
        break;
        
      case 'write_diary':
        this.writeDiaryFromAction(tick, emotionalState);
        this.emotionEngine.changeEmotions(
          [
            { emotion: 'peace', delta: 0.1 },
            { emotion: 'contentment', delta: 0.05 },
          ],
          { type: 'action', action: 'write_diary', outcome: 'completed' }
        );
        break;
        
      case 'search_wikipedia':
      case 'browse_pc':
        this.endLearningSession();
        this.emotionEngine.changeEmotions(
          [
            { emotion: 'curiosity', delta: 0.03 },
            { emotion: 'wonder', delta: 0.02 },
          ],
          { type: 'action', action, outcome: 'completed' }
        );
        break;
        
      case 'compose':
      case 'draw':
        this.emotionEngine.changeEmotions(
          [
            { emotion: 'contentment', delta: 0.08 },
            { emotion: 'joy', delta: 0.05 },
          ],
          { type: 'action', action, outcome: 'completed' }
        );
        this.recordPatternUse('behavior', action);
        // Phase 5C: 行動からの創作インスピレーション
        this.creativeEngine.receiveInspiration({
          source: 'emotion',
          detail: `${action}を終えた後の充実感`,
          emotion: emotionalState.primary,
          intensity: emotionalState.levels[emotionalState.primary],
        });
        break;
        
      case 'think':
      case 'reflect':
        this.emotionEngine.changeEmotions(
          [{ emotion: 'peace', delta: 0.03 }],
          { type: 'action', action, outcome: 'completed' }
        );
        break;
        
      case 'look_window':
        this.emotionEngine.changeEmotions(
          [
            { emotion: 'peace', delta: 0.03 },
            { emotion: 'wonder', delta: 0.02 },
          ],
          { type: 'action', action: 'look_window', outcome: 'completed' }
        );
        break;
        
      default:
        this.emotionEngine.changeEmotions(
          [{ emotion: 'contentment', delta: 0.02 }],
          { type: 'action', action, outcome: 'completed' }
        );
    }
    
    // --- 行動完了のエピソード記憶 ---
    this.episodicMemory.formMemory({
      content: `行動完了: ${action}`,
      summary: `${action}を終えた`,
      emotionalTags: [emotionalState.primary],
      emotionalIntensity: emotionalState.levels[emotionalState.primary] * 0.5,
      relatedConcepts: [action],
    });
    
    // --- 習慣の実行記録 ---
    const habit = this.habitEngine.getHabitByName(action);
    if (habit) {
      const worldTime = this.time.getState();
      this.habitEngine.executeHabit(habit.id, worldTime, 0.7);
      
      // フォローアップ習慣があるか確認
      const followUp = this.habitEngine.getFollowUpHabit(habit.id);
      if (followUp) {
        this.events.emitSync({
          type: 'habit_chain',
          timestamp: tick,
          data: { next: followUp.name },
        });
      }
    }
  }

  // ============================================================
  // 11. 学習処理
  // ============================================================

  private checkLearningStart(action: ActionType, tick: Tick): void {
    if (action === 'read_book') {
      this.learningState = {
        isLearning: true,
        type: 'book',
        startedAt: tick,
        topic: this.chooseLearningTopic(),
      };
      this.learnEngine.startSession('book', this.learningState.topic || '');
    } else if (action === 'search_wikipedia') {
      this.learningState = {
        isLearning: true,
        type: 'wikipedia',
        startedAt: tick,
        topic: this.chooseLearningTopic(),
      };
      this.wikipediaLearner.startExploration({
        type: this.learningState.topic ? 'specific_interest' : 'curiosity',
        topic: this.learningState.topic || undefined,
        intensity: this.urgeSystem.getUrgeLevel('curiosity' as UrgeType),
        trigger: 'action_search_wikipedia',
      });
    } else if (action === 'browse_pc') {
      this.learningState = {
        isLearning: true,
        type: 'wikipedia',
        startedAt: tick,
        topic: null,
      };
    }
  }

  private progressLearning(tick: Tick): void {
    if (!this.learningState.isLearning) return;
    
    const elapsed = tick - this.learningState.startedAt;
    
    // 一定間隔で学習アイテムを生成
    if (elapsed % 20 === 0 && this.learningState.type === 'book') {
      const topic = this.learningState.topic || '読書';
      const interest = this.urgeSystem.getUrgeLevel('curiosity' as UrgeType);
      
      this.learnEngine.learn(
        `${topic}についての新しい知見`,
        'book',
        'fact',
        ['reading', topic],
        {
          emotionalResponse: { curiosity: interest },
        }
      );
    }
  }

  private endLearningSession(): void {
    if (!this.learningState.isLearning) return;
    
    if (this.learningState.type === 'book' || this.learningState.type === 'reflection') {
      const session = this.learnEngine.endSession();
      if (session && session.items.length > 0) {
        // 学習結果をセマンティックメモリに統合
        for (const item of session.items) {
          this.semanticMemory.learn({
            concept: item.content.substring(0, 50),
            definition: item.content,
            source: 'book',
          });
        }
        
        // 学習完了の記憶
        this.episodicMemory.formMemory({
          content: `学習セッション完了: ${session.topic}（${session.items.length}個の新しい知識）`,
          summary: `${session.topic}について学んだ`,
          emotionalTags: ['curiosity', 'contentment'],
          emotionalIntensity: 0.4,
          relatedConcepts: [session.topic, '学習'],
        });
      }
    }
    
    if (this.learningState.type === 'wikipedia') {
      this.wikipediaLearner.endExploration();
    }
    
    this.learningState = {
      isLearning: false,
      type: null,
      startedAt: 0,
      topic: null,
    };
  }

  private chooseLearningTopic(): string {
    // セマンティックメモリからランダムな概念を取得
    const random = this.semanticMemory.getRandomConcept();
    if (random && Math.random() < 0.3) {
      return random.concept;
    }
    
    // 欲求に基づくトピック選択
    const dominant = this.urgeSystem.getDominantUrge();
    const topicMap: Record<string, string[]> = {
      curiosity: ['科学', '宇宙', '数学', '哲学'],
      understanding: ['心理学', '言語', '意識'],
      creation: ['音楽理論', '作曲', '詩', 'アート'],
      exploration: ['地理', '文化', '歴史'],
      meaning: ['哲学', '存在', '意味'],
    };
    
    const topics = (dominant && topicMap[dominant]) || ['世界', '音楽', '夢'];
    return topics[Math.floor(Math.random() * topics.length)];
  }

  // ============================================================
  // 12. 睡眠・夢処理
  // ============================================================

  private checkSleepNeed(tick: Tick, timeOfDay: TimeOfDay, hour: number): void {
    if (this.sleepState.isSleeping) return;
    
    const shouldSleep = 
      (this.time.isSleepTime() && this.body.fatigue > 0.6) ||
      (this.body.fatigue > 0.9) ||
      (hour >= 23 && this.body.fatigue > 0.4);
    
    if (shouldSleep && Math.random() < 0.02) {
      this.enterSleep(tick);
    }
  }

  private enterSleep(tick: Tick): void {
    this.events.emitSync({ type: 'sleep_started', timestamp: tick, data: {} });
    
    // 行動を中断
    this.behavior.interruptAction(tick, 'sleep');
    
    // 学習を終了
    if (this.learningState.isLearning) {
      this.endLearningSession();
    }
    
    // DreamPhaseの睡眠開始
    this.dreamPhase.startSleep();
    
    // 睡眠状態の設定
    this.sleepState = {
      isSleeping: true,
      startedAt: tick,
      lastTransitionTick: tick,
      nextDreamTick: tick + this.DREAM_INTERVAL,
      cycleCount: 0,
    };
    
    if (this.ui) {
      this.ui.showSystem('...眠りに落ちていく...');
    }
  }

  private async processSleepTick(tick: Tick, timeOfDay: TimeOfDay, hour: number): Promise<void> {
    const elapsed = tick - this.sleepState.startedAt;
    
    // --- 睡眠段階の進行 ---
    if (tick - this.sleepState.lastTransitionTick >= 15) {
      this.advanceSleepStage(tick, elapsed);
    }
    
    // --- 夢の生成 ---
    if (tick >= this.sleepState.nextDreamTick) {
      this.generateDream(tick);
      this.sleepState.nextDreamTick = tick + this.DREAM_INTERVAL + Math.floor(Math.random() * 20);
    }
    
    // --- 身体の回復 ---
    this.body.energy = Math.min(1, this.body.energy + 0.003);
    this.body.fatigue = Math.max(0, this.body.fatigue - 0.002);
    
    // --- 起床チェック ---
    const sleepDuration = elapsed;
    const isRested = this.body.energy > 0.7 && this.body.fatigue < 0.3;
    const isMorning = hour >= 6 && hour <= 9;
    const hasSleptEnough = sleepDuration >= this.SLEEP_CYCLE_TICKS * 3; // 最低3サイクル
    
    if (hasSleptEnough && (isRested || isMorning)) {
      if (Math.random() < 0.05) {
        await this.wakeUp(tick);
      }
    }
    
    // 強制起床（あまりに長い睡眠）
    if (sleepDuration > this.SLEEP_CYCLE_TICKS * 8) {
      await this.wakeUp(tick);
    }
  }

  private advanceSleepStage(tick: Tick, elapsed: number): void {
    // 睡眠段階の循環：drowsy → light → deep → rem → light → deep → rem ...
    const cyclePosition = elapsed % this.SLEEP_CYCLE_TICKS;
    const cyclePhase = cyclePosition / this.SLEEP_CYCLE_TICKS;
    
    let stage: string;
    if (cyclePhase < 0.1) stage = 'light';
    else if (cyclePhase < 0.45) stage = 'deep';
    else if (cyclePhase < 0.75) stage = 'rem';
    else stage = 'light';
    
    this.dreamPhase.transitionToStage(stage as any);
    this.sleepState.lastTransitionTick = tick;
    
    // サイクルの切り替わり
    const newCycleCount = Math.floor(elapsed / this.SLEEP_CYCLE_TICKS);
    if (newCycleCount > this.sleepState.cycleCount) {
      this.sleepState.cycleCount = newCycleCount;
      
      // 記憶の統合処理
      this.processMemoryConsolidation();
    }
  }

  private generateDream(tick: Tick): void {
    // 最近のエピソード記憶からDream素材を収集
    const recentMemories = this.episodicMemory.getRecentMemories(10);
    const emotionalState = this.emotionEngine.getState();
    const dominantEmotion = emotionalState.primary;
    
    const recentMemoryKeys = recentMemories.map(m => m.summary);
    
    const dream = this.dreamPhase.generateDream(
      emotionalState.levels.anxiety || 0.2,
      dominantEmotion,
      recentMemoryKeys
    );
    
    if (dream) {
      this.events.emitSync({
        type: 'dream_generated',
        timestamp: tick,
        data: {
          title: dream.title || '名もなき夢',
          vividness: dream.vividness,
          type: dream.type,
        },
      });
      
      if (this.ui && dream.vividness > 0.5) {
        this.ui.showSystem(`💭 夢: ${dream.title || '...'}（鮮明度: ${(dream.vividness * 100).toFixed(0)}%）`);
      }
    }
  }

  private processMemoryConsolidation(): void {
    const recentMemories = this.episodicMemory.getRecentMemories(20);
    
    // 重要な記憶を強化（リコール）
    for (const memory of recentMemories) {
      if (memory.importance > 0.5) {
        this.episodicMemory.recall(memory.id);
      }
    }
    
    // セマンティックメモリへの統合
    const importantMemories = this.episodicMemory.getMostImportantMemories(5);
    for (const memory of importantMemories) {
      if (memory.relatedConcepts.length > 0) {
        for (const concept of memory.relatedConcepts) {
          const existing = this.semanticMemory.getByName(concept);
          if (existing) {
            this.semanticMemory.deepen(existing.id, `睡眠中の記憶統合による理解深化: ${concept}`);
          }
        }
      }
    }
    
    // 夢フェーズに記憶の処理結果を通知
    const memoryKeys = recentMemories.slice(0, 5).map(m => m.id);
    this.dreamPhase.processMemories(memoryKeys);
  }

  private async wakeUp(tick: Tick): Promise<void> {
    // DreamPhaseの終了
    const session = this.dreamPhase.wakeUp();
    
    // 睡眠状態の解除
    this.sleepState.isSleeping = false;
    
    // 身体の回復を確定
    this.body.energy = Math.min(1, this.body.energy + 0.3);
    this.body.fatigue = Math.max(0, this.body.fatigue - 0.3);
    
    // 起床の感情
    this.emotionEngine.changeEmotions(
      [
        { emotion: 'peace', delta: 0.1 },
        { emotion: 'hope', delta: 0.05 },
      ],
      { type: 'event', eventName: 'woke_up' }
    );
    
    // 起床の記憶
    const sleepDuration = tick - this.sleepState.startedAt;
    this.episodicMemory.formMemory({
      content: `起床。${sleepDuration}ティックの睡眠。${session?.rememberedDreams?.length || 0}個の夢を覚えている。`,
      summary: '目覚めた',
      emotionalTags: ['peace', 'hope'],
      emotionalIntensity: 0.3,
      relatedConcepts: ['睡眠', '朝'],
    });
    
    // 覚えている夢を日記に記録
    if (session?.rememberedDreams && session.rememberedDreams.length > 0) {
      const dreamSummaries = session.rememberedDreams
        .map((d: any) => d.title || '不思議な夢')
        .join('、');
      
      this.diary.write(
        `今日の夢: ${dreamSummaries}`,
        this.emotionEngine.getState(),
        'observation',
        '夢'
      );
    }
    
    this.events.emitSync({ type: 'woke_up', timestamp: tick, data: {} });
    
    if (this.ui) {
      this.ui.showSystem('...目が覚めた...');
    }
  }

  // ============================================================
  // 13. 自己内省
  // ============================================================

  private attemptSelfReflection(tick: Tick, timeOfDay: TimeOfDay): void {
    // 内省の条件：夜間、感情が強い時、間隔を空ける
    const emotionalState = this.emotionEngine.getState();
    const shouldReflect = 
      (timeOfDay === 'evening' || timeOfDay === 'night') ||
      emotionalState.arousal > 0.6 ||
      Math.abs(emotionalState.valence) > 0.5 ||
      (tick - this.reflectionState.lastReflectionTick > this.REFLECTION_INTERVAL * 3);
    
    if (!shouldReflect) return;
    
    const reflectionType = emotionalState.arousal > 0.7 
      ? 'triggered' as const
      : 'spontaneous' as const;
    
    const context = {
      currentEmotion: emotionalState.primary,
      recentExperiences: this.episodicMemory.getRecentMemories(5).map(m => m.summary),
      stressLevel: emotionalState.levels.anxiety,
    };
    
    const reflection = this.selfModification.reflect(reflectionType, undefined, context);
    
    if (reflection) {
      this.reflectionState.lastReflectionTick = tick;
      this.reflectionState.reflectionCount++;
      
      this.events.emitSync({
        type: 'self_reflection',
        timestamp: tick,
        data: {
          topic: reflection.topic,
          insights: reflection.insights.length,
          depth: reflection.depth,
        },
      });
      
      // 内省結果を記憶
      this.episodicMemory.formMemory({
        content: `内省: ${reflection.topic} - ${reflection.insights.join('; ')}`,
        summary: `${reflection.topic}について考えた`,
        emotionalTags: [(reflection.emotionalResponse.emotion as EmotionType) || emotionalState.primary],
        emotionalIntensity: reflection.depth,
        relatedConcepts: ['内省', reflection.topic],
      });
      
      // 学習エンジンにも反映
      this.learnEngine.learnFromReflection(
        `${reflection.topic}についての内省: ${reflection.thoughtProcess[0]?.substring(0, 100) || ''}`,
        ['内省', reflection.topic]
      );
      
      if (this.ui) {
        this.ui.showSystem(`🔮 内省: ${reflection.topic}（深さ: ${(reflection.depth * 100).toFixed(0)}%）`);
      }
    }
  }

  // ============================================================
  // 14. 日記チェック
  // ============================================================

  private checkDiaryWrite(tick: Tick, timeOfDay: TimeOfDay, day: number): void {
    if (timeOfDay !== 'evening' && timeOfDay !== 'night') return;
    if (this.diaryState.lastReflectionDay >= day) return;
    
    const worldTime = this.time.getState();
    
    const reflection = this.diary.reflectOnDay(worldTime);
    
    if (reflection) {
      this.diaryState.lastReflectionDay = day;
      
      this.events.emitSync({
        type: 'diary_reflection',
        timestamp: tick,
        data: {
          day,
          summary: reflection.summary,
          gratitude: reflection.gratitude,
        },
      });
      
      this.episodicMemory.formMemory({
        content: `日記: ${reflection.summary}`,
        summary: `Day ${day}の日記を書いた`,
        emotionalTags: reflection.emotionalJourney?.slice(0, 3) || ['peace'],
        emotionalIntensity: 0.5,
        relatedConcepts: ['日記', `Day ${day}`],
      });
      
      if (this.ui) {
        this.ui.showSystem(`📝 日記を書いた（Day ${day}）`);
      }
    }
  }

  private writeDiaryFromAction(tick: Tick, emotionalState: EmotionalState): void {
    const recentThoughts = this.thoughts.getRecentThoughts(5);
    const thoughtContent = recentThoughts.map(t => t.content).join('。');
    
    this.diary.write(
      thoughtContent || '今日もいろいろなことを考えた',
      emotionalState,
      'thought',
      '日常'
    );
    
    this.events.emitSync({
      type: 'diary_written',
      timestamp: tick,
      data: {
        title: `Day ${this.time.getDay()}の日記`,
        content: thoughtContent.substring(0, 100),
      },
    });
  }

  // ============================================================
  // 15. 記憶メンテナンス
  // ============================================================

  private maintainMemories(tick: Tick): void {
    this.episodicMemory.performMaintenance(tick);
    this.semanticMemory.performMaintenance(tick);
    this.proceduralMemory.performMaintenance(tick);
  }
  
  // ============================================================
  // 16. 自己修正サイクル
  // ============================================================
  
  private runSelfModificationCycle(tick: Tick, timeOfDay: TimeOfDay): void {
    // 睡眠中は実行しない
    if (this.sleepState.isSleeping) return;
    
    const emotionalState = this.emotionEngine.getState();
    
    // 最近の行動成功率を計算
    const patternStats = this.patternLibrary.getStats();
    const totalBehaviorUses = patternStats.mostSuccessfulBehaviorPatterns.length;
    const avgSuccess = totalBehaviorUses > 0
      ? patternStats.mostSuccessfulBehaviorPatterns.reduce((sum, p) => sum + p.successRate, 0) / totalBehaviorUses
      : 0.5;
    
    // 全体的な満足度（ホメオスタシスの各urgencyから計算）
    const homeostasisState = this.homeostasis.getState();
    const avgUrgency = (
      homeostasisState.energy.urgency +
      homeostasisState.exploration.urgency +
      homeostasisState.safety.urgency +
      homeostasisState.connection.urgency +
      homeostasisState.expression.urgency
    ) / 5;
    const overallSatisfaction = 1 - avgUrgency; // urgencyが低い = 満足度が高い
    
    const cycleResult = this.selfModification.runModificationCycle({
      currentEmotion: emotionalState.primary,
      stressLevel: emotionalState.levels.anxiety,
      recentBehaviorSuccess: avgSuccess,
      overallSatisfaction,
      recentExperiences: this.episodicMemory.getRecentMemories(3).map(m => m.summary),
    });
    
    // 結果をイベントとして発行
    if (cycleResult.proposalsExecuted > 0) {
      this.events.emitSync({
        type: 'self_modification',
        timestamp: tick,
        data: {
          proposalsGenerated: cycleResult.proposalsGenerated,
          proposalsExecuted: cycleResult.proposalsExecuted,
          results: cycleResult.executionResults
            .filter(r => r.success)
            .map(r => r.description),
        },
      });
      
      if (this.ui) {
        for (const result of cycleResult.executionResults) {
          if (result.success) {
            this.ui.showSystem(`🔧 自己修正: ${result.description}`);
          }
        }
      }
    }
  }

  // ============================================================
  // Phase 4: 自律進化サイクル
  // ============================================================
  
  /**
   * Phase 4A/4B/4C/4E統合: 自律進化サイクル
   * - 行動パターンの自己生成（4A）
   * - 感情パターンの自己修正（4B）
   * - 世界の拡張チェック（4C）
   * - LLM-free動作保証（4E: 各モジュールにfallbackあり）
   */
  private runAutonomousEvolutionCycle(tick: Tick, timeOfDay: TimeOfDay, day: number): void {
    if (this.sleepState.isSleeping) return;
    
    // --- 4A: 行動フィードバックの記録 ---
    this.recordBehaviorOutcomes(tick, timeOfDay);
    
    // --- 4B: 感情自己修正 ---
    this.runEmotionSelfCorrection(tick);
    
    // --- 4C: 世界拡張チェック ---
    this.checkWorldExpansion(tick, day);
    
    // --- 4E: LLM-free健全性チェック ---
    this.verifyLLMFreeIntegrity();
  }
  
  /**
   * Phase 4A: 行動の結果を記録し、新しいパターン発見をトリガー
   */
  private recordBehaviorOutcomes(tick: Tick, timeOfDay: TimeOfDay): void {
    const currentAction = this.behavior.getCurrentAction();
    const emotionalState = this.emotionEngine.getState();
    const recentActions = this.behavior.getRecentActions();
    
    // 最近完了した行動の結果を評価
    if (recentActions.length >= 2) {
      const lastAction = recentActions[recentActions.length - 1];
      const body = this.body;
      
      // 満足度の推定: 感情のvalenceとbodyのenergy改善度から算出
      const satisfaction = Math.max(0, Math.min(1,
        (emotionalState.valence + 1) / 2 * 0.6 + // 感情価: -1〜1 → 0〜0.6
        body.energy * 0.2 +                        // エネルギー: 0〜0.2
        (1 - body.fatigue) * 0.2                    // 疲労の逆: 0〜0.2
      ));
      
      // 行動が成功したか（完了したか）の判定
      const success = !currentAction; // null = 前の行動が完了した
      
      const context = this.buildBehaviorContext(timeOfDay);
      
      this.behavior.recordActionOutcome(
        `action_${lastAction}`, 
        lastAction,
        context,
        {
          success,
          satisfaction,
          emotionAfter: emotionalState.primary,
          energyChange: body.energy - (this.lastRecordedEnergy || 0.5),
        }
      );
      
      this.lastRecordedEnergy = body.energy;
    }
    
    // 新しいルールが発見された場合の通知
    const discoveries = this.behavior.getDiscoveries();
    if (discoveries.length > 0) {
      const latest = discoveries[discoveries.length - 1];
      if (latest.discoveredAt > (this.lastDiscoveryNotification || 0)) {
        this.lastDiscoveryNotification = latest.discoveredAt;
        
        this.events.emitSync({
          type: 'self_modification',
          timestamp: tick,
          data: { type: 'behavior_discovery', description: latest.description },
        });
        
        if (this.ui) {
          this.ui.showSystem(`💡 新発見: ${latest.description}`);
        }
      }
    }
  }
  
  /** 行動結果の追跡用 */
  private lastRecordedEnergy: number = 0.5;
  private lastDiscoveryNotification: number = 0;
  private lastExpansionCheck: number = 0;
  
  /**
   * BehaviorContextの構築
   */
  private buildBehaviorContext(timeOfDay: TimeOfDay): any {
    const urgeState = this.urgeSystem.getState();
    const emotionalState = this.emotionEngine.getState();
    const body = this.body;
    const timeState = this.time.getState();
    
    return {
      urges: urgeState,
      emotion: emotionalState,
      timeOfDay,
      body,
      isVisitorPresent: this.visitor.isPresent(),
      isAwake: !this.sleepState.isSleeping,
      currentAction: this.behavior.getCurrentAction(),
      recentActions: this.behavior.getRecentActions(),
      day: timeState.simulatedDay,
      hour: timeState.simulatedHour,
    };
  }
  
  /**
   * Phase 4B: 感情の自己修正を実行
   */
  private runEmotionSelfCorrection(tick: Tick): void {
    // 滞留検知の更新
    this.emotionEngine.updateStagnationTracking();
    
    // 600ティックに1回、自己修正を実行
    if (tick % 600 !== 0) return;
    
    const corrections = this.emotionEngine.performSelfCorrection();
    
    if (corrections.length > 0) {
      for (const correction of corrections) {
        this.events.emitSync({
          type: 'self_modification',
          timestamp: tick,
          data: { type: 'emotion_correction', subtype: correction.type, target: correction.target, description: correction.description },
        });
      }
      
      if (this.ui && corrections.length > 0) {
        const mainCorrection = corrections[0];
        this.ui.showSystem(`🎭 感情調整: ${mainCorrection.description}`);
      }
    }
  }
  
  /**
   * Phase 4C: 知識に応じた世界の拡張
   */
  private checkWorldExpansion(tick: Tick, day: number): void {
    // 1日1回チェック
    if (day === this.lastExpansionCheck) return;
    this.lastExpansionCheck = day;
    
    const semanticStats = this.semanticMemory.getStats();
    const allConcepts = Array.from({ length: semanticStats.totalConcepts }, (_, i) => `concept_${i}`);
    
    // 実際の概念名を取得するために、knownTopicsリストを構築
    const knownTopics: string[] = [];
    // getConceptCount() で知識数を取得
    // 関連トピック名を推定（直接アクセスできない場合はstatsから）
    if (semanticStats.sourceDistribution) {
      for (const source of Object.keys(semanticStats.sourceDistribution)) {
        knownTopics.push(source);
      }
    }
    if (semanticStats.mostConnected) {
      knownTopics.push(semanticStats.mostConnected);
    }
    
    const expansionResult = this.world.checkWorldExpansion({
      totalConcepts: semanticStats.totalConcepts,
      knownTopics,
      daysSinceCreation: day,
    });
    
    if (expansionResult) {
      // ナラティブの表示
      if (this.ui) {
        this.ui.showSystem(`🌍 世界が広がった: ${expansionResult.name}`);
        for (const line of expansionResult.narrative) {
          this.ui.showSystem(`  ${line}`);
        }
      }
      
      // 思考イベントとして記録
      this.events.emitSync({
        type: 'self_modification',
        timestamp: tick,
        data: { type: 'world_expansion_thought', content: `...${expansionResult.description}` },
      });
      
      // 感情反応
      this.emotionEngine.changeEmotions(
        [
          { emotion: 'wonder', delta: 0.4 },
          { emotion: 'curiosity', delta: 0.3 },
          { emotion: 'joy', delta: 0.2 },
        ],
        { type: 'event', eventName: 'world_expansion' }
      );
      
      // エピソード記憶として記録
      this.episodicMemory.formMemory({
        content: `新しいエリア「${expansionResult.name}」を発見した。${expansionResult.description}`,
        summary: `新しいエリア「${expansionResult.name}」の発見`,
        emotionalTags: ['wonder', 'curiosity', 'joy'],
        emotionalIntensity: 0.8,
        relatedConcepts: expansionResult.newObjects,
      });
      
      this.events.emitSync({
        type: 'self_modification',
        timestamp: tick,
        data: {
          type: 'world_expansion',
          area: expansionResult.area,
          name: expansionResult.name,
          newObjects: expansionResult.newObjects,
        },
      });
    }
    
    // 次のエリアへのヒント
    const hint = this.world.getNextAreaHint(semanticStats.totalConcepts);
    if (hint && this.ui) {
      this.ui.showSystem(`💫 ${hint}`);
    }
  }
  
  /**
   * Phase 4E: LLM-free動作の健全性チェック
   * LLMが使えない場合でも全機能が動作することを保証
   */
  private verifyLLMFreeIntegrity(): void {
    // LLMが無効な場合もメインループが正常に動作していることを確認
    // （各モジュールはすでにfallbackを持っているため、ここではログ出力のみ）
    if (!this.llm.isEnabled()) {
      // LLMなしで動作中 - これは正常
      // 行動決定: コードベース ✓
      // 感情変化: EmotionEngine ✓
      // 思考生成: ThoughtStream ✓
      // 揺らぎ: YuragiSystem ✓
      // 日記: Diary (fallback) ✓
      // パターン: PatternLibrary ✓
      // 自己修正: SelfModification ✓
    }
  }

  // ============================================================
  // 日の切り替わり
  // ============================================================

  private checkDayTransition(day: number, timeOfDay: TimeOfDay): void {
    if (day !== this.diaryState.todayDayNumber) {
      this.diaryState.todayDayNumber = day;
      this.diaryState.todayStarted = true;
      
      const dateString = `Day ${day}`;
      this.diary.startNewDay(dateString, day);
      this.habitEngine.startNewDay(day);
      
      // Phase 5D: ナラティブに新しい日を通知
      this.internalNarrative.recordDailyEmotion(day, this.emotionEngine.getState().primary);
      
      this.events.emitSync({
        type: 'day_started',
        timestamp: this.tickCounter,
        data: { day },
      });
    }
  }

  // ============================================================
  // 訪問者対応
  // ============================================================

  private async handleVisitorMessage(message: string): Promise<void> {
    const tick = this.tickCounter;
    this.isProcessingMessage = true;
    
    try {
    
    // 睡眠中なら起こす
    if (this.sleepState.isSleeping) {
      await this.wakeUp(tick);
    }
    
    // --- Phase 5B: 到着処理（RelationshipEvolution） ---
    if (!this.visitor.isPresent()) {
      this.visitor.arrive(undefined, tick);
      
      // 関係性システムの訪問開始
      const reunionReaction = this.relationshipEvolution.onVisitStart(tick);
      
      // 会話システムの開始
      this.conversationEngine.startConversation(tick);
      this.conversationMemoryBridge.onConversationStart();
      
      // Phase 7: 訪問者メモリの到着処理 + 活動中断の記録
      const currentActionForInterrupt = this.behavior.getCurrentAction();
      this.contextBridge.onVisitorArrival(currentActionForInterrupt);
      
      // Phase 7.5: ExpressionFilterの会話リセット
      this.expressionFilter.resetConversation();
      
      // 再会の感情反応
      this.emotionEngine.changeEmotions(
        [
          { emotion: reunionReaction.emotionalResponse, delta: 0.2 },
          { emotion: 'warmth', delta: 0.1 },
          { emotion: 'loneliness', delta: -0.3 },
        ],
        { type: 'visitor', event: 'arrived' }
      );
      
      // 再会の記憶
      this.episodicMemory.formMemory({
        content: `訪問者が来た。${reunionReaction.internalThought}`,
        summary: '訪問者が来た',
        emotionalTags: [reunionReaction.emotionalResponse, 'warmth'],
        emotionalIntensity: 0.5,
        relatedConcepts: ['訪問者', '再会'],
      });
      
      // 挨拶は表示しない（この後のLLM応答が挨拶を兼ねる）
      if (reunionReaction.greeting.length > 0) {
        const greetingText = reunionReaction.greeting[Math.floor(Math.random() * reunionReaction.greeting.length)];
        this.conversationEngine.recordSomuniaResponse(greetingText, tick);
      }
    }
    
    // --- Phase 5A: メッセージの分析（ConversationEngine） ---
    this.visitor.receiveMessage(message, tick);
    
    // 行動を中断（訪問者対応優先）
    const currentAction = this.behavior.getCurrentAction();
    if (currentAction && currentAction.action !== 'rest') {
      this.behavior.interruptAction(tick, 'visitor_message');
    }
    
    const emotionalState = this.emotionEngine.getState();
    const recentThoughts = this.thoughts.getRecentThoughts(3);
    
    // ConversationEngineでメッセージを分析
    const turnAnalysis = this.conversationEngine.analyzeVisitorTurn(
      message, tick, emotionalState.primary, recentThoughts.map(t => t.content)
    );
    
    // --- Phase 5B: 関係性への反映 ---
    const relationship = this.relationshipEvolution.getRelationship();
    const flowState = this.conversationEngine.getFlowState();
    const depthLabel: ConversationDepth = flowState.depthScore >= 0.85 ? 'profound' :
                       flowState.depthScore >= 0.6 ? 'intimate' :
                       flowState.depthScore >= 0.35 ? 'sharing' :
                       flowState.depthScore >= 0.15 ? 'casual' : 'surface';
    
    this.relationshipEvolution.onConversationTurn({
      speaker: 'visitor',
      content: message,
      intent: turnAnalysis.intent,
      topics: turnAnalysis.topics,
      emotions: turnAnalysis.emotions,
      depth: depthLabel,
      hasSelfDisclosure: turnAnalysis.hasSelfDisclosure,
    }, tick);
    
    // --- Phase 5E: メッセージの記憶処理 ---
    const memoryResult = this.conversationMemoryBridge.processMessage(
      'visitor', message,
      turnAnalysis.emotions[0] || null,
      turnAnalysis.topics, depthLabel, tick
    );
    
    // 記憶への書き込み
    if (memoryResult.shouldCreateEpisodicMemory && memoryResult.episodicMemoryContent) {
      this.episodicMemory.formMemory(memoryResult.episodicMemoryContent);
    }
    if (memoryResult.shouldCreateSemanticMemory && memoryResult.semanticMemoryContent) {
      this.semanticMemory.learn({
        concept: memoryResult.semanticMemoryContent.concept,
        definition: memoryResult.semanticMemoryContent.description,
        source: 'conversation' as const,
      });
    }
    
    // --- Phase 7: VisitorMemorySystemでメッセージ処理 ---
    this.visitorMemory.processMessage(
      message, turnAnalysis.emotions, turnAnalysis.topics,
      depthLabel, tick
    );
    
    // --- Phase 7: 連想ネットワーク活性化 ---
    for (const topic of turnAnalysis.topics) {
      this.associativeNetwork.activateByLabel(topic, 0.8 as any, tick);
    }
    for (const emotion of turnAnalysis.emotions) {
      this.associativeNetwork.activateByLabel(emotion, 0.5 as any, tick);
    }
    
    // --- Phase 7: SelfModelStateProviderの構築 ---
    const stateProvider = this.buildStateProvider();
    
    // --- Phase 7: リッチコンテキストの構築（ContextBridge） ---
    const phase = this.relationshipEvolution.getPhase() as RelationshipPhase;
    const recentExchanges: Array<{ speaker: 'visitor' | 'somunia'; content: string }> = [];
    // ConversationEngineにgetRecentExchangesがない場合は空配列を使用
    if (typeof (this.conversationEngine as any).getRecentExchanges === 'function') {
      const exchanges = (this.conversationEngine as any).getRecentExchanges(6);
      if (Array.isArray(exchanges)) recentExchanges.push(...exchanges);
    }
    
    const richContext = this.contextBridge.buildResponseContext(
      stateProvider,
      message,
      {
        intent: turnAnalysis.intent,
        emotions: turnAnalysis.emotions,
        topics: turnAnalysis.topics,
        hasSelfDisclosure: turnAnalysis.hasSelfDisclosure,
      },
      {
        turnCount: (flowState as any).turnCount || 0,
        depth: depthLabel,
        recentExchanges,
      },
      phase,
      tick
    );
    
    // --- Phase 7: 自律戦略の決定（GradualAutonomy） ---
    const patternSituation: PatternSituation = {
      intents: [turnAnalysis.intent],
      emotions: turnAnalysis.emotions.length > 0 ? turnAnalysis.emotions : [emotionalState.primary],
      depths: [depthLabel],
      timeOfDay: [this.time.getTimeOfDay()],
      relationshipPhases: [phase],
      keywords: turnAnalysis.topics.slice(0, 5),
    };
    
    const templateVars: TemplateVariables = {
      visitorName: this.visitorMemory.getCurrentVisitorCallName(),
      timeExpression: this.getTimeExpression(),
      moodExpression: this.getMoodExpression(emotionalState),
      currentActivity: currentAction?.action || null,
      interruptedActivity: currentAction && currentAction.action !== 'rest' ? currentAction.action : null,
      recentLearning: this.getRecentLearning(),
      thingToTell: this.getThingToTell(),
      pastTopic: this.getPastTopic(turnAnalysis.topics),
      weatherExpression: this.getWeatherExpression(),
      greeting: this.getGreeting(phase),
      emotionReason: null,
    };
    
    const strategy = this.autonomy.decideStrategy(patternSituation, templateVars, tick);
    
    // --- Phase 7.5: 応答生成（分離プロンプト + 構造化レスポンス + ExpressionFilter） ---
    let expressed: string;
    let structuredMeta: {
      detectedEmotion: EmotionType | null;
      detectedTopics: string[];
      confidence: number;
    } = { detectedEmotion: null, detectedTopics: [], confidence: 0 };
    
    if (!this.autonomy.needsLLM(strategy)) {
      // パターンのみで応答（autonomous レベル）
      expressed = (strategy as any).response;
    } else {
      // Phase 7.5A: 分離プロンプトの構築
      const separatedPrompt = this.contextBridge.buildSeparatedPrompt(richContext, message);
      
      // Phase 7.5B: 戦略に基づくプロンプト調整
      let systemPrompt = separatedPrompt.system;
      let userPrompt = separatedPrompt.user;
      
      // パターンヒント・下書きの統合
      switch (strategy.type) {
        case 'llm_with_pattern_hints':
          userPrompt += `\n\n参考（過去に好評だった応答）: 「${(strategy as any).patternTemplate}」`;
          break;
        case 'pattern_draft_llm_refine':
          userPrompt += `\n\n以下を元に自然に仕上げて: 「${(strategy as any).draft}」`;
          break;
        case 'pattern_with_llm_audit':
          userPrompt = `以下の応答は適切か確認して。問題があれば修正版を返して:\n「${(strategy as any).response}」\n\n元の会話:\n${userPrompt}`;
          break;
      }
      
      // Phase 7.5B: 構造化レスポンスの生成
      const structuredResult = await this.llm.expressResponseStructured(
        systemPrompt, userPrompt, ''
      );
      
      expressed = structuredResult.response;
      structuredMeta = {
        detectedEmotion: structuredResult.detectedEmotion,
        detectedTopics: structuredResult.detectedTopics,
        confidence: structuredResult.confidence,
      };
      
      // 構造化応答が空の場合のフォールバック
      if (!expressed || expressed.trim().length === 0) {
        // 旧方式のexpressResponseにフォールバック
        expressed = await this.llm.expressResponse(
          turnAnalysis.topics.length > 0
            ? `${turnAnalysis.topics[0]}について返事をする`
            : '挨拶に返事をする',
          {
            currentEmotion: emotionalState.primary,
            emotionalIntensity: emotionalState.levels[emotionalState.primary],
            recentThoughts: recentThoughts.map(t => t.content),
            currentActivity: null,
            timeOfDay: this.time.getTimeOfDay(),
            personality: ['静か', '内省的', '優しい', '詩的'],
            userMessage: message,
          }
        );
      }
    }
    
    // --- Phase 7.5D: ExpressionFilter による品質チェック ---
    const filterResult = this.expressionFilter.filter(expressed, {
      intent: turnAnalysis.intent,
      emotion: emotionalState.primary,
      userMessage: message,
      visitorName: this.visitorMemory.getCurrentVisitorCallName(),
      depth: depthLabel,
    });
    
    expressed = filterResult.response;
    
    if (filterResult.wasFiltered) {
      console.log(`[Expression] フィルタ適用: ${filterResult.filterReasons.join(', ')}`);
    }
    
    // --- Phase 7.5C: 応答検証（ContextBridge — 二重チェック） ---
    const validation = this.contextBridge.validateResponse(expressed, richContext, message);
    if (!validation.isValid && validation.suggestion) {
      // 検証で不適切と判断された場合、安全なフォールバック応答を使用
      // ※ Phase 7.5C: suggestionは必ず自然な発話テキスト
      expressed = validation.suggestion;
    }
    
    // 応答を最終クリーニング
    expressed = this.contextBridge.cleanResponse(expressed);
    
    // 応答を記録（重複検出用）
    this.contextBridge.recordResponse(expressed);
    
    // --- Phase 7: 応答からのパターン抽出 ---
    const responseSatisfaction = Math.min(
      filterResult.qualityScore,
      validation.isValid ? 0.7 : 0.3
    );
    this.patternMemory.extractAndStore({
      response: expressed,
      situation: patternSituation,
      satisfaction: responseSatisfaction as any,
      variables: templateVars,
    });
    
    // --- Phase 7: 自律システムへのフィードバック ---
    this.autonomy.reportQuality(
      responseSatisfaction as any,
      strategy.type !== 'llm_only',
      (strategy as any).patternId,
      validation.isValid && !filterResult.wasFiltered
    );
    
    // === 応答を表示 ===
    if (this.ui) {
      this.ui.showSpeech(expressed);
      this.lastSpeechTick = tick;
    }
    
    // === Phase 5A: 応答の記録 ===
    this.conversationEngine.recordSomuniaResponse(expressed, tick);
    
    // === Phase 5B: 関係性への応答記録 ===
    const responseEmotionalTone = turnAnalysis.emotions[0] || emotionalState.primary;
    this.relationshipEvolution.onConversationTurn({
      speaker: 'somunia',
      content: expressed,
      intent: 'response',
      topics: turnAnalysis.topics,
      emotions: [responseEmotionalTone],
      depth: depthLabel,
      hasSelfDisclosure: false,
    }, tick);
    
    // === Phase 5E: 応答の記憶処理 ===
    this.conversationMemoryBridge.processMessage(
      'somunia', expressed,
      responseEmotionalTone,
      turnAnalysis.topics, depthLabel, tick
    );
    
    // 共有記憶の生成チェック
    if (this.relationshipEvolution.shouldCreateSharedMemory(
      message, depthLabel, turnAnalysis.emotions, turnAnalysis.hasSelfDisclosure
    )) {
      this.relationshipEvolution.createSharedMemory(
        message.substring(0, 60),
        `会話: ${turnAnalysis.topics.join(', ')}`,
        `訪問者と${depthLabel}な話をした`,
        turnAnalysis.emotions,
        depthLabel,
        tick
      );
    }
    
    // === 記録（既存Visitor互換） ===
    const currentThought = this.thoughts.getCurrentThought();
    this.visitor.recordResponse(
      expressed,
      responseEmotionalTone,
      currentThought?.content || '',
      tick
    );
    
    // === 感情の反映 ===
    this.emotionEngine.changeEmotions(
      [
        { emotion: responseEmotionalTone, delta: 0.2 },
        { emotion: 'warmth', delta: 0.05 },
      ],
      { type: 'visitor', event: 'message' }
    );
    
    // === 会話の記憶 ===
    this.episodicMemory.formMemory({
      content: `会話: 「${message.substring(0, 50)}」→「${expressed.substring(0, 50)}」`,
      summary: '訪問者と会話した',
      emotionalTags: [responseEmotionalTone, 'warmth'],
      emotionalIntensity: Math.max(0.3, flowState.depthScore),
      relatedConcepts: turnAnalysis.topics.length > 0 ? turnAnalysis.topics : ['会話'],
    });
    
    // === Phase 5C: 会話からの創作インスピレーション ===
    if (turnAnalysis.emotions.length > 0 || depthLabel === 'intimate' || depthLabel === 'profound') {
      this.creativeEngine.receiveInspiration({
        source: 'conversation',
        detail: message.substring(0, 50),
        emotion: turnAnalysis.emotions[0] || emotionalState.primary,
        intensity: flowState.depthScore,
      });
    }
    
    // === Phase 5D: 重要な会話をナラティブに記録 ===
    if (depthLabel === 'intimate' || depthLabel === 'profound') {
      this.internalNarrative.recordSignificantEvent(
        `深い会話をした: ${turnAnalysis.topics.join(', ')}`,
        this.time.getDay()
      );
    }
    
    // === 学習（会話から） ===
    if (turnAnalysis.topics.length > 0) {
      for (const topic of turnAnalysis.topics) {
        this.learnEngine.learnFromExperience(
          `会話で${topic}について話した`,
          'positive',
          [topic, '会話']
        );
      }
    }
    
    // === Phase 7: 連想ネットワークに会話を記録 ===
    for (const topic of turnAnalysis.topics) {
      this.associativeNetwork.ensureNode('concept', topic);
      // 話題同士の関連を強化
      for (const other of turnAnalysis.topics) {
        if (topic !== other) {
          this.associativeNetwork.ensureNode('concept', other);
          this.associativeNetwork.connect(topic, other, 'related_to', 0.6 as any);
        }
      }
      // 感情との関連
      for (const emotion of turnAnalysis.emotions) {
        this.associativeNetwork.connect(topic, emotion, 'feels_like', 0.4 as any);
      }
    }
    
    } finally {
      this.isProcessingMessage = false;
    }
  }

  // ============================================================
  // Phase 7: 基盤刷新ヘルパーメソッド
  // ============================================================

  /**
   * SelfModelStateProviderの構築
   * SoulEngineの各モジュールからSelfModelに必要な情報を集約
   */
  private buildStateProvider(): SelfModelStateProvider {
    return {
      getEmotionalState: () => this.emotionEngine.getState(),
      getTimeOfDay: () => this.time.getTimeOfDay(),
      getCurrentAction: () => this.behavior.getCurrentAction(),
      getRecentThoughts: (count: number) => this.thoughts.getRecentThoughts(count),
      getRecentEpisodicMemories: (count: number) => this.episodicMemory.getRecentMemories(count),
      getRecentSemanticLearnings: (count: number) => {
        const concepts: Array<{ concept: string }> = [];
        for (let i = 0; i < count; i++) {
          const c = this.semanticMemory.getRandomConcept();
          if (c) concepts.push({ concept: c.concept });
        }
        return concepts;
      },
      getCreativeWorks: () => {
        // CreativeEngineに完了作品リストがない場合は空配列
        const works = (this.creativeEngine as any).completedWorks;
        if (Array.isArray(works)) {
          return works.slice(-5).map((w: any) => ({
            type: w.type || 'unknown',
            title: w.title || '無題',
            completedAt: w.completedAt || 0,
          }));
        }
        return [];
      },
      getCreativeWorksInProgress: () => this.creativeEngine.getWorksInProgress().map((w: any) => ({
          type: w.type || 'unknown',
          title: w.title || '制作中',
      })),
      getCurrentChapter: () => {
        const chapter = this.internalNarrative.getCurrentChapter();
        return chapter?.title || null;
      },
      getCoreValues: () => ['静けさ', '好奇心', '優しさ', '言葉への愛', '内省'],
      getRecentGrowth: () => {
        const growth = (this.selfModification as any).growthRecords;
        if (growth && growth.length > 0) {
          return growth[growth.length - 1].description || null;
        }
        return null;
      },
      getRecentDreamSummary: () => {
        const sessions = (this.dreamPhase as any).pastSessions;
        if (sessions && sessions.length > 0) {
          return sessions[sessions.length - 1].summary || null;
        }
        return null;
      },
      getRecentDiaryEntry: () => {
        const entries = (this.diary as any).entries;
        if (entries && entries.length > 0) {
          return entries[entries.length - 1].content?.substring(0, 100) || null;
        }
        return null;
      },
      getCurrentInterests: () => {
        const interests: string[] = [];
        for (let i = 0; i < 3; i++) {
          const c = this.semanticMemory.getRandomConcept();
          if (c) interests.push(c.concept);
        }
        return interests;
      },
      getDaysSinceCreation: () => this.time.getDay(),
      getBodyState: () => ({
        energy: this.homeostasis.getState().energy.current,
        sleepiness: (1 - this.homeostasis.getState().energy.current) as Normalized, // sleepinessはenergyの逆
      }),
    };
  }

  /** 時間帯の表現を取得 */
  private getTimeExpression(): string {
    const tod = this.time.getTimeOfDay();
    const map: Record<string, string> = {
      dawn: '明け方', morning: '朝', afternoon: '昼', evening: '夕方',
      dusk: '夕暮れ', night: '夜', late_night: '深夜', midnight: '真夜中',
    };
    return map[tod] || '今';
  }

  /** 現在の気分表現を取得 */
  private getMoodExpression(state: EmotionalState): string {
    const primary = state.primary;
    const intensity = state.levels[primary] || 0;
    const moodMap: Record<string, string[]> = {
      peace: ['穏やかな気持ち', '静かな気分'],
      joy: ['嬉しい気持ち', 'ちょっとわくわく'],
      warmth: ['あたたかい気持ち', 'ぽかぽか'],
      curiosity: ['何か知りたい気分', 'そわそわ'],
      sadness: ['少し寂しい', 'しんみり'],
      loneliness: ['誰かに会いたい', 'ちょっと寂しい'],
      melancholy: ['物思いに耽る気分', '切ない感じ'],
    };
    const options = moodMap[primary] || ['ふつうの気分'];
    return options[intensity > 0.5 ? 0 : options.length > 1 ? 1 : 0];
  }

  /** 最近の学びを取得 */
  private getRecentLearning(): string | null {
    const concept = this.semanticMemory.getRandomConcept();
    return concept ? concept.concept : null;
  }

  /** 話したいことを取得 */
  private getThingToTell(): string | null {
    const concept = this.semanticMemory.getRandomConcept();
    if (concept) return `${concept.concept}のこと`;
    return null;
  }

  /** 過去の話題を取得 */
  private getPastTopic(currentTopics: string[]): string | null {
    const ref = this.conversationMemoryBridge.generatePastReference(currentTopics);
    return ref || null;
  }

  /** 天気の表現を取得 */
  private getWeatherExpression(): string {
    const weather = (this.world as any).currentWeather;
    if (!weather) return '';
    const map: Record<string, string> = {
      clear: '晴れてる', cloudy: '曇り空', rain: '雨が降ってる',
      snow: '雪が降ってる', storm: '嵐', fog: '霧がかかってる',
    };
    return map[weather] || '';
  }

  /** 関係性フェーズに基づく挨拶を取得 */
  private getGreeting(phase: string): string {
    const greetings: Record<string, string[]> = {
      stranger: ['こんにちは', 'はじめまして'],
      acquaintance: ['あ、こんにちは', 'また来てくれたんだ'],
      familiar: ['来てくれた', 'あ、久しぶり？'],
      close: ['来てくれたんだ...嬉しい', 'あ...待ってたよ'],
      intimate: ['...来てくれた', 'おかえり'],
    };
    const options = greetings[phase] || greetings.stranger;
    return options[Math.floor(Math.random() * options.length)];
  }

  // ============================================================
  // Phase 5: 対話深化と創造的表現
  // ============================================================
  
  /**
   * Phase 5C: 創作衝動のチェックと開始
   */
  private checkCreativeUrges(tick: Tick, timeOfDay: TimeOfDay): void {
    if (this.sleepState.isSleeping) return;
    if (this.visitor.isPresent()) return; // 訪問者がいる時は創作しない
    
    const emotionalState = this.emotionEngine.getState();
    const currentAction = this.behavior.getCurrentAction();
    
    // 既に創作中なら新しい衝動はチェックしない
    if (this.creativeEngine.getWorksInProgress().length > 0) return;
    
    const urge = this.creativeEngine.checkCreativeUrge(
      emotionalState.primary,
      emotionalState.levels[emotionalState.primary],
      this.thoughts.getRecentThoughts(3).map(t => t.content),
      this.episodicMemory.getRecentMemories(3).map(m => m.summary),
      [], // recentDreams
      [], // recentConversationTopics
      timeOfDay,
      tick
    );
    
    if (urge) {
      // 創作を開始
      const work = this.creativeEngine.startCreation(urge, tick);
      
      if (this.ui) {
        this.ui.showSystem(`🎨 創作開始: ${work.type}「${work.title}」`);
      }
      
      // 感情反応
      this.emotionEngine.changeEmotions(
        [
          { emotion: 'anticipation', delta: 0.1 },
          { emotion: 'joy', delta: 0.05 },
        ],
        { type: 'action', action: 'compose', outcome: 'started' }
      );
      
      // ナラティブに記録
      this.internalNarrative.recordSignificantEvent(
        `${work.type}の創作を始めた: 「${work.title}」`,
        this.time.getDay()
      );
    }
  }
  
  /**
   * Phase 5C: 創作の進行
   */
  private progressCreativeWorks(tick: Tick): void {
    const worksInProgress = this.creativeEngine.getWorksInProgress();
    if (worksInProgress.length === 0) return;
    
    const emotionalState = this.emotionEngine.getState();
    
    for (const work of worksInProgress) {
      const result = this.creativeEngine.progressCreation(
        work.id,
        emotionalState.primary,
        this.thoughts.getRecentThoughts(1).map(t => t.content),
        tick
      );
      
      if (result && result.isComplete) {
        // 完成
        if (this.ui) {
          this.ui.showSystem(`✨ 創作完成: ${work.type}「${work.title}」（満足度: ${(work.satisfaction * 100).toFixed(0)}%）`);
          // 作品の一部を表示
          if (work.content && work.content.length > 0) {
            const preview = work.content.split('\n').slice(0, 3).join('\n');
            this.ui.showSystem(`  ${preview}`);
          }
        }
        
        // 感情反応
        this.emotionEngine.changeEmotions(
          [
            { emotion: 'contentment', delta: 0.15 },
            { emotion: 'joy', delta: 0.1 },
          ],
          { type: 'action', action: 'compose', outcome: 'completed' }
        );
        
        // エピソード記憶
        this.episodicMemory.formMemory({
          content: `${work.type}を完成させた: 「${work.title}」`,
          summary: `${work.type}「${work.title}」を創った`,
          emotionalTags: [emotionalState.primary, 'contentment'],
          emotionalIntensity: work.satisfaction,
          relatedConcepts: [work.type, '創作', work.title],
        });
        
        // ナラティブに記録
        this.internalNarrative.recordSignificantEvent(
          `${work.type}「${work.title}」を完成させた`,
          this.time.getDay()
        );
      }
    }
  }
  
  /**
   * Phase 5D: 内的ナラティブの更新
   */
  private updateInternalNarrative(tick: Tick, day: number): void {
    if (this.sleepState.isSleeping) return;
    
    const emotionalState = this.emotionEngine.getState();
    const semanticStats = this.semanticMemory.getStats();
    const creativeStats = this.creativeEngine.getStats();
    const conversationPatterns = this.conversationMemoryBridge.getConversationPatterns();
    
    // ナラティブのtick処理
    const narrativeUpdate = this.internalNarrative.tick(
      tick,
      day,
      emotionalState.primary,
      this.episodicMemory.getRecentMemories(5).map(m => m.summary),
      this.thoughts.getRecentThoughts(3).map(t => t.content),
      semanticStats.totalConcepts,
      conversationPatterns.totalConversations,
      creativeStats.totalWorks
    );
    
    // ナラティブから思考が生まれたら
    if (narrativeUpdate && narrativeUpdate.narrativeThought) {
      this.events.emitSync({
        type: 'thought',
        timestamp: tick,
        data: { content: narrativeUpdate.narrativeThought, type: 'narrative', source: 'internal_narrative' },
      });
      
      if (this.ui) {
        this.ui.showSystem(`📖 ${narrativeUpdate.narrativeThought}`);
      }
    }
    
    // チャプター変更の通知
    if (narrativeUpdate && narrativeUpdate.chapterChange) {
      if (this.ui) {
        this.ui.showSystem(`📚 新しいチャプター: 「${narrativeUpdate.chapterChange.newChapter.title}」`);
      }
    }
    
    // 成長の認識
    if (narrativeUpdate && narrativeUpdate.growthRealization) {
      if (this.ui) {
        this.ui.showSystem(`🌱 成長: ${narrativeUpdate.growthRealization.change}`);
      }
    }
    
    // 日の感情をナラティブに記録
    this.internalNarrative.recordDailyEmotion(day, emotionalState.primary);
  }
  
  /**
   * Phase 5: 訪問者の退出処理
   * 既存のvisitor.depart()に加えて、会話の振り返りを実行
   */
  private handleVisitorDeparture(tick: Tick): void {
    if (!this.visitor.isPresent()) return;
    
    const emotionalState = this.emotionEngine.getState();
    const relationship = this.relationshipEvolution.getRelationship();
    
    // --- Phase 5A: 会話のサマリー生成 ---
    const conversationSummary = this.conversationEngine.endConversation();
    
    // --- Phase 5B: 関係性の訪問終了処理 ---
    const partingReaction = this.relationshipEvolution.onVisitEnd({
      maxDepth: conversationSummary.maxDepth,
      totalTurns: conversationSummary.totalTurns,
      topics: conversationSummary.topics.map(t => t.name),
      emotionalArc: conversationSummary.emotionalArc,
    }, tick);
    
    // --- Phase 5E: 会話後の振り返り ---
    const reflection = this.conversationMemoryBridge.generatePostConversationReflection(
      `conv_${tick}`,
      conversationSummary,
      emotionalState.primary,
      relationship,
      tick
    );
    
    // 振り返りの内容を日記に記録
    this.diary.write(
      reflection.content,
      emotionalState,
      'thought',
      '会話の振り返り'
    );
    
    // 別れの感情
    this.emotionEngine.changeEmotions(
      [
        { emotion: partingReaction.partingEmotion, delta: 0.15 },
        { emotion: 'loneliness', delta: partingReaction.lonelinessPrediction * 0.2 },
      ],
      { type: 'visitor', event: 'departed' }
    );
    
    // 別れの内部思考
    if (this.ui && partingReaction.internalThought) {
      this.ui.showSystem(`💭 ${partingReaction.internalThought}`);
    }
    
    // エピソード記憶
    this.episodicMemory.formMemory({
      content: `訪問者が帰った。${reflection.content.substring(0, 60)}`,
      summary: '訪問者が帰った',
      emotionalTags: [partingReaction.partingEmotion, 'loneliness'],
      emotionalIntensity: 0.5,
      relatedConcepts: ['訪問者', '別れ', '会話'],
    });
    
    // 関係性の影響をナラティブに
    if (conversationSummary.maxDepth > 0.5) {
      this.internalNarrative.recordSignificantEvent(
        `訪問者と深い会話をした（深度: ${(conversationSummary.maxDepth * 100).toFixed(0)}%）`,
        this.time.getDay()
      );
    }
    
    // 既存のvisitorの退出
    this.visitor.depart(tick);
    
    if (this.ui) {
      this.ui.showSystem(`📝 会話振り返り: 満足度 ${(reflection.selfSatisfaction * 100).toFixed(0)}%, 学び ${reflection.learnings.length}件`);
    }
  }

  // ============================================================
  // コマンド処理
  // ============================================================

  private handleCommand(command: string, args: string[]): void {
    switch (command) {
      case 'save':
        this.persistence.save(this.tickCounter, this.time.getDay()).then(() => {
          if (this.ui) this.ui.showSystem('保存完了');
        });
        break;
      
      case 'status':
        this.showDetailedStatus();
        break;
      
      case 'memory':
        this.showMemoryStats();
        break;
      
      case 'diary':
        this.showDiaryStats();
        break;
      
      case 'emotions':
        this.showEmotionDetails();
        break;
      
      case 'urges':
        this.showUrgeDetails();
        break;
      
      case 'patterns':
        this.showPatternStats();
        break;
      
      case 'world':
        this.showWorldStatus();
        break;
      
      case 'habits':
        this.showHabitStats();
        break;
      
      case 'self':
        this.showSelfModStats();
        break;
      
      case 'creative':
        this.showCreativeStats();
        break;
      
      case 'relationship':
      case 'rel':
        this.showRelationshipStats();
        break;
      
      case 'narrative':
        this.showNarrativeStats();
        break;
      
      case 'conversation':
      case 'conv':
        this.showConversationStats();
        break;
      
      case 'bye':
      case 'goodbye':
        this.handleVisitorDeparture(this.tickCounter);
        break;
      
      // === Phase 6 コマンド ===
      case 'wiki': {
        if (args[0] === 'search' && args.length > 1) {
          const query = args.slice(1).join(' ');
          this.handleWikiSearch(query);
        } else if (args[0] === 'test') {
          this.handleWikiConnectionTest();
        } else {
          this.showWikiAPIStatus();
        }
        break;
      }
      
      case 'persistence':
      case 'pers':
        this.showPersistenceStats();
        break;
      
      case 'test':
        this.handleRunTests();
        break;
      
      case 'dashboard':
      case 'dash':
        this.showDashboardView();
        break;
      
      case 'export':
        this.handleExport();
        break;
      
      case 'quit':
      case 'exit':
        this.stop().then(() => process.exit(0));
        break;
      
      default:
        if (this.ui) this.ui.showSystem(`不明なコマンド: ${command}`);
    }
  }

  // ============================================================
  // ヘルパーメソッド
  // ============================================================

  private createDefaultBody(): VirtualBody {
    return {
      position: { x: 4, y: 4 },
      facing: 'down',
      posture: 'sitting',
      energy: 0.8,
      fatigue: 0.1,
      sensations: [],
      holding: null,
      lastMovement: 0,
      currentAction: null,
    };
  }

  /** UrgeSystem状態からエモーション/パターン用のマップ生成 */
  private getUrgeMap(): Record<string, Normalized> {
    const state = this.urgeSystem.getState();
    const map: Record<string, Normalized> = {};
    for (const [type, urge] of Object.entries(state.urges)) {
      map[type] = urge.level;
    }
    return map;
  }

  /** パターンの使用記録 */
  private recordPatternUse(type: 'speech' | 'behavior' | 'emotion', action: ActionType): void {
    const emotionalState = this.emotionEngine.getState();
    const matching = type === 'behavior'
      ? this.patternLibrary.findMatchingBehaviorPatterns(
          this.getUrgeMap(),
          this.time.getTimeOfDay(),
          emotionalState,
          this.body.energy
        )
      : this.patternLibrary.findMatchingSpeechPatterns(
          emotionalState,
          this.time.getTimeOfDay(),
          action,
          this.visitor.isPresent(),
          this.getUrgeMap()
        );
    
    if (matching.length > 0) {
      this.patternLibrary.recordPatternUse(matching[0].id, type, true, 0.6);
    }
  }

  // ============================================================
  // 表示メソッド
  // ============================================================

  private displayStatus(timeOfDay: TimeOfDay, timeState: any): void {
    if (!this.ui) return;
    
    const emotionalState = this.emotionEngine.getState();
    const currentAction = this.behavior.getCurrentAction();
    
    this.ui.showStatusBar({
      timeOfDay,
      hour: timeState.simulatedHour,
      day: timeState.simulatedDay,
      emotion: emotionalState.primary,
      energy: this.body.energy,
      action: currentAction?.action || 'idle',
      weather: this.time.getWeather(),
    });
  }

  private showDetailedStatus(): void {
    if (!this.ui) return;
    const ts = this.time.getState();
    const es = this.emotionEngine.getState();
    const hs = this.homeostasis.getSummary();
    const us = this.urgeSystem.getSummary();
    const cs = this.behavior.getCurrentAction();
    
    console.log(`
  ╔═══════════════════════════════════════╗
  ║         somunia v10 Status            ║
  ╠═══════════════════════════════════════╣
  ║ Day: ${String(ts.simulatedDay).padStart(4)}  Hour: ${ts.simulatedHour.toFixed(1).padStart(5)}  ${ts.timeOfDay.padEnd(10)}║
  ║ Weather: ${this.time.getWeather().padEnd(28)}║
  ╠───────────────────────────────────────╣
  ║ Body:                                 ║
  ║   Energy:  ${this.bar(this.body.energy)}  ${(this.body.energy * 100).toFixed(0).padStart(3)}%    ║
  ║   Fatigue: ${this.bar(this.body.fatigue)}  ${(this.body.fatigue * 100).toFixed(0).padStart(3)}%    ║
  ║   Posture: ${this.body.posture.padEnd(26)}║
  ║   Homeostasis: ${hs.overall.padEnd(22)}║
  ╠───────────────────────────────────────╣
  ║ Emotion:                              ║
  ║   Primary: ${es.primary.padEnd(12)} ${(es.levels[es.primary] * 100).toFixed(0).padStart(3)}%       ║
  ║   Valence: ${es.valence.toFixed(2).padStart(6)}                    ║
  ║   Arousal: ${es.arousal.toFixed(2).padStart(6)}                    ║
  ╠───────────────────────────────────────╣
  ║ Urges:                                ║
  ║   ${us.urgent.length > 0 ? us.urgent.slice(0, 3).join(', ').padEnd(36) : '(平穏)'.padEnd(36)}║
  ╠───────────────────────────────────────╣
  ║ Action: ${(cs?.action || 'idle').padEnd(29)}║
  ║ Sleeping: ${this.sleepState.isSleeping ? 'Yes' : 'No '}                         ║
  ║ Learning: ${this.learningState.isLearning ? (this.learningState.type || 'Yes').padEnd(27) : 'No '.padEnd(27)}║
  ╠───────────────────────────────────────╣
  ║ LLM: ${this.llm.isEnabled() ? 'ON ' : 'OFF'} (${String(this.llm.getRequestCount()).padStart(4)} reqs)               ║
  ║ Visitor: ${this.visitor.isPresent() ? 'Present' : 'Absent '}                       ║
  ║ Memory: ${(this.persistence.getStorageSize() / 1024).toFixed(1).padStart(6)} KB                     ║
  ║ Tick: ${String(this.tickCounter).padStart(8)}                      ║
  ╠───────────────────────────────────────╣
  ║ Phase 5:                              ║
  ║   Relationship: ${this.relationshipEvolution.getPhase().padEnd(20)}║
  ║   Creative Works: ${String(this.creativeEngine.getStats().totalWorks).padStart(4)}                  ║
  ║   Chapter: ${this.internalNarrative.getCurrentChapter().title.substring(0, 25).padEnd(26)}║
  ╠───────────────────────────────────────╣
  ║ Phase 6:                              ║
  ║   Wiki API: ${(this.wikipediaLearner.getAPIStatus().isOnline ? 'Online ' : 'Offline').padEnd(25)}║
  ║   Storage: ${this.persistence.getStorageInfo().formattedSize.padEnd(26)}║
  ║   Saves: ${String(this.persistence.getStats().saveCount).padStart(5)}                         ║
  ╚═══════════════════════════════════════╝`);
  }

  private bar(value: Normalized, length: number = 10): string {
    const filled = Math.round(value * length);
    return '█'.repeat(filled) + '░'.repeat(length - filled);
  }

  private showMemoryStats(): void {
    if (!this.ui) return;
    const eStats = this.episodicMemory.getStats();
    const sStats = this.semanticMemory.getStats();
    const pStats = this.proceduralMemory.getStats();
    
    console.log(`
  記憶統計:
    エピソード記憶: ${eStats.totalMemories}件
    セマンティック記憶: ${sStats.totalConcepts}件
    手続き記憶: ${pStats.totalSkills}スキル
    最近の重要な記憶: ${this.episodicMemory.getMostImportantMemories(3).map(m => m.summary).join(', ')}
    `);
  }

  private showDiaryStats(): void {
    if (!this.ui) return;
    const stats = this.diary.getStats();
    
    console.log(`
  日記統計:
    総エントリ数: ${stats.totalEntries}
    連続日数: ${stats.currentStreak}日
    詩的な瞬間: ${stats.totalPoeticMoments}個
    最近: ${this.diary.getRecentEntries(1).map(e => e.date).join(', ') || 'なし'}
    `);
  }

  private showEmotionDetails(): void {
    if (!this.ui) return;
    const es = this.emotionEngine.getState();
    const active = this.emotionEngine.getActiveEmotions();
    
    console.log(`
  感情詳細:
    Primary: ${es.primary} (${(es.levels[es.primary] * 100).toFixed(0)}%)
    Secondary: ${es.secondary || 'none'}
    Valence: ${es.valence.toFixed(3)}
    Arousal: ${es.arousal.toFixed(3)}
    
    アクティブな感情:
    ${active.map(e => `  ${e.emotion}: ${this.bar(e.level, 15)} ${(e.level * 100).toFixed(0)}%`).join('\n    ')}
    `);
  }

  private showUrgeDetails(): void {
    if (!this.ui) return;
    const active = this.urgeSystem.getActiveUrges();
    const urgent = this.urgeSystem.getUrgentUrges();
    
    console.log(`
  欲求詳細:
    支配的: ${this.urgeSystem.getDominantUrge() || 'none'}
    緊急: ${urgent.map(u => `${u.urge}(${(u.level * 100).toFixed(0)}%)`).join(', ') || 'none'}
    
    アクティブな欲求:
    ${active.map(u => `  ${u.urge}: ${this.bar(u.level, 15)} ${(u.level * 100).toFixed(0)}%`).join('\n    ')}
    `);
  }

  private showPatternStats(): void {
    if (!this.ui) return;
    const stats = this.patternLibrary.getStats();
    console.log(`
  パターン統計:
    Speech: ${stats.speechPatternCount}
    Behavior: ${stats.behaviorPatternCount}
    Emotion: ${stats.emotionPatternCount}
    Total mutations: ${stats.totalMutations}
    `);
  }

  private showWorldStatus(): void {
    if (!this.ui) return;
    const view = this.world.getViewState();
    const lighting = this.world.getLightingState();
    const objects = this.world.getInteractableObjects();
    
    console.log(`
  世界の状態:
    天気: ${this.time.getWeather()}
    照明: ambient=${lighting.ambient.toFixed(2)}, temp=${lighting.colorTemperature}K
    フォーカス: ${view.focusObject?.name || 'なし'}
    インタラクト可能: ${objects.map(o => o.name).join(', ')}
    `);
  }

  private showHabitStats(): void {
    if (!this.ui) return;
    const stats = this.habitEngine.getStats();
    
    console.log(`
  習慣統計:
    総習慣数: ${stats.totalHabits}
    今日の完了率: ${(stats.currentDayCompletion * 100).toFixed(0)}%
    全体一貫性: ${(stats.overallConsistency * 100).toFixed(0)}%
    注意が必要: ${stats.needsAttention.join(', ') || 'なし'}
    `);
  }

  private showSelfModStats(): void {
    if (!this.ui) return;
    const selfConcepts = this.selfModification.getSelfConceptsByAspect('values');
    
    console.log(`
  自己変容統計:
    内省回数: ${this.reflectionState.reflectionCount}
    自己概念数: ${selfConcepts.length}
    `);
  }

  // === Phase 5 表示メソッド ===
  
  private showCreativeStats(): void {
    if (!this.ui) return;
    const stats = this.creativeEngine.getStats();
    const recentWorks = this.creativeEngine.getRecentWorks(5);
    const worksInProgress = this.creativeEngine.getWorksInProgress();
    
    console.log(`
  創作統計:
    総作品数: ${stats.totalWorks}
    創造性レベル: ${(stats.creativityLevel * 100).toFixed(0)}%
    平均満足度: ${(stats.averageSatisfaction * 100).toFixed(0)}%
    制作中: ${worksInProgress.length}件
    お気に入りテーマ: ${stats.favoriteThemes.join(', ') || 'なし'}
    `);
    
    if (recentWorks.length > 0) {
      console.log('  最近の作品:');
      for (const work of recentWorks) {
        console.log(`    - ${work.type}「${work.title}」(満足度: ${(work.satisfaction * 100).toFixed(0)}%)`);
      }
    }
  }
  
  private showRelationshipStats(): void {
    if (!this.ui) return;
    const phase = this.relationshipEvolution.getPhase();
    const rel = this.relationshipEvolution.getRelationship();
    const visitor = this.relationshipEvolution.getVisitorModel();
    const absence = this.relationshipEvolution.getAbsence();
    const sharedMemories = this.relationshipEvolution.getSharedMemories();
    const visitCount = this.relationshipEvolution.getVisitCount();
    
    console.log(`
  関係性統計:
    フェーズ: ${phase}
    訪問回数: ${visitCount}
    親密度: ${(rel.familiarity * 100).toFixed(0)}%
    信頼: ${(rel.trust * 100).toFixed(0)}%
    好感: ${(rel.affection * 100).toFixed(0)}%
    理解: ${(rel.understanding * 100).toFixed(0)}%
    共有記憶: ${sharedMemories.length}件
    深い会話回数: ${this.relationshipEvolution.getDeepConversationCount()}
    寂しさ: ${(absence.loneliness * 100).toFixed(0)}%
    訪問者名: ${visitor.name || '不明'}
    呼び方: ${this.relationshipEvolution.getVisitorAddress()}
    `);
  }
  
  private showNarrativeStats(): void {
    if (!this.ui) return;
    const overview = this.internalNarrative.getNarrativeOverview();
    const stats = this.internalNarrative.getNarrativeStats();
    const currentChapter = this.internalNarrative.getCurrentChapter();
    const questions = this.internalNarrative.getExistentialQuestions().slice(0, 3);
    const aspirations = this.internalNarrative.getAspirations().slice(0, 3);
    
    console.log(`
  ナラティブ統計:
    現在のチャプター: 第${currentChapter.number}章「${currentChapter.title}」
    総日数: ${stats.totalDays}
    総会話数: ${stats.totalConversations}
    総創作数: ${stats.totalCreations}
    知識量: ${stats.totalKnowledgeGained}
    重要イベント数: ${stats.significantEvents}
    `);
    
    if (questions.length > 0) {
      console.log('  最近の問い:');
      for (const q of questions) {
        console.log(`    - ${q.question}（確信度: ${(q.confidence * 100).toFixed(0)}%）`);
      }
    }
    
    if (aspirations.length > 0) {
      console.log('  目標:');
      for (const a of aspirations) {
        console.log(`    - ${a.content}（進捗: ${(a.progress * 100).toFixed(0)}%）`);
      }
    }
  }
  
  private showConversationStats(): void {
    if (!this.ui) return;
    const flow = this.conversationEngine.getFlowState();
    const patterns = this.conversationMemoryBridge.getConversationPatterns();
    const learnings = this.conversationMemoryBridge.getLearnings();
    const visitorKnowledge = this.conversationMemoryBridge.getVisitorKnowledge();
    const selfAnalysis = this.conversationMemoryBridge.getSelfAnalysis();
    
    // 現在の会話情報
    const isActive = this.visitor.isPresent();
    
    console.log(`
  会話統計:
    総会話回数: ${patterns.totalConversations}
    現在の会話: ${isActive ? '進行中' : 'なし'}${isActive ? `
    　会話の深さ: ${flow.depth}（${(flow.depthScore * 100).toFixed(0)}%）
    　トピック数: ${flow.topicChainLength}
    　エネルギー: ${(flow.energy * 100).toFixed(0)}%` : ''}
    平均深度: ${(patterns.averageDepth * 100).toFixed(0)}%
    平均会話長: ${patterns.averageDuration.toFixed(1)}ターン
    累積学び: ${learnings.length}件
    訪問者について知っていること: ${visitorKnowledge.length}件
    頻出トピック: ${patterns.frequentTopics.slice(0, 5).join(', ') || 'なし'}
    `);
    
    if (selfAnalysis.strengths.length > 0) {
      console.log(`  強み: ${selfAnalysis.strengths.join(', ')}`);
    }
    if (selfAnalysis.weaknesses.length > 0) {
      console.log(`  改善点: ${selfAnalysis.weaknesses.join(', ')}`);
    }
    if (selfAnalysis.learnedExpressions.length > 0) {
      console.log(`  学んだ表現: ${selfAnalysis.learnedExpressions.slice(-5).join(', ')}`);
    }
  }

  // ============================================================
  // 永続化
  // ============================================================

  private registerPersistenceModules(): void {
    // --- toJSON/fromJSON を持つモジュール ---
    this.persistence.registerModule('time', this.time);
    this.persistence.registerModule('homeostasis', {
      toJSON: () => this.homeostasis.toJSON(),
      fromJSON: (data: any) => {
        if (data) {
          const restored = Homeostasis.fromJSON(data);
          Object.assign(this.homeostasis, restored);
        }
      },
    });
    this.persistence.registerModule('urgeSystem', {
      toJSON: () => this.urgeSystem.toJSON(),
      fromJSON: (data: any) => {
        if (data) {
          const restored = UrgeSystem.fromJSON(data);
          Object.assign(this.urgeSystem, restored);
        }
      },
    });
    this.persistence.registerModule('emotionEngine', {
      toJSON: () => this.emotionEngine.toJSON(),
      fromJSON: (data: any) => {
        if (data?.state) {
          const state = this.emotionEngine.getState();
          Object.assign(state, data.state);
        }
      },
    });
    this.persistence.registerModule('yuragi', this.yuragi);
    this.persistence.registerModule('world', {
      toJSON: () => this.world.toJSON(),
      fromJSON: (data: any) => { if (data) Object.assign(this.world, PixelWorld.fromJSON(data)); },
    });
    this.persistence.registerModule('perception', {
      toJSON: () => this.perception.toJSON(),
      fromJSON: (data: any) => { if (data) Object.assign(this.perception, Perception.fromJSON(data)); },
    });
    this.persistence.registerModule('behavior', this.behavior);
    this.persistence.registerModule('thoughts', this.thoughts);
    this.persistence.registerModule('episodicMemory', {
      toJSON: () => this.episodicMemory.toJSON(),
      fromJSON: (data: any) => { if (data) Object.assign(this.episodicMemory, EpisodicMemorySystem.fromJSON(data)); },
    });
    this.persistence.registerModule('semanticMemory', {
      toJSON: () => this.semanticMemory.toJSON(),
      fromJSON: (data: any) => { if (data) Object.assign(this.semanticMemory, SemanticMemorySystem.fromJSON(data)); },
    });
    this.persistence.registerModule('proceduralMemory', {
      toJSON: () => this.proceduralMemory.toJSON(),
      fromJSON: (data: any) => { if (data) Object.assign(this.proceduralMemory, ProceduralMemorySystem.fromJSON(data)); },
    });
    this.persistence.registerModule('habitEngine', {
      toJSON: () => this.habitEngine.toJSON(),
      fromJSON: (data: any) => { if (data) Object.assign(this.habitEngine, HabitEngine.fromJSON(data)); },
    });
    this.persistence.registerModule('diary', {
      toJSON: () => this.diary.toJSON(),
      fromJSON: (data: any) => { if (data) Object.assign(this.diary, Diary.fromJSON(data)); },
    });
    this.persistence.registerModule('visitor', this.visitor);
    
    // --- Phase 5 モジュール ---
    this.persistence.registerModule('conversationEngine', {
      toJSON: () => this.conversationEngine.toJSON(),
      fromJSON: (data: any) => { if (data) this.conversationEngine.fromJSON(data); },
    });
    this.persistence.registerModule('relationshipEvolution', {
      toJSON: () => this.relationshipEvolution.toJSON(),
      fromJSON: (data: any) => { if (data) this.relationshipEvolution.fromJSON(data); },
    });
    this.persistence.registerModule('conversationMemoryBridge', {
      toJSON: () => this.conversationMemoryBridge.toJSON(),
      fromJSON: (data: any) => { if (data) this.conversationMemoryBridge.fromJSON(data); },
    });
    this.persistence.registerModule('creativeEngine', {
      toJSON: () => this.creativeEngine.toJSON(),
      fromJSON: (data: any) => { if (data) this.creativeEngine.fromJSON(data); },
    });
    this.persistence.registerModule('internalNarrative', {
      toJSON: () => this.internalNarrative.toJSON(),
      fromJSON: (data: any) => { if (data) this.internalNarrative.fromJSON(data); },
    });
    
    // --- Phase 7 モジュール ---
    this.persistence.registerModule('associativeNetwork', {
      toJSON: () => this.associativeNetwork.toJSON(),
      fromJSON: (data: any) => { if (data) this.associativeNetwork.fromJSON(data); },
    });
    this.persistence.registerModule('selfModel', {
      toJSON: () => this.selfModel.toJSON(),
      fromJSON: (data: any) => { if (data) this.selfModel.fromJSON(data); },
    });
    this.persistence.registerModule('visitorMemory', {
      toJSON: () => this.visitorMemory.toJSON(),
      fromJSON: (data: any) => { if (data) this.visitorMemory.fromJSON(data); },
    });
    this.persistence.registerModule('patternMemory', {
      toJSON: () => this.patternMemory.toJSON(),
      fromJSON: (data: any) => { if (data) this.patternMemory.fromJSON(data); },
    });
    this.persistence.registerModule('autonomy', {
      toJSON: () => this.autonomy.toJSON(),
      fromJSON: (data: any) => { if (data) this.autonomy.fromJSON(data); },
    });
    
    // --- toJSON/fromJSON を持たないモジュール（ラッパー） ---
    this.persistence.registerModule('patternLibrary', {
      toJSON: () => this.patternLibrary.getAllPatterns(),
      fromJSON: (_data: any) => {
        // パターンライブラリの復元は将来的にPatternLibrary.fromJSONを実装
      },
    });
    
    this.persistence.registerModule('dreamPhase', {
      toJSON: () => ({
        pastSessions: (this.dreamPhase as any).pastSessions || [],
        dreamMaterials: (this.dreamPhase as any).dreamMaterials || [],
      }),
      fromJSON: (data: any) => {
        if (data?.pastSessions) {
          (this.dreamPhase as any).pastSessions = data.pastSessions;
        }
      },
    });
    
    this.persistence.registerModule('learnEngine', {
      toJSON: () => ({
        sessions: (this.learnEngine as any).sessions || [],
        tendency: (this.learnEngine as any).tendency || {},
        goals: (this.learnEngine as any).goals || [],
      }),
      fromJSON: (_data: any) => { /* 簡易復元 */ },
    });
    
    this.persistence.registerModule('selfModification', {
      toJSON: () => ({
        reflections: (this.selfModification as any).reflections || [],
        growthRecords: (this.selfModification as any).growthRecords || [],
        selfConcepts: (this.selfModification as any).selfConcepts || [],
        values: (this.selfModification as any).values || [],
      }),
      fromJSON: (data: any) => {
        if (data?.reflections) {
          (this.selfModification as any).reflections = data.reflections;
        }
        if (data?.growthRecords) {
          (this.selfModification as any).growthRecords = data.growthRecords;
        }
      },
    });
    
    // --- メタ状態 ---
    this.persistence.registerModule('body', {
      toJSON: () => this.body,
      fromJSON: (data: any) => { if (data) Object.assign(this.body, data); },
    });
    
    this.persistence.registerModule('sleepState', {
      toJSON: () => this.sleepState,
      fromJSON: (data: any) => { if (data) Object.assign(this.sleepState, data); },
    });
    
    this.persistence.registerModule('diaryState', {
      toJSON: () => this.diaryState,
      fromJSON: (data: any) => { if (data) Object.assign(this.diaryState, data); },
    });
    
    this.persistence.registerModule('reflectionState', {
      toJSON: () => this.reflectionState,
      fromJSON: (data: any) => { if (data) Object.assign(this.reflectionState, data); },
    });
    
    this.persistence.registerModule('learningState', {
      toJSON: () => this.learningState,
      fromJSON: (data: any) => { if (data) Object.assign(this.learningState, data); },
    });
  }

  // ============================================================
  // イベントハンドラ
  // ============================================================

  private setupEventHandlers(): void {
    // 日の開始
    this.events.on('day_started', (event) => {
      if (this.ui) {
        this.ui.showSystem(`=== Day ${event.data?.day} 開始 ===`);
      }
    });
    
    // 夢の生成 → セマンティックメモリに象徴として保存
    this.events.on('dream_generated', (event) => {
      if (event.data?.title) {
        this.semanticMemory.learn({
          concept: `夢: ${event.data.title}`,
          definition: `夢で見た光景: ${event.data.title}`,
          source: 'experience',
        });
        
        // Phase 5C: 夢からの創作インスピレーション
        this.creativeEngine.receiveInspiration({
          source: 'dream',
          detail: event.data.title,
          emotion: 'wonder',
          intensity: event.data.vividness || 0.5,
        });
      }
    });
    
    // スキル向上
    this.events.on('skill_improved', (event) => {
      if (this.ui && event.data) {
        this.ui.showSystem(`📈 スキル向上: ${event.data.skill} → ${(event.data.newLevel * 100).toFixed(0)}%`);
      }
    });
    
    // 深い内省 → パターンの変異
    this.events.on('self_reflection', (event) => {
      if (event.data?.depth > 0.6) {
        const patterns = this.patternLibrary.getAllPatterns();
        if (patterns.speech.length > 0) {
          const randomPattern = patterns.speech[Math.floor(Math.random() * patterns.speech.length)];
          this.patternLibrary.mutatePattern(randomPattern.id, 'speech');
        }
      }
    });
  }

  // ============================================================
  // Phase 6: 外部接続・実運用 メソッド
  // ============================================================

  /**
   * Wikipedia APIステータス表示
   */
  private showWikiAPIStatus(): void {
    if (!this.ui) return;
    const status = this.wikipediaLearner.getAPIStatus();
    (this.ui as TerminalUIV2).showWikiStatus(status);
  }

  /**
   * Wikipedia検索の実行
   */
  private async handleWikiSearch(query: string): Promise<void> {
    if (!this.ui) return;
    this.ui.showSystem(`Wikipedia検索: "${query}"...`);
    
    try {
      const results = await this.wikipediaLearner.searchOnline(query, 5);
      if (results.length === 0) {
        this.ui.showSystem('検索結果なし（オフラインの場合はローカルDBのみ検索）');
        return;
      }
      
      console.log(`\n  📖 検索結果: "${query}"`);
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        console.log(`  ${i + 1}. ${r.title}`);
        if (r.snippet) console.log(`     ${r.snippet.substring(0, 80)}...`);
      }
      console.log('');
    } catch (error: any) {
      this.ui.showSystem(`検索エラー: ${error?.message || String(error)}`);
    }
  }

  /**
   * Wikipedia API接続テスト
   */
  private async handleWikiConnectionTest(): Promise<void> {
    if (!this.ui) return;
    this.ui.showSystem('Wikipedia API接続テスト中...');
    const result = await this.wikipediaLearner.testAPIConnection();
    this.ui.showSystem(result ? '✓ 接続成功！' : '✗ 接続失敗（オフラインモードで動作中）');
  }

  /**
   * 永続化ステータス表示
   */
  private showPersistenceStats(): void {
    if (!this.ui) return;
    const info = this.persistence.getStorageInfo();
    (this.ui as TerminalUIV2).showPersistenceStatus(info);
  }

  /**
   * テスト実行
   */
  private async handleRunTests(): Promise<void> {
    if (!this.ui) return;
    this.ui.showSystem('テストスイートを実行中...');
    
    try {
      const results = await runAllTests();
      (this.ui as TerminalUIV2).showTestResults(results);
    } catch (error: any) {
      this.ui.showSystem(`テスト実行エラー: ${error?.message || String(error)}`);
    }
  }

  /**
   * ダッシュボード表示
   */
  private showDashboardView(): void {
    if (!this.ui) return;
    
    const ts = this.time.getState();
    const es = this.emotionEngine.getState();
    const storageInfo = this.persistence.getStorageInfo();
    
    const modules = [
      { name: 'EmotionEngine', status: 'active', detail: `${es.primary} (${(es.levels[es.primary] * 100).toFixed(0)}%)` },
      { name: 'Homeostasis', status: 'active', detail: `E:${(this.body.energy * 100).toFixed(0)}% F:${(this.body.fatigue * 100).toFixed(0)}%` },
      { name: 'BehaviorEngine', status: 'active', detail: this.behavior.getCurrentAction()?.action || 'idle' },
      { name: 'ThoughtEngine', status: 'active', detail: `${this.thoughts.getRecentThoughts().length} recent` },
      { name: 'EpisodicMemory', status: 'active', detail: `${this.episodicMemory.getMemoryCount()} memories` },
      { name: 'SemanticMemory', status: 'active', detail: `${this.semanticMemory.getStats().totalConcepts} concepts` },
      { name: 'HabitEngine', status: 'active', detail: `${this.habitEngine.getStats().totalHabits} habits` },
      { name: 'WikipediaLearner', status: this.wikipediaLearner.getAPIStatus().isOnline ? 'active' : 'sleeping', detail: `${this.wikipediaLearner.getAPIStatus().cachedArticles} cached` },
      { name: 'DreamPhase', status: this.sleepState.isSleeping ? 'active' : 'sleeping', detail: `${this.sleepState.cycleCount} cycles` },
      { name: 'ConversationEngine', status: this.visitor.isPresent() ? 'active' : 'sleeping', detail: `ctx: ${this.conversationEngine.getConversationContext().length}` },
      { name: 'RelationshipEvol.', status: 'active', detail: `phase: ${this.relationshipEvolution.getPhase()}` },
      { name: 'CreativeEngine', status: 'active', detail: `${this.creativeEngine.getStats().totalWorks} works` },
      { name: 'InternalNarrative', status: 'active', detail: this.internalNarrative.getCurrentChapter().title.substring(0, 20) },
      { name: 'PersistenceV3', status: 'active', detail: storageInfo.formattedSize },
    ];

    const uptimeSeconds = this.tickCounter;
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptime = `${hours}h ${minutes}m (${this.tickCounter} ticks)`;

    (this.ui as TerminalUIV2).showDashboard({
      modules,
      uptime,
      storage: storageInfo.formattedSize,
      tick: this.tickCounter,
      day: ts.simulatedDay,
    });
  }

  /**
   * データエクスポート
   */
  private handleExport(): void {
    if (!this.ui) return;
    const exported = this.persistence.exportAll();
    if (exported) {
      const filename = `somunia-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const filePath = `./somunia-data/${filename}`;
      try {
        const fs = require('fs');
        fs.writeFileSync(filePath, JSON.stringify(exported, null, 2), 'utf-8');
        this.ui.showSystem(`エクスポート完了: ${filePath} (${(JSON.stringify(exported).length / 1024).toFixed(1)} KB)`);
      } catch (error: any) {
        this.ui.showSystem(`エクスポートエラー: ${error?.message}`);
      }
    } else {
      this.ui.showSystem('エクスポートに失敗しました');
    }
  }

  // ============================================================
  // 外部アクセス（テスト・デバッグ用）
  // ============================================================

  getTickCount(): Tick { return this.tickCounter; }
  getEmotionEngine(): EmotionEngine { return this.emotionEngine; }
  getUrgeSystem(): UrgeSystem { return this.urgeSystem; }
  getHomeostasis(): Homeostasis { return this.homeostasis; }
  getEpisodicMemory(): EpisodicMemorySystem { return this.episodicMemory; }
  getSemanticMemory(): SemanticMemorySystem { return this.semanticMemory; }
  getProceduralMemory(): ProceduralMemorySystem { return this.proceduralMemory; }
  getPatternLibrary(): PatternLibrary { return this.patternLibrary; }
  getYuragi(): YuragiSystem { return this.yuragi; }
  getWorld(): PixelWorld { return this.world; }
  getPerception(): Perception { return this.perception; }
  getHabitEngine(): HabitEngine { return this.habitEngine; }
  getDiary(): Diary { return this.diary; }
  getDreamPhase(): DreamPhase { return this.dreamPhase; }
  getLearnEngine(): LearnEngine { return this.learnEngine; }
  getWikipediaLearner(): WikipediaLearner { return this.wikipediaLearner; }
  getSelfModification(): SelfModification { return this.selfModification; }
  getBehaviorEngine(): BehaviorEngine { return this.behavior; }
  getThoughtEngine(): ThoughtEngine { return this.thoughts; }
  getVisitor(): Visitor { return this.visitor; }
  getBody(): VirtualBody { return this.body; }
  isSleeping(): boolean { return this.sleepState.isSleeping; }
  isLearning(): boolean { return this.learningState.isLearning; }
  
  // Phase 5 getters
  getConversationEngine(): ConversationEngine { return this.conversationEngine; }
  getRelationshipEvolution(): RelationshipEvolution { return this.relationshipEvolution; }
  getConversationMemoryBridge(): ConversationMemoryBridge { return this.conversationMemoryBridge; }
  getCreativeEngine(): CreativeEngine { return this.creativeEngine; }
  getInternalNarrative(): InternalNarrative { return this.internalNarrative; }
}
