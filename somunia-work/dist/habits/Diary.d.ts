/**
 * Diary.ts - somuniaの日記システム
 *
 * 日々の思考、出来事、感情を記録し、振り返りを行う。
 * 夜になると1日を振り返り、重要な出来事を日記エントリとして残す。
 * 日記は自分だけの内省空間であり、本音や詩的な表現が現れる。
 */
import { EmotionType, EmotionState, WorldTime } from '../types';
import { LLMInterface } from '../llm/LLMInterface';
/** 日記の一節（思考の断片） */
export interface DiaryFragment {
    id: string;
    timestamp: number;
    content: string;
    emotionalContext: EmotionType[];
    intensity: number;
    isPoetic: boolean;
    trigger?: string;
}
/** 日記エントリ（1日分） */
export interface DiaryEntry {
    id: string;
    date: string;
    dayNumber: number;
    fragments: DiaryFragment[];
    reflection?: DailyReflection;
    dominantEmotions: EmotionType[];
    memorableEvents: string[];
    newDiscoveries: string[];
    poeticMoments: string[];
    unansweredQuestions: string[];
}
/** 1日の振り返り */
export interface DailyReflection {
    summary: string;
    emotionalJourney: EmotionType[];
    mostSignificantMoment: string;
    gratitude?: string;
    wish?: string;
    poem?: string;
    selfInsight?: string;
}
/** 書き込みの種類 */
export type WriteType = 'thought' | 'observation' | 'feeling' | 'question' | 'discovery' | 'poem' | 'memory' | 'wish';
/** 日記の統計 */
export interface DiaryStats {
    totalEntries: number;
    totalFragments: number;
    totalPoeticMoments: number;
    mostCommonEmotion: EmotionType;
    emotionDistribution: Map<EmotionType, number>;
    averageFragmentsPerDay: number;
    longestStreak: number;
    currentStreak: number;
}
/** 日記検索結果 */
export interface DiarySearchResult {
    entry: DiaryEntry;
    fragment?: DiaryFragment;
    relevance: number;
    matchType: 'content' | 'emotion' | 'date' | 'discovery';
}
/** 日記書き込みの文脈情報 */
export interface DiaryWriteContext {
    trigger?: string;
    recentActivity?: string;
    interactedObject?: string;
    timeOfDay?: string;
    weather?: string;
}
/** 夢のレコード（DreamPhaseから渡される） */
export interface DreamRecord {
    title?: string;
    narrative: string[];
    emotionalTone: {
        valence: number;
        arousal: number;
        dominance: number;
    };
    dominantColors: string[];
    sounds: string[];
    vividness: number;
    interpretation?: string;
}
/** 週間レトロスペクティブ */
export interface WeeklyRetrospective {
    data: WeeklyRetrospectiveData;
    narrative: string;
    generatedAt: number;
}
/** 週間レトロスペクティブのデータ */
export interface WeeklyRetrospectiveData {
    period: string;
    entryCount: number;
    dominantEmotions: EmotionType[];
    emotionTrend: string;
    totalDiscoveries: number;
    topDiscoveries: string[];
    significantMoments: string[];
    unansweredQuestions: string[];
    poeticHighlights: string[];
    growthIndicators: string[];
}
export interface DiaryConfig {
    maxFragmentsPerDay: number;
    maxEntries: number;
    poeticThreshold: number;
    reflectionHour: number;
    introspectionWeight: number;
    existentialQuestionRate: number;
}
export declare class Diary {
    private entries;
    private currentDayFragments;
    private currentDate;
    private dayNumber;
    private config;
    private llm;
    private emotionCounts;
    private streakData;
    constructor(config?: Partial<DiaryConfig>);
    /**
     * LLMインターフェースを設定（SoulEngineから注入）
     */
    setLLM(llm: LLMInterface): void;
    private initializeEmotionCounts;
    /**
     * 新しい日を開始
     */
    startNewDay(date: string, dayNumber: number): void;
    private updateStreak;
    /**
     * 思考の断片を書き込む
     */
    write(content: string, emotions: EmotionState, type?: WriteType, trigger?: string): DiaryFragment;
    /**
     * 存在論的な問いを書き込む
     */
    writeExistentialQuestion(emotions: EmotionState): DiaryFragment | null;
    /**
     * 発見を記録
     */
    recordDiscovery(discovery: string, emotions: EmotionState, source: string): DiaryFragment;
    /**
     * 詩を書く
     */
    writePoem(theme: string, emotions: EmotionState): DiaryFragment;
    private poeticize;
    private fillTemplate;
    private generatePoem;
    /**
     * 1日を振り返る（夜に呼び出される）
     */
    reflectOnDay(worldTime: WorldTime): DailyReflection | null;
    /**
     * 1日を確定させる
     */
    private finalizeDay;
    private analyzeEmotionalJourney;
    private findMostSignificantMoment;
    private generateDaySummary;
    private generateReflectionPoem;
    private generateGratitude;
    private generateWish;
    private generateSelfInsight;
    /**
     * 特定の日の日記を取得
     */
    getEntry(date: string): DiaryEntry | null;
    /**
     * 最近のエントリを取得
     */
    getRecentEntries(count?: number): DiaryEntry[];
    /**
     * 感情で検索
     */
    searchByEmotion(emotion: EmotionType): DiarySearchResult[];
    /**
     * キーワードで検索
     */
    searchByContent(keyword: string): DiarySearchResult[];
    /**
     * ランダムな過去の日記を読み返す
     */
    readRandomPast(): DiaryEntry | null;
    /**
     * 詩的な瞬間を集める
     */
    getPoeticMoments(count?: number): DiaryFragment[];
    /**
     * 未回答の問いを取得
     */
    getUnansweredQuestions(): string[];
    private extractDominantEmotions;
    private calculateIntensity;
    private getDominantEmotion;
    private extractMemorableEvents;
    private extractDiscoveries;
    private extractPoeticMoments;
    private extractQuestions;
    private cleanupOldEntries;
    private generateId;
    getStats(): DiaryStats;
    /**
     * LLMを使って日記の断片を詩的な散文に変換
     */
    poeticizeWithLLM(content: string, emotions: EmotionState, type: WriteType): Promise<string>;
    /**
     * LLMを使った1日の振り返りの散文化
     * コードで生成した構造化データをsomuniaの声で語り直す
     */
    generateDiaryProse(reflection: DailyReflection): Promise<string>;
    /**
     * LLMを使った詩の生成
     */
    generatePoemWithLLM(theme: string, emotions: EmotionState, fragments: DiaryFragment[]): Promise<string>;
    /**
     * LLM付きの1日の振り返り
     */
    reflectOnDayWithLLM(worldTime: WorldTime, emotions: EmotionState): Promise<DailyReflection | null>;
    /**
     * LLMによるリアルタイム断片のリッチ化
     * 日中の体験をsomuniaの内面の声として深く言語化する
     */
    writeWithLLM(content: string, emotions: EmotionState, type: WriteType, context?: DiaryWriteContext): Promise<DiaryFragment>;
    /**
     * 断片をLLMで内面の声として深く言語化
     */
    private enrichFragmentWithLLM;
    /**
     * 夢日記を書く（DreamPhaseの夢を日記に統合）
     */
    writeDreamDiary(dream: DreamRecord, emotions: EmotionState): Promise<DiaryFragment>;
    /**
     * 夢を日記用にフォーマット
     */
    private formatDreamForDiary;
    /**
     * 内面の対話（自分との対話をLLMで生成）
     */
    writeInnerDialogue(topic: string, emotions: EmotionState, context?: {
        relatedMemory?: string;
        relatedQuestion?: string;
    }): Promise<DiaryFragment[]>;
    private generateFallbackInnerResponse;
    /**
     * 週間レトロスペクティブ（1週間の振り返り）
     */
    generateWeeklyRetrospective(emotions: EmotionState): Promise<WeeklyRetrospective | null>;
    /**
     * 感情トレンドの分析
     */
    private analyzeEmotionTrend;
    /**
     * 成長の指標を特定
     */
    private identifyGrowthIndicators;
    /**
     * 週間振り返りのフォールバック
     */
    private fallbackWeeklyNarrative;
    /**
     * 過去の日記を読み返してLLMで感想を生成
     */
    revisitPastEntry(entry: DiaryEntry, currentEmotions: EmotionState): Promise<DiaryFragment | null>;
    /**
     * 手紙を書く（未来の自分へ、または過去の自分へ）
     */
    writeLetterToSelf(direction: 'future' | 'past', emotions: EmotionState, context?: string): Promise<DiaryFragment>;
    /**
     * Wikipedia学習の感想を日記に書く
     */
    writeLearnReflection(articleTitle: string, learnedContent: string, emotions: EmotionState): Promise<DiaryFragment>;
    /**
     * 訪問者との会話後の感想を日記に書く
     */
    writeVisitorReflection(visitorInteraction: string, emotions: EmotionState): Promise<DiaryFragment>;
    /**
     * フォールバック: コードのみで散文化
     */
    private fallbackDiaryProse;
    toJSON(): object;
    static fromJSON(data: any): Diary;
}
export default Diary;
//# sourceMappingURL=Diary.d.ts.map