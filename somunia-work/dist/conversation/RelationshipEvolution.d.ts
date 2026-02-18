/**
 * RelationshipEvolution - Phase 5B: 関係性深化システム
 *
 * somuniaと訪問者の関係性を有機的に深化させる。
 *
 * 設計思想:
 * - 関係性は数値ではなく「フェーズ」で捉える
 * - 特定の瞬間（共有記憶）が関係を深める
 * - somuniaは訪問者の「モデル」を構築する（この人はこういう人）
 * - 不在中もsomuniaは訪問者のことを考える
 * - 関係性は非線形に深まる（ある瞬間がブレイクスルーになる）
 */
import { RelationshipPhase, SharedMemory, VisitorModel, AbsenceAwareness, Relationship, EmotionType, ConversationDepth, Normalized, Tick } from '../types';
interface PhasePersonality {
    /** 会話での開放度 */
    openness: Normalized;
    /** 冗談の頻度 */
    playfulness: Normalized;
    /** 本音を言う頻度 */
    honesty: Normalized;
    /** 甘えの頻度 */
    vulnerability: Normalized;
    /** 呼び方 */
    addressStyle: string[];
    /** この段階特有の振る舞い */
    behaviors: string[];
}
export interface RelationshipEvolutionConfig {
    /** 共有記憶の最大数 */
    maxSharedMemories: number;
    /** 不在意識の更新間隔（ティック） */
    absenceUpdateInterval: number;
    /** 関係性減衰率（長期不在時） */
    decayRate: number;
    /** 訪問者モデルの最大特徴数 */
    maxModelTraits: number;
}
export declare class RelationshipEvolution {
    private config;
    private phase;
    private relationship;
    private visitCount;
    private deepConversationCount;
    private profoundMomentCount;
    private sharedMemories;
    private visitorModel;
    private absence;
    private milestones;
    private emotionalHistory;
    constructor(config?: Partial<RelationshipEvolutionConfig>);
    /**
     * 訪問開始時の処理
     */
    onVisitStart(tick: Tick): RelationshipReaction;
    /**
     * 会話ターンごとの更新
     */
    onConversationTurn(turnData: {
        speaker: 'visitor' | 'somunia';
        content: string;
        intent: string;
        topics: string[];
        emotions: EmotionType[];
        depth: ConversationDepth;
        hasSelfDisclosure: boolean;
    }, tick: Tick): void;
    /**
     * 共有記憶を作成する
     * 会話の中で特別な瞬間があった時に呼ばれる
     */
    createSharedMemory(content: string, summary: string, meaningToSomunia: string, emotions: EmotionType[], depth: ConversationDepth, tick: Tick): SharedMemory;
    /**
     * 会話が特別な瞬間かどうかを判定
     */
    shouldCreateSharedMemory(content: string, depth: ConversationDepth, emotions: EmotionType[], hasSelfDisclosure: boolean): boolean;
    /**
     * 訪問終了時の処理
     */
    onVisitEnd(conversationSummary: {
        maxDepth: number;
        totalTurns: number;
        topics: string[];
        emotionalArc: string[];
    }, tick: Tick): PostVisitReaction;
    /**
     * 不在中のティック処理
     */
    tickAbsence(tick: Tick, currentEmotion: EmotionType, recentEvents: string[]): AbsenceUpdate | null;
    /**
     * 訪問者モデルの更新
     */
    private updateVisitorModel;
    /**
     * 訪問者の名前を学習
     */
    learnVisitorName(name: string): void;
    /**
     * 訪問者にニックネームをつける
     */
    giveNickname(): string | null;
    /**
     * フェーズ遷移の評価
     */
    private evaluatePhaseTransition;
    /**
     * 再会の感情を計算
     */
    private calculateReunionEmotion;
    /**
     * フェーズに応じた挨拶の生成
     */
    private generatePhaseAppropriateGreeting;
    /**
     * 再会時の内部思考を生成
     */
    private generateReunionThought;
    /**
     * 別れの感情を計算
     */
    private calculatePartingEmotion;
    /**
     * 別れの内部思考を生成
     */
    private generatePartingThought;
    /**
     * 共有記憶の回想
     */
    private recallSharedMemory;
    /**
     * 記憶回想時の思考を生成
     */
    private generateMemoryRecallThought;
    /**
     * 寂しさの思考を生成
     */
    private generateLonelinessThought;
    /**
     * 寂しさの予測
     */
    private predictLoneliness;
    /**
     * 感情的重みの計算
     */
    private calculateEmotionalWeight;
    /**
     * フェーズラベルの取得
     */
    private getPhaseLabel;
    getPhase(): RelationshipPhase;
    getRelationship(): Relationship;
    getVisitorModel(): VisitorModel;
    getAbsence(): AbsenceAwareness;
    getSharedMemories(): SharedMemory[];
    getMilestones(): RelationshipMilestone[];
    getVisitCount(): number;
    getDeepConversationCount(): number;
    getPhasePersonality(): PhasePersonality;
    /**
     * 現在のフェーズでの振る舞いパラメータを取得
     */
    getBehaviorParams(): PhasePersonality;
    /**
     * 訪問者の名前（呼び方）を取得
     */
    getVisitorAddress(): string;
    toJSON(): object;
    fromJSON(data: any): void;
}
export interface RelationshipReaction {
    emotionalResponse: EmotionType;
    phaseChanged: boolean;
    newPhase: RelationshipPhase | null;
    thingsToShare: string[];
    greeting: string[];
    internalThought: string;
}
export interface PostVisitReaction {
    partingEmotion: EmotionType;
    phaseChanged: boolean;
    internalThought: string;
    lonelinessPrediction: Normalized;
}
export interface RelationshipMilestone {
    type: 'phase_transition' | 'visit_milestone' | 'shared_memory' | 'special_moment';
    from: RelationshipPhase | null;
    to: RelationshipPhase | null;
    tick: Tick;
    description: string;
}
export interface AbsenceUpdate {
    type: 'recall_memory' | 'loneliness' | 'anticipation';
    memory: SharedMemory | null;
    thought: string;
    emotion: EmotionType;
}
export {};
//# sourceMappingURL=RelationshipEvolution.d.ts.map