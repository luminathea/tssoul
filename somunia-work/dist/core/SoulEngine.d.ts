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
import { Tick, VirtualBody } from '../types';
import { TimeConfig } from './TimeManager';
import { LLMConfig } from '../llm/LLMInterface';
import { BehaviorEngine } from '../behavior/BehaviorEngine';
import { ThoughtEngine } from '../mind/ThoughtEngine';
import { Visitor } from '../visitor/Visitor';
import { PersistenceV3Config } from '../persistence/PersistenceV3';
import { Homeostasis } from '../body/Homeostasis';
import { UrgeSystem } from '../body/UrgeSystem';
import { EmotionEngine } from '../emotions/EmotionEngine';
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
import { ConversationEngine } from '../conversation/ConversationEngine';
import { RelationshipEvolution } from '../conversation/RelationshipEvolution';
import { ConversationMemoryBridge } from '../conversation/ConversationMemoryBridge';
import { CreativeEngine } from '../creative/CreativeEngine';
import { InternalNarrative } from '../narrative/InternalNarrative';
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
        conversationEngine?: any;
        relationshipEvolution?: any;
        conversationMemoryBridge?: any;
        creativeEngine?: any;
        internalNarrative?: any;
        associativeNetwork?: any;
        visitorMemory?: any;
        patternMemory?: any;
        autonomy?: any;
    };
}
export declare class SoulEngine {
    private events;
    private time;
    private llm;
    private homeostasis;
    private urgeSystem;
    private patternLibrary;
    private yuragi;
    private emotionEngine;
    private world;
    private perception;
    private thoughts;
    private behavior;
    private episodicMemory;
    private semanticMemory;
    private proceduralMemory;
    private habitEngine;
    private diary;
    private dreamPhase;
    private learnEngine;
    private wikipediaLearner;
    private selfModification;
    private visitor;
    private conversationEngine;
    private relationshipEvolution;
    private conversationMemoryBridge;
    private creativeEngine;
    private internalNarrative;
    private associativeNetwork;
    private selfModel;
    private visitorMemory;
    private contextBridge;
    private patternMemory;
    private autonomy;
    private expressionFilter;
    private persistence;
    private ui;
    private body;
    private isRunning;
    private isProcessingMessage;
    private config;
    private tickCounter;
    private sleepState;
    private learningState;
    private diaryState;
    private reflectionState;
    private readonly PERCEPTION_INTERVAL;
    private readonly THOUGHT_INTERVAL;
    private readonly ACTION_INTERVAL;
    private readonly HABIT_CHECK_INTERVAL;
    private readonly STATUS_DISPLAY_INTERVAL;
    private readonly REFLECTION_INTERVAL;
    private readonly DIARY_WRITE_INTERVAL;
    private readonly MEMORY_MAINTENANCE_INTERVAL;
    private readonly SLEEP_CYCLE_TICKS;
    private readonly DREAM_INTERVAL;
    private readonly CREATIVE_CHECK_INTERVAL;
    private readonly CREATIVE_PROGRESS_INTERVAL;
    private readonly NARRATIVE_INTERVAL;
    private readonly ABSENCE_TICK_INTERVAL;
    private readonly AUTONOMOUS_SPEECH_INTERVAL;
    private lastSpeechTick;
    private readonly RELATIONSHIP_TICK_INTERVAL;
    private readonly AUTONOMY_EVAL_INTERVAL;
    private readonly PATTERN_CULL_INTERVAL;
    private readonly ASSOCIATION_DECAY_INTERVAL;
    constructor(config?: SoulEngineConfig);
    /**
     * somuniaを起動する
     */
    start(): Promise<void>;
    /**
     * somuniaを停止する
     */
    stop(): Promise<void>;
    private mainLoop;
    private updateWorld;
    private processYuragi;
    private updateBody;
    private updateEmotions;
    private updatePerception;
    private progressAction;
    private generateThought;
    private checkHabits;
    private decideAction;
    private onActionCompleted;
    private checkLearningStart;
    private progressLearning;
    private endLearningSession;
    private chooseLearningTopic;
    private checkSleepNeed;
    private enterSleep;
    private processSleepTick;
    private advanceSleepStage;
    private generateDream;
    private processMemoryConsolidation;
    private wakeUp;
    private attemptSelfReflection;
    private checkDiaryWrite;
    private writeDiaryFromAction;
    private maintainMemories;
    private runSelfModificationCycle;
    /**
     * Phase 4A/4B/4C/4E統合: 自律進化サイクル
     * - 行動パターンの自己生成（4A）
     * - 感情パターンの自己修正（4B）
     * - 世界の拡張チェック（4C）
     * - LLM-free動作保証（4E: 各モジュールにfallbackあり）
     */
    private runAutonomousEvolutionCycle;
    /**
     * Phase 4A: 行動の結果を記録し、新しいパターン発見をトリガー
     */
    private recordBehaviorOutcomes;
    /** 行動結果の追跡用 */
    private lastRecordedEnergy;
    private lastDiscoveryNotification;
    private lastExpansionCheck;
    /**
     * BehaviorContextの構築
     */
    private buildBehaviorContext;
    /**
     * Phase 4B: 感情の自己修正を実行
     */
    private runEmotionSelfCorrection;
    /**
     * Phase 4C: 知識に応じた世界の拡張
     */
    private checkWorldExpansion;
    /**
     * Phase 4E: LLM-free動作の健全性チェック
     * LLMが使えない場合でも全機能が動作することを保証
     */
    private verifyLLMFreeIntegrity;
    private checkDayTransition;
    private handleVisitorMessage;
    /**
     * SelfModelStateProviderの構築
     * SoulEngineの各モジュールからSelfModelに必要な情報を集約
     */
    private buildStateProvider;
    /** 時間帯の表現を取得 */
    private getTimeExpression;
    /** 現在の気分表現を取得 */
    private getMoodExpression;
    /** 最近の学びを取得 */
    private getRecentLearning;
    /** 話したいことを取得 */
    private getThingToTell;
    /** 過去の話題を取得 */
    private getPastTopic;
    /** 天気の表現を取得 */
    private getWeatherExpression;
    /** 関係性フェーズに基づく挨拶を取得 */
    private getGreeting;
    /**
     * Phase 5C: 創作衝動のチェックと開始
     */
    private checkCreativeUrges;
    /**
     * Phase 5C: 創作の進行
     */
    private progressCreativeWorks;
    /**
     * Phase 5D: 内的ナラティブの更新
     */
    private updateInternalNarrative;
    /**
     * Phase 5: 訪問者の退出処理
     * 既存のvisitor.depart()に加えて、会話の振り返りを実行
     */
    private handleVisitorDeparture;
    private handleCommand;
    private createDefaultBody;
    /** UrgeSystem状態からエモーション/パターン用のマップ生成 */
    private getUrgeMap;
    /** パターンの使用記録 */
    private recordPatternUse;
    private displayStatus;
    private showDetailedStatus;
    private bar;
    private showMemoryStats;
    private showDiaryStats;
    private showEmotionDetails;
    private showUrgeDetails;
    private showPatternStats;
    private showWorldStatus;
    private showHabitStats;
    private showSelfModStats;
    private showCreativeStats;
    private showRelationshipStats;
    private showNarrativeStats;
    private showConversationStats;
    private registerPersistenceModules;
    private setupEventHandlers;
    /**
     * Wikipedia APIステータス表示
     */
    private showWikiAPIStatus;
    /**
     * Wikipedia検索の実行
     */
    private handleWikiSearch;
    /**
     * Wikipedia API接続テスト
     */
    private handleWikiConnectionTest;
    /**
     * 永続化ステータス表示
     */
    private showPersistenceStats;
    /**
     * テスト実行
     */
    private handleRunTests;
    /**
     * ダッシュボード表示
     */
    private showDashboardView;
    /**
     * データエクスポート
     */
    private handleExport;
    getTickCount(): Tick;
    getEmotionEngine(): EmotionEngine;
    getUrgeSystem(): UrgeSystem;
    getHomeostasis(): Homeostasis;
    getEpisodicMemory(): EpisodicMemorySystem;
    getSemanticMemory(): SemanticMemorySystem;
    getProceduralMemory(): ProceduralMemorySystem;
    getPatternLibrary(): PatternLibrary;
    getYuragi(): YuragiSystem;
    getWorld(): PixelWorld;
    getPerception(): Perception;
    getHabitEngine(): HabitEngine;
    getDiary(): Diary;
    getDreamPhase(): DreamPhase;
    getLearnEngine(): LearnEngine;
    getWikipediaLearner(): WikipediaLearner;
    getSelfModification(): SelfModification;
    getBehaviorEngine(): BehaviorEngine;
    getThoughtEngine(): ThoughtEngine;
    getVisitor(): Visitor;
    getBody(): VirtualBody;
    isSleeping(): boolean;
    isLearning(): boolean;
    getConversationEngine(): ConversationEngine;
    getRelationshipEvolution(): RelationshipEvolution;
    getConversationMemoryBridge(): ConversationMemoryBridge;
    getCreativeEngine(): CreativeEngine;
    getInternalNarrative(): InternalNarrative;
}
//# sourceMappingURL=SoulEngine.d.ts.map