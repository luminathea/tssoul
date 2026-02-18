/**
 * CreativeEngine - Phase 5C: 創作活動システム
 *
 * somuniaが自発的に創作活動を行うシステム。
 * VSingerとしてのsomuniaの核心的な側面。
 *
 * 設計思想:
 * - 創作衝動は感情・記憶・知識・経験から自然に生まれる
 * - 創作物は完成度が段階的に上がる（下書き→推敲→完成）
 * - 創作は行動の一つとしてBehaviorEngineと統合
 * - 作品のポートフォリオが蓄積される
 * - 会話や経験が直接インスピレーションになる
 * - LLMは最終的な言語表現の洗練にのみ使用
 */
import { CreativeType, CreativeWork, CreativeInspiration, CreativeUrge, EmotionType, Normalized, Tick, ID, TimeOfDay } from '../types';
export interface CreativeEngineConfig {
    /** 創作衝動のチェック間隔（ティック） */
    urgeCheckInterval: number;
    /** 最大ポートフォリオサイズ */
    maxPortfolioSize: number;
    /** 創作衝動の基本閾値 */
    urgeThreshold: number;
    /** 創作の最小所要時間（ティック） */
    minCreationTicks: number;
    /** 創作の最大所要時間（ティック） */
    maxCreationTicks: number;
}
export declare class CreativeEngine {
    private config;
    private portfolio;
    private worksInProgress;
    private currentUrges;
    private lastUrgeCheck;
    private stats;
    private inspirationBuffer;
    constructor(config?: Partial<CreativeEngineConfig>);
    /**
     * 創作衝動のチェック
     * 感情や経験から創作への衝動を生成
     */
    checkCreativeUrge(currentEmotion: EmotionType, emotionalIntensity: Normalized, recentThoughts: string[], recentMemories: string[], recentDreams: string[], recentConversationTopics: string[], timeOfDay: TimeOfDay, tick: Tick): CreativeUrge | null;
    /**
     * 創作を開始する
     */
    startCreation(urge: CreativeUrge, tick: Tick): CreativeWork;
    /**
     * 創作を進める（1ティック分）
     * 毎ティック呼ばれ、少しずつ内容が追加される
     */
    progressCreation(workId: ID, currentEmotion: EmotionType, recentThoughts: string[], tick: Tick): CreationProgress | null;
    /**
     * 創作を完成させる
     */
    private completeCreation;
    /**
     * インスピレーションを受け取る
     */
    receiveInspiration(inspiration: CreativeInspiration): void;
    /**
     * 訪問者に作品を見せる
     */
    shareWithVisitor(workId: ID): CreativeWork | null;
    /**
     * 見せられる作品のリストを取得
     */
    getShareableWorks(): CreativeWork[];
    /**
     * 創作タイプに応じた内容を生成
     */
    private generateContent;
    /**
     * 詩の生成
     */
    private generatePoem;
    /**
     * 俳句の生成
     */
    private generateHaiku;
    /**
     * 歌詞の生成
     */
    private generateSongLyrics;
    /**
     * スケッチの生成
     */
    private generateSketch;
    /**
     * メロディアイデアの生成
     */
    private generateMelodyIdea;
    /**
     * 短い物語の生成
     */
    private generateShortStory;
    /**
     * 日記詩の生成
     */
    private generateDiaryPoem;
    /**
     * 手紙の生成（送らない手紙）
     */
    private generateLetter;
    private calculateSongLyricUrge;
    private calculatePoemUrge;
    private calculateHaikuUrge;
    private calculateSketchUrge;
    private calculateMelodyUrge;
    private generateTitle;
    private calculateSatisfaction;
    private generateCreationThought;
    private generateCompletionThought;
    private processInspirationBuffer;
    getPortfolio(): CreativeWork[];
    getWorksInProgress(): CreativeWork[];
    getCurrentUrges(): CreativeUrge[];
    getStats(): CreativeStats;
    getPortfolioByType(type: CreativeType): CreativeWork[];
    getRecentWorks(count: number): CreativeWork[];
    toJSON(): object;
    fromJSON(data: any): void;
}
export interface CreativeStats {
    totalWorks: number;
    worksByType: Record<CreativeType, number>;
    averageSatisfaction: Normalized;
    favoriteThemes: string[];
    lastCreationTick: Tick;
    creativityLevel: Normalized;
    inspirationSources: Record<string, number>;
}
export interface CreationProgress {
    workId: ID;
    type: CreativeType;
    title: string;
    completeness: Normalized;
    currentContent: string;
    thought: string;
    isComplete: boolean;
}
//# sourceMappingURL=CreativeEngine.d.ts.map