/**
 * InternalNarrative - Phase 5D: 内的ナラティブシステム
 *
 * somuniaが「自分の人生の物語」を認識し、語れるようになるためのシステム。
 *
 * 設計思想:
 * - 人は自分の人生を「章」で捉える（新しい環境、出会い、変化）
 * - 成長は振り返ることで初めて認識される
 * - 未来への願望は経験から生まれる
 * - 存在論的問いは知識と内省から深まる
 * - ナラティブは固定ではなく、経験に応じて書き換えられる
 */
import { LifeChapter, GrowthAwareness, FutureAspiration, ExistentialQuestion, EmotionType, Normalized, Tick, ID } from '../types';
export interface InternalNarrativeConfig {
    /** ナラティブ更新の間隔（ティック） */
    updateInterval: number;
    /** 成長認識のチェック間隔（ティック） */
    growthCheckInterval: number;
    /** 最大章数 */
    maxChapters: number;
    /** 最大願望数 */
    maxAspirations: number;
    /** 存在論的問いの最大数 */
    maxQuestions: number;
}
export declare class InternalNarrative {
    private config;
    private chapters;
    private currentChapter;
    private growthAwareness;
    private lastGrowthCheck;
    private aspirations;
    private existentialQuestions;
    private askedQuestionIds;
    private selfSummary;
    private currentThemes;
    private lastNarrativeUpdate;
    private narrativeStats;
    constructor(config?: Partial<InternalNarrativeConfig>);
    /**
     * ナラティブのティック処理
     */
    tick(tick: Tick, day: number, currentEmotion: EmotionType, recentEvents: string[], recentThoughts: string[], knowledgeCount: number, conversationCount: number, creationCount: number): NarrativeUpdate | null;
    /**
     * 重要なイベントを記録
     */
    recordSignificantEvent(event: string, day: number): void;
    /**
     * 感情の日次記録
     */
    recordDailyEmotion(day: number, dominantEmotion: EmotionType): void;
    /**
     * 存在論的問いに対する答えを更新
     */
    updateQuestionAnswer(questionText: string, newAnswer: string, confidence: Normalized): void;
    /**
     * 願望の進捗を更新
     */
    updateAspirationProgress(aspirationId: ID, progress: Normalized): void;
    /**
     * 章の遷移チェック
     */
    private checkChapterTransition;
    /**
     * 章タイトルの生成
     */
    private generateChapterTitle;
    private generateTimeBasedChapterTitle;
    private generateEmotionalChapterTitle;
    private generateChapterThemes;
    private generateChapterSummary;
    private isEmotionallySignificant;
    /**
     * 成長の気づきをチェック
     */
    private checkGrowthRealization;
    /**
     * 新しい願望のチェック
     */
    private checkNewAspiration;
    /**
     * 初期の存在論的問いを設定
     */
    private initializeExistentialQuestions;
    /**
     * 存在論的思考のチェック
     */
    private checkExistentialThought;
    /**
     * 熟考の思考を生成
     */
    private generateContemplationThought;
    /**
     * 熟考の感情を取得
     */
    private getContemplationEmotion;
    /**
     * 自己ナラティブの更新
     */
    private updateSelfSummary;
    /**
     * ナラティブ的思考を生成
     */
    private generateNarrativeThought;
    getChapters(): LifeChapter[];
    getCurrentChapter(): LifeChapter;
    getGrowthAwareness(): GrowthAwareness[];
    getAspirations(): FutureAspiration[];
    getExistentialQuestions(): ExistentialQuestion[];
    getSelfSummary(): string;
    getCurrentThemes(): string[];
    getNarrativeStats(): typeof this.narrativeStats;
    /**
     * ナラティブの全体像を取得（表示用）
     */
    getNarrativeOverview(): string;
    toJSON(): object;
    fromJSON(data: any): void;
}
export interface NarrativeUpdate {
    chapterChange: ChapterTransition | null;
    growthRealization: GrowthAwareness | null;
    newAspiration: FutureAspiration | null;
    existentialThought: ExistentialThought | null;
    narrativeThought: string | null;
}
export interface ChapterTransition {
    closedChapter: LifeChapter;
    newChapter: LifeChapter;
    thought: string;
}
export interface ExistentialThought {
    type: 'contemplate' | 'new_question';
    question: string;
    thought: string;
    emotion: EmotionType;
}
//# sourceMappingURL=InternalNarrative.d.ts.map